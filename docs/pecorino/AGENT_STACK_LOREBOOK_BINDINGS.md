# Agent Stack Lorebook Bindings

This document defines the missing seam between Agent Stacks and lorebooks.

The short version:

- stack policy answers `who runs when`
- lorebook bindings answer `what each node is allowed to read or write`

Without explicit lorebook bindings, troubleshooting stays fuzzy because an
agent may be active while still seeing the wrong books.

## Why This Exists

The Pecorino stack has specialized agents with distinct jobs:

- `knowledge-router` should see the active lorebook universe, then narrow by turn-tag policy
- `custom-world-context-agent-v11` should prefer Melbourne world canon
- `custom-cast-advisor-v11` should prefer character books plus the Character Repository
- `custom-pressure-weaver-v11` should prefer the why-layer, including Divine Comedy and BunnyRX
- `custom-casting-director-v11` should reconcile world, character, and pressure context
- `lorebook-keeper` should write only to Melbourne Live Canon
- `custom-character-scrivener-v11` should write only to Character Repository
- `custom-tracker` should remain dashboard-oriented, not a lorebook truth layer

That means read-scope and write-target must be first-class stack data.

## Data Model

Each stack node may now carry:

- `lorebooks.read`
- `lorebooks.write`

### Read Binding

`mode`:

- `disabled`
- `inherit_chat_active`
- `filtered`
- `explicit_only`

`selector` may include:

- `lorebookIds`
- `lorebookNames`
- `categories`
- `tags`
- `excludeTags`
- `includeEmbeddedCharacterBooks`
- `includeCharacterLinkedLorebooks`
- `includePersonaLinkedLorebooks`
- `includeGlobalLorebooks`

### Write Binding

`mode`:

- `disabled`
- `explicit_target`
- `selector_target`

Write targets may use:

- `targetLorebookId`
- `targetLorebookName`
- `targetCategory`
- `targetTag`
- `selector`

## Design Rule

Read scope and write target are separate on purpose.

An agent may need to read broadly but write narrowly.

Examples:

- `knowledge-router`
  - read: broad
  - write: none
- `lorebook-keeper`
  - read: Melbourne world books
  - write: Melbourne Live Canon only
- `custom-character-scrivener-v11`
  - read: character books + Character Repository
  - write: Character Repository only

## Recommended Lorebook Tags

These tags make stack bindings stable across imports, exports, and reinstallations.

### Melbourne Core

- `melbourne_core`
- `world_context`

### Melbourne Live Canon

- `melbourne_live_canon`
- `world_context`
- `world_writeback_target`

### Character Repository

- `character_repository`
- `character_context`
- `character_writeback_target`

### Divine Comedy Repository

- `divine_comedy_repository`
- `pressure_context`

### BunnyRX / framework packs

- `bunnyrx`
- `framework_lens`
- `requires_explicit_activation`
- `no_ambient_retrieval`
- `pressure_context`

### Embedded character books / character-linked lorebooks

- `character_framework`

## Pecorino Binding Intent

The seeded Pecorino stack now expresses this intended routing:

- `knowledge-router`
  - read active lorebooks, embedded character books, character-linked lorebooks, global lorebooks
- `custom-world-context-agent-v11`
  - read books tagged `melbourne_core`, `melbourne_live_canon`, `world_context`
- `custom-cast-advisor-v11`
  - read `character_repository`, `character_context`, `character_framework`, plus embedded/linked character books
- `custom-pressure-weaver-v11`
  - read `divine_comedy_repository`, `pressure_context`, `bunnyrx`, `framework_lens`
- `custom-casting-director-v11`
  - read world, character, and pressure tags together
- `lorebook-keeper`
  - read Melbourne world tags
  - write selector target tagged `melbourne_live_canon`
- `custom-character-scrivener-v11`
  - read character tags and character books
  - write selector target tagged `character_repository`
- `custom-tracker`
  - lorebook read disabled
  - lorebook write disabled

## UI Direction

This is the clean troubleshooting UI to build next.

### Stack Editor

For each node in the stack:

- show phase and group placement
- show read binding
- show write binding
- show unresolved lorebook selectors
- show matched lorebooks in the current chat

### Chat Debug View

For a given turn or chat:

- show assigned stack
- show active nodes
- show which lorebooks each node could read
- show which lorebook target each writer node would write to
- flag unresolved selectors in red
- flag multiple matching write targets as unsafe

### Failure Modes To Surface

- node has `selector_target` but no matching lorebook
- node has multiple matching write targets
- node is allowed to read framework packs when turn-tag says not to
- world writer is pointed at Character Repository
- character writer is pointed at Melbourne Live Canon

## Practical Constraint

Imported lorebook IDs are not stable enough to be the only strategy.

That is why the current seeded stack prefers tags and selectors over hardcoded
IDs. Exact IDs are still supported, but tags are the portable default.

## Next Runtime Step

The current change only makes lorebook routing part of stack data.

The next runtime slice should:

- resolve node lorebook bindings into concrete lorebook IDs at generation time
- pass resolved read scopes into router/advisory agents
- enforce writer targets before writeback tools run
- expose the resolved routing in debug output and future stack UI
