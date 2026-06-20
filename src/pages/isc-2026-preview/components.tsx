// Small shared presentational bits for the ISC preview.
import React from 'react';
import styles from './isc.module.scss';
import {
  IscRecommendation,
  IscScores,
  IscStatus,
  RECOMMENDATION_LABEL,
  SCORE_DIMENSIONS,
  STATUS_LABEL,
  scoreTotal,
} from './types';

const STATUS_CLASS: Record<IscStatus, string> = {
  submitted: styles.bSubmitted,
  under_review: styles.bUnder,
  reviewed: styles.bReviewed,
  withdrawn: styles.bSubmitted,
  interview_scheduled: styles.bInterview,
  interview_completed: styles.bInterview,
  accepted: styles.bAccepted,
  waitlisted: styles.bWait,
  rejected: styles.bRejected,
};

const REC_CLASS: Record<IscRecommendation, string> = {
  strong_recommend: styles.recStrong,
  recommend: styles.recRec,
  neutral: styles.recNeutral,
  not_recommend: styles.recNot,
};

export function StatusBadge({ status }: { status: IscStatus }) {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function RecBadge({ rec }: { rec: IscRecommendation }) {
  return (
    <span className={`${styles.badge} ${REC_CLASS[rec]}`}>
      {RECOMMENDATION_LABEL[rec]}
    </span>
  );
}

export function Avatar({ initials, big }: { initials: string; big?: boolean }) {
  return <div className={big ? styles.bigAvatar : styles.avatar}>{initials}</div>;
}

export function BarRow({
  label,
  value,
  max,
  variant,
}: {
  label: string;
  value: number;
  max: number;
  variant?: 'green' | 'amber' | 'red';
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const fill =
    variant === 'green'
      ? styles.fillGreen
      : variant === 'amber'
        ? styles.fillAmber
        : variant === 'red'
          ? styles.fillRed
          : '';
  return (
    <div className={styles.barRow}>
      <div className={styles.barLabel}>{label}</div>
      <div className={styles.barTrack}>
        <div className={`${styles.barFill} ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.barVal}>{value}</div>
    </div>
  );
}

/** Interactive 5-dimension score sliders. Controlled. */
export function ScoreSliders({
  scores,
  onChange,
  readOnly,
}: {
  scores: IscScores;
  onChange?: (next: IscScores) => void;
  readOnly?: boolean;
}) {
  return (
    <>
      {SCORE_DIMENSIONS.map(({ key, label }) => (
        <div key={key} className={styles.scoreRow}>
          <div className={styles.scoreHead}>
            <span className={styles.scoreLabel}>{label}</span>
            <span className={styles.scoreVal}>{scores[key]} / 10</span>
          </div>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={10}
            value={scores[key]}
            disabled={readOnly}
            onChange={(e) =>
              onChange?.({ ...scores, [key]: Number(e.target.value) })
            }
          />
        </div>
      ))}
      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total score</span>
        <span className={styles.totalNum}>{scoreTotal(scores)} / 50</span>
      </div>
    </>
  );
}

