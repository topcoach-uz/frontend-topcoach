import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ImportedWritingPrompt } from "./ImportedWriting.jsx";
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
test("diagram choices come from the declared letter range when labels are inside the image", () => {
  const html = render([
    {
      start: 17,
      end: 17,
      type: "select-given-diagram",
      desc: { optionRange: ["A", "G"] },
      body: {
        items: [{ type: "atom", blocks: [{ type: "input", content: 17 }] }],
      },
    },
  ]);
  for (const letter of "ABCDEFG") assert.ok(html.includes(`value="${letter}"`));
});
test(
  "all imported listening and reading question numbers render, with no duplicate input IDs",
  { skip: !process.env.IELTS_PACKAGE_ROOT },
  () => {
    const root = process.env.IELTS_PACKAGE_ROOT;
    const manifest = JSON.parse(
      readFileSync(join(root, "manifests/dev.json"), "utf8"),
    );
    let count = 0;
    for (const entry of manifest.records.filter((entry) =>
      ["listening", "reading"].includes(entry.skill),
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
      for (const select of html.matchAll(
        /<select[^>]*>([\s\S]*?)<\/select>/g,
      )) {
        assert.match(
          select[1],
          /<option value="(?:[A-Z]|[ivx]+)">/,
          `${part.id} has an empty matching choice list`,
        );
      }
      count++;
    }
    assert.equal(count, 278);
  },
);

test("reading statements use semantic answers and heading choices retain Roman numerals", () => {
  const html = render([
    { start: 1, end: 1, type: "option-true-false", desc: {}, body: { items: ["A source statement"] } },
    { start: 2, end: 2, type: "option-yes-no", desc: {}, body: { items: ["The writer's view"] } },
    { start: 14, end: 14, type: "select-section-given-list", desc: { optionRange: ["i", "iii"], sectionRange: ["A", "B"] }, body: { list: ["First heading", "Second heading", "Third heading"], items: [{ type: "input", content: 14 }] } },
    { start: 15, end: 15, type: "select-section", desc: { sectionRange: ["A", "G"] }, body: { items: [{ type: "input", content: 15 }] } },
  ]);
  for (const text of ["Answer 1: TRUE", "Answer 1: FALSE", "Answer 1: NOT GIVEN", "Answer 2: YES", "Answer 2: NO", "Answer 2: NOT GIVEN"])
    assert.ok(html.includes(text));
  for (const value of ["i", "ii", "iii", "G"]) assert.ok(html.includes(`value="${value}"`));
  assert.ok(html.includes('<ol type="i">'));
});


test("writing uses the selected chart and identifies absent prompts and samples", () => {
  const html = renderToStaticMarkup(<ImportedWritingPrompt part={1} book="20" test={2} task={{ chart: "/api/ielts-content/media/signed-chart", prompt: null, sampleAnswer: null }} />);
  assert.ok(html.includes('src="/api/ielts-content/media/signed-chart"'));
  assert.ok(html.includes('class="writing-chart"'));
  assert.ok(html.includes('Academic 20 Test 2 Writing Task 1 chart'));
  assert.ok(html.includes('written task prompt has not been imported'));
  assert.ok(html.includes('sample writing answer has not been imported'));
  assert.ok(!html.includes('/ielts-assets/writing-21-1.jpg'));
  assert.ok(!html.includes('Sample Writing Answer</summary>'));
});
