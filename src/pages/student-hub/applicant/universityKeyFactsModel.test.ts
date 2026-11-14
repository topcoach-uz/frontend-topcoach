import { describe, expect, it } from "vitest";
import { buildComparableFacts, qsRankOf, buildGlanceTiles, buildKeyFactRows, buildScholarshipText, extractTuition, meetsFullNeed, cleanExamName, formatMoney, humanizeFacts, humanizeKey, safeHttpUrl, shortUniversityName, stripGraduateParagraph } from "./universityKeyFactsModel";

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
    expect(rows.map((r) => r.id)).toEqual(["deadlines", "tuition", "acceptance", "exams"]);
    expect(rows[0].lines?.[0]).toEqual({ text: "Regular", note: "1 January 2027" });
    expect(rows[3].chips).toEqual(["SAT"]);
      });

  const NOW = new Date("2026-11-14T00:00:00Z");
  it("labels tuition and prefixes USD", () => {
    const u = { tuitionFees: [{ fee: 61990, currency: { symbol: "$", name: "USD" } }] } as never;
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

  it("no longer emits scholarship or link rows", () => {
    const rows = buildKeyFactRows({ scholarships: [{ name: "Aid", url: "https://fa.mit.edu/aid" }], links: [{ name: "Site", url: "https://mit.edu" }] } as never, tr);
    expect(rows).toEqual([]);
  });

  it("builds legacy scholarship text without the official-website label", () => {
    const out = buildScholarshipText({ scholarships: [{ name: "Aid\nOfficial Website:", url: "https://fa.mit.edu/aid" }] } as never, tr);
    expect(out).toEqual({ text: "Aid", url: "https://fa.mit.edu/aid" });
    expect(buildScholarshipText({} as never, tr)).toBeUndefined();
  });

  it("extracts tuition from verified finance text", () => {
    expect(extractTuition("For 2026–27, tuition is $62,980 per year, plus housing $12,000.")).toEqual({ value: "US$62,980", sub: "per year · 2026–27" });
    expect(extractTuition("Tuition US$61,990.")).toEqual({ value: "US$61,990", sub: undefined });
    expect(extractTuition("Housing is $12,000.")).toBeUndefined();
  });

  it("detects a 100% of need pledge conservatively", () => {
    expect(meetsFullNeed("MIT meets 100% of demonstrated financial need for all admitted students.")).toBe(true);
    expect(meetsFullNeed("We meet the full demonstrated need of every student.")).toBe(true);
    expect(meetsFullNeed("Aid covers full demonstrated financial need.")).toBe(true);
    expect(meetsFullNeed("The university does not meet full need.")).toBe(false);
    expect(meetsFullNeed("Scholarships are available.")).toBe(false);
  });

  it("builds glance tiles and omits missing data", () => {
    const rows = buildKeyFactRows({
      acceptanceRates: [{ rate: 4 }],
      tuitionFees: [{ fee: 1, currency: { symbol: "$", name: "USD" } }],
      applicationFees: [{ fee: 75, currency: { symbol: "$", name: "USD" } }],
    } as never, tr);
    const fin = { feesSummary: "Tuition is $62,980 in 2026-27.", fundingSummary: "Meets 100% of demonstrated need." };
    expect(buildGlanceTiles(rows, fin).map((t) => [t.id, t.value])).toEqual([["acceptance", "4%"], ["tuition", "US$62,980"], ["application-fee", "US$75"], ["aid", "Meets 100% of need"]]);
    expect(buildGlanceTiles(rows)[1].value).toBe("US$1");
    expect(buildGlanceTiles([])).toEqual([]);
  });

  it("shortens names", () => {
    expect(shortUniversityName("Massachusetts Institute of Technology (MIT)")).toBe("MIT");
    expect(shortUniversityName("Yale University")).toBe("Yale University");
  });

  it("builds comparable facts including QS rank, with gaps left undefined", () => {
    const rows = buildKeyFactRows({ acceptanceRates: [{ rate: 4 }], applicationFees: [{ fee: 75, currency: { symbol: "$", name: "USD" } }] } as never, tr);
    const facts = buildComparableFacts(rows, { feesSummary: "Tuition is $62,980 in 2026-27.", fundingSummary: "Meets 100% of demonstrated need." }, 1);
    expect(facts).toEqual({ acceptance: "4%", tuition: "US$62,980", tuitionSub: "per year · 2026–27", applicationFee: "US$75", aid: "Meets 100% of need", qs: "#1" });
    expect(buildComparableFacts([], null, undefined)).toEqual({ acceptance: undefined, tuition: undefined, tuitionSub: undefined, applicationFee: undefined, aid: undefined, qs: undefined });
    expect(qsRankOf({ rankings: [{ type: "THE", rank: 3 }, { type: "QS", rank: 12 }] } as never)).toBe(12);
    expect(qsRankOf({} as never)).toBeUndefined();
  });
});
