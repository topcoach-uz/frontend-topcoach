import { describe, expect, it } from "vitest";
import { buildKeyFactRows, formatMoney, humanizeFacts, humanizeKey, safeHttpUrl } from "./universityKeyFactsModel";

const tr = (v: unknown) => (typeof v === "string" ? v : "");

describe("university key facts", () => {
  it("humanises camelCase keys, booleans and skips empty values", () => {
    expect(humanizeKey("tuitionFee")).toBe("Tuition fee");
    expect(humanizeFacts({ tuitionFee: "$5", needBlind: true, empty: "", none: null, list: ["a", "b"] }))
      .toBe("Tuition fee: $5 · Need blind: Yes · List: a, b");
    expect(humanizeFacts(null)).toBe("");
  });

  it("formats money and rejects unsafe urls", () => {
    expect(formatMoney("$", 59750)).toBe("$59,750");
    expect(formatMoney("$", undefined)).toBe("");
    expect(safeHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeHttpUrl("https://mit.edu")).toBe("https://mit.edu/");
  });

  it("omits empty rows and builds populated ones", () => {
    expect(buildKeyFactRows({}, tr)).toEqual([]);
    const rows = buildKeyFactRows({
      deadlines: [{ name: "Regular", date: "2027-01-01T00:00:00Z" }],
      tuitionFees: [{ fee: 1000, currency: { symbol: "$" } }],
      acceptanceRates: [{ rate: 4 }],
      requiredExams: [{ certification: { name: "SAT" } }, { certification: { name: "SAT" } }],
      scholarships: [{ name: "Aid", url: "https://x.edu/aid" }],
      links: [{ name: "", url: "https://www.mit.edu/admissions" }],
    } as never, tr);
    expect(rows.map((r) => r.id)).toEqual(["deadlines", "tuition", "acceptance", "exams", "scholarships", "links"]);
    expect(rows[0].lines?.[0]).toEqual({ text: "Regular", note: "1 January 2027" });
    expect(rows[3].chips).toEqual(["SAT"]);
    expect(rows[5].links?.[0].label).toBe("mit.edu");
  });
});
