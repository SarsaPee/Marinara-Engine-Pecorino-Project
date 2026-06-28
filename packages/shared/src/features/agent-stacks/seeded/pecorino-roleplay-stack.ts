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
          nodes: [
            {
              kind: "runtime",
              runtimeNodeType: "turn-classifier",
              id: "turn-classifier",
            },
          ],
        },
        {
          id: "routing-context",
          name: "Routing And Context",
          execution: "parallel",
          nodes: [
            {
              kind: "agent",
              id: "knowledge-router",
              lorebooks: {
                read: {
                  mode: "inherit_chat_active",
                  selector: {
                    includeEmbeddedCharacterBooks: true,
                    includeCharacterLinkedLorebooks: true,
                    includeGlobalLorebooks: true,
                  },
                  notes: [
                    "Knowledge Router can see the active lorebook universe.",
                    "Turn-tag routing narrows what it should actually retrieve on a given turn.",
                  ],
                },
              },
            },
            {
              kind: "runtime",
              runtimeNodeType: "knowledge-router",
              id: "knowledge-router-runtime",
              lorebooks: {
                read: {
                  mode: "inherit_chat_active",
                  selector: {
                    includeEmbeddedCharacterBooks: true,
                    includeCharacterLinkedLorebooks: true,
                    includeGlobalLorebooks: true,
                  },
                },
              },
            },
            {
              kind: "runtime",
              runtimeNodeType: "stack-context-injector",
              id: "stack-context-injector",
            },
          ],
        },
        {
          id: "advisory",
          name: "Advisory Agents",
          execution: "parallel",
          nodes: [
            {
              kind: "agent",
              id: "custom-world-context-agent-v11",
              lorebooks: {
                read: {
                  mode: "filtered",
                  selector: {
                    tags: ["melbourne_core", "melbourne_live_canon", "world_context"],
                    categories: ["world"],
                    includeGlobalLorebooks: true,
                  },
                  notes: [
                    "World Context should prefer Melbourne canon books rather than broad framework packs.",
                  ],
                },
              },
            },
            {
              kind: "agent",
              id: "custom-cast-advisor-v11",
              lorebooks: {
                read: {
                  mode: "filtered",
                  selector: {
                    tags: ["character_repository", "character_context", "character_framework"],
                    categories: ["character", "npc"],
                    includeEmbeddedCharacterBooks: true,
                    includeCharacterLinkedLorebooks: true,
                    includeGlobalLorebooks: true,
                  },
                  notes: [
                    "Cast Advisor should see character books plus the shared Character Repository.",
                  ],
                },
              },
            },
            {
              kind: "agent",
              id: "custom-pressure-weaver-v11",
              lorebooks: {
                read: {
                  mode: "filtered",
                  selector: {
                    tags: ["divine_comedy_repository", "pressure_context", "bunnyrx", "framework_lens"],
                    includeGlobalLorebooks: true,
                  },
                  notes: [
                    "Pressure Weaver reads the why-layer: pressures, frameworks, and substance lenses.",
                  ],
                },
              },
            },
          ],
        },
        {
          id: "casting",
          name: "Casting Decisions",
          execution: "sequential",
          nodes: [
            {
              kind: "agent",
              id: "custom-casting-director-v11",
              lorebooks: {
                read: {
                  mode: "filtered",
                  selector: {
                    tags: [
                      "melbourne_core",
                      "melbourne_live_canon",
                      "character_repository",
                      "character_context",
                      "divine_comedy_repository",
                      "pressure_context",
                    ],
                    includeEmbeddedCharacterBooks: true,
                    includeCharacterLinkedLorebooks: true,
                    includeGlobalLorebooks: true,
                  },
                  notes: [
                    "Casting Director should be able to reconcile world state, character state, and active pressures.",
                  ],
                },
              },
            },
          ],
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
          nodes: [
            {
              kind: "runtime",
              runtimeNodeType: "knowledge-retrieval",
              id: "knowledge-retrieval",
              lorebooks: {
                read: {
                  mode: "inherit_chat_active",
                  selector: {
                    includeEmbeddedCharacterBooks: true,
                    includeCharacterLinkedLorebooks: true,
                    includeGlobalLorebooks: true,
                  },
                },
              },
            },
          ],
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
          nodes: [
            {
              kind: "agent",
              id: "lorebook-keeper",
              lorebooks: {
                read: {
                  mode: "filtered",
                  selector: {
                    tags: ["melbourne_core", "melbourne_live_canon", "world_context"],
                    categories: ["world"],
                    includeGlobalLorebooks: true,
                  },
                },
                write: {
                  mode: "selector_target",
                  targetTag: "melbourne_live_canon",
                  selector: {
                    tags: ["melbourne_live_canon", "world_writeback_target"],
                    categories: ["world"],
                  },
                  notes: [
                    "Lorebook Keeper should only write durable world-state changes into Melbourne Live Canon.",
                  ],
                },
              },
            },
          ],
        },
        {
          id: "character-writeback",
          name: "Character Writeback",
          execution: "sequential",
          nodes: [
            {
              kind: "agent",
              id: "custom-character-scrivener-v11",
              lorebooks: {
                read: {
                  mode: "filtered",
                  selector: {
                    tags: ["character_repository", "character_context", "character_framework"],
                    categories: ["character", "npc"],
                    includeEmbeddedCharacterBooks: true,
                    includeCharacterLinkedLorebooks: true,
                    includeGlobalLorebooks: true,
                  },
                },
                write: {
                  mode: "selector_target",
                  targetTag: "character_repository",
                  selector: {
                    tags: ["character_repository", "character_writeback_target"],
                    categories: ["character", "npc"],
                  },
                  notes: [
                    "Character Scrivener should write durable character state only into the Character Repository.",
                  ],
                },
              },
            },
          ],
        },
        {
          id: "tracker-writeback",
          name: "Tracker Writeback",
          execution: "sequential",
          nodes: [
            {
              kind: "agent",
              id: "custom-tracker",
              lorebooks: {
                read: {
                  mode: "disabled",
                  notes: ["Custom Tracker should stay dashboard-only unless a future stack explicitly opts it into lorebook reads."],
                },
                write: {
                  mode: "disabled",
                },
              },
            },
          ],
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
