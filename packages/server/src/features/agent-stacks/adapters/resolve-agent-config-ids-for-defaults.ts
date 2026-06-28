import { inArray } from "drizzle-orm";
import type { DB } from "../../../db/connection.js";
import { agentConfigs } from "../../../db/schema/index.js";

export interface DefaultAgentConfigMatchRow {
  type: string;
  id: string;
  phase: string | null;
}

export interface DefaultAgentConfigIdResolution {
  agentConfigIds: string[];
  missingTypes: string[];
  matched: DefaultAgentConfigMatchRow[];
}

export function mapDefaultAgentTypesToAgentConfigIds(
  defaultAgentTypes: readonly string[],
  rows: readonly DefaultAgentConfigMatchRow[],
): DefaultAgentConfigIdResolution {
  const requestedTypes = [...defaultAgentTypes];
  const requestedTypeSet = new Set(requestedTypes);
  const firstRowByType = new Map<string, DefaultAgentConfigMatchRow>();

  for (const row of rows) {
    if (!requestedTypeSet.has(row.type)) continue;
    if (firstRowByType.has(row.type)) continue;
    firstRowByType.set(row.type, row);
  }

  const matched: DefaultAgentConfigMatchRow[] = [];
  const agentConfigIds: string[] = [];
  const missingTypes: string[] = [];
  const seenRequestedTypes = new Set<string>();

  for (const type of requestedTypes) {
    if (seenRequestedTypes.has(type)) continue;
    seenRequestedTypes.add(type);

    const row = firstRowByType.get(type);
    if (!row) {
      missingTypes.push(type);
      continue;
    }

    matched.push(row);
    agentConfigIds.push(row.id);
  }

  return {
    agentConfigIds,
    missingTypes,
    matched,
  };
}

export async function resolveAgentConfigIdsForDefaultAgentTypes(
  db: DB,
  defaultAgentTypes: readonly string[],
): Promise<DefaultAgentConfigIdResolution> {
  const requestedTypes = [...defaultAgentTypes];
  if (requestedTypes.length === 0) {
    return {
      agentConfigIds: [],
      missingTypes: [],
      matched: [],
    };
  }

  const uniqueRequestedTypes = Array.from(new Set(requestedTypes));
  const rows = await db
    .select({
      type: agentConfigs.type,
      id: agentConfigs.id,
      phase: agentConfigs.phase,
    })
    .from(agentConfigs)
    .where(inArray(agentConfigs.type, uniqueRequestedTypes));

  return mapDefaultAgentTypesToAgentConfigIds(requestedTypes, rows);
}
