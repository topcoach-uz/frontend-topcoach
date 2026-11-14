import { describe, expect, it } from "vitest";
import { buildKeyFactRows, cleanExamName, formatMoney, humanizeFacts, humanizeKey, safeHttpUrl, shortUniversityName, stripGraduateParagraph } from "./universityKeyFactsModel";

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

  const NOW = new Date("2026-11-14T00:00:00Z");
  it("hides tuition when verified finance exists and prefixes USD", () => {
    const u = { tuitionFees: [{ fee: 61990, currency: { symbol: "$", name: "USD" } }] } as never;
    expect(buildKeyFactRows(u, tr, { hasVerifiedFinance: true }).some((r) => r.id === "tuition")).toBe(false);
    const row = buildKeyFactRows(u, tr)[0];
    expect(row.label).toBe("Tuition & fees");
    expect(row.lines?.[0].text).toBe("US$61,990");
    expect(formatMoney("£", 100)).toBe("£100");
  });

  it("moves past-dated deadlines under last cycle and strips graduate text", () => {
    const rows = buildKeyFactRows({ deadlines: [
      { name: "Undergraduate:\nRegular Decision: January 6, 2026\n\nGraduate:\nDecember 1, 2026", date: "2026-01-06T00:00:00Z" },
      { name: "Priority: March 1, 2027", date: "2027-03-01T00:00:00Z" },
      { name: "Rolling admissions", date: "" },
    ] } as never, tr, { now: NOW });
    const past = rows.find((r) => r.id === "deadlines-past");
    expect(past?.label).toBe("Last cycle's deadlines");
    expect(past?.note).toContain("official site");
    expect(past?.lines?.[0].text).not.toMatch(/Graduate/);
    expect(rows.find((r) => r.id === "deadlines")?.lines?.map((l) => l.text)).toEqual(["Priority: March 1, 2027", "Rolling admissions"]);
    expect(stripGraduateParagraph("A\n\nGraduate: x\ny\n\nB")).toBe("A\n\nB");
  });

  it("cleans exams for a bachelor page", () => {
    const names = ["SAT (for undergraduate)", "GRE", "GMAT", "Graduate Record", "Duolingo English Test(DET)", "Undergraduate Essay"];
    const rows = buildKeyFactRows({ requiredExams: names.map((name) => ({ certification: { name } })) } as never, tr);
    expect(rows[0].chips).toEqual(["SAT", "Duolingo English Test (DET)", "Undergraduate Essay"]);
    expect(cleanExamName("X(for undergraduate)")).toBe("X");
  });

  it("shows each URL once and drops the official-website label line", () => {
    const rows = buildKeyFactRows({
      scholarships: [{ name: "Aid\nOfficial Website:", url: "https://fa.mit.edu/aid" }],
      links: [{ name: "Aid page", url: "https://fa.mit.edu/aid/" }, { name: "Official Website", url: "https://fa.mit.edu/" }, { name: "Admissions", url: "https://mit.edu/admissions" }],
    } as never, tr);
    expect(rows.find((r) => r.id === "scholarships")?.lines?.[0].text).toBe("Aid");
    expect(rows.find((r) => r.id === "links")?.links?.map((l) => l.label)).toEqual(["Admissions"]);
  });

  it("shortens names", () => {
    expect(shortUniversityName("Massachusetts Institute of Technology (MIT)")).toBe("MIT");
    expect(shortUniversityName("Yale University")).toBe("Yale University");
  });
});
