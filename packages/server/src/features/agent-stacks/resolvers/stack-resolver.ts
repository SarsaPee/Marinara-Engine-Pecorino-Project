import type {
  AgentStackGroup,
  AgentStackManifest,
  AgentStackNodeRef,
  AgentStackRoutingPolicy,
  AgentStackToolPolicy,
  RuntimeStackNodeType,
} from "@marinara-engine/shared";
import { PECORINO_ROLEPLAY_STACK } from "@marinara-engine/shared";

export interface AgentStackPhaseGroupSummary {
  phase: AgentStackGroupSummaryPhase;
  groupId: string;
  groupName: string;
  execution: AgentStackGroup["execution"];
  agentIds: string[];
  runtimeNodes: RuntimeStackNodeType[];
}

type AgentStackGroupSummaryPhase = AgentStackManifest["executionPlan"][number]["phase"];

export interface AgentStackRoutingPolicySummary {
  lowActivationSuppression: boolean;
  exactFirstLookup: boolean;
  frameworkGating: string[];
  turnTagPacketVersion: AgentStackRoutingPolicy["turnTag"]["packetVersion"];
  turnTagSemantics: string[];
  defaultAddressingModes: Record<string, "off" | "hold" | "light" | "focused">;
}

export interface AgentStackToolPolicySummary {
  denyMutatingToolsInDirectLookup: boolean;
  denyMutatingToolsInPreGenerationByDefault: boolean;
  notes: string[];
}

function collectAgentIds(nodes: readonly AgentStackNodeRef[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.kind === "agent") ids.push(node.id);
  }
  return ids;
}

function collectRuntimeNodeTypes(nodes: readonly AgentStackNodeRef[]): RuntimeStackNodeType[] {
  const types: RuntimeStackNodeType[] = [];
  for (const node of nodes) {
    if (node.kind === "runtime") types.push(node.runtimeNodeType);
  }
  return types;
}

export function getDefaultAgentIdsFromStack(stack: AgentStackManifest): string[] {
  const agentIds = new Set<string>();
  for (const phase of stack.executionPlan) {
    for (const group of phase.groups) {
      for (const node of group.nodes) {
        if (node.kind !== "agent") continue;
        agentIds.add(node.id);
      }
    }
  }
  return [...agentIds];
}

export function getExecutionPhaseGroupSummaryFromStack(stack: AgentStackManifest): AgentStackPhaseGroupSummary[] {
  return stack.executionPlan.flatMap((phase) =>
    phase.groups.map((group) => ({
      phase: phase.phase,
      groupId: group.id,
      groupName: group.name,
      execution: group.execution,
      agentIds: collectAgentIds(group.nodes),
      runtimeNodes: collectRuntimeNodeTypes(group.nodes),
    })),
  );
}

export function getRuntimeNodesFromStack(stack: AgentStackManifest): RuntimeStackNodeType[] {
  const runtimeNodes = new Set<RuntimeStackNodeType>();
  for (const phase of stack.executionPlan) {
    for (const group of phase.groups) {
      for (const node of group.nodes) {
        if (node.kind !== "runtime") continue;
        runtimeNodes.add(node.runtimeNodeType);
      }
    }
  }
  return [...runtimeNodes];
}

export function getRoutingPolicySummaryFromStack(stack: AgentStackManifest): AgentStackRoutingPolicySummary {
  return {
    lowActivationSuppression: stack.routingPolicy.lowActivationSuppression,
    exactFirstLookup: stack.routingPolicy.exactFirstLookup,
    frameworkGating: [...stack.routingPolicy.frameworkGating],
    turnTagPacketVersion: stack.routingPolicy.turnTag.packetVersion,
    turnTagSemantics: [...stack.routingPolicy.turnTag.semantics],
    defaultAddressingModes: { ...stack.routingPolicy.turnTag.defaultAddressingModes },
  };
}

export function getToolPolicySummaryFromStack(stack: AgentStackManifest): AgentStackToolPolicySummary {
  return {
    denyMutatingToolsInDirectLookup: stack.toolPolicy.denyMutatingToolsInDirectLookup,
    denyMutatingToolsInPreGenerationByDefault: stack.toolPolicy.denyMutatingToolsInPreGenerationByDefault,
    notes: [...(stack.toolPolicy.notes ?? [])],
  };
}

export function getPecorinoRoleplayStackManifest(): AgentStackManifest {
  return PECORINO_ROLEPLAY_STACK;
}

export function getPecorinoRoleplayDefaultAgentIds(): string[] {
  return getDefaultAgentIdsFromStack(getPecorinoRoleplayStackManifest());
}

export function getPecorinoRoleplayExecutionSummary(): AgentStackPhaseGroupSummary[] {
  return getExecutionPhaseGroupSummaryFromStack(getPecorinoRoleplayStackManifest());
}

export function getPecorinoRoleplayRuntimeNodes(): RuntimeStackNodeType[] {
  return getRuntimeNodesFromStack(getPecorinoRoleplayStackManifest());
}

export function getPecorinoRoleplayRoutingPolicySummary(): AgentStackRoutingPolicySummary {
  return getRoutingPolicySummaryFromStack(getPecorinoRoleplayStackManifest());
}

export function getPecorinoRoleplayToolPolicySummary(): AgentStackToolPolicySummary {
  return getToolPolicySummaryFromStack(getPecorinoRoleplayStackManifest());
}
