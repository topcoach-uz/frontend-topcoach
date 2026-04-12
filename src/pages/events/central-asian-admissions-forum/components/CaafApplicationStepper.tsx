import React from 'react';
import styles from './CaafApplicationStepper.module.scss';

type Props = {
  current: number;
  titles: string[];
};

/**
 * Same UX as Youth Leaders registration stepper: numbered circles + labels,
 * here with crimson active / completed states.
 */
export default function CaafApplicationStepper({ current, titles }: Props) {
  return (
    <div className={styles.caafStepper}>
      {titles.map((title, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <React.Fragment key={title}>
            {index > 0 && (
              <div
                className={`${styles.caafStepperLine} ${done || active ? styles.caafStepperLineDone : ''}`}
                aria-hidden
              />
            )}
            <div
              className={`${styles.caafStepperItem} ${active ? styles.caafStepperItemActive : ''} ${done ? styles.caafStepperItemDone : ''}`}
            >
              <span className={styles.caafStepperCircle}>{index + 1}</span>
              <span className={styles.caafStepperTitle}>{title}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
