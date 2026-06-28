const BUILTIN_AGENT_CONFIG_ID_PREFIX = "builtin:";

export function matchesActiveAgentSelection(
  activeAgentIds: ReadonlySet<string>,
  candidate: { id?: string | null; type: string },
): boolean {
  if (candidate.id && activeAgentIds.has(candidate.id)) return true;
  if (activeAgentIds.has(candidate.type)) return true;
  if (activeAgentIds.has(`${BUILTIN_AGENT_CONFIG_ID_PREFIX}${candidate.type}`)) return true;
  return false;
}

export const matchesActiveAgentSelectionForTest = matchesActiveAgentSelection;
