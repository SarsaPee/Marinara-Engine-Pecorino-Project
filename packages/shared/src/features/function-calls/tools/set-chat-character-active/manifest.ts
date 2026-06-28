import type { ToolDefinition } from "../../tool-definitions.js";

export const setChatCharacterActiveToolManifest = {
  name: "set_chat_character_active",
  description:
    "Enable or disable an already-present chat character by exact character name or id without removing them from the roster.",
  parameters: {
    type: "object",
    properties: {
      characterName: {
        type: "string",
        description: "Exact canonical character name to activate or deactivate.",
      },
      characterId: {
        type: "string",
        description: "Optional exact internal character id if known.",
      },
      active: {
        type: "boolean",
        description: "True to mark active, false to mark inactive.",
      },
      reason: {
        type: "string",
        description: "Optional short reason for the active-state change.",
      },
    },
    required: ["active"],
    oneOf: [{ required: ["characterName"] }, { required: ["characterId"] }],
  },
} satisfies ToolDefinition;
