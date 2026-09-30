import { Check } from 'lucide-react';

import type { ProfileStep } from 'src/app/services/admissionsProfileApi';

import styles from '../Profile.module.scss';

type Props = {
  /** The step currently shown. */
  current: ProfileStep;
  /** Steps that the user has already completed (drives "done" color). */
  done: Set<ProfileStep>;
};

const STEPS: { id: ProfileStep; label: string; n: number }[] = [
  { id: 'basic', label: 'Basic info', n: 1 },
  { id: 'academic', label: 'Academic', n: 2 },
  { id: 'goals', label: 'Goals', n: 3 },
  { id: 'needs', label: 'Needs', n: 4 },
];

export function SubStepper({ current, done }: Props) {
  return (
    <div className={styles.stepper}>
      {STEPS.map((s) => {
        const isActive = s.id === current;
        const isDone = done.has(s.id) && !isActive;
        return (
          <div
            key={s.id}
            className={`${styles.stepper__cell} ${
              isActive ? styles.stepper__cellActive : ''
            } ${isDone ? styles.stepper__cellDone : ''}`}
          >
            <span className={styles.stepper__dot}>
              {isDone ? <Check size={12} /> : s.n}
            </span>
            <span className={styles.stepper__label}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}
