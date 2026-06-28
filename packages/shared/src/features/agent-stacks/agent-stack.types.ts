import type { AgentPhase } from "../../types/agent.js";
import type { ChatMode } from "../../types/chat.js";
import type { LorebookCategory } from "../../types/lorebook.js";

export type RuntimeStackNodeType =
  | "turn-classifier"
  | "knowledge-router"
  | "knowledge-retrieval"
  | "stack-context-injector";

export type AgentStackLorebookReadMode = "disabled" | "inherit_chat_active" | "filtered" | "explicit_only";

export type AgentStackLorebookWriteMode = "disabled" | "explicit_target" | "selector_target";

export interface AgentStackLorebookSelector {
  lorebookIds?: readonly string[];
  lorebookNames?: readonly string[];
  categories?: readonly LorebookCategory[];
  tags?: readonly string[];
  excludeTags?: readonly string[];
  includeEmbeddedCharacterBooks?: boolean;
  includeCharacterLinkedLorebooks?: boolean;
  includePersonaLinkedLorebooks?: boolean;
  includeGlobalLorebooks?: boolean;
}

export interface AgentStackNodeLorebookReadBinding {
  mode: AgentStackLorebookReadMode;
  selector?: AgentStackLorebookSelector;
  notes?: readonly string[];
}

export interface AgentStackNodeLorebookWriteBinding {
  mode: AgentStackLorebookWriteMode;
  targetLorebookId?: string | null;
  targetLorebookName?: string | null;
  targetCategory?: LorebookCategory | null;
  targetTag?: string | null;
  selector?: AgentStackLorebookSelector;
  notes?: readonly string[];
}

export interface AgentStackNodeLorebookBinding {
  read?: AgentStackNodeLorebookReadBinding;
  write?: AgentStackNodeLorebookWriteBinding;
}

export interface AgentStackNodeBase {
  lorebooks?: AgentStackNodeLorebookBinding;
}

export type AgentStackNodeRef =
  | (AgentStackNodeBase & {
      kind: "agent";
      id: string;
    })
  | (AgentStackNodeBase & {
      kind: "runtime";
      runtimeNodeType: RuntimeStackNodeType;
      id?: string;
    });

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
