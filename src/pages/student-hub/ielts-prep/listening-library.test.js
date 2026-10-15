import test from "node:test";
import assert from "node:assert/strict";
import {
  listeningKeys,
  completeListeningKeys,
  listeningPartForQuestion,
  multiSlotCounts,
  selectListeningGroup,
} from "./listening-library.js";

test("imported ranges and keys never fall back to sample answers", () => {
  const library = {
    parts: [
      { part: 1, questionNumbers: [1, 2], answerKeys: { 1: "real" } },
      { part: 2, questionNumbers: [3, 4, 5], answerKeys: { 3: "different" } },
    ],
  };
  assert.deepEqual(listeningKeys(library), ["real", "", "different", "", ""]);
  assert.equal(listeningPartForQuestion(library, 3), 2);
  assert.equal(completeListeningKeys(library), null);
  assert.equal(listeningKeys(undefined), null);
});
test("band scoring requires four parts and all forty actual keys", () => {
  const parts = Array.from({ length: 4 }, (_, p) => ({
    part: p + 1,
    questionNumbers: Array.from({ length: 10 }, (_, i) => p * 10 + i + 1),
    answerKeys: Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [p * 10 + i + 1, "answer"]),
    ),
  }));
  assert.equal(completeListeningKeys({ parts }).length, 40);
  delete parts[2].answerKeys[25];
  assert.equal(completeListeningKeys({ parts }), null);
});
test("checkbox groups preserve numbered answers and enforce the selection limit", () => {
  const group = { start: 21, end: 22 };
  assert.deepEqual(selectListeningGroup(group, { 21: "E" }, "C"), {
    21: "C",
    22: "E",
  });
  assert.equal(selectListeningGroup(group, { 21: "C", 22: "E" }, "A"), null);
  assert.deepEqual(selectListeningGroup(group, { 21: "C", 22: "E" }, "C"), {
    21: "E",
    22: "",
  });
});
test("multi-field answers retain all inputs under the original question number", () => {
  assert.deepEqual(
    multiSlotCounts({
      items: [
        {
          type: "atom",
          blocks: [
            { type: "inputs", content: 24, index: 0 },
            { type: "inputs", content: 24, index: 2 },
          ],
        },
      ],
    }),
    { 24: 3 },
  );
});
