import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Lock, ArrowRight, Check } from 'lucide-react';

import { MajorMatchUpsell } from '../../psychometric-assessment/components/MajorMatchUpsell';
import type { MajorMatchAccessStatus } from '../../../../app/services/student-hub/majorMatchApi';
import { MM3_PARTS, MM3_TOTAL_PARTS, MM3_TOTAL_QUESTIONS } from '../mm3-content';
import '../mm3-runner.scss';

/**
 * MM3 intro screen — same eyebrow/title/stat-row/CTA shape as `MM2Intro`,
 * with three part cards (one per `MM3_PARTS` entry) below the stats.
 *
 * All chrome reuses the existing `mm2__*` classes from
 * `MajorMatchV2Page.scss`; only the part cards are new (`mm3-intro__*`,
 * defined in `mm3-runner.scss`). Content only was borrowed from the
 * prototype — nothing visual.
 */

interface MM3IntroProps {
  readOnly?: boolean;
  /**
   * 'public' is the signed-out lead-magnet page, which shows majors ONLY —
   * universities sit behind signup. The in-app copy promises "the universities
   * to reach them", which that page does not deliver, so the headline swaps
   * rather than the component being forked.
   */
  variant?: 'inApp' | 'public';
  hasReport: boolean;
  access?: MajorMatchAccessStatus;
  hasDraft: boolean;
  /**
   * Per-part completion, index-aligned with `MM3_PARTS`. Derived from the
   * answers the localStorage draft restores — MM3 persists nothing partial
   * server-side, so this is same-device only.
   */
  partsCompleted?: boolean[];
  onStart: () => void;
  onViewResults: () => void;
  onUnlock: () => void;
}

export const MM3Intro: React.FC<MM3IntroProps> = ({
  readOnly = false,
  variant = 'inApp',
  hasReport,
  access,
  hasDraft,
  partsCompleted,
  onStart,
  onViewResults,
  onUnlock,
}) => {
  const { t } = useTranslation();

  const requiresEnrollment = !readOnly && !!access && !access.canStart && access.requiresCommunityEnrollment;

  /* Progress across the three parts. `doneCount === MM3_TOTAL_PARTS` means
     every question is answered but nothing has been submitted yet — the
     student still has to run the analysis, hence "See My Match". */
  const partDone = partsCompleted ?? [];
  const doneCount = partDone.filter(Boolean).length;
  const inProgress = doneCount > 0 && doneCount < MM3_TOTAL_PARTS;
  /* Minutes left = the parts still outstanding, so the number shrinks as
     they go rather than quoting one fixed figure at every stage. */
  const minutesLeft = MM3_PARTS.reduce(
    (sum, part, i) => (partDone[i] ? sum : sum + part.estMinutes),
    0,
  );

  if (readOnly) {
    if (!hasReport) {
      return (
        <div className="mm2__state">
          <p className="mm2__state-text">
            {t(
              'studentHub.psychometric.counselorEmpty',
              "This student hasn't completed the AI Major Match assessment yet.",
            )}
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
      <div className="mm2__eyebrow">{t('majorMatch3.intro.eyebrow', 'YOUR MATCH STARTS HERE')}</div>
      <h1 className="mm2__title">
        {variant === 'public'
          ? t('majorMatch3.intro.publicTitle', 'Which major actually fits you?')
          : t('majorMatch3.intro.title', 'This is where the guessing stops')}
      </h1>
      <p className="mm2__subtitle">
        {variant === 'public'
          ? t(
              'majorMatch3.intro.publicSubtitle',
              'Answer {{total}} questions about your academics, interests and preferences. You get your best-fit majors free. No account needed to start.',
              { total: MM3_TOTAL_QUESTIONS },
            )
          : t(
              'majorMatch3.intro.subtitle',
              "Every answer you give below feeds directly into your match — nothing generic, nothing recycled from someone else's profile.",
            )}
      </p>

      <div className="mm2__stats">
        {/* Order mirrors the design: time first, then scope. */}
        <div className="mm2__stat">
          <div className="mm2__stat-value">{t('majorMatch3.intro.estimatedTime', '10 minutes')}</div>
        </div>
        <div className="mm2__stat">
          <div className="mm2__stat-value">
            {t('majorMatch3.intro.questionCount', '{{total}} questions', { total: MM3_TOTAL_QUESTIONS })}
          </div>
        </div>
        <div className="mm2__stat">
          <div className="mm2__stat-value">
            {t('majorMatch3.intro.partCount', '{{total}} parts', { total: MM3_TOTAL_PARTS })}
          </div>
        </div>
      </div>

      <div className="mm3-intro__parts">
        {MM3_PARTS.map((part, i) => {
          const done = !!partDone[i];
          return (
            <div
              key={part.slug}
              className={`mm3-intro__part-card${done ? ' mm3-intro__part-card--done' : ''}`}
            >
              <span className="mm3-intro__part-roman">
                {part.roman} · {t(`majorMatch3.part.${part.slug}.label`)}
              </span>
              <h3 className="mm3-intro__part-title">{t(`majorMatch3.part.${part.slug}.title`)}</h3>
              <p className="mm3-intro__part-desc">{t(`majorMatch3.part.${part.slug}.desc`)}</p>
              {done ? (
                <span className="mm3-intro__part-done">
                  <Check size={13} />
                  {t('majorMatch3.intro.partCompleted', 'Completed')}
                </span>
              ) : (
                <span className="mm3-intro__part-count">
                  {t('majorMatch3.intro.partMeta', '{{count}} questions · ~{{minutes}} min', {
                    count: part.questionIds.length,
                    minutes: part.estMinutes,
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {hasReport && (
        <div className="mm2__notice">
          {t('majorMatch3.intro.completedNotice', "You've already completed this assessment.")}
        </div>
      )}
      {!hasReport && hasDraft && (
        <div className="mm2__notice">
          {t('majorMatch.intro.draftRestoredNotice', 'We restored your in-progress answers from last time.')}
        </div>
      )}

      <div className="mm2__cta-row">
        {hasReport && (
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
          (!hasReport || (access?.canStart ?? true)) && (
            <button
              type="button"
              className={hasReport ? 'mm2__btn mm2__btn--secondary' : 'mm2__btn mm2__btn--primary'}
              onClick={onStart}
            >
              {hasReport
                ? t('majorMatch3.intro.retakeCta', 'Retake the assessment')
                : doneCount === MM3_TOTAL_PARTS
                  ? t('majorMatch3.intro.seeMatchCta', 'See My Match')
                  : inProgress
                    ? t('majorMatch3.intro.continueCta', 'Continue — {{done}}/{{total}} done', {
                        done: doneCount,
                        total: MM3_TOTAL_PARTS,
                      })
                    : t('majorMatch3.intro.startCta', 'Start My Match')}
              <ArrowRight size={15} />
            </button>
          )
        )}
      </div>

      {inProgress && !hasReport && !requiresEnrollment && (
        <p className="mm3-intro__reminder">
          {t(
            'majorMatch3.intro.reminder',
            'No rush — pick up right where you stopped, in about {{minutes}} minutes.',
            { minutes: minutesLeft },
          )}
        </p>
      )}

      {requiresEnrollment && <MajorMatchUpsell message={access?.promptMessage} onUnlock={onUnlock} />}
    </div>
  );
};
