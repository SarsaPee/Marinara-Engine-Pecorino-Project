import type { ChatMode } from "../../types/chat.js";

export interface AgentStackAssignmentConfig {
  chatStackIdOverride?: string | null;
  modeDefaultStackIds?: Partial<Record<ChatMode, string | null>>;
}
