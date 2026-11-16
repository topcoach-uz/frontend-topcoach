/**
 * SAT test runner — Bluebook-style simulation. Three phases:
 *
 *   1. briefing  — mission-briefing splash for mock tests (skipped for
 *                  practice/pack)
 *   2. taking    — full-bleed two-pane test surface with all tools
 *                  (navigator, cross-out mode, timer toggle, vocab,
 *                  highlights panel)
 *   3. submitted — scored review screen
 *
 * Picks up `sat-mock-test` and `sat-mock-test-meta` from sessionStorage —
 * those are set by the page that composed the test (mock list / pack /
 * practice flow / quick drill).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  DoorOpen,
  Eye,
  EyeOff,
  FileQuestion,
  Flag,
  Grid3x3,
  Highlighter,
  Plus,
  Rocket,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import SatHtml from 'src/components/sat-prep/SatHtml';
import { RunnerModal, ConfirmDialog } from 'src/components/sat-prep/RunnerModal';
import type { SatChoice, SatQuestion } from 'src/app/services/sat-prep/types';
import {
  recordSession,
  useGetSatProgressQuery,
  type SessionRecord,
} from 'src/app/services/sat-prep/local-progress';
import { useGetSatStudyGoalQuery } from 'src/app/services/sat-prep/study-goal';
import { scoreBreakdown, resultInsights } from './sat-overview-model';
import { SatScoringState } from './SatScoringState';
import { answeredCount, clearRun, loadRun, runKey, saveRun } from './satRunState';
import {
  useAddVocabularyMutation,
  useGetMarkedQuestionIdsQuery,
  useMarkQuestionMutation,
  useUnmarkQuestionMutation,
} from 'src/app/services/sat-prep/library';
// The review screen uses shared shell tokens (.sat-btn, .sat-card,
// --sat-brand, etc.). The runner doesn't render inside SatPrepLayout, so
// we have to import the shell stylesheet here directly — otherwise
// .sat-btn--primary falls back to the bare ghost styling and looks
// invisible against the cream background.
import 'src/components/sat-prep/sat-prep-shell.scss';
import './sat-runner.scss';

type Letter = 'A' | 'B' | 'C' | 'D';
type Answer = { letter: Letter | null; spr: string };

interface TestMeta {
  title?: string;
  section?: 'math' | 'reading-writing';
  durationMin?: number;
  mode?: 'practice' | 'mock' | 'pack';
  mockId?: string;
}

const STORAGE_KEY = 'sat-mock-test';
const META_KEY = 'sat-mock-test-meta';

const isCorrect = (q: SatQuestion, ans: Answer): boolean => {
  if (q.questionType === 'multiple-choice') {
    if (typeof q.correctAnswer !== 'string') return false;
    return ans.letter === q.correctAnswer;
  }
  if (typeof q.correctAnswer === 'string') return false;
  const v = ans.spr.trim().replace(/\s+/g, '');
  if (!v) return false;
  return q.correctAnswer.acceptedForms.some((f) => f.replace(/\s+/g, '') === v);
};

const fmt = (s: number) => {
  if (s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const SatMockTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<SatQuestion[]>([]);
  const [meta, setMeta] = useState<TestMeta>({});
  const [phase, setPhase] = useState<'briefing' | 'taking' | 'scoring' | 'submitted'>('briefing');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  // Hydrate marks from the backend on mount — keyed by CB questionId, not
  // our local row id, so retakes pick up flags from previous sessions.
  const { data: markedIds } = useGetMarkedQuestionIdsQuery();
  const [markQuestion] = useMarkQuestionMutation();
  const [unmarkQuestion] = useUnmarkQuestionMutation();
  const [addVocabulary] = useAddVocabularyMutation();
  const [crossedOut, setCrossedOut] = useState<Record<string, Set<Letter>>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [reviewIdx, setReviewIdx] = useState(0);

  // UI toggles
  const [navOpen, setNavOpen] = useState(false);
  const [eliminatorMode, setEliminatorMode] = useState(false);
  const [timerHidden, setTimerHidden] = useState(false);
  const [vocabOpen, setVocabOpen] = useState(false);
  const [vocabInput, setVocabInput] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [passageNotes, setPassageNotes] = useState('');
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [leftPct, setLeftPct] = useState(50);
  const [savedSession, setSavedSession] = useState<SessionRecord | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const { data: progress } = useGetSatProgressQuery();
  const { data: goal } = useGetSatStudyGoalQuery();
  const runKeyRef = useRef<string | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const pendingRef = useRef<{ perQ: Record<string, boolean>; durationSec: number } | null>(null);
  const reviewListRef = useRef<HTMLDivElement | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const tickedDownRef = useRef(false);

  // Boot
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const rawMeta = sessionStorage.getItem(META_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SatQuestion[];
      setQuestions(parsed);
      const m: TestMeta = rawMeta ? JSON.parse(rawMeta) : {};
      setMeta(m);
      const key = runKey(parsed, m);
      runKeyRef.current = key;
      const saved = loadRun(key);
      if (saved && saved.phase === 'taking') {
        // Resume after a reload: restore answers and continue the clock
        // from the absolute end timestamp, never from a fresh duration.
        setAnswers(saved.answers);
        setMarked(saved.marked);
        setIdx(Math.min(saved.idx, parsed.length - 1));
        startedAtRef.current = saved.startedAt ?? Date.now();
        endsAtRef.current = saved.endsAt;
        if (saved.endsAt != null) {
          setSecondsLeft(Math.max(0, Math.ceil((saved.endsAt - Date.now()) / 1000)));
        }
        setPhase('taking');
        return;
      }
      if (m.durationMin) setSecondsLeft(m.durationMin * 60);
      // Skip briefing for practice/pack — only mock tests get the splash
      setPhase(m.mode === 'mock' ? 'briefing' : 'taking');
    } catch {
      setQuestions([]);
    }
  }, []);

  // Track when "taking" started so we can compute true duration on submit.
  useEffect(() => {
    if (phase === 'taking' && startedAtRef.current == null) {
      startedAtRef.current = Date.now();
      if (endsAtRef.current == null && secondsLeft != null) {
        endsAtRef.current = Date.now() + secondsLeft * 1000;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Persist the run so a reload resumes where the student left off.
  useEffect(() => {
    if (phase !== 'taking' || !runKeyRef.current) return;
    saveRun(runKeyRef.current, {
      answers,
      marked,
      idx,
      phase: 'taking',
      endsAt: endsAtRef.current,
      startedAt: startedAtRef.current,
      savedAt: Date.now(),
    });
  }, [phase, answers, marked, idx]);

  // Warn before closing / reloading the tab mid-test.
  useEffect(() => {
    if (phase !== 'taking') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [phase]);

  const attemptSave = async () => {
    const pending = pendingRef.current;
    if (!pending) return;
    setSaveFailed(false);
    const [record] = await Promise.all([
      recordSession({
        questions,
        perQuestionCorrect: pending.perQ,
        mode: meta.mode ?? 'practice',
        section: meta.section ?? questions[0]?.section ?? 'math',
        title: meta.title ?? 'SAT Practice',
        durationSec: pending.durationSec,
        mockId: meta.mockId,
      }),
      new Promise((r) => setTimeout(r, 1300)),
    ]);
    if (!record) {
      setSaveFailed(true);
      return;
    }
    setSavedSession(record);
    if (runKeyRef.current) clearRun(runKeyRef.current);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(META_KEY);
    pendingRef.current = null;
    setPhase('submitted');
  };

  const beginSubmit = () => {
    const perQ: Record<string, boolean> = {};
    for (const q of questions) {
      perQ[q.id] = isCorrect(q, answers[q.id] ?? { letter: null, spr: '' });
    }
    const startedAt = startedAtRef.current ?? Date.now();
    pendingRef.current = { perQ, durationSec: Math.round((Date.now() - startedAt) / 1000) };
    setPhase('scoring');
    void attemptSave();
  };

  // Seed local `marked` state from server-side flags. Keyed by row id (q.id)
  // since the runner's `marked` map is row-id-keyed, but we look up which
  // rows match the user's marked CB questionIds.
  useEffect(() => {
    if (!markedIds || !questions.length) return;
    const set = new Set(markedIds);
    setMarked((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const q of questions) {
        if (set.has(q.questionId)) next[q.id] = true;
      }
      return next;
    });
  }, [markedIds, questions]);

  // Single source of truth for toggling a mark — local state for instant
  // feedback, mutation for persistence. Failures roll back the local flag
  // and surface a toast so the student knows the mark didn't save.
  const toggleMark = (rowId: string, questionId: string) => {
    if (!questionId) {
      message.error('Cannot mark — missing question id.');
      // eslint-disable-next-line no-console
      console.warn('[mark] missing questionId for row', rowId);
      return;
    }
    const wasMarked = !!marked[rowId];
    setMarked((p) => ({ ...p, [rowId]: !wasMarked }));
    // eslint-disable-next-line no-console
    console.log('[mark] firing', wasMarked ? 'unmark' : 'mark', 'for', questionId);
    const op = wasMarked ? unmarkQuestion(questionId) : markQuestion({ questionId });
    op.unwrap()
      .then((res) => {
        // eslint-disable-next-line no-console
        console.log('[mark] persisted ok', res);
      })
      .catch((err) => {
        setMarked((p) => ({ ...p, [rowId]: wasMarked }));
        // eslint-disable-next-line no-console
        console.error('[mark] persistence failed', err);
        const msg = err?.data?.message || err?.error || 'Could not save the mark.';
        message.error(typeof msg === 'string' ? msg : 'Could not save the mark.');
      });
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'taking' || secondsLeft == null) return;
    if (secondsLeft <= 0 && !tickedDownRef.current) {
      tickedDownRef.current = true;
      beginSubmit();
      Modal.info({ title: 'Time is up', content: 'Your answers have been auto-submitted.' });
      return;
    }
    const t = setTimeout(
      () =>
        setSecondsLeft((s) => {
          if (s == null) return null;
          const end = endsAtRef.current;
          return end != null ? Math.max(0, Math.ceil((end - Date.now()) / 1000)) : s - 1;
        }),
      1000,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  // ←/→ keyboard nav. Active in both `taking` and `submitted` phases.
  // Skips when:
  //   - any modal is open (Esc handles those)
  //   - focus is in an input / textarea / contenteditable (typing wins)
  //   - the SPR answer field has focus (digits + dashes still go through)
  // preventDefault stops the browser from shifting focus across buttons.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (navOpen || directionsOpen || exitOpen || submitOpen || vocabOpen) return;
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (t.isContentEditable) return;
      }

      const last = questions.length - 1;
      if (phase === 'taking') {
        if (e.key === 'ArrowLeft') {
          if (idx > 0) { e.preventDefault(); setIdx((i) => i - 1); }
        } else {
          if (idx < last) { e.preventDefault(); setIdx((i) => i + 1); }
        }
      } else if (phase === 'submitted') {
        if (e.key === 'ArrowLeft') {
          if (reviewIdx > 0) { e.preventDefault(); setReviewIdx((i) => i - 1); }
        } else {
          if (reviewIdx < last) { e.preventDefault(); setReviewIdx((i) => i + 1); }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, idx, reviewIdx, questions.length, navOpen, directionsOpen, exitOpen, submitOpen, vocabOpen]);

  // Drag separator
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const body = document.querySelector('.sat-runner__body') as HTMLElement | null;
      if (!body) return;
      const rect = body.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setLeftPct(Math.max(25, Math.min(75, ratio * 100)));
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const total = questions.length;
  const current = phase === 'submitted' ? questions[reviewIdx] : questions[idx];

  const score = useMemo(() => {
    if (phase !== 'submitted' || !total) return null;
    let correct = 0;
    for (const q of questions) if (isCorrect(q, answers[q.id] ?? { letter: null, spr: '' })) correct++;
    return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0 };
  }, [phase, questions, answers, total]);

  // ─── Empty state ───
  if (!total) {
    return (
      <div className="sat-runner sat-runner--empty">
        <div className="sat-runner__empty-card">
          <Rocket size={36} />
          <h2>No test in progress</h2>
          <p>Build a practice or mock test from the SAT Prep dashboard.</p>
          <button className="sat-runner__primary-btn" onClick={() => navigate('/student-hub/sat-prep')}>
            Go to SAT Prep
          </button>
        </div>
      </div>
    );
  }

  // ─── BRIEFING ───
  if (phase === 'briefing') {
    const isMath = meta.section === 'math';
    return (
      <div className="sat-runner sat-runner--briefing">
        <div className="sat-runner__briefing-card">
          <div className="sat-runner__briefing-eyebrow">
            <span className="sat-runner__briefing-dot" /> MISSION BRIEFING
          </div>
          <h1 className="sat-runner__briefing-title">{meta.title ?? 'Mock Test'}</h1>
          <div className="sat-runner__briefing-sub">System check complete. Ready for launch.</div>

          <div className="sat-runner__briefing-stats">
            <div className="sat-runner__briefing-stat">
              <div className="sat-runner__briefing-stat-icon"><FileQuestion size={20} /></div>
              <div>
                <div className="sat-runner__briefing-stat-label">Total Questions</div>
                <div className="sat-runner__briefing-stat-value">{total}</div>
              </div>
            </div>
            <div className="sat-runner__briefing-stat">
              <div className="sat-runner__briefing-stat-icon"><Clock size={20} /></div>
              <div>
                <div className="sat-runner__briefing-stat-label">Total Time</div>
                <div className="sat-runner__briefing-stat-value">{meta.durationMin ?? '—'} min</div>
              </div>
            </div>
          </div>

          <div className="sat-runner__briefing-modules">
            <div className="sat-runner__briefing-modules-label">Test module</div>
            <div className={`sat-runner__briefing-module sat-runner__briefing-module--${isMath ? 'math' : 'rw'}`}>
              <div className="sat-runner__briefing-module-icon">
                {isMath ? <Calculator size={18} /> : <BookOpen size={18} />}
              </div>
              <div className="sat-runner__briefing-module-text">
                <div className="sat-runner__briefing-module-title">
                  {isMath ? 'Math' : 'Reading & Writing'}
                </div>
                <div className="sat-runner__briefing-module-meta">
                  {total} questions · {meta.durationMin ?? '—'} min
                </div>
              </div>
            </div>
          </div>

          <button className="sat-runner__primary-btn sat-runner__briefing-cta" onClick={() => setPhase('taking')}>
            <Rocket size={16} /> Enter Exam Mode
          </button>
          <p className="sat-runner__briefing-disclaimer">
            Make sure you're in a quiet environment. The timer starts when you click the button.
          </p>
        </div>
        <button className="sat-runner__briefing-exit" onClick={() => navigate('/student-hub/sat-prep')}>
          <ArrowLeft size={14} /> Exit
        </button>
      </div>
    );
  }

  // ─── SCORING (save in flight, or failed) ───
  if (phase === 'scoring') {
    return (
      <div className="sat-runner sat-runner--scoring">
        <SatScoringState failed={saveFailed} onRetry={() => void attemptSave()} />
      </div>
    );
  }

  // ─── SUBMITTED (review) ───
  if (phase === 'submitted' && score) {
    const insights = resultInsights({
      saved: savedSession,
      sessions: [
        ...(progress?.recentSessions ?? []),
        ...(progress?.mockSessions ?? []),
        ...(progress?.packSessions ?? []),
      ],
      combined: scoreBreakdown(progress?.mockSessions ?? []).total,
      target: goal?.targetScore ?? null,
    });
    const wrongCount = score.total - score.correct;
    const reviewMistakes = () => {
      const first = questions.findIndex(
        (q) => !isCorrect(q, answers[q.id] ?? { letter: null, spr: '' }),
      );
      if (first >= 0) setReviewIdx(first);
      reviewListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const isMath = meta.section === 'math';
    return (
      <div className="sat-runner sat-runner--review">
        {/* Editorial summary card */}
        <section className="sat-review">
          <div className="sat-review__summary">
            <div className="sat-review__summary-left">
              <div className="sat-review__eyebrow">
                <span className="sat-review__eyebrow-dot" />
                Test complete
              </div>
              <h1 className="sat-review__title">{meta.title ?? 'Practice session'}</h1>
              <p className="sat-review__subtitle">
                {isMath ? 'Math' : 'Reading & Writing'} · {meta.mode === 'mock' ? 'Bluebook-style mock' : meta.mode === 'pack' ? 'Test pack' : 'Practice'}
              </p>
              <div className="sat-review__actions">
                {wrongCount > 0 ? (
                  <button className="sat-btn sat-btn--primary" onClick={reviewMistakes}>
                    Review {wrongCount} {wrongCount === 1 ? 'mistake' : 'mistakes'}
                  </button>
                ) : (
                  <button
                    className="sat-btn sat-btn--primary"
                    onClick={() => navigate('/student-hub/sat-prep')}
                  >
                    <Check size={14} /> Back to overview
                  </button>
                )}
                {wrongCount > 0 && (
                  <button
                    className="sat-btn sat-btn--ghost"
                    onClick={() => navigate('/student-hub/sat-prep')}
                  >
                    Back to overview
                  </button>
                )}
                <button
                  className="sat-btn sat-btn--ghost"
                  onClick={() => {
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
                    sessionStorage.setItem(META_KEY, JSON.stringify(meta));
                    setAnswers({});
                    setMarked({});
                    setCrossedOut({});
                    setIdx(0);
                    setReviewIdx(0);
                    if (meta.durationMin) setSecondsLeft(meta.durationMin * 60);
                    startedAtRef.current = null;
                    endsAtRef.current = null;
                    tickedDownRef.current = false;
                    setSavedSession(null);
                    setSaveFailed(false);
                    if (runKeyRef.current) clearRun(runKeyRef.current);
                    setPhase(meta.mode === 'mock' ? 'briefing' : 'taking');
                  }}
                >
                  <RotateCcw size={14} /> Retake
                </button>
              </div>
            </div>

            <div className="sat-review__score">
              <div className="sat-review__score-ring">
                <svg viewBox="0 0 120 120" className="sat-review__score-ring-svg" aria-hidden>
                  <circle cx="60" cy="60" r="52" stroke="#e5e3da" strokeWidth="10" fill="none" />
                  <circle
                    cx="60" cy="60" r="52"
                    stroke="#7B1F2F" strokeWidth="10" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(score.pct / 100) * 326.7} 326.7`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="sat-review__score-ring-center">
                  <div className="sat-review__score-pct">{score.pct}<span>%</span></div>
                  <div className="sat-review__score-frac">{score.correct} of {score.total}</div>
                </div>
              </div>
              {insights.length > 0 && (
                <ul className="sat-review__insights">
                  {insights.map((i) => (
                    <li key={i.key} className={`sat-review__insight sat-review__insight--${i.tone}`}>
                      <strong>{i.value}</strong>
                      <span>{i.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="sat-review__score-tags">
                <div className="sat-review__score-tag sat-review__score-tag--ok">
                  <CheckCircle2 size={12} /> {score.correct} correct
                </div>
                <div className="sat-review__score-tag sat-review__score-tag--bad">
                  <XCircle size={12} /> {score.total - score.correct} incorrect
                </div>
              </div>
            </div>
          </div>

          <div className="sat-review__divider" />

          <div className="sat-review__list-header" ref={reviewListRef}>
            <h2 className="sat-review__list-title">Question review</h2>
            <span className="sat-review__list-meta">
              Question {reviewIdx + 1} of {total}
              {marked[questions[reviewIdx]?.id ?? ''] && <> · <Flag size={11} color="#f59e0b" /> Marked</>}
            </span>
          </div>

          {/* Per-question pip strip */}
          <div className="sat-review__pips">
            {questions.map((q, i) => {
              const a = answers[q.id] ?? { letter: null, spr: '' };
              const ok = isCorrect(q, a);
              const cur = i === reviewIdx;
              return (
                <button
                  key={q.id}
                  className={[
                    'sat-review__pip',
                    ok ? 'sat-review__pip--ok' : 'sat-review__pip--bad',
                    cur && 'sat-review__pip--current',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setReviewIdx(i)}
                  title={`Question ${i + 1} — ${ok ? 'Correct' : 'Incorrect'}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </section>

        {/* Question detail */}
        {current && (
          <ReviewQuestion
            question={current}
            ans={answers[current.id] ?? { letter: null, spr: '' }}
            idx={reviewIdx}
            total={total}
          />
        )}

        {/* Bottom nav */}
        <div className="sat-review__nav">
          <button
            className="sat-btn sat-btn--ghost"
            disabled={reviewIdx === 0}
            onClick={() => setReviewIdx((i) => Math.max(0, i - 1))}
          >
            <ArrowLeft size={14} /> Previous
          </button>
          <span className="sat-review__nav-pill">
            Question {reviewIdx + 1} of {total}
          </span>
          <button
            className="sat-btn sat-btn--dark"
            disabled={reviewIdx >= total - 1}
            onClick={() => setReviewIdx((i) => Math.min(total - 1, i + 1))}
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ─── TAKING ───
  if (!current) return null;
  const ans = answers[current.id] ?? { letter: null, spr: '' };
  const update = (patch: Partial<Answer>) =>
    setAnswers((prev) => ({ ...prev, [current.id]: { ...(prev[current.id] ?? { letter: null, spr: '' }), ...patch } }));

  const toggleCross = (letter: Letter) => {
    setCrossedOut((prev) => {
      const next = { ...prev };
      const set = new Set(next[current.id] ?? []);
      set.has(letter) ? set.delete(letter) : set.add(letter);
      next[current.id] = set;
      return next;
    });
    if (ans.letter === letter) update({ letter: null });
  };

  const finalizeAndSubmit = beginSubmit;

  const handleConfirmSubmit = () => {
    setSubmitOpen(false);
    finalizeAndSubmit();
  };

  const handleConfirmExit = () => {
    setExitOpen(false);
    if (runKeyRef.current) clearRun(runKeyRef.current);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(META_KEY);
    navigate('/student-hub/sat-prep');
  };

  // Leave but keep everything: the Overview offers "Resume your test".
  const handleLeaveAndResume = () => {
    setExitOpen(false);
    navigate('/student-hub/sat-prep');
  };

  const submit = () => setSubmitOpen(true);
  const exit = () => setExitOpen(true);

  const addVocab = async () => {
    const w = vocabInput.trim();
    if (!w) return;
    try {
      await addVocabulary({
        word: w,
        questionId: current?.questionId,
      }).unwrap();
      setVocabInput('');
      setVocabOpen(false);
      message.success(`Added "${w}" to vocabulary`);
    } catch {
      message.error('Could not save word.');
    }
  };

  const isMath = current.section === 'math';
  const sectionLabel = isMath ? 'Section 2: Math' : 'Section 1: Reading and Writing';
  const correctLetter = typeof current.correctAnswer === 'string' ? (current.correctAnswer as Letter) : null;
  const crossSet = crossedOut[current.id] ?? new Set<Letter>();

  return (
    <div className="sat-runner">
      {/* Top bar */}
      <header className="sat-runner__topbar">
        <div className="sat-runner__topbar-left">
          <button className="sat-runner__exit-btn" onClick={exit} title="Exit test">
            <DoorOpen size={14} /> Exit
          </button>
          <span className="sat-runner__section-divider" />
          <span className="sat-runner__section-label">{sectionLabel}</span>
          <button className="sat-runner__link-btn" onClick={() => setDirectionsOpen(true)}>
            Directions
          </button>
        </div>
        <div className="sat-runner__topbar-center">
          {secondsLeft != null && (
            <>
              <Clock size={15} />
              <span className={`sat-runner__timer ${secondsLeft < 300 ? 'sat-runner__timer--warn' : ''}`}>
                {timerHidden ? '••:••' : fmt(secondsLeft)}
              </span>
              <button className="sat-runner__icon-btn" onClick={() => setTimerHidden((v) => !v)} title={timerHidden ? 'Show timer' : 'Hide timer'}>
                {timerHidden ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </>
          )}
        </div>
        <div className="sat-runner__topbar-right">
          <button
            className={`sat-runner__icon-btn ${notesOpen ? 'sat-runner__icon-btn--active' : ''}`}
            onClick={() => setNotesOpen((v) => !v)}
            title="Highlights & Notes"
          >
            <Highlighter size={15} />
            <span>Highlights & Notes</span>
          </button>
          <button
            className={`sat-runner__abc-btn ${eliminatorMode ? 'sat-runner__abc-btn--active' : ''}`}
            onClick={() => setEliminatorMode((v) => !v)}
            title="Cross out answer choices"
          >
            <span style={{ textDecoration: 'line-through' }}>ABC</span>
          </button>
        </div>
      </header>
      <div className="sat-runner__divider" />

      {/* Body — two-pane only when there's a passage to display.
           Most math questions have no passage and would otherwise leave the
           left half empty with placeholder text. Real Bluebook does the same:
           passage-less questions get a single centered column. */}
      <main className={`sat-runner__body ${current.passageHtml ? '' : 'sat-runner__body--single'}`}>
        {current.passageHtml ? (
          <>
            <div className="sat-runner__pane sat-runner__pane--left" style={{ flex: `0 0 ${leftPct}%` }}>
              <SatHtml html={current.passageHtml} className="sat-runner__passage" />
            </div>

            <div
              role="separator"
              className="sat-runner__separator"
              onMouseDown={() => {
                draggingRef.current = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
              }}
            >
              <div className="sat-runner__separator-handle" />
            </div>

            <div className="sat-runner__pane sat-runner__pane--right" style={{ flex: `0 0 ${100 - leftPct}%` }}>
              <QuestionColumn
                idx={idx}
                current={current}
                ans={ans}
                crossSet={crossSet}
                eliminatorMode={eliminatorMode}
                marked={!!marked[current.id]}
                onToggleMark={() => toggleMark(current.id, current.questionId)}
                onPickLetter={(l) => {
                  if (crossSet.has(l)) return;
                  update({ letter: l });
                }}
                onCross={toggleCross}
                onSpr={(spr) => update({ spr })}
              />
            </div>
          </>
        ) : (
          <div className="sat-runner__pane sat-runner__pane--single">
            <QuestionColumn
              idx={idx}
              current={current}
              ans={ans}
              crossSet={crossSet}
              eliminatorMode={eliminatorMode}
              marked={!!marked[current.id]}
              onToggleMark={() => setMarked((p) => ({ ...p, [current.id]: !p[current.id] }))}
              onPickLetter={(l) => {
                if (crossSet.has(l)) return;
                update({ letter: l });
              }}
              onCross={toggleCross}
              onSpr={(spr) => update({ spr })}
            />
          </div>
        )}
      </main>

      {/* Notes side panel */}
      {notesOpen && (
        <aside className="sat-runner__notes-panel">
          <div className="sat-runner__notes-header">
            <span><Highlighter size={14} /> Highlights & Notes</span>
            <button className="sat-runner__icon-btn" onClick={() => setNotesOpen(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="sat-runner__notes-body">
            <div className="sat-runner__notes-section-label">Passage notes</div>
            <textarea
              className="sat-runner__notes-textarea"
              value={passageNotes}
              onChange={(e) => setPassageNotes(e.target.value)}
              placeholder="Add general notes about this passage…"
              rows={6}
            />
            <div className="sat-runner__notes-section-label" style={{ marginTop: 16 }}>
              Highlights (0)
            </div>
            <p className="sat-runner__notes-hint">Select text in the passage to create highlights.</p>
          </div>
        </aside>
      )}

      {/* Bottom bar */}
      <div className="sat-runner__divider" />
      <footer className="sat-runner__bottombar">
        <div className="sat-runner__bottombar-left">
          {current.section === 'reading-writing' && <button className="sat-runner__vocab-btn" onClick={() => setVocabOpen((v) => !v)}>
            <Plus size={13} />
            <span>Add vocabulary</span>
          </button>}
          {vocabOpen && (
            <div className="sat-runner__vocab-pop">
              <input
                autoFocus
                value={vocabInput}
                onChange={(e) => setVocabInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addVocab(); }}
                placeholder="Enter word…"
              />
              <button className="sat-runner__primary-btn sat-runner__primary-btn--sm" onClick={addVocab}>Add</button>
            </div>
          )}
        </div>
        <button className="sat-runner__nav-pill" onClick={() => setNavOpen(true)}>
          Question {idx + 1} of {total}
          <Grid3x3 size={13} />
        </button>
        <div className="sat-runner__bottombar-right">
          <button
            className="sat-runner__ghost-btn"
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
          >
            Back
          </button>
          {idx >= total - 1 ? (
            <button className="sat-runner__primary-btn" onClick={submit}>Submit</button>
          ) : (
            <button className="sat-runner__primary-btn" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}>
              Next
            </button>
          )}
        </div>
      </footer>

      {/* Directions */}
      <RunnerModal
        open={directionsOpen}
        onClose={() => setDirectionsOpen(false)}
        eyebrow={isMath ? 'Section 2' : 'Section 1'}
        title={isMath ? 'Math Directions' : 'Reading and Writing Directions'}
        size="lg"
        footer={
          <button className="rm-btn rm-btn--primary" onClick={() => setDirectionsOpen(false)}>
            Got it
          </button>
        }
      >
        {isMath ? (
          <div className="rm-directions">
            <p className="rm-directions__lead">
              The questions in this section address <strong>algebra</strong>, <strong>advanced math</strong>,
              <strong> problem-solving and data analysis</strong>, and <strong>geometry &amp; trigonometry</strong>.
            </p>
            <p>Read each question carefully and choose the best answer. You may use a calculator on any question.</p>

            <h3 className="rm-directions__subhead">Student-produced response (SPR) questions</h3>
            <ul className="rm-directions__rules">
              <li className="rm-directions__rule">
                <span className="rm-directions__rule-num">1</span>
                <span className="rm-directions__rule-text">Enter only one answer per question.</span>
              </li>
              <li className="rm-directions__rule">
                <span className="rm-directions__rule-num">2</span>
                <span className="rm-directions__rule-text">Up to 5 characters for a positive answer, or 6 including a negative sign.</span>
              </li>
              <li className="rm-directions__rule">
                <span className="rm-directions__rule-num">3</span>
                <span className="rm-directions__rule-text">If a fraction doesn't fit, enter the decimal equivalent. If a decimal doesn't fit, truncate or round at the fourth digit.</span>
              </li>
              <li className="rm-directions__rule">
                <span className="rm-directions__rule-num">4</span>
                <span className="rm-directions__rule-text">For mixed numbers (e.g. 3½), enter as the improper fraction <code>7/2</code> or its decimal <code>3.5</code>.</span>
              </li>
              <li className="rm-directions__rule">
                <span className="rm-directions__rule-num">5</span>
                <span className="rm-directions__rule-text">Don't enter symbols like %, $, or commas.</span>
              </li>
            </ul>

            <h3 className="rm-directions__subhead">Examples</h3>
            <table className="rm-directions__examples">
              <thead>
                <tr>
                  <th>Answer</th>
                  <th>Acceptable</th>
                  <th>Will not be accepted</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>3.5</td>
                  <td className="ok">3.5 · 3.50 · 7/2</td>
                  <td className="bad">31/2 · 3 1/2</td>
                </tr>
                <tr>
                  <td>2/3</td>
                  <td className="ok">2/3 · .6666 · .6667 · 0.666 · 0.667</td>
                  <td className="bad">0.66 · .67</td>
                </tr>
                <tr>
                  <td>−1/3</td>
                  <td className="ok">-1/3 · -.3333 · -0.333</td>
                  <td className="bad">-.33 · -0.33</td>
                </tr>
              </tbody>
            </table>

            <div className="rm-directions__note">
              All multiple-choice questions have a single best answer. Cross out choices you've ruled out using the
              <strong> ABC </strong> button in the top-right.
            </div>
          </div>
        ) : (
          <div className="rm-directions">
            <p className="rm-directions__lead">
              The questions in this section address a number of important <strong>reading and writing</strong> skills.
              Each question includes one or more passages, which may include a table or graph.
            </p>
            <p>Read each passage and question carefully, then choose the best answer based on the passage(s).</p>

            <h3 className="rm-directions__subhead">How to answer</h3>
            <ul className="rm-directions__rules">
              <li className="rm-directions__rule">
                <span className="rm-directions__rule-num">1</span>
                <span className="rm-directions__rule-text">All questions are multiple choice with four answer choices and a single best answer.</span>
              </li>
              <li className="rm-directions__rule">
                <span className="rm-directions__rule-num">2</span>
                <span className="rm-directions__rule-text">Use the <strong>Mark for Review</strong> bookmark to revisit a question later.</span>
              </li>
              <li className="rm-directions__rule">
                <span className="rm-directions__rule-num">3</span>
                <span className="rm-directions__rule-text">Click <strong>ABC</strong> in the top-right to enable answer-elimination mode.</span>
              </li>
              <li className="rm-directions__rule">
                <span className="rm-directions__rule-num">4</span>
                <span className="rm-directions__rule-text">Open <strong>Highlights &amp; Notes</strong> to take passage notes during the test.</span>
              </li>
            </ul>

            <div className="rm-directions__note">
              You can drag the vertical separator between the passage and the question to resize each side.
            </div>
          </div>
        )}
      </RunnerModal>

      {/* Exit / Finish — 3 paths so users don't lose progress by mistake */}
      <RunnerModal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        eyebrow="Leaving the test"
        title="What would you like to do?"
        size="md"
        footer={
          <>
            <button className="rm-btn rm-btn--ghost" onClick={() => setExitOpen(false)}>
              Keep going
            </button>
            <button className="rm-btn rm-btn--ghost" onClick={handleLeaveAndResume}>
              Leave &amp; resume later
            </button>
            <button
              className="rm-btn rm-btn--danger"
              onClick={handleConfirmExit}
            >
              Exit without saving
            </button>
            <button
              className="rm-btn rm-btn--primary"
              onClick={() => { setExitOpen(false); finalizeAndSubmit(); }}
              autoFocus
            >
              Finish &amp; submit
            </button>
          </>
        }
      >
        <div className="sat-runner__exit-options">
          <p className="sat-runner__exit-lead">
            Leave test? Your answers are saved and you can resume from the SAT Overview.
          </p>
          <p className="sat-runner__exit-lead">
            You've answered{' '}
            <strong>{answeredCount({ answers })}</strong>{' '}
            of <strong>{total}</strong> questions so far.
          </p>
          <ul className="sat-runner__exit-list">
            <li>
              <strong>Leave &amp; resume later</strong> — keep your answers and timer, and pick up
              from the SAT Overview.
            </li>
            <li>
              <strong>Finish &amp; submit</strong> — score this attempt and add it to your study
              history. Unanswered questions count as incorrect.
            </li>
            <li>
              <strong>Exit without saving</strong> — leave now and discard this attempt. Nothing is
              recorded.
            </li>
            <li>
              <strong>Keep going</strong> — close this dialog and return to the test.
            </li>
          </ul>
        </div>
      </RunnerModal>

      {/* Submit confirm */}
      <ConfirmDialog
        open={submitOpen}
        onCancel={() => setSubmitOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit test?"
        description={
          <>
            You've answered <strong>{Object.values(answers).filter((a) => a.letter || a.spr).length}</strong> of{' '}
            <strong>{total}</strong>. Unanswered questions count as incorrect.
          </>
        }
        confirmLabel="Submit"
        cancelLabel="Keep going"
      />

      {/* Question Navigator modal */}
      {navOpen && (
        <div className="sat-runner__navigator-overlay" onClick={() => setNavOpen(false)}>
          <div className="sat-runner__navigator" onClick={(e) => e.stopPropagation()}>
            <div className="sat-runner__navigator-header">
              <span><Grid3x3 size={14} /> Question Navigator</span>
              <button className="sat-runner__icon-btn" onClick={() => setNavOpen(false)}><X size={14} /></button>
            </div>
            <div className="sat-runner__navigator-legend">
              <span><span className="sat-runner__navigator-swatch sat-runner__navigator-swatch--answered" /> Answered</span>
              <span><span className="sat-runner__navigator-swatch sat-runner__navigator-swatch--unanswered" /> Unanswered</span>
              <span><span className="sat-runner__navigator-swatch sat-runner__navigator-swatch--current" /> Current</span>
              <span><Flag size={11} color="#f59e0b" /> Marked</span>
            </div>
            <div className="sat-runner__navigator-grid">
              {questions.map((q, i) => {
                const a = answers[q.id];
                const answered = !!(a?.letter || a?.spr);
                const cur = i === idx;
                const isMarked = !!marked[q.id];
                return (
                  <button
                    key={q.id}
                    className={[
                      'sat-runner__navigator-cell',
                      cur && 'sat-runner__navigator-cell--current',
                      !cur && answered && 'sat-runner__navigator-cell--answered',
                      isMarked && 'sat-runner__navigator-cell--marked',
                    ].filter(Boolean).join(' ')}
                    onClick={() => { setIdx(i); setNavOpen(false); }}
                  >
                    {i + 1}
                    {isMarked && (
                      <span className="sat-runner__navigator-flag" aria-hidden>
                        <Flag size={8} fill="white" strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="sat-runner__navigator-footer">
              <span>{Object.values(answers).filter((a) => a.letter || a.spr).length} / {total} answered</span>
              <button className="sat-runner__primary-btn" onClick={() => { setNavOpen(false); submit(); }}>
                Finish Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionColumn: React.FC<{
  idx: number;
  current: SatQuestion;
  ans: Answer;
  crossSet: Set<Letter>;
  eliminatorMode: boolean;
  marked: boolean;
  onToggleMark: () => void;
  onPickLetter: (l: Letter) => void;
  onCross: (l: Letter) => void;
  onSpr: (v: string) => void;
}> = ({ idx, current, ans, crossSet, eliminatorMode, marked, onToggleMark, onPickLetter, onCross, onSpr }) => {
  return (
    <>
      <div className="sat-runner__qhead">
        <div className={`sat-runner__qnum ${marked ? 'sat-runner__qnum--marked' : ''}`}>
          {idx + 1}
          {marked && (
            <span className="sat-runner__qnum-flag" aria-hidden>
              <Flag size={8} fill="white" strokeWidth={2.5} />
            </span>
          )}
        </div>
        <button
          className={`sat-runner__mark ${marked ? 'sat-runner__mark--active' : ''}`}
          onClick={onToggleMark}
          aria-pressed={marked}
        >
          {marked ? <BookmarkCheck size={14} fill="#92400e" /> : <Bookmark size={14} />}
          <span>{marked ? 'Marked for Review' : 'Mark for Review'}</span>
        </button>
      </div>
      <div className="sat-runner__divider sat-runner__divider--inline" />

      <SatHtml html={current.stemHtml} className="sat-runner__stem" />

      {current.questionType === 'multiple-choice' && current.choices && (
        <ul className="sat-runner__choices">
          {current.choices.map((c) => (
            <ChoiceRow
              key={c.label}
              choice={c}
              selected={ans.letter === c.label}
              crossed={crossSet.has(c.label as Letter)}
              eliminatorMode={eliminatorMode}
              onPick={() => onPickLetter(c.label as Letter)}
              onCross={() => onCross(c.label as Letter)}
            />
          ))}
        </ul>
      )}

      {current.questionType === 'student-produced-response' && (
        <div className="sat-runner__spr">
          <label className="sat-runner__spr-label">Your Answer</label>
          <input
            type="text"
            className="sat-runner__spr-input"
            value={ans.spr}
            onChange={(e) => onSpr(e.target.value)}
            placeholder="Enter your answer"
          />
          <div className="sat-runner__spr-hint">Number or fraction (e.g., 42, 3/4, 0.75)</div>
        </div>
      )}
    </>
  );
};

const ChoiceRow: React.FC<{
  choice: SatChoice;
  selected: boolean;
  crossed: boolean;
  eliminatorMode: boolean;
  onPick: () => void;
  onCross: () => void;
}> = ({ choice, selected, crossed, eliminatorMode, onPick, onCross }) => {
  return (
    <li className={[
      'sat-runner__choice',
      selected && 'sat-runner__choice--selected',
      crossed && 'sat-runner__choice--crossed',
    ].filter(Boolean).join(' ')}>
      <button type="button" className="sat-runner__choice-btn" onClick={onPick} disabled={crossed}>
        <span className="sat-runner__choice-letter">{choice.label}</span>
        <SatHtml html={choice.text} className="sat-runner__choice-body" />
      </button>
      {eliminatorMode && (
        <button
          className={`sat-runner__cross-btn ${crossed ? 'sat-runner__cross-btn--active' : ''}`}
          onClick={onCross}
          title={crossed ? 'Restore choice' : 'Cross out choice'}
        >
          {crossed ? choice.label : <span style={{ textDecoration: 'line-through' }}>{choice.label}</span>}
        </button>
      )}
    </li>
  );
};

const ReviewQuestion: React.FC<{
  question: SatQuestion;
  ans: Answer;
  idx: number;
  total: number;
}> = ({ question, ans, idx, total }) => {
  const correctLetter = typeof question.correctAnswer === 'string' ? question.correctAnswer : null;
  const won = isCorrect(question, ans);

  return (
    <article className="sat-runner__review-q">
      <header className="sat-runner__review-q-head">
        <div className={`sat-runner__review-q-status sat-runner__review-q-status--${won ? 'correct' : 'incorrect'}`}>
          {won ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          {won ? 'Correct' : 'Incorrect'}
        </div>
        <span className="sat-runner__review-q-meta">
          Q{idx + 1} of {total} · {question.skill}
        </span>
      </header>
      <SatHtml html={question.stemHtml} className="sat-runner__stem" />
      {question.questionType === 'multiple-choice' && question.choices && (
        <ul className="sat-runner__choices">
          {question.choices.map((c) => {
            const selected = ans.letter === c.label;
            const isAnswerCorrect = correctLetter === c.label;
            const cls = [
              'sat-runner__choice',
              isAnswerCorrect && 'sat-runner__choice--correct',
              selected && !isAnswerCorrect && 'sat-runner__choice--incorrect',
            ].filter(Boolean).join(' ');
            return (
              <li key={c.label} className={cls}>
                <button className="sat-runner__choice-btn" disabled>
                  <span className="sat-runner__choice-letter">{c.label}</span>
                  <SatHtml html={c.text} className="sat-runner__choice-body" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {question.questionType === 'student-produced-response' && typeof question.correctAnswer === 'object' && (
        <div className="sat-runner__spr-accepted">
          <strong>Your answer:</strong> {ans.spr || <em>(none)</em>}
          <br />
          <strong>Accepted:</strong> {question.correctAnswer.acceptedForms.map((f, i) => <code key={i}>{f}</code>)}
        </div>
      )}
      {question.rationaleHtml && (
        <details className="sat-runner__rationale" open>
          <summary>Show rationale</summary>
          <SatHtml html={question.rationaleHtml} className="sat-runner__rationale-body" />
        </details>
      )}
    </article>
  );
};

export default SatMockTestPage;
