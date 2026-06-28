import type { ChatMode } from "@marinara-engine/shared";
import { resolveRoleplayDefaultAgentIds } from "../bridges/resolve-roleplay-default-agent-ids.js";
import {
  resolveAgentStackAssignment,
  type AgentStackAssignmentSource,
  type ResolveAgentStackAssignmentInput,
} from "../resolvers/stack-assignment-resolver.js";

export interface ResolveModeDefaultAgentStackInput {
  mode: ChatMode;
  chatStackIdOverride?: string | null;
  modeDefaultStackId?: string | null;
}

export interface ModeDefaultAgentStackResolution {
  mode: ChatMode;
  source: AgentStackAssignmentSource;
  stackId: string | null;
  agentIds: string[];
}

function toAssignmentInput(input: ResolveModeDefaultAgentStackInput): ResolveAgentStackAssignmentInput {
  return {
    mode: input.mode,
    chatStackIdOverride: input.chatStackIdOverride,
    modeDefaultStackId: input.modeDefaultStackId,
  };
}

export function resolveModeDefaultAgentStack(
  input: ResolveModeDefaultAgentStackInput,
): ModeDefaultAgentStackResolution {
  const assignment = resolveAgentStackAssignment(toAssignmentInput(input));

  if (input.mode === "roleplay") {
    const roleplayDefaults = resolveRoleplayDefaultAgentIds(input);
    return {
      mode: input.mode,
      source: roleplayDefaults.source,
      stackId: assignment.appliedStackId,
      agentIds: [...roleplayDefaults.agentIds],
    };
  }

  return {
    mode: input.mode,
    source: assignment.source,
    stackId: assignment.appliedStackId,
    agentIds: [...assignment.defaultAgentIds],
  };
}
