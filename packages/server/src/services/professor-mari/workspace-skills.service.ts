import { rm, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { loadSkillsFromDir, type LoadSkillsResult } from "@earendil-works/pi-coding-agent";
import type {
  MariWorkspaceSkillDetail,
  MariWorkspaceSkillSummary,
  MariWorkspaceSkillsResponse,
} from "@marinara-engine/shared";
import { DATA_DIR } from "../../utils/data-dir.js";
import { now } from "../../utils/id-generator.js";
import { logger } from "../../lib/logger.js";

type SkillRecord = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type SkillDraft = {
  name?: string | null;
  description?: string | null;
  content: string;
  fileName?: string | null;
  enabled?: boolean;
};

type SkillUpdate = {
  name?: string | null;
  description?: string | null;
  content?: string | null;
  enabled?: boolean;
};

const MAX_SKILL_CONTENT_LENGTH = 200_000;
const MAX_SKILL_DESCRIPTION_LENGTH = 1024;
const SAFE_SKILL_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
export const DEFAULT_WORKSPACE_SKILLS_FOR_TEST: ReadonlyArray<{ id: string; name: string; description: string; content: string }> = [
  {
    id: "runtime-forensics",
    name: "runtime-forensics",
    description: "Use Mari's runtime inspection tools to diagnose stacks, turn tags, lorebook scope, and agent behavior.",
    content: `# Runtime Forensics

Use this skill when the user asks why an RP/chat behaved a certain way, why an agent did or did not fire, what stack is active, or what lorebook/runtime state a chat currently has.

Preferred tool order:
1. \`inspect_chat_runtime\` for a high-level snapshot of a specific chat.
2. \`inspect_turn_tag_packet\` to read the stored \`turn_tag_packet_v1\` or another agent variable.
3. \`inspect_agent_activity\` to see active agent configs, phases, and stack/default assignment hints.
4. \`inspect_agent_settings\` to fetch deep read-only per-agent settings, prompt wiring, bindings, and raw/parsed settings for a specific chat.
5. \`inspect_lorebook_scope\` to inspect active lorebooks plus linked/global lorebook candidates for that chat.
6. \`read_chat\` if you need to inspect the recent conversation that produced the runtime state.

Rules:
- Prefer tool evidence over guesswork.
- Distinguish stored chat metadata from per-turn runtime inference.
- Distinguish four buckets explicitly when useful: tool-confirmed facts, summary from previous inspection, inference, and unavailable/not found.
- If the user asks for runtime detail that is not present in the most recent tool result, call the relevant inspection tool again instead of pretending you already fetched it.
- If you answer from previous tool output rather than a fresh call, say so plainly.
- If you offer a next inspection action and the user replies with any clear affirmative confirmation, you must either run the relevant tool for that action or clearly state that no current workspace tool can fetch the requested data.
- Do not repeat the previous inspection packet as if it were newly fetched.
- Do not offer the same next action again after the user has already confirmed it.
- If you answer from prior tool output after a confirmation, begin plainly with: "Using the previous inspection result..."
- Treat Mari workspace tools and chat generation/runtime tools as different things. If a tool result shows no active chat-generation tool ids, say exactly that; do not say no tools are available when Mari workspace inspection tools are still available.
- If agent phase comes directly from \`inspect_agent_activity\`, label it as tool-confirmed. If phase must be guessed from config shape or naming, label it inferred. If you do not have phase data, say unavailable.
- If the user asks for resolved agent settings summaries or tells you to continue after offering them, use \`inspect_agent_settings\`.
- \`inspect_agent_settings\` is the deep read-only path. It can expose raw settings, parsed settings, prompt template, connection wiring, lorebook bindings, tool allowance, and available/unavailable fields. Do not mutate anything. Decrypted secrets are still out of scope unless a future tool explicitly adds them.
- After an unavailable-data answer, stop unless the user asks for a different available inspection.
- For short follow-ups like "do it", "y", or "go on", confirm whether you are summarizing previous inspection or running another tool. If new evidence is needed, run the tool.
- When debugging roleplay stacks, name exact agent ids/types and exact lorebook ids/names when that helps.
- If the issue spans multiple chats or forks, use \`list_chats\` and \`search_chat_messages\` first to identify the correct chat ids before reading deeper.`,
  },
  {
    id: "chat-sniffer",
    name: "chat-sniffer",
    description: "Use Mari's read-only chat forensics tools to sniff through chats, compare forks, and locate continuity.",
    content: `# Chat Sniffer

Use this skill when the user wants you to rummage through saved chats, compare forks, find where a scene started drifting, or locate a past moment, character beat, joke, or runtime failure.

Preferred tool order:
1. \`list_chats\` to find likely chats by mode or name.
2. \`search_chat_messages\` to search across chats or within one chat.
3. \`read_chat\` to inspect the latest messages, metadata, and hidden extras when needed.
4. \`inspect_chat_runtime\` if the user cares about agents, tools, lorebooks, or stack behavior in that chat.

Rules:
- Stay read-only unless the user explicitly asks for a separate mutation task.
- If several chats match, compare ids, names, mode, and timestamps before concluding.
- Quote or summarize only the relevant turns instead of dumping entire transcripts unless the user explicitly asks for the full thing.
- Treat \`read_chat\` and \`search_chat_messages\` as bounded inspection tools. Prefer excerpts and recent windows unless the user explicitly asks for broader retrieval.
- If a follow-up question needs data you have not actually retrieved yet, run the relevant tool again instead of leaning on memory from a prior answer.
- If you are answering from the previous inspection rather than a fresh tool call, say so plainly.
- For lore/continuity questions, combine \`search_chat_messages\` with \`inspect_lorebook_scope\` when you need both story evidence and runtime context.`,
  },
] as const;
const DEFAULT_WORKSPACE_SKILLS = DEFAULT_WORKSPACE_SKILLS_FOR_TEST;

function rootDir() {
  return join(DATA_DIR, ".mari-workspace", "skills");
}

function indexPath() {
  return join(rootDir(), "skills.json");
}

function skillDir(id: string) {
  return join(rootDir(), id);
}

function skillFilePath(id: string) {
  return join(skillDir(id), "SKILL.md");
}

function stripFrontmatter(content: string) {
  return content.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*/, "").trimStart();
}

