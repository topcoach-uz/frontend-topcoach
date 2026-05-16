import { X } from 'lucide-react';
import { useState } from 'react';

import styles from '../Profile.module.scss';
import type { Option } from '../_vocab';

type SingleProps<T extends string> = {
  mode: 'single';
  options: Option<T>[];
  value: T | null;
  onChange: (next: T | null) => void;
  disabled?: boolean;
  allowOther?: false;
};

type MultiProps = {
  mode: 'multi';
  options: Option<string>[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /** When true, an "Add other" inline input appears under the chips. */
  allowOther?: boolean;
  /** Optional cap. Extra clicks are ignored once reached. */
  max?: number;
};

type Props<T extends string> = SingleProps<T> | MultiProps;

/**
 * Editorial chip group. Single OR multi-select via `mode`.
 *
 * - Single: clicking the active chip clears it (returns null).
 * - Multi : clicking toggles; respects `max`; supports "Add other"
 *           free-form additions that are tracked alongside the
 *           closed-list option ids in `value`.
 */
export function ChipGroup<T extends string>(props: Props<T>) {
  if (props.mode === 'single') {
    return <SingleChipGroup {...props} />;
  }
  return <MultiChipGroup {...props} />;
}

function SingleChipGroup<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: SingleProps<T>) {
  return (
    <div className={styles.chipGroup} role="radiogroup">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(active ? null : o.id)}
            className={`${styles.chip} ${active ? styles.chipActive : ''}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiChipGroup({
  options,
  value,
  onChange,
  disabled,
  allowOther,
  max,
}: MultiProps) {
  const known = new Set(options.map((o) => o.id));
  const free = value.filter((v) => !known.has(v));
  const [pending, setPending] = useState('');

  const toggle = (id: string) => {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (max && value.length >= max) return;
      onChange([...value, id]);
    }
  };

  const addFree = () => {
    const v = pending.trim();
    if (!v) return;
    if (value.includes(v)) {
      setPending('');
      return;
    }
    if (max && value.length >= max) return;
    onChange([...value, v]);
    setPending('');
  };

  return (
    <>
      <div className={styles.chipGroup} role="group">
        {options.map((o) => {
          const active = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => toggle(o.id)}
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
            >
              {o.label}
            </button>
          );
        })}
        {free.map((label) => (
          <button
            key={`free:${label}`}
            type="button"
            aria-pressed
            onClick={() => toggle(label)}
            className={`${styles.chip} ${styles.chipActive}`}
          >
            {label}
            <X size={12} />
          </button>
        ))}
      </div>

      {allowOther ? (
        <div className={styles.chipAddInputRow}>
          <input
            type="text"
            className={styles.input}
            placeholder="Add another (e.g. Vanderbilt)"
            value={pending}
            onChange={(e) => setPending(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFree();
              }
            }}
            disabled={disabled}
            maxLength={60}
          />
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={addFree}
            disabled={disabled || pending.trim().length === 0}
          >
            Add
          </button>
        </div>
      ) : null}
    </>
  );
}
