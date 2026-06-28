import type { AgentPhase } from "../../types/agent.js";
import type { ChatMode } from "../../types/chat.js";

export type RuntimeStackNodeType =
  | "turn-classifier"
  | "knowledge-router"
  | "knowledge-retrieval"
  | "stack-context-injector";

export type AgentStackNodeRef =
  | {
      kind: "agent";
      id: string;
    }
  | {
      kind: "runtime";
      runtimeNodeType: RuntimeStackNodeType;
      id?: string;
    };

export interface AgentStackMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
}

export interface AgentStackGroup {
  id: string;
  name: string;
  execution: "sequential" | "parallel";
  nodes: readonly AgentStackNodeRef[];
}

export interface AgentStackPhasePlan {
  phase: AgentPhase;
  groups: readonly AgentStackGroup[];
}

export interface TurnTagPolicyPlaceholder {
  packetVersion: "turn_tag_packet_v1";
  semantics: readonly string[];
  defaultAddressingModes: Readonly<Record<string, "off" | "hold" | "light" | "focused">>;
}

export interface AgentStackRoutingPolicy {
  lowActivationSuppression: boolean;
  exactFirstLookup: boolean;
  frameworkGating: readonly string[];
  turnTag: TurnTagPolicyPlaceholder;
}

export interface AgentStackToolPolicy {
  denyMutatingToolsInDirectLookup: boolean;
  denyMutatingToolsInPreGenerationByDefault: boolean;
  notes?: readonly string[];
}

export interface AgentStackManifest {
  metadata: AgentStackMetadata;
  modeAllowlist: readonly ChatMode[];
  executionPlan: readonly AgentStackPhasePlan[];
  routingPolicy: AgentStackRoutingPolicy;
  toolPolicy: AgentStackToolPolicy;
}
