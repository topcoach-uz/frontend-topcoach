import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import {
  MM3Field,
  MM3FieldsQuestion,
  MM3MultiQuestion,
  MM3Question,
  MM3ScaleQuestion,
  MM3SingleQuestion,
  mm3FieldKey,
  mm3QuestionKey,
} from '../mm3-content';

/** Shared answer controls for all Major Match question types. */

// ─────────────────────────────────────────────────────────────────────────
// Answer shapes
// ─────────────────────────────────────────────────────────────────────────

export type MM3SingleAnswer = number | { option: number; other: string };
export type MM3MultiAnswer = number[];
export type MM3ScaleAnswer = number;
export type MM3FieldsAnswer = Record<string, string>;
export type MM3Answer =
  | MM3SingleAnswer
  | MM3MultiAnswer
  | MM3ScaleAnswer
  | MM3FieldsAnswer
  | undefined;

/** True when the question has enough of an answer for Continue to enable. */
export const isMM3Answered = (q: MM3Question, a: MM3Answer): boolean => {
  switch (q.type) {
    case 'single':
      if (typeof a === 'number') return a >= 0 && a < q.optionCount && !(q.slug === 'grade' && a === q.optionCount - 1);
      return q.slug === 'grade' && !!a && typeof a === 'object' && !Array.isArray(a) &&
        'option' in a && a.option === q.optionCount - 1 && 'other' in a &&
        typeof a.other === 'string' && a.other.trim().length > 0;
    case 'scale':
      return typeof a === 'number' && a >= q.min && a <= q.max;
    case 'multi':
      return Array.isArray(a) && a.length > 0;
    case 'fields': {
      if (q.requiredFields.length === 0) return true;
      if (!a || typeof a !== 'object' || Array.isArray(a)) return false;
      const v = a as MM3FieldsAnswer;
      // Selects gate Continue; free text never does (mirrors the prototype).
      return q.requiredFields.every((k) => typeof v[k] === 'string' && v[k].trim().length > 0);
    }
    default:
      return false;
  }
};

const keyActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

// ─────────────────────────────────────────────────────────────────────────
// single — the first bachelor question also accepts a specified Other answer
// ─────────────────────────────────────────────────────────────────────────

