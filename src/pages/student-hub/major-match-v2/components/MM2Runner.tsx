import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  MM2_QUESTION_ORDER,
  MM2_OPTION_LETTERS,
  MM2_TOTAL_SECTIONS,
  isShortAnswer,
  sectionIndexForQuestion,
} from '../content';

interface MM2RunnerProps {
  currentIndex: number;
  answers: Record<number, number>;
  shortAnswers: Record<number, string>;
  submitting: boolean;
  onSelectOption: (questionId: number, optionIndex: number) => void;
  onShortAnswerChange: (questionId: number, text: string) => void;
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
}

export const MM2Runner: React.FC<MM2RunnerProps> = ({
  currentIndex,
  answers,
  shortAnswers,
  submitting,
  onSelectOption,
  onShortAnswerChange,
  onNext,
  onBack,
  onExit,
}) => {
  const { t } = useTranslation();
  const total = MM2_QUESTION_ORDER.length;
  const questionId = MM2_QUESTION_ORDER[currentIndex];
  const isLast = currentIndex === total - 1;
  const isSA = isShortAnswer(questionId);
  const sectionIdx = sectionIndexForQuestion(questionId);
  const progressPct = ((currentIndex + 1) / total) * 100;

  return (
    <div className="mm2-runner">
      <div className="mm2-runner__progress">
        <div className="mm2-runner__progress-top">
          <span className="mm2-runner__section-label">
            {t(`majorMatch.section.${sectionIdx}.name`)} · {t('majorMatch.progress.sectionLabel', 'Section {{current}} of {{totalSections}}', { current: sectionIdx + 1, totalSections: MM2_TOTAL_SECTIONS })}
          </span>
          <button type="button" className="mm2-runner__exit" onClick={onExit}>
            {t('majorMatch.nav.exit', 'Save & exit')}
          </button>
        </div>
        <div className="mm2-runner__bar">
          <div className="mm2-runner__bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="mm2-runner__count">
          {t('majorMatch.progress.questionLabel', 'Question {{current}} of {{total}}', { current: currentIndex + 1, total })}
        </span>
      </div>

      <div className="mm2-runner__card">
        <h2 className="mm2-runner__question">{t(`majorMatch.question.${questionId}.text`)}</h2>

        {isSA ? (
          <div className="mm2-runner__sa">
            <textarea
              className="mm2-runner__textarea"
              rows={4}
              value={shortAnswers[questionId] || ''}
              onChange={(e) => onShortAnswerChange(questionId, e.target.value)}
              placeholder={t('majorMatch.shortAnswer.placeholder', 'Type your answer here...') as string}
              maxLength={800}
            />
            <span className="mm2-runner__sa-hint">
              {t('majorMatch.shortAnswer.optionalHint', "Optional — this won't affect your results.")}
            </span>
          </div>
        ) : (
          <div className="mm2-runner__options" role="radiogroup">
            {MM2_OPTION_LETTERS.map((letter, idx) => {
              const selected = answers[questionId] === idx;
              return (
                <div
                  key={letter}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  className={`mm2-runner__option ${selected ? 'is-selected' : ''}`}
                  onClick={() => onSelectOption(questionId, idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectOption(questionId, idx);
                    }
                  }}
                >
                  <span className="mm2-runner__option-dot" aria-hidden="true" />
                  <span className="mm2-runner__option-label">
                    {t(`majorMatch.question.${questionId}.option.${letter}.text`)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mm2-runner__actions">
          <button
            type="button"
            className="mm2-runner__btn"
            onClick={onBack}
            disabled={currentIndex === 0}
          >
            <ArrowLeft size={15} />
            {t('majorMatch.nav.back', 'Back')}
          </button>
          <button
            type="button"
            className="mm2-runner__btn mm2-runner__btn--primary"
            onClick={onNext}
            disabled={submitting}
          >
            {isLast ? <Check size={15} /> : <ArrowRight size={15} />}
            {isLast ? t('majorMatch.nav.submit', 'See my results') : t('majorMatch.nav.next', 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
};
