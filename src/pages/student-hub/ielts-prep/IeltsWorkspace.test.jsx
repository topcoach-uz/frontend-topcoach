import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test, vi } from "vitest";
import assert from "node:assert/strict";
import IeltsWorkspace from "./IeltsWorkspace.jsx";
import { homeAudio } from "./content.js";

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