export const MM3Single: FC<{
  question: MM3SingleQuestion;
  value: MM3SingleAnswer | undefined;
  onChange: (v: MM3SingleAnswer) => void;
}> = ({ question, value, onChange }) => {
  const { t } = useTranslation();
  const root = mm3QuestionKey(question.slug);

  const isGrade = question.slug === 'grade';
  const otherIndex = question.optionCount - 1;
  const selectedIndex = typeof value === 'number' ? value : value?.option;
  const otherSelected = isGrade && selectedIndex === otherIndex;
  const select = (i: number) => onChange(isGrade && i === otherIndex
    ? { option: i, other: typeof value === 'object' ? value.other : '' }
    : i);

  return (
    <>
      <div className="mm2-runner__options" role="radiogroup" aria-label={t(`${root}.title`)}>
        {Array.from({ length: question.optionCount }, (_, i) => {
          const selected = selectedIndex === i;
          const hint = question.optionHints.includes(i) ? t(`${root}.hint.${i}`) : null;
          return (
            <div
              key={i}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              className={`mm2-runner__option ${selected ? 'is-selected' : ''} ${isGrade && i === otherIndex ? 'mm3-option--other' : ''}`}
              onClick={() => select(i)}
              onKeyDown={keyActivate(() => select(i))}
            >
              <span className="mm2-runner__option-dot" aria-hidden="true" />
              <span className="mm2-runner__option-label">
                {t(`${root}.opt.${i}`)}
                {hint && <small className="mm3-hint">{hint}</small>}
              </span>
            </div>
          );
        })}
      </div>
      {otherSelected && (
        <div className="mm3-other-detail">
          <label htmlFor="mm3-grade-other">{t('majorMatch3.q.grade.other.label', 'Please specify')}</label>
          <input
            id="mm3-grade-other"
            type="text"
            value={typeof value === 'object' ? value.other : ''}
            placeholder={t('majorMatch3.q.grade.other.ph', 'Tell us where you are in your studies')}
            onChange={(e) => onChange({ option: otherIndex, other: e.target.value })}
            autoFocus
          />
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// multi — capped; at the cap, unselected options go disabled rather than
// silently ignoring the click (the prototype just no-oped, which reads broken)
// ─────────────────────────────────────────────────────────────────────────

export const MM3Multi: FC<{
  question: MM3MultiQuestion;
  value: MM3MultiAnswer | undefined;
  onChange: (v: MM3MultiAnswer) => void;
}> = ({ question, value, onChange }) => {
  const { t } = useTranslation();
  const root = mm3QuestionKey(question.slug);
  const selected = value ?? [];
  const atCap = selected.length >= question.max;

  const toggle = (i: number) => {
    if (selected.includes(i)) onChange(selected.filter((x) => x !== i));
    else if (!atCap) onChange([...selected, i]);
  };

  return (
    <>
      <div className="mm2-runner__options" role="group">
        {Array.from({ length: question.optionCount }, (_, i) => {
          const isOn = selected.includes(i);
          const blocked = atCap && !isOn;
          const hint = question.optionHints.includes(i) ? t(`${root}.hint.${i}`) : null;
          return (
            <div
              key={i}
              role="checkbox"
              aria-checked={isOn}
              aria-disabled={blocked}
              tabIndex={blocked ? -1 : 0}
              className={`mm2-runner__option mm3-option--multi ${isOn ? 'is-selected' : ''} ${
                blocked ? 'is-blocked' : ''
              }`}
              onClick={() => !blocked && toggle(i)}
              onKeyDown={keyActivate(() => !blocked && toggle(i))}
            >
              <span className="mm2-runner__option-dot mm3-dot--square" aria-hidden="true" />
              <span className="mm2-runner__option-label">
                {t(`${root}.opt.${i}`)}
                {hint && <small className="mm3-hint">{hint}</small>}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mm3-count" aria-live="polite">
        {t('majorMatch3.nav.selectUpTo', 'Select up to {{max}}. Selected: {{count}}', {
          max: question.max,
          count: selected.length,
        })}
      </p>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// scale — 1..5 with end labels
// ─────────────────────────────────────────────────────────────────────────

export const MM3Scale: FC<{
  question: MM3ScaleQuestion;
  value: MM3ScaleAnswer | undefined;
  onChange: (v: MM3ScaleAnswer) => void;
}> = ({ question, value, onChange }) => {
  const { t } = useTranslation();
  const root = mm3QuestionKey(question.slug);
  const steps = Array.from(
    { length: question.max - question.min + 1 },
    (_, i) => question.min + i,
  );

  return (
    <div className="mm3-scale">
      <div className="mm3-scale__ends">
        <span>{t(`${root}.low`)}</span>
        <span>{t(`${root}.high`)}</span>
      </div>
      <div className="mm3-scale__row" role="radiogroup">
        {steps.map((n) => {
          const selected = value === n;
          return (
            <div
              key={n}
              role="radio"
              aria-checked={selected}
              aria-label={String(n)}
              tabIndex={0}
              className={`mm2-runner__option mm3-scale__step ${selected ? 'is-selected' : ''}`}
              onClick={() => onChange(n)}
              onKeyDown={keyActivate(() => onChange(n))}
            >
              {n}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// fields — grouped select / text
// ─────────────────────────────────────────────────────────────────────────

const MM3FieldRow: FC<{
  slug: string;
  field: MM3Field;
  required: boolean;
  value: string;
  onChange: (v: string) => void;
}> = ({ slug, field, required, value, onChange }) => {
  const { t } = useTranslation();
  const root = mm3FieldKey(slug, field.key);
  const id = `mm3-${slug}-${field.key}`;

  return (
    <div className="mm3-field">
      <label className="mm3-field__label" htmlFor={id}>
        {t(`${root}.label`)}
      </label>
      {field.kind === 'select' ? (
        <select
          id={id}
          className="mm3-field__control"
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{t('majorMatch3.field.choose', 'Choose…')}</option>
          {Array.from({ length: field.optionCount ?? 0 }, (_, i) => {
            const label = t(`${root}.opt.${i}`);
            // Store the label, not the index — the LLM reads these verbatim
            // and an index would be meaningless in the prompt.
            return (
              <option key={i} value={label}>
                {label}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          id={id}
          type="text"
          className="mm3-field__control"
          value={value}
          placeholder={field.hasPlaceholder ? t(`${root}.ph`) : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

export const MM3Fields: FC<{
  question: MM3FieldsQuestion;
  value: MM3FieldsAnswer | undefined;
  onChange: (v: MM3FieldsAnswer) => void;
}> = ({ question, value, onChange }) => {
  const current = value ?? {};
  return (
    <div className="mm3-fields">
      {question.fields.map((f) => (
        <MM3FieldRow
          key={f.key}
          slug={question.slug}
          field={f}
          required={question.requiredFields.includes(f.key)}
          value={current[f.key] ?? ''}
          onChange={(v) => onChange({ ...current, [f.key]: v })}
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────────────────────────────────

export const MM3QuestionInput: FC<{
  question: MM3Question;
  value: MM3Answer;
  onChange: (v: MM3Answer) => void;
}> = ({ question, value, onChange }) => {
  switch (question.type) {
    case 'single':
      return (
        <MM3Single
          question={question}
          value={value as MM3SingleAnswer | undefined}
          onChange={onChange}
        />
      );
    case 'multi':
      return (
        <MM3Multi
          question={question}
          value={value as MM3MultiAnswer | undefined}
          onChange={onChange}
        />
      );
    case 'scale':
      return (
        <MM3Scale
          question={question}
          value={value as MM3ScaleAnswer | undefined}
          onChange={onChange}
        />
      );
    case 'fields':
      return (
        <MM3Fields
          question={question}
          value={value as MM3FieldsAnswer | undefined}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
};
