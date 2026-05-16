import { App, message } from 'antd';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { useTypedSelector } from 'src/app/store';
import {
  StartedPlacementAttempt,
  useGetPlacementAttemptQuery,
  useGetPlacementTestStatusQuery,
  useStartPlacementAttemptMutation,
  useSubmitPlacementAttemptMutation,
} from 'src/app/services/placementTestApi';
import { COMMUNITY_FUNNEL_PATHS, profilePath } from 'src/lib/communityAccess';

import { IntroCard } from './_components/IntroCard';
import { ProgressStrip } from './_components/ProgressStrip';
import { QuestionCard } from './_components/QuestionCard';
import { ResultPanel } from './_components/ResultPanel';
import { Timer } from './_components/Timer';
import styles from './PlacementTest.module.scss';

void App; // antd App context — required for `message` to render correctly

/**
 * Placement test — English-only gate before Community subscription.
 * Full-bleed editorial layout (cream backdrop, narrow column).
 */

type Phase =
  | { kind: 'intro' }
  | { kind: 'starting' }
  | { kind: 'quiz'; attempt: StartedPlacementAttempt }
  | { kind: 'submitting'; attempt: StartedPlacementAttempt };

function passedUserDestination(
  status:
    | { profile: { completed: boolean; lastEditedStep: string | null } }
    | undefined,
): string {
  if (!status) return COMMUNITY_FUNNEL_PATHS.subscriptionTab;
  if (status.profile.completed) return COMMUNITY_FUNNEL_PATHS.roadmap;
  return profilePath(status.profile.lastEditedStep ?? 'basic');
}

