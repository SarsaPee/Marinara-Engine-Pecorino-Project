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

export function resolveActiveAgentSelectionOrder(
  orderedActiveAgentIds: readonly string[],
  candidate: { id?: string | null; type: string },
): number | null {
  const candidateIds = [candidate.id, candidate.type, `${BUILTIN_AGENT_CONFIG_ID_PREFIX}${candidate.type}`].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  for (let index = 0; index < orderedActiveAgentIds.length; index += 1) {
    if (candidateIds.includes(orderedActiveAgentIds[index]!)) return index;
  }

  return null;
}
