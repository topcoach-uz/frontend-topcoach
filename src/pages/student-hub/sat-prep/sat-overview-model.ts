import type {
  SessionRecord,
  SkillMastery,
} from "src/app/services/sat-prep/local-progress";

export function scoreBreakdown(sessions: SessionRecord[]) {
  const valid = sessions
    .filter(
      (s) =>
        s.mode === "mock" &&
        s.estimatedScore != null &&
        s.estimatedScore >= 200 &&
        s.estimatedScore <= 800,
    )
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  const math = valid.find((s) => s.section === "math");
  const reading = valid.find((s) => s.section === "reading-writing");
  return {
    math,
    reading,
    total:
      math && reading ? math.estimatedScore! + reading.estimatedScore! : null,
  };
}
export function weakestSkills(rows: SkillMastery[]) {
  return rows
    .filter((r) => r.attempts > 0)
    .slice()
    .sort((a, b) => a.pct - b.pct);
}
