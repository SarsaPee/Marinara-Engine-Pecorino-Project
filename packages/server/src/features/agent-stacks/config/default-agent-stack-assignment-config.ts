import type { AgentStackAssignmentConfig } from "@marinara-engine/shared";
import { PECORINO_ROLEPLAY_STACK_ID } from "@marinara-engine/shared";

export function getDefaultAgentStackAssignmentConfig(): AgentStackAssignmentConfig {
  return {
    modeDefaultStackIds: {
      roleplay: PECORINO_ROLEPLAY_STACK_ID,
    },
  };
}
