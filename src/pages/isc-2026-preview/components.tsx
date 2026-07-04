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

/* ── AI assessment (rich, structured expert read) ───────────────────── */
import type {
  IscAiAssessment,
  IscAiRecommendation2,
} from '../../app/services/iscAdmissionsApi';

const DIM_LABEL: Record<string, string> = {
  academicPotential: 'Academic',
  leadership: 'Leadership',
  extracurricular: 'Extracurricular',
  motivation: 'Motivation',
  communication: 'Communication',
};

const REC_META: Record<IscAiRecommendation2, { label: string; cls: string }> = {
  strong_yes: { label: 'Strong yes', cls: styles.recStrongYes },
  yes: { label: 'Yes', cls: styles.recYes },
  lean_yes: { label: 'Lean yes', cls: styles.recLeanYes },
  borderline: { label: 'Borderline', cls: styles.recBorderline },
  lean_no: { label: 'Lean no', cls: styles.recLeanNo },
  no: { label: 'No', cls: styles.recNo },
};

const AUTH_LABEL: Record<IscAiAssessment['authenticity']['verdict'], string> = {
  authentic: 'Authentic',
  mixed: 'Mixed signals',
  likely_ai: 'Likely AI-written',
  uncertain: 'Uncertain',
};

/**
 * Renders the structured expert assessment: advisory lean + headline,
 * per-dimension evidence, strengths/concerns, essay authenticity, camp fit,
 * interview questions and things to verify. Advisory only.
 */
export function AiAssessmentDetails({
  assessment,
}: {
  assessment?: IscAiAssessment | null;
}) {
  if (!assessment) return null;
  const a = assessment;
  const rec = REC_META[a.recommendation] ?? REC_META.borderline;
  const dims = (a.dimensions ?? []).filter((d) => d.justification);

  return (
    <div className={styles.aiAssess}>
      <div className={styles.aiRecRow}>
        <span className={`${styles.aiRecBadge} ${rec.cls}`}>{rec.label}</span>
        <span className={styles.aiRecNote}>advisory lean — not a decision</span>
      </div>
      {a.headline && <div className={styles.aiHeadline}>{a.headline}</div>}

      {dims.length > 0 && (
        <div className={styles.aiSection}>
          <div className={styles.aiSectionLabel}>Per-criterion evidence</div>
          {dims.map((d) => (
            <div key={d.key} className={styles.aiDimRow}>
              <span className={styles.aiDimHead}>
                {DIM_LABEL[d.key] ?? d.key} <b>{d.score}/10</b>
              </span>
              <span className={styles.aiDimText}>{d.justification}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.aiTwoCol}>
        {a.strengths?.length > 0 && (
          <div className={styles.aiSection}>
            <div className={styles.aiSectionLabel}>Strengths</div>
            <ul className={styles.aiList}>
              {a.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {a.concerns?.length > 0 && (
          <div className={styles.aiSection}>
            <div className={styles.aiSectionLabel}>Concerns</div>
            <ul className={`${styles.aiList} ${styles.aiListWarn}`}>
              {a.concerns.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {a.authenticity && (a.authenticity.reasoning || a.authenticity.verdict) && (
        <div className={styles.aiSection}>
          <div className={styles.aiSectionLabel}>Essay authenticity</div>
          <div className={styles.aiAuthRow}>
            <span
              className={`${styles.aiAuthBadge} ${
                a.authenticity.verdict === 'authentic'
                  ? styles.aiAuthGood
                  : a.authenticity.verdict === 'likely_ai'
                    ? styles.aiAuthBad
                    : styles.aiAuthMid
              }`}
            >
              {AUTH_LABEL[a.authenticity.verdict]}
            </span>
            <span className={styles.aiAuthConf}>
              {a.authenticity.confidence}% confidence
            </span>
          </div>
          {a.authenticity.reasoning && (
            <div className={styles.aiDimText}>{a.authenticity.reasoning}</div>
          )}
        </div>
      )}

      {a.fit && (
        <div className={styles.aiSection}>
          <div className={styles.aiSectionLabel}>Fit for the camp</div>
          <div className={styles.aiDimText}>{a.fit}</div>
        </div>
      )}

      {a.interviewQuestions?.length > 0 && (
        <div className={styles.aiSection}>
          <div className={styles.aiSectionLabel}>Suggested interview questions</div>
          <ol className={styles.aiQuestions}>
            {a.interviewQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </div>
      )}

      {a.verify?.length > 0 && (
        <div className={styles.aiSection}>
          <div className={styles.aiSectionLabel}>Verify</div>
          <ul className={`${styles.aiList} ${styles.aiListWarn}`}>
            {a.verify.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
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

