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

// ─── Result screen ────────────────────────────────────────────────────

export interface ResultInsight {
  key: "score" | "delta" | "target";
  tone: "neutral" | "good" | "bad";
  value: string;
  label: string;
}

const accuracy = (s: SessionRecord) => (s.totalQ ? s.correctQ / s.totalQ : 0);

export function previousAttempt(
  saved: SessionRecord,
  sessions: SessionRecord[],
): SessionRecord | null {
  const savedAt = Date.parse(saved.completedAt);
  const prev = sessions
    .filter(
      (s) =>
        s.id !== saved.id &&
        s.mode === saved.mode &&
        s.section === saved.section &&
        (saved.mode !== "mock" || (s.mockId ?? null) === (saved.mockId ?? null)) &&
        Date.parse(s.completedAt) <= savedAt,
    )
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  return prev[0] ?? null;
}

export function resultInsights(input: {
  saved: SessionRecord | null;
  sessions: SessionRecord[];
  combined: number | null;
  target: number | null;
}): ResultInsight[] {
  const { saved, sessions, combined, target } = input;
  if (!saved) return [];
  const out: ResultInsight[] = [];
  const est = saved.estimatedScore ?? null;
  if (est != null) {
    out.push({
      key: "score",
      tone: "neutral",
      value: String(est),
      label: "Estimated section score (of 800)",
    });
  }
  const prev = previousAttempt(saved, sessions);
  if (!prev) {
    out.push({
      key: "delta",
      tone: "neutral",
      value: "First",
      label: "attempt of this kind",
    });
  } else if (est != null && prev.estimatedScore != null) {
    const d = est - prev.estimatedScore;
    out.push({
      key: "delta",
      tone: d > 0 ? "good" : d < 0 ? "bad" : "neutral",
      value: d === 0 ? "No change" : `${d > 0 ? "+" : "−"}${Math.abs(d)} pts`,
      label: "vs your previous attempt",
    });
  } else {
    const d = Math.round((accuracy(saved) - accuracy(prev)) * 100);
    out.push({
      key: "delta",
      tone: d > 0 ? "good" : d < 0 ? "bad" : "neutral",
      value: d === 0 ? "No change" : `${d > 0 ? "+" : "−"}${Math.abs(d)}%`,
      label: "accuracy vs previous attempt",
    });
  }
  if (target != null) {
    if (combined != null) {
      out.push(
        combined >= target
          ? { key: "target", tone: "good", value: "Reached", label: `your ${target} target` }
          : {
              key: "target",
              tone: "neutral",
              value: `${target - combined} pts`,
              label: `to your ${target} target`,
            },
      );
    } else if (est != null) {
      const pace = Math.round(target / 2 / 10) * 10;
      out.push(
        est >= pace
          ? { key: "target", tone: "good", value: "On pace", label: `for a ${target} target` }
          : {
              key: "target",
              tone: "neutral",
              value: `${pace - est} pts`,
              label: `to your ${pace} section pace`,
            },
      );
    }
  }
  return out;
}

// ─── Overview ─────────────────────────────────────────────────────────

/** First-ever combined score: earliest Math + earliest R&W mock estimates. */
export function baselineTotal(sessions: SessionRecord[]): number | null {
  const valid = sessions
    .filter(
      (s) =>
        s.mode === "mock" &&
        s.estimatedScore != null &&
        s.estimatedScore >= 200 &&
        s.estimatedScore <= 800,
    )
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));
  const math = valid.find((s) => s.section === "math");
  const rw = valid.find((s) => s.section === "reading-writing");
  return math && rw ? math.estimatedScore! + rw.estimatedScore! : null;
}

export interface JourneyScale {
  /** 0–100 fill. */
  pct: number;
  /** Left / right labels for the track. */
  min: number;
  max: number;
  /** Target marker position (0–100) or null when on the plain scale. */
  markerPct: number | null;
  toGo: number | null;
}

export function journeyScale(input: {
  current: number | null;
  baseline: number | null;
  target: number | null;
}): JourneyScale {
  const { current, baseline, target } = input;
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  if (target == null || current == null) {
    return {
      pct: current ? clamp(((current - 400) / 1200) * 100) : 0,
      min: 400,
      max: 1600,
      markerPct: target != null ? clamp(((target - 400) / 1200) * 100) : null,
      toGo: target != null && current != null ? Math.max(0, target - current) : null,
    };
  }
  const from = Math.min(baseline ?? current, current, target);
  const span = target - from;
  return {
    pct: span <= 0 ? 100 : clamp(((current - from) / span) * 100),
    min: from,
    max: target,
    markerPct: 100,
    toGo: Math.max(0, target - current),
  };
}

export type ContinueAction =
  | { kind: "resume"; label: string; detail: string }
  | { kind: "first-mock"; label: string; detail: string }
  | { kind: "practice"; label: string; detail: string }
  | { kind: "next-mock"; label: string; detail: string };

export function continueAction(input: {
  resume: { answered: number; total: number } | null;
  hasScore: boolean;
  mockCount: number;
  focusSkill: string | null;
}): ContinueAction {
  const { resume, hasScore, mockCount, focusSkill } = input;
  if (resume) {
    return {
      kind: "resume",
      label: "Resume your test",
      detail: `${resume.answered} of ${resume.total} answered`,
    };
  }
  if (!hasScore && mockCount === 0) {
    return {
      kind: "first-mock",
      label: "Take your first mock",
      detail: "Set your baseline score",
    };
  }
  if (focusSkill) {
    return {
      kind: "practice",
      label: "Practise your weakest skill",
      detail: `${focusSkill} · Up to 10 questions`,
    };
  }
  return { kind: "next-mock", label: "Take your next mock", detail: "Practise under SAT timing" };
}

const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function streakState(input: {
  count: number;
  lastPracticeDate: string | null;
  sessions: SessionRecord[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const today = localDay(now);
  const doneToday =
    input.sessions.some((s) => localDay(new Date(s.completedAt)) === today) ||
    (input.lastPracticeDate != null && input.lastPracticeDate.slice(0, 10) === today);
  return {
    count: input.count,
    doneToday,
    atRisk: input.count > 0 && !doneToday,
  };
}
