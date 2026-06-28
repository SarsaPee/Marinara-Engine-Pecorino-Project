import type { DB } from "./connection.js";
import { customTools } from "./schema/index.js";
import { now } from "../utils/id-generator.js";

const DEFAULT_CUSTOM_TOOLS = [
  {
    id: "default-tool-inspect-chat-runtime",
    name: "inspect_chat_runtime",
    description: "Inspect the current chat runtime, including active agents, tools, lorebooks, and recent message context.",
    parametersSchema: "{}",
    executionType: "script",
    includeHiddenContext: "true",
    staticResult: null,
    scriptBody: `const runtime = context?.runtime ?? {};
const recentMessages = Array.isArray(context?.recentMessages) ? context.recentMessages.slice(-8) : [];
return {
  tool: "inspect_chat_runtime",
  chatId: context?.chatId ?? null,
  chatMode: context?.chatMode ?? null,
  personaId: context?.personaId ?? null,
  personaName: context?.personaName ?? null,
  primaryCharacterId: context?.characterId ?? null,
  primaryCharacterName: context?.characterName ?? null,
  characters: Array.isArray(context?.characters) ? context.characters : [],
  runtime: {
    enableAgents: runtime.enableAgents ?? null,
    enableTools: runtime.enableTools ?? null,
    activeAgentIds: Array.isArray(runtime.activeAgentIds) ? runtime.activeAgentIds : [],
    activeToolIds: Array.isArray(runtime.activeToolIds) ? runtime.activeToolIds : [],
    activeLorebookIds: Array.isArray(runtime.activeLorebookIds) ? runtime.activeLorebookIds : [],
    resolvedAgents: Array.isArray(runtime.resolvedAgents) ? runtime.resolvedAgents : [],
    promptCharacterIds: Array.isArray(runtime.promptCharacterIds) ? runtime.promptCharacterIds : [],
  },
  summary: context?.summary ?? "",
  variableKeys: context?.variables ? Object.keys(context.variables) : [],
  recentMessages,
};`,
  },
  {
    id: "default-tool-inspect-turn-tag-packet",
    name: "inspect_turn_tag_packet",
    description: "Read and parse the current turn tag packet or another agent variable from hidden chat context.",
    parametersSchema:
      '{"type":"object","properties":{"variableName":{"type":"string","description":"Chat variable to inspect. Defaults to turn_tag_packet_v1."}}}',
    executionType: "script",
    includeHiddenContext: "true",
    staticResult: null,
    scriptBody: `const variableName = typeof args.variableName === "string" && args.variableName.trim() ? args.variableName.trim() : "turn_tag_packet_v1";
const raw = context?.variables?.[variableName];
if (typeof raw !== "string" || !raw.trim()) {
  return { tool: "inspect_turn_tag_packet", variableName, found: false, value: null };
}
try {
  return { tool: "inspect_turn_tag_packet", variableName, found: true, parsed: JSON.parse(raw), raw };
} catch (error) {
  return {
    tool: "inspect_turn_tag_packet",
    variableName,
    found: true,
    parsed: null,
    raw,
    error: error instanceof Error ? error.message : "Failed to parse JSON",
  };
}`,
  },
  {
    id: "default-tool-inspect-agent-activity",
    name: "inspect_agent_activity",
    description: "Inspect which agents are active for the current turn and which agent variables are present.",
    parametersSchema: "{}",
    executionType: "script",
    includeHiddenContext: "true",
    staticResult: null,
    scriptBody: `const runtime = context?.runtime ?? {};
const resolvedAgents = Array.isArray(runtime.resolvedAgents) ? runtime.resolvedAgents : [];
const variables = context?.variables ?? {};
const interestingVariables = Object.fromEntries(
  Object.entries(variables).filter(([key]) =>
    key.endsWith("_v1") ||
    key.includes("turn_tag_packet") ||
    key.includes("casting") ||
    key.includes("pressure") ||
    key.includes("world_context")
  )
);
return {
  tool: "inspect_agent_activity",
  activeAgentIds: Array.isArray(runtime.activeAgentIds) ? runtime.activeAgentIds : [],
  resolvedAgents,
  visibleVariableKeys: Object.keys(interestingVariables),
  visibleVariables: interestingVariables,
};`,
  },
  {
    id: "default-tool-inspect-lorebook-scope",
    name: "inspect_lorebook_scope",
    description: "Inspect the current lorebook scope, active lorebooks, and prompt character targets for this turn.",
    parametersSchema: "{}",
    executionType: "script",
    includeHiddenContext: "true",
    staticResult: null,
    scriptBody: `const runtime = context?.runtime ?? {};
return {
  tool: "inspect_lorebook_scope",
  activeLorebookIds: Array.isArray(runtime.activeLorebookIds) ? runtime.activeLorebookIds : [],
  promptCharacterIds: Array.isArray(runtime.promptCharacterIds) ? runtime.promptCharacterIds : [],
  chatCharacterIds: Array.isArray(context?.characterIds) ? context.characterIds : [],
  chatCharacterNames: Array.isArray(context?.characterNames) ? context.characterNames : [],
  summaryPresent: typeof context?.summary === "string" && context.summary.trim().length > 0,
};`,
  },
  {
    id: "default-tool-add-chat-character",
    name: "add_chat_character",
    description: "Add a character to the current chat roster by canonical name or character ID.",
    parametersSchema:
      '{"type":"object","properties":{"characterId":{"type":"string","description":"Character ID to add."},"characterName":{"type":"string","description":"Canonical character name to add."},"reason":{"type":"string","description":"Why this change is being made."}},"oneOf":[{"required":["characterId"]},{"required":["characterName"]}]}',
    executionType: "static",
    includeHiddenContext: "false",
    staticResult: '{"result":"Handled internally by Marinara."}',
    scriptBody: null,
  },
  {
    id: "default-tool-remove-chat-character",
    name: "remove_chat_character",
    description: "Remove a character from the current chat roster by canonical name or character ID.",
    parametersSchema:
      '{"type":"object","properties":{"characterId":{"type":"string","description":"Character ID to remove."},"characterName":{"type":"string","description":"Canonical character name to remove."},"reason":{"type":"string","description":"Why this change is being made."}},"oneOf":[{"required":["characterId"]},{"required":["characterName"]}]}',
    executionType: "static",
    includeHiddenContext: "false",
    staticResult: '{"result":"Handled internally by Marinara."}',
    scriptBody: null,
  },
  {
    id: "default-tool-set-chat-character-active",
    name: "set_chat_character_active",
    description: "Activate or deactivate a character already present in the current chat roster.",
    parametersSchema:
      '{"type":"object","properties":{"characterId":{"type":"string","description":"Character ID to update."},"characterName":{"type":"string","description":"Canonical character name to update."},"active":{"type":"boolean","description":"Whether the character should be active in the chat."},"reason":{"type":"string","description":"Why this change is being made."}},"required":["active"],"oneOf":[{"required":["characterId"]},{"required":["characterName"]}]}',
    executionType: "static",
    includeHiddenContext: "false",
    staticResult: '{"result":"Handled internally by Marinara."}',
    scriptBody: null,
  },
] as const;

export async function seedDefaultCustomTools(db: DB) {
  const existing = await db.select({ id: customTools.id, name: customTools.name }).from(customTools);
  const existingIds = new Set(existing.map((row) => row.id));
  const existingNames = new Set(existing.map((row) => row.name));
  const timestamp = now();

  const toInsert = DEFAULT_CUSTOM_TOOLS.filter((tool) => !existingIds.has(tool.id) && !existingNames.has(tool.name)).map(
    (tool) => ({
      ...tool,
      enabled: "true",
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  );

  if (toInsert.length > 0) {
    await db.insert(customTools).values(toInsert);
  }
}
