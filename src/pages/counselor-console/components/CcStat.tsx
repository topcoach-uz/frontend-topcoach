import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

export type CcStatTone = 'info' | 'good' | 'warn' | 'alert' | 'neutral';

/**
 * Editorial stat tile for the counselor console — small-caps label, serif
 * numeral, a small tinted icon in the top-right margin, tone-tinted ink and a
 * reveal-on-hover CTA. A tile is not a card: put several inside a
 * `.cc-stat-grid` and they weld into one bordered band divided by hairlines
 * (see CounselorConsoleLayout.scss, where all the styles live).
 */
export function CcStat({
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
  tone?: CcStatTone;
  cta?: string;
  onClick?: () => void;
}) {
  const clickable = !!onClick;
  return (
    <div
      className={`cc-stat cc-stat--${tone}${clickable ? ' cc-stat--clickable' : ''}`}
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
      <div className="cc-stat-top">
        <div className="cc-stat-label">{label}</div>
        {icon && <span className="cc-stat-ico">{icon}</span>}
      </div>
      <div className="cc-stat-value">{value}</div>
      {meta && <div className="cc-stat-meta">{meta}</div>}
      {clickable && (
        <span className="cc-stat-cta">
          {cta} <ArrowRight size={12} />
        </span>
      )}
    </div>
  );
}
