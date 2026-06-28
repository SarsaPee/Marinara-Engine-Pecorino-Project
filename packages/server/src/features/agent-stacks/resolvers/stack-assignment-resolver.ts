import { ROLEPLAY_DEFAULT_AGENT_IDS, type ChatMode } from "@marinara-engine/shared";
import { PECORINO_ROLEPLAY_STACK_ID } from "@marinara-engine/shared";
import type { AgentStackManifest } from "@marinara-engine/shared";
import {
  getDefaultAgentIdsFromStack,
  getPecorinoRoleplayStackManifest,
  getRuntimeNodesFromStack,
} from "./stack-resolver.js";

export type AgentStackAssignmentSource = "chat_override" | "mode_default" | "legacy_fallback" | "none";

export interface ResolveAgentStackAssignmentInput {
  mode: ChatMode;
  chatStackIdOverride?: string | null;
  modeDefaultStackId?: string | null;
}

export interface AgentStackAssignmentResolution {
  source: AgentStackAssignmentSource;
  requestedStackId: string | null;
  appliedStackId: string | null;
  stack: AgentStackManifest | null;
  defaultAgentIds: string[];
  runtimeNodeTypes: string[];
  modeValidated: boolean;
}

function normalizeOptionalId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getSeededStackById(stackId: string | null): AgentStackManifest | null {
  if (stackId === PECORINO_ROLEPLAY_STACK_ID) return getPecorinoRoleplayStackManifest();
  return null;
}

function isModeAllowedForStack(mode: ChatMode, stack: AgentStackManifest): boolean {
  return stack.modeAllowlist.includes(mode);
}

function buildAppliedResolution(
  source: Extract<AgentStackAssignmentSource, "chat_override" | "mode_default">,
  requestedStackId: string,
  stack: AgentStackManifest,
): AgentStackAssignmentResolution {
  return {
    source,
    requestedStackId,
    appliedStackId: stack.metadata.id,
    stack,
    defaultAgentIds: getDefaultAgentIdsFromStack(stack),
    runtimeNodeTypes: getRuntimeNodesFromStack(stack),
    modeValidated: true,
  };
}

function buildLegacyFallbackResolution(): AgentStackAssignmentResolution {
  return {
    source: "legacy_fallback",
    requestedStackId: null,
    appliedStackId: null,
    stack: null,
    defaultAgentIds: [...ROLEPLAY_DEFAULT_AGENT_IDS],
    runtimeNodeTypes: [],
    modeValidated: true,
  };
}

function buildNoAssignmentResolution(requestedStackId: string | null, modeValidated = false): AgentStackAssignmentResolution {
  return {
    source: "none",
    requestedStackId,
    appliedStackId: null,
    stack: null,
    defaultAgentIds: [],
    runtimeNodeTypes: [],
    modeValidated,
  };
}

export function resolveAgentStackAssignment(
  input: ResolveAgentStackAssignmentInput,
): AgentStackAssignmentResolution {
  const chatOverrideId = normalizeOptionalId(input.chatStackIdOverride);
  if (chatOverrideId) {
    const stack = getSeededStackById(chatOverrideId);
    if (stack && isModeAllowedForStack(input.mode, stack)) {
      return buildAppliedResolution("chat_override", chatOverrideId, stack);
    }
    return input.mode === "roleplay"
      ? buildLegacyFallbackResolution()
      : buildNoAssignmentResolution(chatOverrideId, false);
  }

  const modeDefaultId = normalizeOptionalId(input.modeDefaultStackId);
  if (modeDefaultId) {
    const stack = getSeededStackById(modeDefaultId);
    if (stack && isModeAllowedForStack(input.mode, stack)) {
      return buildAppliedResolution("mode_default", modeDefaultId, stack);
    }
    return input.mode === "roleplay"
      ? buildLegacyFallbackResolution()
      : buildNoAssignmentResolution(modeDefaultId, false);
  }

  if (input.mode === "roleplay") {
    return buildLegacyFallbackResolution();
  }

  return buildNoAssignmentResolution(null, false);
}
