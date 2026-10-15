import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ImportedListeningQuestions } from "./ImportedListening.jsx";

function render(groups) {
  return renderToStaticMarkup(
    <ImportedListeningQuestions
      part={{ groups }}
      answers={{}}
      update={() => {}}
      setAnswers={() => {}}
      input={(n) => <input id={`answer-${n}`} aria-label={`Answer ${n}`} />}
      revealed={false}
      keys={[]}
    />,
  );
}
test("source text is escaped and examples do not shift numbered choices", () => {
  const html = render([
    {
      start: 1,
      end: 1,
      type: "option-abc",
      desc: {},
      body: {
        items: [
          { type: "example", items: "Example" },
          {
            title: {
              type: "atom",
              blocks: [{ type: "word", content: "<script>alert(1)</script>" }],
            },
            options: ["yes", "no"],
          },
        ],
      },
    },
  ]);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes('id="answer-1"'));
  assert.ok(!html.includes('id="answer-2"'));
});
test(
  "all imported listening question numbers render, with no duplicate input IDs",
  { skip: !process.env.IELTS_PACKAGE_ROOT },
  () => {
    const root = process.env.IELTS_PACKAGE_ROOT;
    const manifest = JSON.parse(
      readFileSync(join(root, "manifests/dev.json"), "utf8"),
    );
    let count = 0;
    for (const entry of manifest.records.filter(
      (entry) => entry.skill === "listening",
    )) {
      const part = JSON.parse(readFileSync(join(root, entry.path), "utf8"));
      const html = render(
        part.question_groups.map((g) => ({
          ...g,
          body: g.body_smart,
          image: null,
        })),
      );
      const ids = [...html.matchAll(/id="answer-(\d+)(?:-\d+)?"/g)].map(
        (m) => m[1],
      );
      for (const number of part.question_numbers)
        assert.ok(
          ids.includes(String(number)),
          `${part.id} is missing Q${number}`,
        );
      const fullIds = [...html.matchAll(/id="(answer-[^"]+)"/g)].map(
        (m) => m[1],
      );
      assert.equal(
        new Set(fullIds).size,
        fullIds.length,
        `${part.id} duplicates a question field`,
      );
      count++;
    }
    assert.equal(count, 189);
  },
);
