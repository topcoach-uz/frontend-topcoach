import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test, vi } from "vitest";
import assert from "node:assert/strict";
import IeltsWorkspace from "./IeltsWorkspace.jsx";
import { homeAudio } from "./content.js";
import { route, practicePartCount, partRange, partForQuestion } from "./model.js";

vi.mock("../../../components/logos", () => ({
  Logo: () => <span>TopCoach</span>,
}));

test("IELTS dashboard renders its sample audio without a runtime error", () => {
  const html = renderToStaticMarkup(
    <IeltsWorkspace
      path="/"
      navigate={() => {}}
      href={(path) => path}
      storagePrefix="test:"
      profile={null}
    />,
  );
  assert.ok(html.includes("IELTS Practice Tests"));
  assert.ok(html.includes(`src="${homeAudio}"`));
  assert.ok(html.includes("Coordinator surname"));
});

test("the six-part General Training test reaches questions 28–40 without adding phantom parts to other tests", () => {
  const practice = route("/ielts/practice/general-training/17/1/reading/6");
  assert.ok(practice);
  assert.equal(practicePartCount(practice), 6);
  assert.deepEqual(partRange(practice), [27, 40]);
  assert.equal(partForQuestion(practice, 28), 6);
  assert.equal(partForQuestion(practice, 40), 6);
  assert.equal(route("/ielts/practice/general-training/17/2/reading/6"), null);
  assert.equal(route("/ielts/practice/academic/17/1/reading/4"), null);
});
