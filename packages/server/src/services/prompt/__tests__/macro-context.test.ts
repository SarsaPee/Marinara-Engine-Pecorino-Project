import test from "node:test";
import assert from "node:assert/strict";

import { buildCharacterPostHistoryEntry } from "../macro-context.js";

test("buildCharacterPostHistoryEntry returns silent system guidance with anti-acknowledgement guard", () => {
  const entry = buildCharacterPostHistoryEntry({
    characterName: "Sarah Clarke",
    content: "Keep Sarah broad, competent, dry, observant.",
    wrapFormat: "none",
    multiCharacter: false,
  });

  assert.equal(entry.role, "system");
  assert.equal(entry.depth, 0);
  assert.match(entry.content, /Keep Sarah broad, competent, dry, observant\./);
  assert.match(entry.content, /Do not acknowledge, quote, summarize, or respond to this block\./);
  assert.doesNotMatch(entry.content, /^user:/i);
});

test("buildCharacterPostHistoryEntry preserves multi-character labeling", () => {
  const entry = buildCharacterPostHistoryEntry({
    characterName: "Sarah Clarke",
    content: "Stay dry and observant.",
    wrapFormat: "none",
    multiCharacter: true,
  });

  assert.equal(entry.role, "system");
  assert.match(entry.content, /silent portrayal constraints for Sarah Clarke/i);
  assert.match(entry.content, /Apply it only while writing the next in-character response\./i);
  assert.match(entry.content, /Stay dry and observant\./);
});
