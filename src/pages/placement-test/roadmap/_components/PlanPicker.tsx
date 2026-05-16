import { ArrowRight, Check } from 'lucide-react';

import styles from '../Roadmap.module.scss';

type Props = {
  onChoose: () => void;
};

export function PlanPicker({ onChoose }: Props) {
  return (
    <>
      <div className={styles.plansHeader}>
        <h2 className={styles.plansHeader__title}>Choose your plan</h2>
        <p className={styles.plansHeader__lede}>
          Start with a 7-day free trial. Cancel anytime.
        </p>
      </div>

      <div className={styles.plans}>
        <article className={styles.planCard}>
          <span className={styles.planCard__eyebrow}>Premium Monthly</span>
          <div className={styles.planCard__price}>
            $12<span>/ month</span>
          </div>
          <ul className={styles.planCard__features}>
            <li>
              <Check size={14} /> Full Community access
            </li>
            <li>
              <Check size={14} /> Admissions program
            </li>
            <li>
              <Check size={14} /> AI Major Match
            </li>
            <li>
              <Check size={14} /> 7-day free trial
            </li>
          </ul>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost} ${styles.planCard__cta}`}
            onClick={onChoose}
          >
            Start trial
            <ArrowRight size={14} />
          </button>
        </article>

        <article
          className={`${styles.planCard} ${styles.planCardFeatured}`}
          aria-label="Recommended plan"
        >
          <span className={styles.planCard__ribbon}>Save 31%</span>
          <span className={styles.planCard__eyebrow}>Premium Yearly</span>
          <div className={styles.planCard__price}>
            $99<span>/ year</span>
          </div>
          <ul className={styles.planCard__features}>
            <li>
              <Check size={14} /> Everything in Monthly
            </li>
            <li>
              <Check size={14} /> Priority support
            </li>
            <li>
              <Check size={14} /> Best value
            </li>
            <li>
              <Check size={14} /> 7-day free trial
            </li>
          </ul>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.planCard__cta}`}
            onClick={onChoose}
          >
            Start trial
            <ArrowRight size={14} />
          </button>
        </article>
      </div>
    </>
  );
}
