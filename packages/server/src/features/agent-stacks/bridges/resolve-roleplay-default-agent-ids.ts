import type { ChatMode } from "@marinara-engine/shared";
import {
  type AgentStackAssignmentSource,
  resolveAgentStackAssignment,
  type ResolveAgentStackAssignmentInput,
} from "../resolvers/stack-assignment-resolver.js";

export interface ResolveRoleplayDefaultAgentIdsInput {
  mode: ChatMode;
  chatStackIdOverride?: string | null;
  modeDefaultStackId?: string | null;
}

export interface RoleplayDefaultAgentIdsBridgeResult {
  source: AgentStackAssignmentSource;
  agentIds: string[];
}

function toAssignmentInput(input: ResolveRoleplayDefaultAgentIdsInput): ResolveAgentStackAssignmentInput {
  return {
    mode: input.mode,
    chatStackIdOverride: input.chatStackIdOverride,
    modeDefaultStackId: input.modeDefaultStackId,
  };
}

export function resolveRoleplayDefaultAgentIds(
  input: ResolveRoleplayDefaultAgentIdsInput,
): RoleplayDefaultAgentIdsBridgeResult {
  const resolution = resolveAgentStackAssignment(toAssignmentInput(input));
  return {
    source: resolution.source,
    agentIds: [...resolution.defaultAgentIds],
  };
}
