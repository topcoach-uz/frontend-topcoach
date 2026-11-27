import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

export interface SkeletonBlockProps {
  /** panel: a title and text lines; list: rows with an avatar dot; tiles: a grid of stat-sized blocks. */
  variant?: 'panel' | 'list' | 'tiles';
  lines?: number;
}

/** Loading placeholder that keeps the page's shape. The shimmer rests under reduced motion. */
export function SkeletonBlock({ variant = 'panel', lines = 4 }: SkeletonBlockProps) {
  const { t } = useTranslation();
  const label = <span className="tc-visually-hidden">{t('studentUi.loading', 'Loading…')}</span>;
  const count = Math.max(1, lines);

  if (variant === 'list') {
    return (
      <div className="tc-skeleton" aria-busy="true">
        {label}
        {Array.from({ length: count }, (_, i) => (
          <div className="tc-skeleton__row" key={i} aria-hidden>
            <span className="tc-skeleton__dot" />
            <span className={`tc-skeleton__line${i % 2 ? ' tc-skeleton__line--short' : ''}`} />
          </div>
        ))}
      </div>
    );
  }
  if (variant === 'tiles') {
    return (
      <div className="tc-skeleton" aria-busy="true">
        {label}
        <div className="tc-skeleton__tiles" aria-hidden>
          {Array.from({ length: count }, (_, i) => (
            <span className="tc-skeleton__tile" key={i} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="tc-skeleton" aria-busy="true">
      {label}
      <span className="tc-skeleton__line tc-skeleton__line--title" aria-hidden />
      {Array.from({ length: count }, (_, i) => (
        <span className={`tc-skeleton__line${i === count - 1 ? ' tc-skeleton__line--short' : ''}`} key={i} aria-hidden />
      ))}
    </div>
  );
}

export interface SpinnerProps {
  size?: 16 | 24 | 32;
  /** Announced to screen readers; defaults to "Loading…". */
  label?: string;
}

/** Inline spinner for buttons and small areas. Stops under reduced motion. */
export function Spinner({ size = 24, label }: SpinnerProps) {
  const { t } = useTranslation();
  return (
    <span role="status">
      <span className="tc-spinner" style={{ '--tc-spinner-size': `${size}px` } as CSSProperties} aria-hidden />
      <span className="tc-visually-hidden">{label ?? t('studentUi.loading', 'Loading…')}</span>
    </span>
  );
}
