import React from 'react';
import { STEP_TITLES } from '../types';
import styles from '../YouthLeadersApplication.module.scss';

type Props = {
  current: number;
};

export default function ApplicationStepper({ current }: Props) {
  return (
    <div className={styles.stepper}>
      {STEP_TITLES.map((title, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <React.Fragment key={title}>
            {index > 0 && <div className={`${styles.stepperLine} ${done || active ? styles.stepperLineDone : ''}`} aria-hidden />}
            <div
              className={`${styles.stepperItem} ${active ? styles.stepperItemActive : ''} ${done ? styles.stepperItemDone : ''}`}
            >
              <span className={styles.stepperCircle}>{index + 1}</span>
              <span className={styles.stepperTitle}>{title}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
