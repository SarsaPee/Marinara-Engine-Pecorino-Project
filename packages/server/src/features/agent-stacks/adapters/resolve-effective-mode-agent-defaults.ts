import type { AgentStackAssignmentConfig, ChatMode } from "@marinara-engine/shared";
import { getChatModeDefaultAgentIds } from "@marinara-engine/shared";
import {
  inspectAgentStackResolution,
  type AgentStackResolutionDiagnostic,
} from "../diagnostics/inspect-agent-stack-resolution.js";
import {
  resolveAgentDefaultsFromAssignmentConfig,
  type ResolveAgentDefaultsFromAssignmentConfigInput,
} from "../facades/resolve-agent-defaults-from-assignment-config.js";

export type EffectiveModeAgentDefaultsSource =
  | "chat_override"
  | "mode_default"
  | "legacy_fallback"
  | "shared_legacy"
  | "none";

export interface ResolveEffectiveModeAgentDefaultsInput {
  mode: ChatMode;
  assignmentConfig?: AgentStackAssignmentConfig | null;
  includeDiagnostics?: boolean;
}

export interface EffectiveModeAgentDefaultsResult {
  mode: ChatMode;
  source: EffectiveModeAgentDefaultsSource;
  stackId: string | null;
  agentIds: string[];
  diagnostics?: AgentStackResolutionDiagnostic;
}

function toAssignmentInput(input: ResolveEffectiveModeAgentDefaultsInput): ResolveAgentDefaultsFromAssignmentConfigInput {
  return {
    mode: input.mode,
    assignmentConfig: input.assignmentConfig,
  };
}

export function resolveEffectiveModeAgentDefaults(
  input: ResolveEffectiveModeAgentDefaultsInput,
): EffectiveModeAgentDefaultsResult {
  const assignmentResolved = resolveAgentDefaultsFromAssignmentConfig(toAssignmentInput(input));

  let source: EffectiveModeAgentDefaultsSource = assignmentResolved.source;
  let stackId = assignmentResolved.stackId;
  let agentIds = [...assignmentResolved.agentIds];

  if (assignmentResolved.source === "none") {
    source = "shared_legacy";
    stackId = null;
    agentIds = getChatModeDefaultAgentIds(input.mode);
  }

  return {
    mode: input.mode,
    source,
    stackId,
    agentIds,
    ...(input.includeDiagnostics
      ? {
          diagnostics: inspectAgentStackResolution({
            mode: input.mode,
            assignmentConfig: input.assignmentConfig,
          }),
        }
      : {}),
  };
}
