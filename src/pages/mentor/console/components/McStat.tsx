import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

export type McStatTone = 'info' | 'good' | 'warn' | 'alert' | 'neutral';

/**
 * Editorial stat tile used across the mentor console (dashboard, sessions,
 * to-review). Serif numeral, icon chip, semantic tone tint, reveal-on-hover
 * CTA. Replaces the old `mc-kpi-card` AntD tiles. Styles live in
 * MentorConsoleLayout.scss so every page picks them up.
 */
export function McStat({
  icon,
  label,
  value,
  meta,
  tone = 'neutral',
  cta = 'View',
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  value: number | string;
  meta?: string;
  tone?: McStatTone;
  cta?: string;
  onClick?: () => void;
}) {
  const clickable = !!onClick;
  return (
    <div
      className={`mc-stat mc-stat--${tone}${clickable ? ' mc-stat--clickable' : ''}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="mc-stat-top">
        <div className="mc-stat-label">{label}</div>
        {icon && <span className="mc-stat-ico">{icon}</span>}
      </div>
      <div className="mc-stat-value">{value}</div>
      {meta && <div className="mc-stat-meta">{meta}</div>}
      {clickable && (
        <span className="mc-stat-cta">
          {cta} <ArrowRight size={12} />
        </span>
      )}
    </div>
  );
}
