import { PECORINO_ROLEPLAY_STACK } from "@marinara-engine/shared";

export function getRoleplayStackDefaultAgentIds(): string[] {
  const agentIds = new Set<string>();
  for (const phase of PECORINO_ROLEPLAY_STACK.executionPlan) {
    for (const group of phase.groups) {
      for (const node of group.nodes) {
        if (node.kind !== "agent") continue;
        agentIds.add(node.id);
      }
    }
  }
  return [...agentIds];
}
