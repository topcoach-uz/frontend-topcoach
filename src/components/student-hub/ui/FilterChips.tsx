import type { ReactNode } from 'react';

export interface FilterChipOption {
  value: string;
  label: ReactNode;
  count?: number;
}

export interface FilterChipsProps {
  options: FilterChipOption[];
  /** The selected value, or values when `multiple`. */
  value: string | string[];
  onChange: (value: string) => void;
  ariaLabel: string;
  multiple?: boolean;
}

/**
 * Toggle chips for filters (difficulty, count, subtopic). For switching between
 * views of a page, use ViewTabs instead.
 */
export function FilterChips({ options, value, onChange, ariaLabel }: FilterChipsProps) {
  const selected = new Set(Array.isArray(value) ? value : [value]);
  return (
    <div className="tc-chips" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="tc-chip"
          aria-pressed={selected.has(option.value)}
          onClick={() => onChange(option.value)}
        >
          <span>{option.label}</span>
          {option.count != null && <span className="tc-chip__count">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
