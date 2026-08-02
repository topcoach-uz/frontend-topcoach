/* ── Counselor Console — the one page header ───────────────────────────────────
   Every console page opens the same way: an eyebrow that names the section (and
   the current organization), an editorial serif title, and a deck that says
   what the page is for. This is the single definition of that anatomy.

   It used to exist nine times: once as `PeoplePageHead` (used by two pages) and
   seven more times as a copy-pasted JSX block, plus Analytics' own
   `.cc-analytics-header` which had drifted to a 28px bottom margin and sat 4px
   lower than every other page.

   Two variants the console genuinely needs, both optional so neither is forced:
     • deck-less — the Student profile leads with a meta row instead of a deck.
     • actions — a cluster pinned to the right of the header (an invite button,
       Analytics' range control, the profile's Message action).

   `actionsAlign` exists because a control that reads as a filter for the page
   ("last 30 days") belongs at the top next to the eyebrow, while an action that
   acts on the subject belongs on the baseline with the copy. Default is
   baseline; Analytics is the one 'top'. */
import type { ReactNode } from 'react';

export interface CcPageHeadProps {
  /** Section name, e.g. "Insights". Rendered in the accent colour. */
  eyebrow: string;
  /** Appended to the eyebrow after a middot when an organization is selected. */
  orgName?: string | null;
  title: ReactNode;
  /** The deck. Omit for the deck-less variant. */
  lead?: ReactNode;
  /** Optional row between the copy and the rule (the profile's email/class/status). */
  meta?: ReactNode;
  /** Optional cluster on the right of the header. */
  actions?: ReactNode;
  /** Where the action cluster sits vertically. See the note above. */
  actionsAlign?: 'baseline' | 'top';
}

export function CcPageHead({
  eyebrow,
  orgName,
  title,
  lead,
  meta,
  actions,
  actionsAlign = 'baseline',
}: CcPageHeadProps) {
  return (
    <div className="cc-page-head--ruled">
      <div
        className={`cc-page-head-row${
          actionsAlign === 'top' ? ' cc-page-head-row--top' : ''
        }`}
      >
        <div className="cc-page-head-copy">
          <div className="cc-page-eyebrow">
            <span className="cc-page-eyebrow-accent">{eyebrow}</span>
            {orgName ? <span>· {orgName}</span> : null}
          </div>
          <h1 className="cc-page-title">{title}</h1>
          {lead ? <p className="cc-page-lead">{lead}</p> : null}
          {meta ? <div className="cc-page-head-meta">{meta}</div> : null}
        </div>
        {actions ? <div className="cc-page-head-actions">{actions}</div> : null}
      </div>
    </div>
  );
}

export default CcPageHead;
