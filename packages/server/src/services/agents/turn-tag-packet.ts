import type { AgentContext } from "@marinara-engine/shared";

export interface TurnTagPacketRetrievalPolicy {
  mode?: string;
  primary_pack?: string | null;
  exact_terms?: string[];
  aliases?: string[];
  max_entries?: number;
  semantic_support?: boolean;
}

export interface TurnTagPacketAgentAddressing {
  knowledge_router?: string;
  world_context?: string;
  cast_advisor?: string;
  pressure_weaver?: string;
  casting_director?: string;
  world_keeper?: string;
  character_scrivener?: string;
}

export interface TurnTagPacket {
  turn_type?: string;
  primary_intent?: string;
  confidence?: string;
  entities?: string[];
  locations?: string[];
  mentioned_items?: string[];
  active_scene_status?: string;
  tags?: string[];
  exclusions?: string[];
  agent_addressing?: TurnTagPacketAgentAddressing;
  retrieval_policy?: TurnTagPacketRetrievalPolicy;
  notes?: string;
}

const LOOKUP_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "apply",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "does",
  "for",
  "from",
  "get",
  "give",
  "got",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "know",
  "like",
  "look",
  "lorebook",
  "me",
  "my",
  "of",
  "on",
  "or",
  "please",
  "regarding",
  "say",
  "says",
  "show",
  "tell",
  "that",
  "the",
  "their",
  "them",
  "there",
  "these",
  "this",
  "to",
  "try",
  "up",
  "use",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "you",
  "your",
  "yourself",
]);

const FRAMEWORK_PACK_PATTERNS: Array<{ regex: RegExp; pack: string }> = [
  { regex: /\bbunnyrx\b/i, pack: "BunnyRX Melbourne Mega Pack" },
  { regex: /\bbsm-?5\b/i, pack: "BunnyRX Melbourne Mega Pack" },
  { regex: /\bbunnymo\b/i, pack: "BunnyRX Melbourne Mega Pack" },
  { regex: /\bdivine comedy\b/i, pack: "Divine Comedy Repository" },
  { regex: /\bcharacter repository\b/i, pack: "Character Repository" },
  { regex: /\bmelbourne\b/i, pack: "Melbourne" },
];

