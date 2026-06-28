import type { AgentStackAssignmentConfig, ChatMode } from "@marinara-engine/shared";
import {
  resolveAgentDefaultsFromAssignmentConfig,
  type ResolveAgentDefaultsFromAssignmentConfigInput,
} from "../facades/resolve-agent-defaults-from-assignment-config.js";

export interface InspectAgentStackResolutionInput {
  mode: ChatMode;
  assignmentConfig?: AgentStackAssignmentConfig | null;
}

export interface AgentStackResolutionDiagnosticDetails {
  hasAssignmentConfig: boolean;
  hasChatOverride: boolean;
  modeDefaultStackId: string | null;
  resolvedStackId: string | null;
  agentCount: number;
  isLegacyFallback: boolean;
}

export interface AgentStackResolutionDiagnostic {
  mode: ChatMode;
  source: "chat_override" | "mode_default" | "legacy_fallback" | "none";
  stackId: string | null;
  agentIds: string[];
  details: AgentStackResolutionDiagnosticDetails;
}

function toAssignmentInput(input: InspectAgentStackResolutionInput): ResolveAgentDefaultsFromAssignmentConfigInput {
  return {
    mode: input.mode,
    assignmentConfig: input.assignmentConfig,
  };
}

function getModeDefaultStackId(mode: ChatMode, assignmentConfig: AgentStackAssignmentConfig | null | undefined): string | null {
  return assignmentConfig?.modeDefaultStackIds?.[mode] ?? null;
}

export function inspectAgentStackResolution(
  input: InspectAgentStackResolutionInput,
): AgentStackResolutionDiagnostic {
  const resolved = resolveAgentDefaultsFromAssignmentConfig(toAssignmentInput(input));
  return {
    mode: resolved.mode,
    source: resolved.source,
    stackId: resolved.stackId,
    agentIds: [...resolved.agentIds],
    details: {
      hasAssignmentConfig: input.assignmentConfig != null,
      hasChatOverride: typeof input.assignmentConfig?.chatStackIdOverride === "string"
        ? input.assignmentConfig.chatStackIdOverride.trim().length > 0
        : false,
      modeDefaultStackId: getModeDefaultStackId(input.mode, input.assignmentConfig),
      resolvedStackId: resolved.stackId,
      agentCount: resolved.agentIds.length,
      isLegacyFallback: resolved.source === "legacy_fallback",
    },
  };
}
