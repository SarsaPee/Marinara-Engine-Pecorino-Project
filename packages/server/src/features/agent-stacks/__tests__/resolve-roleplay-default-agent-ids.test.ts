import test from "node:test";
import assert from "node:assert/strict";

import {
  CONVERSATION_AGENT_IDS,
  GAME_AGENT_IDS,
  PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS,
  PECORINO_ROLEPLAY_STACK_ID,
  ROLEPLAY_DEFAULT_AGENT_IDS,
  CHAT_MODES,
  VISUAL_NOVEL_DEFAULT_AGENT_IDS,
  getChatModeCapabilities,
  getChatModeDefaultAgentIds,
} from "@marinara-engine/shared";
import { inspectAgentStackResolution } from "../diagnostics/inspect-agent-stack-resolution.js";
import { resolveAgentDefaultsFromAssignmentConfig } from "../facades/resolve-agent-defaults-from-assignment-config.js";
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

test("assignment config facade falls back to legacy roleplay defaults when config is empty", () => {
  const result = resolveAgentDefaultsFromAssignmentConfig({
    mode: "roleplay",
    assignmentConfig: {},
  });

  assert.equal(result.mode, "roleplay");
  assert.equal(result.source, "legacy_fallback");
  assert.equal(result.stackId, null);
  assert.deepEqual(result.agentIds, [...ROLEPLAY_DEFAULT_AGENT_IDS]);
});

test("assignment config facade uses roleplay mode default when configured", () => {
  const result = resolveAgentDefaultsFromAssignmentConfig({
    mode: "roleplay",
    assignmentConfig: {
      modeDefaultStackIds: {
        roleplay: PECORINO_ROLEPLAY_STACK_ID,
      },
    },
  });

  assert.equal(result.mode, "roleplay");
  assert.equal(result.source, "mode_default");
  assert.equal(result.stackId, PECORINO_ROLEPLAY_STACK_ID);
  assert.deepEqual(result.agentIds, [...PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS]);
});

test("assignment config facade prefers chat override when configured", () => {
  const result = resolveAgentDefaultsFromAssignmentConfig({
    mode: "roleplay",
    assignmentConfig: {
      chatStackIdOverride: PECORINO_ROLEPLAY_STACK_ID,
      modeDefaultStackIds: {
        roleplay: null,
      },
    },
  });

  assert.equal(result.mode, "roleplay");
  assert.equal(result.source, "chat_override");
  assert.equal(result.stackId, PECORINO_ROLEPLAY_STACK_ID);
  assert.deepEqual(result.agentIds, [...PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS]);
});

test("assignment config facade returns none for non-roleplay mode with no assignment", () => {
  const result = resolveAgentDefaultsFromAssignmentConfig({
    mode: "conversation",
    assignmentConfig: {},
  });

  assert.equal(result.mode, "conversation");
  assert.equal(result.source, "none");
  assert.equal(result.stackId, null);
  assert.deepEqual(result.agentIds, []);
});

test("diagnostic helper reports legacy roleplay fallback with matching agent count", () => {
  const result = inspectAgentStackResolution({
    mode: "roleplay",
    assignmentConfig: {},
  });

  assert.equal(result.mode, "roleplay");
  assert.equal(result.source, "legacy_fallback");
  assert.equal(result.stackId, null);
  assert.deepEqual(result.agentIds, [...ROLEPLAY_DEFAULT_AGENT_IDS]);
  assert.equal(result.details.hasAssignmentConfig, true);
  assert.equal(result.details.hasChatOverride, false);
  assert.equal(result.details.modeDefaultStackId, null);
  assert.equal(result.details.resolvedStackId, null);
  assert.equal(result.details.agentCount, ROLEPLAY_DEFAULT_AGENT_IDS.length);
  assert.equal(result.details.isLegacyFallback, true);
});

test("diagnostic helper reports roleplay mode default resolution details", () => {
  const result = inspectAgentStackResolution({
    mode: "roleplay",
    assignmentConfig: {
      modeDefaultStackIds: {
        roleplay: PECORINO_ROLEPLAY_STACK_ID,
      },
    },
  });

  assert.equal(result.mode, "roleplay");
  assert.equal(result.source, "mode_default");
  assert.equal(result.stackId, PECORINO_ROLEPLAY_STACK_ID);
  assert.deepEqual(result.agentIds, [...PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS]);
  assert.equal(result.details.hasAssignmentConfig, true);
  assert.equal(result.details.hasChatOverride, false);
  assert.equal(result.details.modeDefaultStackId, PECORINO_ROLEPLAY_STACK_ID);
  assert.equal(result.details.resolvedStackId, PECORINO_ROLEPLAY_STACK_ID);
  assert.equal(result.details.agentCount, PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS.length);
  assert.equal(result.details.isLegacyFallback, false);
});

