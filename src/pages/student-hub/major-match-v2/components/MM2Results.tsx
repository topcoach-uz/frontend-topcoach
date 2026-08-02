import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RotateCcw, Lock } from 'lucide-react';
import type { MajorMatchAccessStatus, MajorMatchResult } from '../../../../app/services/student-hub/majorMatchApi';
import { MM2_DIMENSION_KEYS } from '../content';
import { MajorMatchUpsell } from '../../psychometric-assessment/components/MajorMatchUpsell';
import { RoadmapTab } from '../../settings/roadmap/RoadmapTab';

interface MM2ResultsProps {
  result: MajorMatchResult;
  readOnly?: boolean;
  access?: MajorMatchAccessStatus;
  onRetake: () => void;
  onUnlock: () => void;
  onBack?: () => void;
  /** Server timestamp (result.createdAt) — set only when this result was
   *  JUST submitted in this session (not when viewing a past result via
   *  "View results"). The backend kicks off a background roadmap
   *  regeneration synchronously right after a Major Match submit (see
   *  `RoadmapService.regenerateForMajorMatch`), so passing this tells the
   *  embedded roadmap section to wait for a roadmap generated AFTER this
   *  moment rather than showing whatever (possibly stale, pre-submission)
   *  roadmap happens to be cached. Omitted in read-only (counselor)
   *  embeds — see the `!readOnly` guard below. */
  freshSince?: string;
}

export const MM2Results: React.FC<MM2ResultsProps> = ({
  result,
  readOnly = false,
  access,
  onRetake,
  onUnlock,
  onBack,
  freshSince,
}) => {
  const { t } = useTranslation();

  const requiresEnrollment = !readOnly && !!access && !access.canStart && access.requiresCommunityEnrollment;
  const total = result.totalPoints || 96;

  return (
    <div className="mm2-results">
      <div className="mm2-results__eyebrow">{t('majorMatch.results.eyebrow', 'Your Major Match')}</div>

      <section className="mm2-results__primary">
        <span className="mm2-results__primary-label">
          {t('majorMatch.results.primaryLabel', 'Your top match')}
          {' · '}
          {result.matchType === 'exact'
            ? t('majorMatch.results.matchTypeExact', 'Exact match')
            : t('majorMatch.results.matchTypeFallback', 'Closest match')}
        </span>
        <h1 className="mm2-results__primary-name">{t(`majorMatch.major.${result.primaryMajorSlug}.name`)}</h1>
        <p className="mm2-results__primary-desc">{t(`majorMatch.major.${result.primaryMajorSlug}.description`)}</p>
      </section>

      {!readOnly && (
        <section className="mm2-results__roadmap">
          <h2 className="mm2-results__section-title">
            {t('majorMatch.results.roadmapSectionTitle', 'Your personalized roadmap')}
          </h2>
          <div className="mm2-results__roadmap-body">
            <RoadmapTab freshSince={freshSince} />
          </div>
        </section>
      )}

      {result.altMajorSlugs?.length > 0 && (
        <section className="mm2-results__alts">
          <h2 className="mm2-results__section-title">{t('majorMatch.results.altLabel', 'Also worth exploring')}</h2>
          <div className="mm2-results__alt-grid">
            {result.altMajorSlugs.map((slug) => (
              <div key={slug} className="mm2-results__alt-card">
                {t(`majorMatch.major.${slug}.name`)}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mm2-results__dimensions">
        <h2 className="mm2-results__section-title">{t('majorMatch.results.dimensionsTitle', 'Your dimension breakdown')}</h2>
        <p className="mm2-results__section-subtitle">
          {t('majorMatch.results.dimensionsSubtitle', 'How your {{total}} points spread across the six dimensions.', { total })}
        </p>
        <div className="mm2-results__bars">
          {MM2_DIMENSION_KEYS.map((key) => {
            const score = result.dimensionScores?.[key] ?? 0;
            const pct = total > 0 ? Math.round((score / total) * 100) : 0;
            return (
              <div key={key} className="mm2-results__bar-row">
                <span className="mm2-results__bar-label">{t(`majorMatch.dimension.${key}.label`)}</span>
                <div className="mm2-results__bar-track">
                  <div className="mm2-results__bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="mm2-results__bar-value">{score}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mm2-results__actions">
        {onBack && (
          <button type="button" className="mm2__btn" onClick={onBack}>
            <ArrowLeft size={14} />
            {t('majorMatch.results.backCta', 'Back to overview')}
          </button>
        )}
        {!readOnly && (
          requiresEnrollment ? (
            <button type="button" className="mm2__btn mm2__btn--secondary" onClick={onUnlock}>
              <Lock size={14} />
              {t('studentHub.psychometric.unlockUnlimited', 'Unlock unlimited matches')}
            </button>
          ) : (
            <button type="button" className="mm2__btn mm2__btn--primary" onClick={onRetake}>
              <RotateCcw size={14} />
              {t('majorMatch.results.retakeCta', 'Retake the assessment')}
            </button>
          )
        )}
      </div>

      {requiresEnrollment && (
        <MajorMatchUpsell message={access?.promptMessage} onUnlock={onUnlock} />
      )}
    </div>
  );
};
