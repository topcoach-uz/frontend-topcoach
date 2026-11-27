import { describe, expect, it } from "vitest";
import {
  applicationListReturnTo,
  updateApplicationListParams,
} from "./applicationNavigation";

describe("application navigation context", () => {
  it("retains the saved collection, search, sort and comparison selection in the return link", () => {
    const path =
      "/student-hub/applications?collection=saved&q=Oxford&sort=name&compare=a,b";
    expect(applicationListReturnTo({ applicationListReturnTo: path })).toBe(
      path,
    );
  });
  it("accepts only an internal application list URL", () => {
    for (const value of [
      null,
      {},
      { applicationListReturnTo: "https://example.com" },
      { applicationListReturnTo: "//example.com" },
      { applicationListReturnTo: "/student-hub/applications/new" },
    ])
      expect(applicationListReturnTo(value)).toBe("/student-hub/applications");
  });
  it("switches collections and clears incompatible filters atomically, keeping search", () => {
    const previous = new URLSearchParams(
      "status=preparing&q=Oxford&page=2&compare=a,b",
    );
    const next = updateApplicationListParams(previous, {
      collection: "saved",
      status: "all",
    });
    expect(next.get("collection")).toBe("saved");
    expect(next.get("status")).toBeNull();
    expect(next.get("q")).toBe("Oxford");
    expect(next.get("compare")).toBe("a,b");
    expect(next.has("page")).toBe(false);
    expect(previous.get("page")).toBe("2");
  });
  it("clears search and status together without losing the collection", () => {
    const next = updateApplicationListParams(
      new URLSearchParams("collection=saved&q=Oxford&status=submitted"),
      { q: "", status: "all" },
    );
    expect(next.toString()).toBe("collection=saved");
  });
});
