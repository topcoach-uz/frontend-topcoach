import { describe, expect, it } from "vitest";
import { apiStructuredContent, formatAmountRange, formatCostAmount, formatDateText, getStructuredContent, sharedSource, sortedCostItems } from "./structuredContent";

const base = { schemaVersion: 2, universityId: "u1" };

describe("structured content", () => {
  it("accepts API content only for the matching university and schema", async () => {
    expect(apiStructuredContent({ id: "u1", structuredContent: base })).toBeDefined();
    expect(apiStructuredContent({ id: "u2", structuredContent: base })).toBeUndefined();
    expect(apiStructuredContent({ id: "u1", structuredContent: { ...base, schemaVersion: 1 } })).toBeUndefined();
    expect(await getStructuredContent({ id: "u1", structuredContent: base })).toMatchObject({ universityId: "u1" });
  });

  it("has no pilot fixtures without the build flag", async () => {
    expect(await getStructuredContent({ id: "no-such-university" })).toBeUndefined();
  });

  it("formats money with its period and never converts", () => {
    expect(formatCostAmount(22577, "USD", "quarter")).toBe("US$22,577 / quarter");
    expect(formatCostAmount(61990, "usd", "year")).toBe("US$61,990 / year");
    expect(formatCostAmount(500, "GBP", "one-time")).toBe("£500 one-time");
    expect(formatCostAmount(1000, "CHF")).toBe("CHF 1,000");
    expect(formatCostAmount(null, "USD", "year")).toBe("—");
    expect(formatAmountRange({ min: 1000, max: 5000, currency: "USD", period: "year" })).toBe("US$1,000–5,000 / year");
    expect(formatAmountRange({ max: 5000, currency: "USD", period: null })).toBe("US$5,000");
    expect(formatAmountRange(undefined)).toBeUndefined();
  });

  it("uses the published date text", () => {
    expect(formatDateText({ date: "2027-01-06", text: "January 6, 2027" })).toBe("January 6, 2027");
    expect(formatDateText(undefined)).toBeUndefined();
  });

  it("orders cost items by category and detects a shared source", () => {
    const items = [{ category: "housing" }, { category: "tuition" }, { category: "other" }, { category: "fees" }] as never;
    expect(sortedCostItems(items).map((i) => i.category)).toEqual(["tuition", "fees", "housing", "other"]);
    expect(sharedSource([{ sourceUrl: "a", sourceTitle: "A" }, { sourceUrl: "a", sourceTitle: "A" }])).toEqual({ sourceUrl: "a", sourceTitle: "A" });
    expect(sharedSource([{ sourceUrl: "a", sourceTitle: "A" }, { sourceUrl: "b", sourceTitle: "B" }])).toBeUndefined();
    expect(sharedSource([])).toBeUndefined();
  });
});
