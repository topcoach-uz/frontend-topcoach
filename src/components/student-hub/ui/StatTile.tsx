import type { ReactNode } from 'react';

export interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning';
}

/** One number with its label. Sits inside a Panel (inset surface, never glass on glass). */
export function StatTile({ label, value, hint, tone = 'neutral' }: StatTileProps) {
  return (
    <div className={`tc-stat${tone === 'neutral' ? '' : ` tc-stat--${tone}`}`}>
      <span className="tc-stat__label">{label}</span>
      <span className="tc-stat__value">{value}</span>
      {hint && <span className="tc-stat__hint">{hint}</span>}
    </div>
  );
}
