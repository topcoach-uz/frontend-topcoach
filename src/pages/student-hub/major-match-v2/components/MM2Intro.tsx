import React from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Play, Eye, Lock } from 'lucide-react';
import { MajorMatchUpsell } from '../../psychometric-assessment/components/MajorMatchUpsell';
import type { MajorMatchAccessStatus, MajorMatchResult } from '../../../../app/services/student-hub/majorMatchApi';
import { MM2_TOTAL_QUESTIONS, MM2_TOTAL_SECTIONS } from '../content';

interface MM2IntroProps {
  readOnly?: boolean;
  latest: MajorMatchResult | null | undefined;
  access?: MajorMatchAccessStatus;
  hasDraft: boolean;
  onStart: () => void;
  onViewResults: () => void;
  onUnlock: () => void;
}

export const MM2Intro: React.FC<MM2IntroProps> = ({
  readOnly = false,
  latest,
  access,
  hasDraft,
  onStart,
  onViewResults,
  onUnlock,
}) => {
  const { t } = useTranslation();

  const requiresEnrollment = !readOnly && !!access && !access.canStart && access.requiresCommunityEnrollment;

  if (readOnly) {
    if (!latest) {
      return (
        <div className="mm2__state">
          <p className="mm2__state-text">
            {t('studentHub.psychometric.counselorEmpty', "This student hasn't completed the AI Major Match assessment yet.")}
          </p>
        </div>
      );
    }
    return (
      <div className="mm2__intro">
        <button type="button" className="mm2__btn mm2__btn--primary" onClick={onViewResults}>
          <Eye size={15} />
          {t('majorMatch.intro.viewResultsCta', 'View your results')}
        </button>
      </div>
    );
  }

  return (
    <div className="mm2__intro">
      <div className="mm2__eyebrow">{t('majorMatch.intro.eyebrow', 'TOP300 Majors')}</div>
      <h1 className="mm2__title">{t('majorMatch.intro.title', 'Find the major that actually fits you')}</h1>
      <p className="mm2__subtitle">
        {t('majorMatch.intro.subtitle', 'Answer {{total}} short questions about how you think, learn, and want to work. Takes about 5 minutes.', {
          total: MM2_TOTAL_QUESTIONS,
        })}
      </p>

      <div className="mm2__stats">
        <div className="mm2__stat">
          <div className="mm2__stat-value">{t('majorMatch.intro.questionCount', '{{total}} questions', { total: MM2_TOTAL_QUESTIONS })}</div>
        </div>
        <div className="mm2__stat">
          <div className="mm2__stat-value">{t('majorMatch.intro.sectionCount', '6 sections', { total: MM2_TOTAL_SECTIONS })}</div>
        </div>
        <div className="mm2__stat">
          <div className="mm2__stat-value">{t('majorMatch.intro.estimatedTime', 'About 5 minutes')}</div>
        </div>
      </div>

      {latest && (
        <div className="mm2__notice">{t('majorMatch.intro.completedNotice', "You've already completed this assessment.")}</div>
      )}
      {!latest && hasDraft && (
        <div className="mm2__notice">{t('majorMatch.intro.draftRestoredNotice', 'We restored your in-progress answers from last time.')}</div>
      )}

      <div className="mm2__cta-row">
        {latest && (
          <button type="button" className="mm2__btn mm2__btn--primary" onClick={onViewResults}>
            <Eye size={15} />
            {t('majorMatch.intro.viewResultsCta', 'View your results')}
          </button>
        )}

        {requiresEnrollment ? (
          <button type="button" className="mm2__btn mm2__btn--secondary" onClick={onUnlock}>
            <Lock size={14} />
            {t('studentHub.psychometric.unlockUnlimited', 'Unlock unlimited matches')}
          </button>
        ) : (
          (!latest || (access?.canStart ?? true)) && (
            <button
              type="button"
              className={latest ? 'mm2__btn mm2__btn--secondary' : 'mm2__btn mm2__btn--primary'}
              onClick={onStart}
            >
              {hasDraft ? <RotateCcw size={15} /> : <Play size={15} />}
              {latest
                ? t('majorMatch.intro.retakeCta', 'Retake the assessment')
                : hasDraft
                  ? t('majorMatch.intro.resumeCta', 'Continue where you left off')
                  : t('majorMatch.intro.startCta', 'Start the assessment')}
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
