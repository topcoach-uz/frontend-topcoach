import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

import {
  MM3_PARTS,
  MM3_QUESTION_ORDER,
  getMm3QuestionMap,
  MM3_TOTAL_PARTS,
  MM3_TOTAL_QUESTIONS,
  mm3QuestionKey,
} from '../mm3-content';
import { MM3Answer, MM3QuestionInput, isMM3Answered } from './MM3Inputs';
import '../mm3-inputs.scss';
import '../mm3-runner.scss';

/** The shared 30-question runner across three assessment parts. */

interface MM3RunnerProps {
  targetDegree?: string | null;
  currentIndex: number;
  answers: Record<string, MM3Answer>;
  prefilledSlugs: readonly string[];
  submitting: boolean;
  onAnswer: (slug: string, value: MM3Answer) => void;
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
  showSaveExit?: boolean;
  onReturnToReview?: () => void;
}

export const MM3Runner: React.FC<MM3RunnerProps> = ({
  targetDegree,
  currentIndex,
  answers,
  prefilledSlugs,
  submitting,
  onAnswer,
  onNext,
  onBack,
  onExit,
  showSaveExit = true,
  onReturnToReview,
}) => {
  const { t } = useTranslation();

  const questionId = MM3_QUESTION_ORDER[currentIndex];
  const question = getMm3QuestionMap(targetDegree).get(questionId);

  // Out-of-range index (shouldn't happen, but never crash the runner over it).
  if (!question) return null;

  const isLast = currentIndex === MM3_TOTAL_QUESTIONS - 1;
  const part = MM3_PARTS[question.part - 1];
  const withinPartIndex = part.questionIds.indexOf(question.id) + 1;
  const withinPartTotal = part.questionIds.length;
  const partProgressPct = (withinPartIndex / withinPartTotal) * 100;

  const root = mm3QuestionKey(question.slug);
  const value = answers[question.slug];
  const answered = isMM3Answered(question, value);
  const isPrefilled = prefilledSlugs.includes(question.slug);

  return (
    <div className="mm2-runner mm3-runner">
      <div className="mm2-runner__progress">
        <div className="mm2-runner__progress-top">
          <span className="mm2-runner__section-label">
            {t(`majorMatch3.part.${part.slug}.title`)} ·{' '}
            {t('majorMatch3.nav.partLabel', 'Part {{current}} of {{total}}', {
              current: part.index,
              total: MM3_TOTAL_PARTS,
            })}
          </span>
          <span className="mm2-runner__count">
            {t('majorMatch3.nav.progress', 'Question {{current}} of {{total}}', {
              current: withinPartIndex,
              total: withinPartTotal,
            })}
          </span>
          {showSaveExit && (
            <button type="button" className="mm2-runner__exit" onClick={onExit}>
              {t('majorMatch.nav.exit', 'Save & exit')}
            </button>
          )}
        </div>
        <div className="mm2-runner__bar">
          <div className="mm2-runner__bar-fill" style={{ width: `${partProgressPct}%` }} />
        </div>
      </div>

      <div className="mm2-runner__card">
        <div className="mm3-runner__question-head">
          <h2 className="mm2-runner__question">{t(`${root}.title`)}</h2>
          {question.hasSub && <p className="mm3-runner__sub">{t(`${root}.sub`)}</p>}
        </div>

        {isPrefilled && <div className="mm3-prefill-notice">{t('majorMatch3.prefill.notice')}</div>}

        <MM3QuestionInput
          question={question}
          value={value}
          onChange={(v) => onAnswer(question.slug, v)}
        />

        <div className="mm2-runner__actions">
          <button
            type="button"
            className="mm2-runner__btn"
            onClick={onBack}
            disabled={currentIndex === 0}
          >
            <ArrowLeft size={15} />
            {t('majorMatch3.nav.back')}
          </button>
          <button
            type="button"
            className="mm2-runner__btn mm2-runner__btn--primary"
            onClick={onNext}
            disabled={!answered || submitting}
          >
            {isLast ? t('majorMatch3.nav.analyze') : t('majorMatch3.nav.continue')}
            {isLast ? <Check size={15} /> : <ArrowRight size={15} />}
          </button>
        </div>

        {onReturnToReview && (
          <button type="button" className="mm3-runner__review-return" onClick={onReturnToReview}>
            {t('majorMatch3.review.return', 'Return to review')}
          </button>
        )}
      </div>
    </div>
  );
};
