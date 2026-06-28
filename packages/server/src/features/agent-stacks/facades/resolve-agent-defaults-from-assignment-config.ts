import type { AgentStackAssignmentConfig, ChatMode } from "@marinara-engine/shared";
import {
  resolveModeDefaultAgentStack,
  type ModeDefaultAgentStackResolution,
} from "./resolve-mode-default-agent-stack.js";

export interface ResolveAgentDefaultsFromAssignmentConfigInput {
  mode: ChatMode;
  assignmentConfig?: AgentStackAssignmentConfig | null;
}

function getModeDefaultStackId(
  mode: ChatMode,
  assignmentConfig: AgentStackAssignmentConfig | null | undefined,
): string | null | undefined {
  return assignmentConfig?.modeDefaultStackIds?.[mode];
}

export function resolveAgentDefaultsFromAssignmentConfig(
  input: ResolveAgentDefaultsFromAssignmentConfigInput,
): ModeDefaultAgentStackResolution {
  return resolveModeDefaultAgentStack({
    mode: input.mode,
    chatStackIdOverride: input.assignmentConfig?.chatStackIdOverride,
    modeDefaultStackId: getModeDefaultStackId(input.mode, input.assignmentConfig),
  });
}
