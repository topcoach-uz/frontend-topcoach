import { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMm3QuestionMap, MM3_PARTS, mm3FieldKey, mm3QuestionKey } from '../mm3-content';
import { buildMm3Payload } from '../mm3-payload';
import { isMM3Answered, type MM3Answer } from './MM3Inputs';

interface MM3ReviewProps {
  targetDegree?: string | null;
  answers: Record<string, MM3Answer>;
  submitting: boolean;
  onEdit: (questionIndex: number, part: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export const MM3Review = ({ targetDegree, answers, submitting, onEdit, onBack, onSubmit }: MM3ReviewProps) => {
  const { t } = useTranslation();
  const questions = useMemo(() => getMm3QuestionMap(targetDegree), [targetDegree]);
  const payload = useMemo(() => buildMm3Payload(answers, t, targetDegree), [answers, t, targetDegree]);
  const complete = [...questions.values()].every((question) => isMM3Answered(question, answers[question.slug]));

  return (
    <section className="mm3-review" aria-labelledby="mm3-review-title">
      <header>
        <h1 id="mm3-review-title">{t('majorMatch3.review.title', 'Check your answers')}</h1>
        <p>{t('majorMatch3.review.subtitle', 'Review your details before generating matches.')}</p>
      </header>
      {MM3_PARTS.map((part) => {
        const title = targetDegree === 'master' && part.index === 1
          ? t('majorMatch3.part.academic.masterLabel', 'Graduate profile')
          : t(`majorMatch3.part.${part.slug}.label`);
        return (
          <section key={part.slug} className="mm3-review__section">
            <div className="mm3-review__section-head">
              <h2>{title}</h2>
              <button type="button" className="mm2__btn" onClick={() => onEdit(part.questionIds[0] - 1, part.index)}
                aria-label={t('majorMatch3.review.editSection', 'Edit {{section}}', { section: title })}>
                <Pencil size={16} aria-hidden="true" />{t('common.edit', 'Edit')}
              </button>
            </div>
            <div className="mm3-review__summary">
              {part.questionIds.slice(0, 3).map((id) => {
                const question = questions.get(id)!;
                const value = payload[question.slug];
                const displayValue = Array.isArray(value) ? value.join(', ')
                  : value && typeof value === 'object' ? Object.values(value).join(' · ')
                  : value == null ? t('majorMatch3.review.unanswered', 'Not answered') : String(value);
                return <p key={id}>{displayValue}</p>;
              })}
            </div>
            <details className="mm3-review__details">
              <summary>{t('majorMatch3.review.allAnswers', 'Review all {{count}} answers', { count: part.questionIds.length })}</summary>
              <dl>
                {part.questionIds.map((id) => {
                  const question = questions.get(id)!;
                  const value = payload[question.slug];
                  const displayValue = Array.isArray(value) ? value.join(', ')
                    : value && typeof value === 'object' ? Object.entries(value).map(([key, answer]) => `${t(`${mm3FieldKey(question.slug, key)}.label`)}: ${answer}`).join(' · ')
                    : value == null ? t('majorMatch3.review.unanswered', 'Not answered') : String(value);
                  return (
                    <div key={id} className="mm3-review__answer">
                      <dt>{id}. {t(`${mm3QuestionKey(question.slug)}.title`)}</dt>
                      <dd>{displayValue}</dd>
                      <button type="button" onClick={() => onEdit(id - 1, part.index)}
                        aria-label={t('majorMatch3.review.editQuestion', 'Edit question {{number}}', { number: id })}>
                        <Pencil size={16} aria-hidden="true" />{t('common.edit', 'Edit')}
                      </button>
                    </div>
                  );
                })}
              </dl>
            </details>
          </section>
        );
      })}
      {!complete && <p role="status">{t('majorMatch3.review.missing', 'A few answers are still missing. Continue to complete them before generating your matches.')}</p>}
      <div className="mm3-review__actions">
        <button type="button" className="mm2__btn" onClick={onBack} disabled={submitting}>
          <ArrowLeft size={16} />{t('majorMatch3.review.back', 'Back to final question')}
        </button>
        <button type="button" className="mm2__btn mm2__btn--primary" onClick={onSubmit} disabled={submitting}>
          {complete ? t('majorMatch3.review.generate', 'Generate my matches') : t('majorMatch3.review.complete', 'Complete answers')}
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
};
