import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryState } from "./ApplicationQueryState";

describe("cached application workspace content", () => {
  const content = <div data-draft="unsaved">My checklist draft</div>;
  it("keeps cached content rendered with a retry warning when a refresh fails", () => {
    const html = renderToStaticMarkup(
      <QueryState error hasData retry={() => undefined}>
        {content}
      </QueryState>,
    );
    expect(html).toContain("My checklist draft");
    expect(html).toContain('data-draft="unsaved"');
    expect(html).toContain("Retry refresh");
    expect(html).not.toContain("We couldn’t finish that request");
  });
  it("does not replace existing data with a loading skeleton", () => {
    const html = renderToStaticMarkup(
      <QueryState loading hasData retry={() => undefined}>
        {content}
      </QueryState>,
    );
    expect(html).toContain("My checklist draft");
    expect(html).not.toContain("ant-skeleton");
  });
  it("shows a full error only when no data has ever loaded", () => {
    const html = renderToStaticMarkup(
      <QueryState error retry={() => undefined}>
        {content}
      </QueryState>,
    );
    expect(html).toContain("We couldn’t finish that request");
    expect(html).not.toContain("My checklist draft");
  });
});
