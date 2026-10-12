/**
 * Mock Tests — editorial layout. Hero card + stats card on top, then a
 * grid of available tests. No fake completion data; every card is
 * "available" until we wire attempt tracking.
 */

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { RunnerModal } from "src/components/sat-prep/RunnerModal";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  FileQuestion,
  Info,
  Play,
  RotateCcw,
  TimerReset,
} from "lucide-react";
import { useComposeMockTestMutation } from "src/app/services/sat-prep";
import {
  useGetSatProgressQuery,
  type SessionRecord,
} from "src/app/services/sat-prep/local-progress";
import "src/components/sat-prep/sat-prep-shell.scss";
import "./sat-mock-tests.scss";
import "./sat-secondary-pages.scss";

interface MockTest {
  id: string;
  number: number;
  title: string;
  releaseDate: string;
  durationMin: number;
  questionCount: number;
  difficulty: { easy: number; medium: number; hard: number };
  badge?: "new";
}

interface MockAttempt {
  score: number | null;
  correctQ: number;
  totalQ: number;
  lastAt: string;
  attempts: number;
  bestScore: number | null;
}

// Releases are spaced from early April through the first week of May 2026
// (current cycle). The pair released most recently keeps the "new" badge.
const MOCK_TESTS: MockTest[] = [
  {
    id: "mock-1-math",
    number: 1,
    title: "Math Mock Test 1",
    releaseDate: "May 5, 2026",
    durationMin: 70,
    questionCount: 44,
    difficulty: { easy: 0.25, medium: 0.5, hard: 0.25 },
    badge: "new",
  },
  {
    id: "mock-1-rw",
    number: 1,
    title: "R&W Mock Test 1",
    releaseDate: "May 5, 2026",
    durationMin: 64,
    questionCount: 54,
    difficulty: { easy: 0.3, medium: 0.5, hard: 0.2 },
    badge: "new",
  },
  {
    id: "mock-2-math",
    number: 2,
    title: "Math Mock Test 2",
    releaseDate: "April 28, 2026",
    durationMin: 70,
    questionCount: 44,
    difficulty: { easy: 0.2, medium: 0.5, hard: 0.3 },
  },
  {
    id: "mock-2-rw",
    number: 2,
    title: "R&W Mock Test 2",
    releaseDate: "April 28, 2026",
    durationMin: 64,
    questionCount: 54,
    difficulty: { easy: 0.25, medium: 0.5, hard: 0.25 },
  },
  {
    id: "mock-3-math",
    number: 3,
    title: "Math Mock Test 3",
    releaseDate: "April 18, 2026",
    durationMin: 70,
    questionCount: 44,
    difficulty: { easy: 0.15, medium: 0.45, hard: 0.4 },
  },
  {
    id: "mock-3-rw",
    number: 3,
    title: "R&W Mock Test 3",
    releaseDate: "April 18, 2026",
    durationMin: 64,
    questionCount: 54,
    difficulty: { easy: 0.2, medium: 0.5, hard: 0.3 },
  },
  {
    id: "mock-4-math",
    number: 4,
    title: "Math Mock Test 4",
    releaseDate: "April 8, 2026",
    durationMin: 70,
    questionCount: 44,
    difficulty: { easy: 0.3, medium: 0.45, hard: 0.25 },
  },
  {
    id: "mock-4-rw",
    number: 4,
    title: "R&W Mock Test 4",
    releaseDate: "April 8, 2026",
    durationMin: 64,
    questionCount: 54,
    difficulty: { easy: 0.3, medium: 0.5, hard: 0.2 },
  },
];

const SatMockTestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [composeMockTest] = useComposeMockTestMutation();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<
    "all" | "math" | "reading-writing"
  >("all");
  const visibleTests = MOCK_TESTS.filter(
    (m) =>
      sectionFilter === "all" ||
      (m.id.includes("math") ? "math" : "reading-writing") === sectionFilter,
  );
  const [scoringOpen, setScoringOpen] = useState(false);

  // Mock-mode session aggregates from the backend. Distinguish total
  // attempts (no cap — students can retake any mock) from unique mocks
  // attempted (capped at the catalog size). avg uses each mock's latest
  // attempt so a single bad replay doesn't drag the headline number.
  const { data: progress } = useGetSatProgressQuery();
  const mockProgress = useMemo(() => {
    const mocks = (progress?.mockSessions ?? []).filter(
      (s) => s.estimatedScore != null,
    );
    if (!mocks.length) {
      return { attempts: 0, uniqueMocks: 0, avgScore: null as number | null };
    }
    // mockSessions is newest-first, so the first row per mockId is the latest.
    const latestById = new Map<string, number>();
    for (const s of mocks) {
      if (s.mockId && !latestById.has(s.mockId))
        latestById.set(s.mockId, s.estimatedScore!);
    }
    const latestScores = Array.from(latestById.values());
    const avg = latestScores.length
      ? Math.round(
          latestScores.reduce((n, v) => n + v, 0) / latestScores.length,
        )
      : null;
    return {
      attempts: mocks.length,
      uniqueMocks: latestById.size,
      avgScore: avg,
    };
  }, [progress]);

  // Per-mockId attempt summary. mockSessions arrives newest-first, so the
  // first row we see for a given mockId is the latest attempt.
  const attemptByMock = useMemo(() => {
    const map = new Map<string, MockAttempt>();
    const sessions: SessionRecord[] = progress?.mockSessions ?? [];
    for (const s of sessions) {
      if (!s.mockId) continue;
      const existing = map.get(s.mockId);
      if (existing) {
        existing.attempts += 1;
        if (s.estimatedScore != null) {
          existing.bestScore = Math.max(
            existing.bestScore ?? 0,
            s.estimatedScore,
          );
        }
      } else {
        map.set(s.mockId, {
          score: s.estimatedScore ?? null,
          correctQ: s.correctQ,
          totalQ: s.totalQ,
          lastAt: s.completedAt,
          attempts: 1,
          bestScore: s.estimatedScore ?? null,
        });
      }
    }
    return map;
  }, [progress]);

  const startTest = async (mock: MockTest) => {
    setLoadingId(mock.id);
    try {
      const isMath = mock.id.includes("math");
      const result = await composeMockTest({
        section: isMath ? "math" : "reading-writing",
        totalQuestions: mock.questionCount,
        distribution: mock.difficulty,
        seed: mock.number * 1000 + (isMath ? 1 : 2),
      }).unwrap();
      if (!result.length) {
        message.warning("Could not compose this test.");
        return;
      }
      sessionStorage.setItem("sat-mock-test", JSON.stringify(result));
      sessionStorage.setItem(
        "sat-mock-test-meta",
        JSON.stringify({
          title: mock.title,
          section: isMath ? "math" : "reading-writing",
          durationMin: mock.durationMin,
          mode: "mock",
          mockId: mock.id,
        }),
      );
      navigate("/student-hub/sat-prep/runner");
    } catch {
      message.error("Could not start test.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="sat-mocks">
      {/* Top — hero + progress side-by-side */}
      <section className="sat-mocks__top">
        <div className="sat-card sat-mocks__hero">
          <div className="sat-eyebrow">Timed practice</div>
          <h1 className="sat-page-title">Mock tests</h1>
          <p className="sat-page-desc">
            Choose a Math or Reading & Writing section. Each mock is timed, with
            an estimated score after submission.
          </p>
          <div className="sat-mocks__hero-actions">
            <button className="sat-action" onClick={() => setScoringOpen(true)}>
              <Info size={14} /> How scoring works
            </button>
          </div>
        </div>

        <div className="sat-card sat-mocks__progress">
          <div className="sat-eyebrow">Your mock progress</div>
          <div className="sat-mocks__progress-row">
            <div>
              <div className="sat-mocks__progress-num">
                {mockProgress.attempts}
              </div>
              <div className="sat-mocks__progress-label">
                {mockProgress.attempts === 1 ? "attempt" : "attempts"}
              </div>
            </div>
            <div className="sat-mocks__progress-divider" />
            <div>
              <div
                className={`sat-mocks__progress-num ${mockProgress.avgScore == null ? "sat-mocks__progress-num--muted" : ""}`}
              >
                {mockProgress.avgScore ?? "—"}
              </div>
              <div className="sat-mocks__progress-label">avg section score</div>
            </div>
          </div>
          <div className="sat-mocks__progress-track">
            <div className="sat-progress-bar">
              <div
                className="sat-progress-bar__fill"
                style={{
                  width: `${(mockProgress.uniqueMocks / MOCK_TESTS.length) * 100}%`,
                }}
              />
            </div>
            <div className="sat-mocks__progress-track-label">
              {mockProgress.uniqueMocks
                ? `${mockProgress.uniqueMocks} of ${MOCK_TESTS.length} unique mocks attempted${mockProgress.attempts > mockProgress.uniqueMocks ? ` · ${mockProgress.attempts} total attempts` : ""}`
                : "Score trajectory appears after first attempt."}
            </div>
          </div>
        </div>
      </section>

      {/* How scoring works */}
      <RunnerModal
        open={scoringOpen}
        onClose={() => setScoringOpen(false)}
        eyebrow="Scoring rubric"
        title="How your mock score is calculated"
        size="lg"
        footer={
          <button
            className="rm-btn rm-btn--primary"
            onClick={() => setScoringOpen(false)}
          >
            Got it
          </button>
        }
      >
        <div className="rm-directions">
          <p className="rm-directions__lead">
            Each completed mock produces an estimated{" "}
            <strong>200–800 section score</strong> for tracking your practice
            progress.
          </p>

          <h3 className="rm-directions__subhead">How we calculate it</h3>
          <ul className="rm-directions__rules">
            <li className="rm-directions__rule">
              <span className="rm-directions__rule-num">1</span>
              <span className="rm-directions__rule-text">
                Your <strong>raw accuracy</strong> (correct answers ÷ total
                questions) is the input.
              </span>
            </li>
            <li className="rm-directions__rule">
              <span className="rm-directions__rule-num">2</span>
              <span className="rm-directions__rule-text">
                We convert that accuracy into an estimate on the 200–800 section
                scale.
              </span>
            </li>
            <li className="rm-directions__rule">
              <span className="rm-directions__rule-num">3</span>
              <span className="rm-directions__rule-text">
                Because the conversion is consistent, scores are{" "}
                <strong>directly comparable</strong> across attempts of the same
                test.
              </span>
            </li>
          </ul>

          <h3 className="rm-directions__subhead">Retake-stable questions</h3>
          <p>
            Every mock test is built from a fixed pool of questions in a fixed
            order. When you retake
            <em> Math Mock Test 1</em>, you'll see the same questions you saw
            the first time, so you can revisit the same material and compare
            your accuracy.
          </p>

          <div className="rm-directions__note">
            This is a <strong>study-tracking estimate</strong>, not an official
            SAT score. Use these estimates to track your practice rather than
            predict an exact exam score.
          </div>
        </div>
      </RunnerModal>

      {/* List */}
      <section>
        <div className="sat-mocks__list-header">
          <h2 className="sat-mocks__list-title">Available tests</h2>
          <span className="sat-mocks__list-meta">
            {visibleTests.length} section mocks
          </span>
        </div>

        <div className="sat-secondary-filters" aria-label="Mock test sections">
          {(["all", "math", "reading-writing"] as const).map((s) => (
            <button
              key={s}
              aria-pressed={sectionFilter === s}
              onClick={() => setSectionFilter(s)}
            >
              {s === "all"
                ? "All sections"
                : s === "math"
                  ? "Math"
                  : "Reading & Writing"}
            </button>
          ))}
        </div>
        <div className="sat-mocks__grid">
          {visibleTests.map((m) => (
            <MockCard
              key={m.id}
              mock={m}
              attempt={attemptByMock.get(m.id)}
              loading={loadingId === m.id}
              onStart={() => startTest(m)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const MockCard: React.FC<{
  mock: MockTest;
  attempt?: MockAttempt;
  loading: boolean;
  onStart: () => void;
}> = ({ mock, attempt, loading, onStart }) => {
  const isMath = mock.id.includes("math");
  // Map a 200–800 score to a 0–100% bar.
  const barPct =
    attempt?.score != null
      ? Math.max(0, Math.min(100, ((attempt.score - 200) / 600) * 100))
      : 0;
  const lastPct =
    attempt && attempt.totalQ
      ? Math.round((attempt.correctQ / attempt.totalQ) * 100)
      : 0;
  return (
    <article
      className={`sat-mocks__card sat-mocks__card--${isMath ? "math" : "rw"} ${attempt ? "sat-mocks__card--done" : ""}`}
    >
      <header className="sat-mocks__card-top">
        <div
          className={`sat-mocks__card-icon sat-mocks__card-icon--${isMath ? "math" : "rw"}`}
        >
          {isMath ? <Calculator size={16} /> : <BookOpen size={16} />}
        </div>
        <div className="sat-mocks__card-top-right">
          {attempt && (
            <span className="sat-mocks__card-done-pill">
              <CheckCircle2 size={11} /> Attempted
            </span>
          )}
        </div>
      </header>

      <div className="sat-mocks__card-eyebrow">
        {isMath ? "Math" : "Reading & Writing"} · Mock
      </div>
      <h3 className="sat-mocks__card-title">{mock.title}</h3>

      <div className="sat-mocks__card-meta">
        <span>
          <TimerReset size={13} /> {mock.durationMin} m
        </span>
        <span>
          <FileQuestion size={13} /> {mock.questionCount} questions
        </span>
      </div>

      {attempt ? (
        <div className="sat-mocks__card-attempt">
          <div className="sat-mocks__card-attempt-label">Last attempt</div>
          <div className="sat-mocks__card-attempt-value">
            {attempt.score != null ? (
              <span className="sat-mocks__card-attempt-score">
                {attempt.score}
              </span>
            ) : null}
            <span className="sat-mocks__card-attempt-frac">
              {attempt.correctQ}/{attempt.totalQ}
            </span>
            <span className="sat-mocks__card-attempt-sep">·</span>
            <span className="sat-mocks__card-attempt-pct">{lastPct}%</span>
          </div>
          <div className="sat-mocks__card-attempt-bar">
            <div
              className="sat-mocks__card-attempt-bar-fill"
              style={{ width: `${barPct}%` }}
            />
          </div>
          {attempt.attempts > 1 && attempt.bestScore != null && (
            <div className="sat-mocks__card-attempt-meta">
              {attempt.attempts} attempts · best {attempt.bestScore} pts
            </div>
          )}
        </div>
      ) : (
        <div className="sat-mocks__card-date">Released {mock.releaseDate}</div>
      )}

      <button
        className="sat-mocks__card-cta"
        disabled={loading}
        onClick={onStart}
      >
        {loading ? (
          "Composing…"
        ) : attempt ? (
          <>
            <RotateCcw size={13} />
            <span>Retake test</span>
            <ArrowRight size={13} className="sat-mocks__card-cta-arrow" />
          </>
        ) : (
          <>
            <Play size={13} />
            <span>Start test</span>
            <ArrowRight size={13} className="sat-mocks__card-cta-arrow" />
          </>
        )}
      </button>
    </article>
  );
};

export default SatMockTestsPage;
