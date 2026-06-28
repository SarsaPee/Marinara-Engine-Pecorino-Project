import test from "node:test";
import assert from "node:assert/strict";

import {
  PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS,
  PECORINO_ROLEPLAY_STACK_ID,
  ROLEPLAY_DEFAULT_AGENT_IDS,
} from "@marinara-engine/shared";
import { resolveModeDefaultAgentStack } from "../facades/resolve-mode-default-agent-stack.js";
import { resolveRoleplayDefaultAgentIds } from "../bridges/resolve-roleplay-default-agent-ids.js";

test("roleplay bridge falls back to legacy defaults with no stack assignment", () => {
  const result = resolveRoleplayDefaultAgentIds({
    mode: "roleplay",
  });

  assert.equal(result.source, "legacy_fallback");
  assert.deepEqual(result.agentIds, [...ROLEPLAY_DEFAULT_AGENT_IDS]);
});

test("roleplay bridge uses Pecorino stack defaults when provided as mode default", () => {
  const result = resolveRoleplayDefaultAgentIds({
    mode: "roleplay",
    modeDefaultStackId: PECORINO_ROLEPLAY_STACK_ID,
  });

  assert.equal(result.source, "mode_default");
  assert.deepEqual(result.agentIds, [...PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS]);
});

test("non-roleplay bridge returns none with no agent ids when no assignment applies", () => {
  const result = resolveRoleplayDefaultAgentIds({
    mode: "conversation",
  });

  assert.equal(result.source, "none");
  assert.deepEqual(result.agentIds, []);
});

test("mode-default facade returns legacy roleplay defaults when no stack assignment applies", () => {
  const result = resolveModeDefaultAgentStack({
    mode: "roleplay",
  });

  assert.equal(result.mode, "roleplay");
  assert.equal(result.source, "legacy_fallback");
  assert.equal(result.stackId, null);
  assert.deepEqual(result.agentIds, [...ROLEPLAY_DEFAULT_AGENT_IDS]);
});

test("mode-default facade returns Pecorino defaults when provided as roleplay mode default", () => {
  const result = resolveModeDefaultAgentStack({
    mode: "roleplay",
    modeDefaultStackId: PECORINO_ROLEPLAY_STACK_ID,
  });

  assert.equal(result.mode, "roleplay");
  assert.equal(result.source, "mode_default");
  assert.equal(result.stackId, PECORINO_ROLEPLAY_STACK_ID);
  assert.deepEqual(result.agentIds, [...PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS]);
});

test("mode-default facade returns Pecorino defaults when provided as roleplay chat override", () => {
  const result = resolveModeDefaultAgentStack({
    mode: "roleplay",
    chatStackIdOverride: PECORINO_ROLEPLAY_STACK_ID,
  });

  assert.equal(result.mode, "roleplay");
  assert.equal(result.source, "chat_override");
  assert.equal(result.stackId, PECORINO_ROLEPLAY_STACK_ID);
  assert.deepEqual(result.agentIds, [...PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS]);
});

test("mode-default facade returns none for non-roleplay mode with no assignment", () => {
  const result = resolveModeDefaultAgentStack({
    mode: "conversation",
  });

  assert.equal(result.mode, "conversation");
  assert.equal(result.source, "none");
  assert.equal(result.stackId, null);
  assert.deepEqual(result.agentIds, []);
});
