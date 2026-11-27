import type { ReactNode } from 'react';

export interface ProgressBarProps {
  /** 0–100; values outside are clamped. */
  value: number;
  /** Visible label above the bar; also its accessible name. */
  label?: ReactNode;
  /** Small line under the bar, e.g. "2 of 8 weeks complete". */
  meta?: ReactNode;
  /** Accessible name when there's no visible text label. */
  ariaLabel?: string;
}

/** A thin progress meter. The fill animates with transform only (MOTION.md). */
export function ProgressBar({ value, label, meta, ariaLabel }: ProgressBarProps) {
  const pct = Math.round(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)));
  return (
    <div className="tc-progress">
      {label && (
        <div className="tc-progress__top">
          <span>{label}</span>
          <strong>{pct}%</strong>
        </div>
      )}
      <div
        className="tc-progress__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      >
        <div className="tc-progress__fill" style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      {meta && <span className="tc-progress__meta">{meta}</span>}
    </div>
  );
}