export default function PlacementTestPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useTypedSelector((s) => s.auth);

  const resultAttemptId = searchParams.get('result');

  const { data: status } = useGetPlacementTestStatusQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { data: resultAttempt } = useGetPlacementAttemptQuery(
    resultAttemptId ?? '',
    {
      skip: !isAuthenticated || !resultAttemptId,
    },
  );

  const [startAttempt] = useStartPlacementAttemptMutation();
  const [submitAttempt] = useSubmitPlacementAttemptMutation();

  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const [index, setIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Map<string, number | null>>(
    () => new Map(),
  );
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!status || resultAttemptId) return;
    if (phase.kind !== 'intro') return;
    if (status.passed) {
      navigate(passedUserDestination(status), { replace: true });
    }
  }, [status, resultAttemptId, phase.kind, navigate]);

  useEffect(() => {
    if (!resultAttemptId && phase.kind === 'intro') {
      setIndex(0);
      setAnswers(new Map());
      startedAtRef.current = null;
    }
  }, [resultAttemptId, phase.kind]);

  const handleStart = useCallback(async () => {
    setPhase({ kind: 'starting' });
    try {
      const attempt = await startAttempt().unwrap();
      setIndex(0);
      setAnswers(new Map(attempt.questions.map((q) => [q.id, null])));
      startedAtRef.current = Date.now();
      setPhase({ kind: 'quiz', attempt });
    } catch (err) {
      setPhase({ kind: 'intro' });
      message.error(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.data?.message ?? 'Couldn’t start the test. Please try again.',
      );
    }
  }, [startAttempt]);

  const performSubmit = useCallback(
    async (attempt: StartedPlacementAttempt, current: Map<string, number | null>) => {
      setPhase({ kind: 'submitting', attempt });
      const startedAt = startedAtRef.current ?? Date.now();
      const elapsed = Math.max(
        0,
        Math.min(
          attempt.timeLimitSeconds + 60,
          Math.round((Date.now() - startedAt) / 1000),
        ),
      );
      try {
        const result = await submitAttempt({
          attemptId: attempt.attemptId,
          body: {
            answers: attempt.questions.map((q) => ({
              questionId: q.id,
              selectedIndex: current.get(q.id) ?? null,
            })),
            timeTakenSeconds: elapsed,
          },
        }).unwrap();
        setPhase({ kind: 'intro' });
        setSearchParams({ result: result.id }, { replace: true });
      } catch (err) {
        setPhase({ kind: 'quiz', attempt });
        message.error(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (err as any)?.data?.message ?? 'Couldn’t submit your answers. Please try again.',
        );
      }
    },
    [submitAttempt, setSearchParams],
  );

  const handleSubmit = useCallback(() => {
    if (phase.kind !== 'quiz') return;
    void performSubmit(phase.attempt, answers);
  }, [phase, answers, performSubmit]);

  const handleTimerExpire = useCallback(() => {
    if (phase.kind !== 'quiz') return;
    void performSubmit(phase.attempt, answers);
  }, [phase, answers, performSubmit]);

  const handleSelect = useCallback(
    (questionId: string, optionIndex: number) => {
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(questionId, optionIndex);
        return next;
      });
    },
    [],
  );

  const handleRetake = useCallback(() => {
    setSearchParams({}, { replace: true });
    setPhase({ kind: 'intro' });
  }, [setSearchParams]);

  const handleContinueFunnel = useCallback(() => {
    navigate(passedUserDestination(status));
  }, [navigate, status]);

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth/signin?next=${encodeURIComponent(COMMUNITY_FUNNEL_PATHS.placementTest)}`}
        replace
      />
    );
  }

  if (resultAttemptId) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <BackLink onClick={() => handleRetake()} />
          {resultAttempt ? (
            <ResultPanel
              attempt={resultAttempt}
              onRetake={handleRetake}
              onContinue={handleContinueFunnel}
            />
          ) : (
            <div className={styles.centered}>Loading your result…</div>
          )}
        </div>
      </div>
    );
  }

  if (phase.kind === 'quiz' || phase.kind === 'submitting') {
    return (
      <QuizView
        attempt={phase.attempt}
        index={index}
        answers={answers}
        submitting={phase.kind === 'submitting'}
        onSelect={handleSelect}
        onPrev={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() => setIndex((i) => Math.min(phase.attempt.questions.length - 1, i + 1))}
        onSubmit={handleSubmit}
        onExpire={handleTimerExpire}
        onExit={handleRetake}
      />
    );
  }

  const hasPriorAttempt = Boolean(status?.lastAttempt);
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <BackLink onClick={() => navigate(-1)} />
        <IntroCard
          onStart={handleStart}
          starting={phase.kind === 'starting'}
          hasPriorAttempt={hasPriorAttempt}
          lastScorePct={status?.lastAttempt?.scorePercentage ?? null}
        />
      </div>
    </div>
  );
}

type QuizViewProps = {
  attempt: StartedPlacementAttempt;
  index: number;
  answers: Map<string, number | null>;
  submitting: boolean;
  onSelect: (qid: string, idx: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onExpire: () => void;
  onExit: () => void;
};

function QuizView({
  attempt,
  index,
  answers,
  submitting,
  onSelect,
  onPrev,
  onNext,
  onSubmit,
  onExpire,
  onExit,
}: QuizViewProps) {
  const total = attempt.questions.length;
  const current = attempt.questions[index];
  const selectedIndex = useMemo(
    () => answers.get(current.id) ?? null,
    [answers, current.id],
  );
  const isLast = index === total - 1;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <BackLink onClick={onExit} label="Exit test" />
        <section className={styles.card}>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>
              Question {index + 1} of {total}
            </span>
            <Timer
              totalSeconds={attempt.timeLimitSeconds}
              onExpire={onExpire}
            />
          </div>
          <ProgressStrip current={index + 1} total={total} />

          <QuestionCard
            question={current}
            selectedIndex={selectedIndex}
            onSelect={(idx) => onSelect(current.id, idx)}
            disabled={submitting}
          />

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={onPrev}
              disabled={index === 0 || submitting}
            >
              <ArrowLeft size={14} />
              Back
            </button>
            {isLast ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={onSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit answers'}
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={onNext}
                disabled={submitting}
              >
                Next
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function BackLink({
  onClick,
  label = 'Back',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={styles.backLink}>
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
