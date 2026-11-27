import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ApplicationRequirements from "./ApplicationRequirements";

const pending = {
  id: "essay",
  title: "Write personal statement",
  completed: false,
};
const done = { id: "transcript", title: "Upload transcript", completed: true };
const render = (items: (typeof pending)[], compact = true) =>
  renderToStaticMarkup(
    <ApplicationRequirements
      compact={compact}
      requirements={{ custom: { items } }}
    />,
  );

describe("workspace requirement visibility", () => {
  it("prioritizes unfinished work and keeps completed work collapsed but accessible", () => {
    const html = render([done, pending]);
    const [visible, completed] = html.split(
      '<details class="application-requirements-completed">',
    );
    expect(visible).toContain(pending.title);
    expect(visible).not.toContain(done.title);
    expect(completed).toContain("Completed (1)");
    expect(completed).toContain(done.title);
    expect(html).not.toMatch(/<details[^>]*\sopen(?:=|\s|>)/);
  });
  it("reports the unfinished count rather than a completion fraction", () => {
    const html = render([
      done,
      pending,
      { ...pending, id: "second", title: "Request reference" },
    ]);
    expect(html).toContain("2 remaining");
    expect(html).toContain('aria-label="2 requirements remaining"');
    expect(html).not.toContain("1/3");
  });
  it("keeps completed work available when every requirement is done", () => {
    const html = render([done]);
    expect(html).not.toContain("0 remaining");
    expect(html).not.toContain("All requirements complete.");
    expect(html).toContain("Checklist complete · 1 item");
    expect(html).toContain(done.title);
  });
  it("does not display an empty completed group or a false success message", () => {
    expect(render([pending])).not.toContain("Completed (");
    const empty = render([]);
    expect(empty).toContain("No requirements added yet.");
    expect(empty).not.toContain("All requirements complete.");
  });
  it("preserves the full checklist in the mentor view", () => {
    const html = render([done, pending], false);
    expect(html).toContain(done.title);
    expect(html).toContain(pending.title);
    expect(html).not.toContain("<details");
  });
});

describe("new application checklist setup", () => {
  const setup = (programName?: string, items: (typeof pending)[] = []) => renderToStaticMarkup(
    <ApplicationRequirements compact requirements={{ custom: { items } }} onSave={async () => undefined}
      setup={{ programName, renderProgramLink: (children) => <a className="application-checklist-step" aria-label={programName ? "Edit program" : "Choose program"} href="/edit#major">{children}</a> }} />,
  );
  it("guides an empty application to choose its program and add real requirements", () => {
    const html = setup();
    expect(html).toContain("Choose program");
    expect(html).toContain("Add requirements");
    expect(html).toContain("official requirements");
    expect(html).not.toContain("No requirements added yet.");
    expect(html).not.toContain('aria-label="Edit checklist"');
  });
  it("acknowledges the selected program while leaving requirements actionable", () => {
    const html = setup("Economics");
    expect(html).toContain("Program selected");
    expect(html).toContain("Economics");
    expect(html).toContain("Add requirements");
  });
  it("replaces setup guidance with the checklist once requirements exist", () => {
    const html = setup("Economics", [pending]);
    expect(html).toContain(pending.title);
    expect(html).toContain("1 remaining");
    expect(html).not.toContain("Build your application checklist");
  });
});
