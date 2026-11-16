import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { test, vi } from "vitest";
import assert from "node:assert/strict";
import IeltsWorkspace from "./IeltsWorkspace.jsx";
import { route, practicePartCount, partRange, partForQuestion } from "./model.js";

vi.mock("../../../components/logos", () => ({
  Logo: () => <span>TopCoach</span>,
}));

function renderPage(path) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <IeltsWorkspace path={path} navigate={() => {}} href={(path) => path}
        storagePrefix="test:" profile={null} />
    </MemoryRouter>,
  );
}

test("the IELTS dashboard uses the new dev browse design", () => {
  const html = renderPage("/");
  assert.ok(html.includes("IELTS prep"));
  assert.ok(html.includes("Choose a skill"));
  assert.ok(html.includes("ielts-browse"));
  assert.ok(!html.includes("Coordinator surname"));
});

test("both practice lists retain their formats and open existing practice routes", () => {
  vi.stubGlobal("window", { location: { search: "?skill=listening" } });
  try {
    const academic = renderPage("/ielts/practice/home");
    assert.ok(academic.includes("Academic tests"));
    assert.ok(academic.includes("96 Listening tests"));
    assert.ok(academic.includes('/ielts/practice/academic/21/1/listening/1'));
    const general = renderPage("/ielts/practice/general-training");
    assert.ok(general.includes("General Training tests"));
    assert.ok(general.includes("34 Reading tests"));
    assert.ok(general.includes('/ielts/practice/general-training/17/1/reading/1'));
    assert.ok(!general.includes('/general-training/17/1/listening/1'));
  } finally { vi.unstubAllGlobals(); }
});

test("focused practice and score pages do not opt into the browse design", () => {
  vi.stubGlobal("location", { search: "" });
  try { for (const skill of ["listening/1", "reading/1", "writing/1", "speaking/1", "score"]) {
    const html = renderPage(`/ielts/practice/academic/21/1/${skill}`);
    assert.ok(!html.includes("ielts-browse"), skill);
    assert.ok(html.includes('class="brand"'), skill);
  } } finally { vi.unstubAllGlobals(); }
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
