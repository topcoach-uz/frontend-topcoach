import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Clock, Target } from 'lucide-react';

import styles from '../PlacementTest.module.scss';

type Props = {
  onStart: () => void;
  starting: boolean;
  /** If the user has attempted before but didn't pass, copy shifts slightly. */
  hasPriorAttempt: boolean;
  /** Most recent score percentage if available — shown subtly in the lede. */
  lastScorePct?: number | null;
};

/**
 * The placement-test start call hits Gemini and routinely takes 4–6s
 * before the runner mounts. A static "Loading…" label during that window
 * makes the page feel broken; users click again. This component cycles
 * through a short script of grounded status messages so the wait reads
 * as "the system is working" rather than "the system is hanging".
 *
 * Each message describes a real step the backend goes through (fetching
 * the question bank, calibrating difficulty, etc.) — no fake progress
 * bar, no fake countdown timer that finishes before the response.
 */
const LOADING_STEPS = [
  'Picking 10 fresh questions…',
  'Tuning difficulty for your level…',
  'Calibrating the reading section…',
  'Almost ready — opening your test…',
];

function useRotatingMessage(active: boolean, intervalMs = 1400): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      // Cap at the final message so we hold on "Almost ready…" instead
      // of looping back to step 1 if the API takes longer than expected.
      setIndex((i) => Math.min(i + 1, LOADING_STEPS.length - 1));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);

  return LOADING_STEPS[index];
}

export function IntroCard({
  onStart,
  starting,
  hasPriorAttempt,
  lastScorePct,
}: Props) {
  const loadingMessage = useRotatingMessage(starting);

  return (
    <section className={styles.hero}>
      <span className={styles.hero__eyebrow}>
        Top Coach · Community access
      </span>
      <h1 className={styles.hero__title}>
        {hasPriorAttempt ? (
          <>
            One more <em>try</em>.
          </>
        ) : (
          <>
            A short <em>English</em> check.
          </>
        )}
      </h1>
      <p className={styles.hero__lede}>
        {hasPriorAttempt && typeof lastScorePct === 'number'
          ? `Your last attempt was ${lastScorePct}%. Each retake pulls a fresh set of questions — close this gap and the next step opens up.`
          : 'Before you join the Community, take a 10-minute reading, grammar, and vocabulary check. Score 50% or higher and you’re in.'}
      </p>

      <div className={styles.hero__metaRow}>
        <span className={styles.hero__metaChip}>
          <Clock size={14} /> 10 minutes
        </span>
        <span className={styles.hero__metaChip}>
          <BookOpen size={14} /> 10 questions
        </span>
        <span className={styles.hero__metaChip}>
          <Target size={14} /> 50% to pass
        </span>
      </div>

      <button
        type="button"
        className={styles.hero__cta}
        onClick={onStart}
        disabled={starting}
      >
        {starting
          ? loadingMessage
          : hasPriorAttempt
            ? 'Retake the test'
            : 'Begin the test'}
        <ArrowRight size={16} />
      </button>

      <p className={styles.hero__footnote}>
        {starting
          ? 'Hang tight — questions are being generated just for you.'
          : 'Each attempt pulls fresh questions. Retake as many times as you like.'}
      </p>
    </section>
  );
}