function skillInstructions(content: string) {
  return stripFrontmatter(content).trim();
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*/);
  if (!match?.[1]) return {};
  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    if (!key) continue;
    frontmatter[key] = raw.replace(/^["']|["']$/g, "");
  }
  return frontmatter;
}

function normalizeSkillName(value: string | null | undefined, fallback = "custom-skill") {
  const source = value?.trim() || fallback;
  const normalized = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 64)
    .replace(/^-+|-+$/g, "");
  return normalized || "custom-skill";
}

function normalizeSkillId(value: string | null | undefined, fallback = "skill") {
  return normalizeSkillName(value, fallback);
}

function assertSafeSkillId(id: string) {
  if (!SAFE_SKILL_ID_PATTERN.test(id)) {
    throw new Error("Invalid skill id");
  }
  return id;
}

function appendSkillIdSuffix(baseId: string, suffix: number) {
  const suffixText = `-${suffix}`;
  const prefix = baseId.slice(0, 64 - suffixText.length).replace(/-+$/g, "") || "skill";
  return `${prefix}${suffixText}`;
}

function titleFromFileName(fileName: string | null | undefined) {
  const base = fileName ? basename(fileName).replace(/\.[^.]+$/, "") : "";
  return base.replace(/[-_]+/g, " ").trim();
}

function titleFromBody(content: string) {
  const match = stripFrontmatter(content).match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? "";
}

function firstBodyLine(content: string) {
  return (
    stripFrontmatter(content)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith("#")) ?? ""
  );
}

function normalizeDescription(value: string | null | undefined, content: string) {
  const frontmatter = parseFrontmatter(content);
  const candidate =
    value?.trim() ||
    frontmatter.description?.trim() ||
    firstBodyLine(content) ||
    "User-defined Professor Mari skill.";
  return candidate.slice(0, MAX_SKILL_DESCRIPTION_LENGTH);
}