export interface DeterministicTurnTagPacketInput {
  chatMode?: string | null;
  latestUserContent: string;
  recentMessages?: Array<{ role?: string; content?: string }>;
  chatSummary?: string | null;
  sceneStatus?: string | null;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function extractQuotedTerms(text: string): string[] {
  return Array.from(text.matchAll(/"([^"]+)"|'([^']+)'/g))
    .map((match) => (match[1] ?? match[2] ?? "").trim())
    .filter(Boolean);
}

function extractAllCapsTerms(text: string): string[] {
  return Array.from(text.matchAll(/\b[A-Z0-9][A-Z0-9-]{1,}\b/g))
    .map((match) => match[0]?.trim() ?? "")
    .filter(Boolean);
}

function extractLookupTokens(text: string): string[] {
  return uniqueStrings(
    (text.match(/[A-Za-z0-9][A-Za-z0-9-]{1,}/g) ?? [])
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
      .filter((token) => !LOOKUP_STOPWORDS.has(token.toLowerCase())),
  ).slice(0, 12);
}

function detectPrimaryPack(text: string): string | null {
  for (const candidate of FRAMEWORK_PACK_PATTERNS) {
    if (candidate.regex.test(text)) return candidate.pack;
  }
  return null;
}

function isDirectLookupTurn(text: string): boolean {
  return (
    /\bfrom the lorebook\b/i.test(text) ||
    /\baccording to the lorebook\b/i.test(text) ||
    /\bwhat does the lorebook say\b/i.test(text) ||
    /\blook up\b/i.test(text) ||
    /\bcheck (the )?lorebook\b/i.test(text) ||
    /\bwhat do you know about\b/i.test(text) ||
    /\bquestion is\b/i.test(text) ||
    /^(what|who|where|when|why|how|which)\b/i.test(text.trim())
  );
}

function isFrameworkLookup(text: string): boolean {
  return FRAMEWORK_PACK_PATTERNS.some((candidate) => candidate.regex.test(text));
}

function isTimeSkip(text: string): boolean {
  return /\b(later that day|next day|the next morning|time skip|skip ahead|hours later|tomorrow night)\b/i.test(text);
}

function isSceneSetup(text: string): boolean {
  return /\b(set the scene|scene setup|open on|start with|new scene|walk into|arrive at|slam cut to)\b/i.test(text);
}

function isCharacterRecall(text: string): boolean {
  return /\b(where is|where's|what has .* been up to|what've .* been up to|since i last saw)\b/i.test(text);
}

function resolveSceneStatus(sceneStatus: string | null | undefined, directLookup: boolean): string {
  if (directLookup) return "none";
  if (sceneStatus === "active" || sceneStatus === "ending" || sceneStatus === "transition") return sceneStatus;
  if (sceneStatus === "starting") return "starting";
  return "active";
}

export function buildDeterministicTurnTagPacket(input: DeterministicTurnTagPacketInput): TurnTagPacket {
  const latestUserContent = input.latestUserContent.trim();
  const lower = latestUserContent.toLowerCase();
  const quotedTerms = extractQuotedTerms(latestUserContent);
  const allCapsTerms = extractAllCapsTerms(latestUserContent);
  const lookupTokens = extractLookupTokens(latestUserContent);
  const exactTerms = uniqueStrings([...quotedTerms, ...allCapsTerms, ...lookupTokens]);
  const primaryPack = detectPrimaryPack(latestUserContent);
  const directLookup = isDirectLookupTurn(latestUserContent);
  const frameworkLookup = primaryPack !== null && isFrameworkLookup(latestUserContent);
  const timeSkip = isTimeSkip(latestUserContent);
  const sceneSetup = isSceneSetup(latestUserContent);
  const characterRecall = isCharacterRecall(latestUserContent);
  const activeSceneStatus = resolveSceneStatus(input.sceneStatus, directLookup);

  if (directLookup || frameworkLookup) {
    const frameworkLens = frameworkLookup;
    const tags = uniqueStrings([
      "LOW_ACTIVATION",
      "AMBIENT_HOLD",
      "NO_CAST_CHANGE",
      "NO_NEW_INFORMATION",
      "STATE_MAINTAIN",
      "NO_RANDOM_ESCALATION",
      "NO_CONFLICT_ESCALATION",
      "NO_WORLD_DRIFT",
      "NO_PRESSURE_ESCALATION",
      frameworkLens ? "FRAMEWORK_LOOKUP" : "DIRECT_LOOKUP",
      primaryPack ? `PRIMARY_PACK:${primaryPack}` : "",
      frameworkLens ? "" : "NO_FRAMEWORK_LENS",
      frameworkLens ? "" : "NO_DIAGNOSIS_FROM_VIBES",
      frameworkLens ? "" : "NO_BUNNYRX_UNLESS_EXPLICIT",
    ]);
    return {
      turn_type: "direct_lookup",
      primary_intent: frameworkLens ? "framework_lookup" : "lore_lookup",
      confidence: "high",
      entities: [],
      locations: [],
      mentioned_items: exactTerms.slice(0, 8),
      active_scene_status: "none",
      tags,
      agent_addressing: {
        knowledge_router: frameworkLens ? "framework_lens" : "exact_lookup",
        world_context: "off",
        cast_advisor: "off",
        pressure_weaver: "off",
        casting_director: "hold",
        world_keeper: "off",
        character_scrivener: "off",
      },
      retrieval_policy: {
        mode: frameworkLens ? "framework_lens" : "exact_first",
        primary_pack: primaryPack,
        exact_terms: exactTerms.slice(0, 8),
        aliases: [],
        max_entries: frameworkLens ? 2 : 3,
        semantic_support: !frameworkLens,
      },
      exclusions: uniqueStrings([
        "NO_BROAD_WORLD_OVERVIEW",
        "NO_RANDOM_B_PLOT",
        "NO_CAST_CHANGE",
        frameworkLens ? "" : "NO_FRAMEWORK_LENS",
        frameworkLens ? "" : "NO_DIAGNOSIS_FROM_VIBES",
        frameworkLens ? "" : "NO_BUNNYRX_UNLESS_EXPLICIT",
      ]),
      notes: frameworkLens
        ? "Direct framework lookup. Prefer the named pack only."
        : "Direct lore lookup. Suppress scene agents and retrieve narrowly.",
    };
  }

  if (timeSkip) {
    return {
      turn_type: "time_skip",
      primary_intent: "scene_transition",
      confidence: "medium",
      entities: [],
      locations: [],
      mentioned_items: [],
      active_scene_status: "transition",
      tags: ["SCENE_TRANSITION", "TIME_SKIP", "STATE_ADVANCE"],
      agent_addressing: {
        knowledge_router: "minimal",
        world_context: "focused",
        cast_advisor: "light",
        pressure_weaver: "seed",
        casting_director: "hold",
        world_keeper: "off",
        character_scrivener: "post_if_changed",
      },
      retrieval_policy: {
        mode: "scene_support",
        primary_pack: null,
        exact_terms: [],
        aliases: [],
        max_entries: 2,
        semantic_support: true,
      },
      exclusions: ["NO_RANDOM_B_PLOT"],
      notes: "Time skip or timeline advancement detected.",
    };
  }

  if (sceneSetup) {
    return {
      turn_type: "scene_setup",
      primary_intent: "scene_transition",
      confidence: "medium",
      entities: [],
      locations: [],
      mentioned_items: [],
      active_scene_status: "starting",
      tags: ["SCENE_SETUP", "NEW_BEAT"],
      agent_addressing: {
        knowledge_router: "minimal",
        world_context: "focused",
        cast_advisor: "light",
        pressure_weaver: "seed",
        casting_director: "hold",
        world_keeper: "off",
        character_scrivener: "post_if_changed",
      },
      retrieval_policy: {
        mode: "scene_support",
        primary_pack: null,
        exact_terms: [],
        aliases: [],
        max_entries: 2,
        semantic_support: true,
      },
      exclusions: [],
      notes: "Scene setup beat detected.",
    };
  }

  if (characterRecall) {
    return {
      turn_type: "character_recall",
      primary_intent: "cast_resolution",
      confidence: "medium",
      entities: [],
      locations: [],
      mentioned_items: exactTerms.slice(0, 6),
      active_scene_status: activeSceneStatus,
      tags: ["CHARACTER_RECALL", "CAST_RESOLUTION"],
      agent_addressing: {
        knowledge_router: "minimal",
        world_context: "light",
        cast_advisor: "focused",
        pressure_weaver: "simmer",
        casting_director: "focused",
        world_keeper: "off",
        character_scrivener: "post_if_changed",
      },
      retrieval_policy: {
        mode: "scene_support",
        primary_pack: null,
        exact_terms: exactTerms.slice(0, 6),
        aliases: [],
        max_entries: 3,
        semantic_support: true,
      },
      exclusions: [],
      notes: "Character recall or off-screen continuity request detected.",
    };
  }

  return {
    turn_type: "scene_continuation",
    primary_intent: "character_interaction",
    confidence: "medium",
    entities: [],
    locations: [],
    mentioned_items: [],
    active_scene_status: activeSceneStatus,
    tags: [
      "SCENE_CONTINUATION",
      "STATE_MAINTAIN",
      "LOW_ACTIVATION",
      "AMBIENT_HOLD",
      "NO_CAST_CHANGE",
      "NO_NEW_INFORMATION",
      "NO_RANDOM_ESCALATION",
      "NO_CONFLICT_ESCALATION",
      "NO_FRAMEWORK_LENS",
      "NO_DIAGNOSIS_FROM_VIBES",
      "NO_BUNNYRX_UNLESS_EXPLICIT",
    ],
    agent_addressing: {
      knowledge_router: "off",
      world_context: "light",
      cast_advisor: "off",
      pressure_weaver: "simmer",
      casting_director: "hold",
      world_keeper: "off",
      character_scrivener: "post_if_changed",
    },
    retrieval_policy: {
      mode: "none",
      primary_pack: null,
      exact_terms: [],
      aliases: [],
      max_entries: 0,
      semantic_support: false,
    },
    exclusions: [
      "NO_RANDOM_B_PLOT",
      "NO_BROAD_WORLD_OVERVIEW",
      "NO_FRAMEWORK_LENS",
      "NO_DIAGNOSIS_FROM_VIBES",
      "NO_BUNNYRX_UNLESS_EXPLICIT",
    ],
    notes: lower ? "Default scene continuation routing." : "Empty or minimal turn; preserve scene state.",
  };
}

function resolveAddressingModeForAgent(agentType: string, packet: TurnTagPacket | null): string | null {
  if (!packet?.agent_addressing) return null;
  if (agentType === "knowledge-router" || agentType === "knowledge-retrieval") {
    return packet.agent_addressing.knowledge_router ?? null;
  }
  if (agentType === "lorebook-keeper") return packet.agent_addressing.world_keeper ?? null;
  if (agentType.includes("character-scrivener")) return packet.agent_addressing.character_scrivener ?? null;
  if (agentType.includes("world-context")) return packet.agent_addressing.world_context ?? null;
  if (agentType.includes("cast-advisor")) return packet.agent_addressing.cast_advisor ?? null;
  if (agentType.includes("pressure-weaver")) return packet.agent_addressing.pressure_weaver ?? null;
  if (agentType.includes("casting-director")) return packet.agent_addressing.casting_director ?? null;
  return null;
}

export function shouldRunAgentForTurnTagPacket(agentType: string, packet: TurnTagPacket | null): boolean {
  const mode = resolveAddressingModeForAgent(agentType, packet);
  if (mode === null) return true;
  if (mode === "off" || mode === "hold") return false;
  return true;
}

export function normalizeAgentVariables(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const variables: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (!key || typeof rawValue !== "string") continue;
    variables[key] = rawValue;
  }
  return variables;
}