test("diagnostic helper reports roleplay chat override details", () => {
  const result = inspectAgentStackResolution({
    mode: "roleplay",
    assignmentConfig: {
      chatStackIdOverride: PECORINO_ROLEPLAY_STACK_ID,
    },
  });

  assert.equal(result.mode, "roleplay");
  assert.equal(result.source, "chat_override");
  assert.equal(result.stackId, PECORINO_ROLEPLAY_STACK_ID);
  assert.deepEqual(result.agentIds, [...PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS]);
  assert.equal(result.details.hasAssignmentConfig, true);
  assert.equal(result.details.hasChatOverride, true);
  assert.equal(result.details.modeDefaultStackId, null);
  assert.equal(result.details.resolvedStackId, PECORINO_ROLEPLAY_STACK_ID);
  assert.equal(result.details.agentCount, PECORINO_ROLEPLAY_STACK_DEFAULT_AGENT_IDS.length);
  assert.equal(result.details.isLegacyFallback, false);
});

test("diagnostic helper reports none for non-roleplay mode with no assignment", () => {
  const result = inspectAgentStackResolution({
    mode: "conversation",
    assignmentConfig: {},
  });

  assert.equal(result.mode, "conversation");
  assert.equal(result.source, "none");
  assert.equal(result.stackId, null);
  assert.deepEqual(result.agentIds, []);
  assert.equal(result.details.hasAssignmentConfig, true);
  assert.equal(result.details.hasChatOverride, false);
  assert.equal(result.details.modeDefaultStackId, null);
  assert.equal(result.details.resolvedStackId, null);
  assert.equal(result.details.agentCount, 0);
  assert.equal(result.details.isLegacyFallback, false);
});

test("shared chat-mode helper returns roleplay defaults in order", () => {
  assert.deepEqual(getChatModeDefaultAgentIds("roleplay"), [...ROLEPLAY_DEFAULT_AGENT_IDS]);
});

test("shared chat-mode helper returns conversation defaults in order", () => {
  assert.deepEqual(getChatModeDefaultAgentIds("conversation"), [...CONVERSATION_AGENT_IDS]);
});

test("shared chat-mode helper returns visual novel defaults in order", () => {
  assert.deepEqual(getChatModeDefaultAgentIds("visual_novel"), [...VISUAL_NOVEL_DEFAULT_AGENT_IDS]);
});

test("shared chat-mode helper returns game defaults in order", () => {
  assert.deepEqual(getChatModeDefaultAgentIds("game"), [...GAME_AGENT_IDS]);
});

test("shared chat-mode helper null and undefined fallback matches capabilities fallback", () => {
  assert.deepEqual(getChatModeDefaultAgentIds(null), [...getChatModeCapabilities(null).defaultAgentIds]);
  assert.deepEqual(getChatModeDefaultAgentIds(undefined), [...getChatModeCapabilities(undefined).defaultAgentIds]);
});

test("shared chat-mode helper returns copies, not the original arrays", () => {
  const roleplayIds = getChatModeDefaultAgentIds("roleplay");
  const original = getChatModeCapabilities("roleplay").defaultAgentIds;

  assert.notEqual(roleplayIds, original);
  roleplayIds.push("fake-agent");
  assert.deepEqual([...original], [...ROLEPLAY_DEFAULT_AGENT_IDS]);
});

test("CHAT_MODES conversation defaultAgents matches shared helper", () => {
  assert.deepEqual(CHAT_MODES.conversation.defaultAgents, getChatModeDefaultAgentIds("conversation"));
});

test("CHAT_MODES roleplay defaultAgents matches shared helper", () => {
  assert.deepEqual(CHAT_MODES.roleplay.defaultAgents, getChatModeDefaultAgentIds("roleplay"));
});

test("CHAT_MODES visual_novel defaultAgents matches shared helper", () => {
  assert.deepEqual(CHAT_MODES.visual_novel.defaultAgents, getChatModeDefaultAgentIds("visual_novel"));
});

test("CHAT_MODES game defaultAgents matches shared helper", () => {
  assert.deepEqual(CHAT_MODES.game.defaultAgents, getChatModeDefaultAgentIds("game"));
});

test("CHAT_MODES defaultAgents arrays are copies, not shared references", () => {
  const conversationDefaults = CHAT_MODES.conversation.defaultAgents;
  const conversationHelperDefaults = getChatModeDefaultAgentIds("conversation");

  assert.notEqual(conversationDefaults, conversationHelperDefaults);
  conversationDefaults.push("fake-agent");
  assert.deepEqual(getChatModeDefaultAgentIds("conversation"), [...CONVERSATION_AGENT_IDS]);
});
