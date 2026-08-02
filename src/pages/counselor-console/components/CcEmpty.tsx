/* ── Counselor Console — the one empty state ──────────────────────────────────
   A card with nothing in it still has to say something useful: what would be
   here, and what the counselor can do about it. This is the single definition
   of that block.

   It had grown into six variants (`.cc-dash-empty`, `.cc-analytics-empty`,
   `.cc-invite-empty`, `.cc-roster-empty`, `.cc-staff-empty`, `.cc-audit-empty`,
   plus Announcements' own) whose titles ranged from 1.02rem to 1.25rem and whose
   padding ranged from 24/20 to 56/28. Audit's and Staff's had no icon chip at
   all, and the Student profile's was a bare left-aligned paragraph.

   Anatomy: 40px/r12 icon chip, serif 1.05rem title, one guiding sentence,
   optional recovery action.

   `tone` colours the chip only. It is never the sole carrier of meaning — an
   error state says so in its title, so a reader who cannot separate the maroon
   chip from the red one loses nothing. */
import type { ReactNode } from 'react';
import { Building2 } from 'lucide-react';

export type CcEmptyTone = 'neutral' | 'accent' | 'good' | 'danger';

export interface CcEmptyProps {
  /** Usually a 20px lucide icon. Omit for a chip-less state. */
  icon?: ReactNode;
  tone?: CcEmptyTone;
  title: ReactNode;
  /** One sentence: what would be here, or what to do next. */
  text?: ReactNode;
  /** A recovery action, e.g. Retry. */
  action?: ReactNode;
  /** Extra class for layout-only concerns (e.g. filling a chart's height). */
  className?: string;
}

export function CcEmpty({
  icon,
  tone = 'accent',
  title,
  text,
  action,
  className,
}: CcEmptyProps) {
  return (
    <div className={`cc-empty${className ? ` ${className}` : ''}`}>
      {icon ? (
        <span className={`cc-empty-ico cc-empty-ico--${tone}`}>{icon}</span>
      ) : null}
      <div className="cc-empty-title">{title}</div>
      {text ? <div className="cc-empty-text">{text}</div> : null}
      {action ? <div className="cc-empty-action">{action}</div> : null}
    </div>
  );
}

/**
 * Shown in place of a page's body when no organization is selected, and for the
 * page-level "you don't have access to this" states. Dashed rule and generous
 * padding so it reads as a held-open space rather than a failed card.
 *
 * The page header still renders above it, so the counselor keeps their bearings.
 *
 * Reports, Settings, Audit and Announcements each hand-rolled this block; they
 * now all come through here.
 */
export function NoOrgPlaceholder({
  title = 'No organization selected',
  text,
  icon,
}: {
  title?: string;
  text: ReactNode;
  icon?: ReactNode;
}) {
  return (
    /* The icon takes its colour from `.cc-placeholder svg` in the stylesheet,
       never a `color` prop — that was the console's most common token bypass. */
    <div className="cc-placeholder">
      {icon ?? <Building2 size={22} />}
      <div className="cc-placeholder-title">{title}</div>
      <div className="cc-placeholder-text">{text}</div>
    </div>
  );
}

export default CcEmpty;