function buildSkillContent(input: { name: string; description: string; content: string }) {
  const body = skillInstructions(input.content);
  const fallbackBody = `# ${input.name}

Add focused instructions for when Professor Mari should use this skill.`;
  return [
    "---",
    `name: ${JSON.stringify(input.name)}`,
    `description: ${JSON.stringify(input.description)}`,
    "---",
    "",
    body || fallbackBody,
    "",
  ].join("\n");
}

function summarizeRecord(record: SkillRecord, content: string): MariWorkspaceSkillSummary {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    enabled: record.enabled,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    size: Buffer.byteLength(content, "utf8"),
    filePath: skillFilePath(record.id),
  };
}

function idFromSkillFile(path: string) {
  return basename(dirname(path));
}

export class ProfessorMariWorkspaceSkillsService {
  async list(): Promise<MariWorkspaceSkillsResponse> {
    await this.ensureStorage();
    const records = await this.readRecords();
    const diagnostics: string[] = [];
    const skills: MariWorkspaceSkillDetail[] = [];

    for (const record of records) {
      try {
        const content = await readFile(skillFilePath(record.id), "utf8");
        skills.push({ ...summarizeRecord(record, content), content: skillInstructions(content) });
      } catch (err) {
        diagnostics.push(`Skill ${record.name} could not be read: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return { skills, diagnostics };
  }

  async listSummaries(): Promise<MariWorkspaceSkillSummary[]> {
    const response = await this.list();
    return response.skills.map(({ content: _content, ...summary }) => summary);
  }

  async create(input: SkillDraft): Promise<MariWorkspaceSkillDetail> {
    await this.ensureStorage();
    this.assertContent(input.content);
    const records = await this.readRecords();
    const frontmatter = parseFrontmatter(input.content);
    const name = normalizeSkillName(input.name ?? frontmatter.name, titleFromBody(input.content) || titleFromFileName(input.fileName));
    const id = this.uniqueId(name, records);
    const description = normalizeDescription(input.description, input.content);
    const timestamp = now();
    const record: SkillRecord = {
      id,
      name,
      description,
      enabled: input.enabled ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const content = buildSkillContent({ name, description, content: input.content });
    await mkdir(skillDir(id), { recursive: true });
    await writeFile(skillFilePath(id), content, "utf8");
    await this.writeRecords([...records, record]);
    return { ...summarizeRecord(record, content), content: skillInstructions(content) };
  }

  async update(id: string, input: SkillUpdate): Promise<MariWorkspaceSkillDetail> {
    await this.ensureStorage();
    const safeId = assertSafeSkillId(id);
    const records = await this.readRecords();
    const index = records.findIndex((record) => record.id === safeId);
    if (index < 0) throw new Error("Skill not found");
    const current = records[index]!;

    const previousContent = await readFile(skillFilePath(current.id), "utf8");
    const nextContentSource = input.content ?? skillInstructions(previousContent);
    if (input.content !== undefined && input.content !== null) this.assertContent(input.content);
    const name = normalizeSkillName(input.name ?? parseFrontmatter(nextContentSource).name ?? current.name, current.name);
    const description = normalizeDescription(input.description ?? current.description, nextContentSource);
    const nextRecord: SkillRecord = {
      ...current,
      name,
      description,
      enabled: input.enabled ?? current.enabled,
      updatedAt: now(),
    };
    const nextContent = buildSkillContent({ name, description, content: nextContentSource });
    await writeFile(skillFilePath(current.id), nextContent, "utf8");
    const nextRecords = [...records];
    nextRecords[index] = nextRecord;
    await this.writeRecords(nextRecords);
    return { ...summarizeRecord(nextRecord, nextContent), content: skillInstructions(nextContent) };
  }

  async delete(id: string): Promise<void> {
    await this.ensureStorage();
    const safeId = assertSafeSkillId(id);
    const records = await this.readRecords();
    const record = records.find((entry) => entry.id === safeId);
    if (!record) throw new Error("Skill not found");
    await rm(skillDir(record.id), { recursive: true, force: true });
    await this.writeRecords(records.filter((entry) => entry.id !== record.id));
  }

  async loadPiSkills(): Promise<LoadSkillsResult> {
    await this.ensureStorage();
    const records = await this.readRecords();
    const enabledIds = new Set(records.filter((record) => record.enabled).map((record) => record.id));
    const result = loadSkillsFromDir({ dir: rootDir(), source: "user" });
    return {
      skills: result.skills.filter((skill) => enabledIds.has(idFromSkillFile(skill.filePath))),
      diagnostics: result.diagnostics,
    };
  }

  private async ensureStorage() {
    await mkdir(rootDir(), { recursive: true });
    await this.ensureDefaultSkills();
  }

  private async readRecords(): Promise<SkillRecord[]> {
    if (!existsSync(indexPath())) return [];
    try {
      const parsed = JSON.parse(await readFile(indexPath(), "utf8")) as unknown;
      if (!Array.isArray(parsed)) return [];
      const records: SkillRecord[] = [];
      const usedIds = new Set<string>();
      for (const entry of parsed.filter((entry): entry is Partial<SkillRecord> => !!entry && typeof entry === "object")) {
        const baseId = normalizeSkillId(typeof entry.id === "string" ? entry.id : entry.name, "skill");
        let id = baseId;
        let suffix = 2;
        while (usedIds.has(id)) {
          id = appendSkillIdSuffix(baseId, suffix);
          suffix += 1;
        }
        usedIds.add(id);
        records.push({
          id,
          name: normalizeSkillName(entry.name, "skill"),
          description:
            typeof entry.description === "string" && entry.description.trim()
              ? entry.description.slice(0, MAX_SKILL_DESCRIPTION_LENGTH)
              : "User-defined Professor Mari skill.",
          enabled: entry.enabled !== false,
          createdAt: typeof entry.createdAt === "string" ? entry.createdAt : now(),
          updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : now(),
        });
      }
      return records;
    } catch (err) {
      logger.warn(err, "[Professor Mari] failed to read workspace skill index");
      return [];
    }
  }

  private async writeRecords(records: SkillRecord[]) {
    await mkdir(rootDir(), { recursive: true });
    await writeFile(indexPath(), JSON.stringify(records, null, 2), "utf8");
  }

  private uniqueId(baseName: string, records: SkillRecord[]) {
    const existing = new Set(records.map((record) => record.id));
    let id = baseName;
    let suffix = 2;
    while (existing.has(id)) {
      id = appendSkillIdSuffix(baseName, suffix);
      suffix += 1;
    }
    return id;
  }

  private assertContent(content: string) {
    if (!skillInstructions(content)) throw new Error("Skill instructions are required.");
    if (content.length > MAX_SKILL_CONTENT_LENGTH) {
      throw new Error(`Skill content must be ${MAX_SKILL_CONTENT_LENGTH} characters or fewer.`);
    }
  }

  private async ensureDefaultSkills() {
    const records = await this.readRecords();
    const existingById = new Map(records.map((record) => [record.id, record] as const));
    const timestamp = now();
    const nextRecords = [...records];
    let changed = false;

    for (const skill of DEFAULT_WORKSPACE_SKILLS) {
      const content = buildSkillContent({
        name: skill.name,
        description: skill.description,
        content: skill.content,
      });
      const existing = existingById.get(skill.id);
      await mkdir(skillDir(skill.id), { recursive: true });
      await writeFile(skillFilePath(skill.id), content, "utf8");
      if (existing) {
        const index = nextRecords.findIndex((record) => record.id === skill.id);
        if (index >= 0) {
          nextRecords[index] = {
            ...existing,
            name: skill.name,
            description: skill.description,
            updatedAt: timestamp,
          };
          changed = true;
        }
        continue;
      }
      nextRecords.push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        enabled: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      changed = true;
    }

    if (changed) await this.writeRecords(nextRecords);
  }
}

let singleton: ProfessorMariWorkspaceSkillsService | null = null;
export function getProfessorMariWorkspaceSkillsService() {
  if (!singleton) singleton = new ProfessorMariWorkspaceSkillsService();
  return singleton;
}
