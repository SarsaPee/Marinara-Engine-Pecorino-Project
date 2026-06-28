import type { ToolDefinition } from "../../tool-definitions.js";

export const removeChatCharacterToolManifest = {
  name: "remove_chat_character",
  description:
    "Remove a character from the current chat roster by exact character name or id. Also clears any inactive flag for that character.",
  parameters: {
    type: "object",
    properties: {
      characterName: {
        type: "string",
        description: "Exact canonical character name to remove from the chat roster.",
      },
      characterId: {
        type: "string",
        description: "Optional exact internal character id if known.",
      },
      reason: {
        type: "string",
        description: "Optional short reason for why this character is being removed.",
      },
    },
    oneOf: [{ required: ["characterName"] }, { required: ["characterId"] }],
  },
} satisfies ToolDefinition;
