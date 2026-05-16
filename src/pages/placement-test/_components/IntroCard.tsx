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

export function IntroCard({
  onStart,
  starting,
  hasPriorAttempt,
  lastScorePct,
}: Props) {
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
        {starting ? 'Loading…' : hasPriorAttempt ? 'Retake the test' : 'Begin the test'}
        <ArrowRight size={16} />
      </button>

      <p className={styles.hero__footnote}>
        Each attempt pulls fresh questions. Retake as many times as you like.
      </p>
    </section>
  );
}
