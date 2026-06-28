import type { AgentStackManifest } from "../agent-stack.types.js";

export const PECORINO_ROLEPLAY_STACK_ID = "pecorino-roleplay-stack";

export const PECORINO_ROLEPLAY_STACK = {
  metadata: {
    id: PECORINO_ROLEPLAY_STACK_ID,
    name: "Pecorino Roleplay Stack",
    description:
      "Seeded Roleplay-first agent stack capturing the current Pecorino RP composition, execution intent, and routing/tool policy placeholders.",
    author: "SarsaPee / Pecorino Project",
  },
  modeAllowlist: ["roleplay"],
  executionPlan: [
    {
      phase: "pre_generation",
      groups: [
        {
          id: "classifier",
          name: "Turn Classifier",
          execution: "sequential",
          nodes: [{ kind: "runtime", runtimeNodeType: "turn-classifier", id: "turn-classifier" }],
        },
        {
          id: "routing-context",
          name: "Routing And Context",
          execution: "parallel",
          nodes: [
            { kind: "agent", id: "knowledge-router" },
            { kind: "runtime", runtimeNodeType: "knowledge-router", id: "knowledge-router-runtime" },
            { kind: "runtime", runtimeNodeType: "stack-context-injector", id: "stack-context-injector" },
          ],
        },
        {
          id: "advisory",
          name: "Advisory Agents",
          execution: "parallel",
          nodes: [
            { kind: "agent", id: "custom-world-context-agent-v11" },
            { kind: "agent", id: "custom-cast-advisor-v11" },
            { kind: "agent", id: "custom-pressure-weaver-v11" },
          ],
        },
        {
          id: "casting",
          name: "Casting Decisions",
          execution: "sequential",
          nodes: [{ kind: "agent", id: "custom-casting-director-v11" }],
        },
      ],
    },
    {
      phase: "parallel",
      groups: [
        {
          id: "retrieval",
          name: "Knowledge Retrieval",
          execution: "parallel",
          nodes: [{ kind: "runtime", runtimeNodeType: "knowledge-retrieval", id: "knowledge-retrieval" }],
        },
      ],
    },
    {
      phase: "post_processing",
      groups: [
        {
          id: "world-writeback",
          name: "World Writeback",
          execution: "sequential",
          nodes: [{ kind: "agent", id: "lorebook-keeper" }],
        },
        {
          id: "character-writeback",
          name: "Character Writeback",
          execution: "sequential",
          nodes: [{ kind: "agent", id: "custom-character-scrivener-v11" }],
        },
        {
          id: "tracker-writeback",
          name: "Tracker Writeback",
          execution: "sequential",
          nodes: [{ kind: "agent", id: "custom-tracker" }],
        },
      ],
    },
  ],
  routingPolicy: {
    lowActivationSuppression: true,
    exactFirstLookup: true,
    frameworkGating: ["bunnyrx", "bunnymo", "framework", "diagnosis", "direct_lookup"],
    turnTag: {
      packetVersion: "turn_tag_packet_v1",
      semantics: [
        "low-activation suppression",
        "exact-first direct lookup",
        "BunnyRX/framework gating",
        "per-agent addressing modes",
      ],
      defaultAddressingModes: {
        knowledge_router: "light",
        world_context: "light",
        cast_advisor: "light",
        pressure_weaver: "light",
        casting_director: "hold",
        world_keeper: "hold",
        character_scrivener: "hold",
        custom_tracker: "hold",
      },
    },
  },
  toolPolicy: {
    denyMutatingToolsInDirectLookup: true,
    denyMutatingToolsInPreGenerationByDefault: true,
    notes: [
      "Pre-generation mutating tools stay denied unless a later stack policy slice explicitly allows them.",
      "Direct lookup turns should avoid mutating tools by default.",
    ],
  },
} as const satisfies AgentStackManifest;

export const PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS = [
  "knowledge-router",
  "custom-world-context-agent-v11",
  "custom-cast-advisor-v11",
  "custom-pressure-weaver-v11",
  "custom-casting-director-v11",
  "lorebook-keeper",
  "custom-character-scrivener-v11",
  "custom-tracker",
] as const;
