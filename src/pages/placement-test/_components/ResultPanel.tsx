import { ArrowRight, RotateCcw } from 'lucide-react';

import type {
  PlacementAttemptDto,
  PlacementLevel,
} from 'src/app/services/placementTestApi';

import styles from '../PlacementTest.module.scss';

type Props = {
  attempt: PlacementAttemptDto;
  onRetake: () => void;
  /** Pass-state CTA. Wires to the next funnel step (profile wizard). */
  onContinue: () => void;
  retakeBusy?: boolean;
};

const LEVEL_LONG: Record<PlacementLevel, string> = {
  A1: 'A1 Beginner',
  A2: 'A2 Elementary',
  B1: 'B1 Intermediate',
  B2: 'B2 Upper-Intermediate',
  C1: 'C1 Advanced',
};

export function ResultPanel({
  attempt,
  onRetake,
  onContinue,
  retakeBusy,
}: Props) {
  const passed = attempt.passed;
  const longLevel = LEVEL_LONG[attempt.level];

  return (
    <>
      <section className={styles.resultCard}>
        <div
          className={`${styles.scoreDisc} ${
            passed ? '' : styles.scoreDiscFail
          }`}
          aria-label={`Score ${attempt.scorePercentage} percent`}
        >
          {attempt.scorePercentage}%
        </div>

        <h2 className={styles.resultTitle}>
          {passed ? "You're in." : "Almost — let's try again."}
        </h2>

        <p className={styles.resultLevel}>
          Your level: <strong>{longLevel}</strong>
        </p>

        <div className={styles.divider} />

        <div className={styles.resultBreakdown}>
          <span>
            Reading <strong>{attempt.categoryScores.reading}</strong>
          </span>
          <span>·</span>
          <span>
            Grammar <strong>{attempt.categoryScores.grammar}</strong>
          </span>
          <span>·</span>
          <span>
            Vocabulary <strong>{attempt.categoryScores.vocabulary}</strong>
          </span>
        </div>

        {passed ? (
          <p className={styles.resultBlurb}>
            Welcome to the next step. We’ll ask a few quick questions about
            your goals and target schools so we can build you a personalized
            roadmap.
          </p>
        ) : (
          <p className={styles.resultBlurb}>
            We want everyone in the Community to be comfortable with B1
            reading and listening so your experience is great from day one.
            Try again with a fresh set of questions.
          </p>
        )}
      </section>

      {passed ? (
        <div className={styles.retakeRow}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onContinue}
          >
            Continue to your profile
            <ArrowRight size={16} />
          </button>
          <p className={styles.retakeNote}>
            Takes 2–3 minutes. We use it only to personalize your roadmap.
          </p>
        </div>
      ) : (
        <div className={styles.retakeRow}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onRetake}
            disabled={retakeBusy}
          >
            <RotateCcw size={16} />
            {retakeBusy ? 'Loading…' : 'Retake the test'}
          </button>
          <p className={styles.retakeNote}>
            Fresh questions every time. No cooldown.
          </p>
        </div>
      )}
    </>
  );
}