export function parseTurnTagPacket(raw: unknown): TurnTagPacket | null {
  if (!raw) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as TurnTagPacket;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as TurnTagPacket;
  } catch {
    return null;
  }
}

export function getTurnTagPacketRawFromChatMeta(chatMeta?: Record<string, unknown>): string | null {
  const variables = normalizeAgentVariables(chatMeta?.agentVariables);
  return typeof variables.turn_tag_packet_v1 === "string" ? variables.turn_tag_packet_v1 : null;
}

export function parseTurnTagPacketFromChatMeta(chatMeta?: Record<string, unknown>): TurnTagPacket | null {
  return parseTurnTagPacket(getTurnTagPacketRawFromChatMeta(chatMeta));
}

export function parseTurnTagPacketFromAgentContext(context: AgentContext): TurnTagPacket | null {
  const fromMemory = parseTurnTagPacket(context.memory._turnTagPacket);
  if (fromMemory) return fromMemory;

  const rawFromMemory =
    typeof context.memory._turnTagPacketRaw === "string" ? (context.memory._turnTagPacketRaw as string) : null;
  const parsedRaw = parseTurnTagPacket(rawFromMemory);
  if (parsedRaw) return parsedRaw;

  const variables = normalizeAgentVariables(context.memory._chatVariables);
  return parseTurnTagPacket(variables.turn_tag_packet_v1);
}
