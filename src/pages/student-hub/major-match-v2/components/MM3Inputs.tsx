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

/**
 * The three answer types the MM2 runner never had: capped multi-select,
 * 1–5 scale, and grouped fields. Plus `single`, which reuses the existing
 * radio pattern verbatim so old and new questions are visually identical.
 *
 * ⚠️ STYLING: content came from the prototype, nothing visual did. These use
 * the platform's own tokens ($mm2-cream / $mm2-brand / Iowan) and mirror
 * `MM2Runner`'s option markup — same dot, same is-selected, same keyboard
 * handling. Do not port the prototype's crimson/Fraunces look.
 */

// ─────────────────────────────────────────────────────────────────────────
// Answer shapes
// ─────────────────────────────────────────────────────────────────────────

export type MM3SingleAnswer = number;
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
    case 'scale':
      return typeof a === 'number';
    case 'multi':
      return Array.isArray(a) && a.length > 0;
    case 'fields': {
      if (!a || typeof a !== 'object' || Array.isArray(a)) return false;
      const v = a as MM3FieldsAnswer;
      // Selects gate Continue; free text never does (mirrors the prototype).
      return q.requiredFields.every((k) => Boolean(v[k]));
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
// single — same markup as MM2Runner so the two sets look identical
// ─────────────────────────────────────────────────────────────────────────

export const MM3Single: FC<{
  question: MM3SingleQuestion;
  value: MM3SingleAnswer | undefined;
  onChange: (v: MM3SingleAnswer) => void;
}> = ({ question, value, onChange }) => {
  const { t } = useTranslation();
  const root = mm3QuestionKey(question.slug);

  return (
    <div className="mm2-runner__options" role="radiogroup">
      {Array.from({ length: question.optionCount }, (_, i) => {
        const selected = value === i;
        const hint = question.optionHints.includes(i) ? t(`${root}.hint.${i}`) : null;
        return (
          <div
            key={i}
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            className={`mm2-runner__option ${selected ? 'is-selected' : ''}`}
            onClick={() => onChange(i)}
            onKeyDown={keyActivate(() => onChange(i))}
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
      <div className="mm3-scale__ends">
        <span>{t(`${root}.low`)}</span>
        <span>{t(`${root}.high`)}</span>
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
