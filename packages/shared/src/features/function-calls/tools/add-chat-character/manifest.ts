import type { ToolDefinition } from "../../tool-definitions.js";

export const addChatCharacterToolManifest = {
  name: "add_chat_character",
  description:
    "Add an existing character to the current chat roster by exact character name or id. Also reactivates them if they were inactive.",
  parameters: {
    type: "object",
    properties: {
      characterName: {
        type: "string",
        description: "Exact canonical character name to add to the chat roster.",
      },
      characterId: {
        type: "string",
        description: "Optional exact internal character id if known.",
      },
      reason: {
        type: "string",
        description: "Optional short reason for why this character is being added.",
      },
    },
    oneOf: [{ required: ["characterName"] }, { required: ["characterId"] }],
  },
} satisfies ToolDefinition;
