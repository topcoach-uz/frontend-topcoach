import { describe, expect, it } from "vitest";
import {
  IELTS_BASE,
  toIeltsPath,
  toTopCoachPath,
  ieltsStoragePrefix,
} from "./routes";

describe("IELTS integration routes", () => {
  it("keeps test identity and query parameters inside TopCoach", () => {
    const source = "/ielts/practice/general-training/21/1/reading/5";
    const topcoach = toTopCoachPath(source);
    expect(topcoach).toBe(
      `${IELTS_BASE}/practice/general-training/21/1/reading/5`,
    );
    expect(toIeltsPath(topcoach)).toBe(source);
    expect(toTopCoachPath(source + "?mode=mock")).toBe(topcoach + "?mode=mock");
  });
  it("maps overview, catalog, vocabulary and review destinations", () => {
    for (const path of [
      "/",
      "/ielts/practice/home",
      "/ielts/vocabulary",
      "/ielts/practice/academic/og/8/score",
    ]) {
      expect(toIeltsPath(toTopCoachPath(path))).toBe(path);
    }
    expect(toIeltsPath(`${IELTS_BASE}/`)).toBe("/");
  });
  it("returns account and policies to the existing TopCoach pages", () => {
    expect(toTopCoachPath("/settings/account")).toBe(
      "/student-hub?section=account&target=settings",
    );
    expect(toTopCoachPath("/student-hub")).toBe("/student-hub");
    expect(toTopCoachPath("/privacy")).toBe("/privacy-policy");
    expect(toTopCoachPath("/terms")).toBe("/terms-and-conditions");
  });
  it("does not interpret another student-hub feature as IELTS", () => {
    expect(toIeltsPath("/student-hub/sat-prep")).toBe("/not-found");
    expect(toIeltsPath(`${IELTS_BASE}-other/practice/home`)).toBe("/not-found");
  });
  it("isolates local practice by stable user ID, including separator characters", () => {
    expect(ieltsStoragePrefix("student-a")).not.toBe(
      ieltsStoragePrefix("student-b"),
    );
    expect(ieltsStoragePrefix("student:a")).not.toBe(
      ieltsStoragePrefix("student%3Aa"),
    );
    expect(ieltsStoragePrefix("student:a")).toBe(
      "topcoach:ielts:v1:student%3Aa:",
    );
  });
});
