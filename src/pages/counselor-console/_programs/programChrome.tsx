/* ── Counselor Console — shared chrome for the per-program tabs ───────────────
   The five program tabs (Admissions, SAT Prep, Research Prep, Full Support,
   Major Match) were each built standalone and each grew its own card shell,
   eyebrow, empty state and skeleton. They are ONE family and must read as one:
   this module is the single definition of that family's anatomy, and
   `programs-shared.scss` is the single definition of its styling.

   A tab supplies only what is genuinely its own (a week ladder, a mastery bar,
   a session timeline). Card padding, radii, hairlines, title/eyebrow type,
   empty/error/loading shape and table treatment come from here — never from a
   per-tab copy.

   PROGRAM COLOUR. `CC_PROGRAM_COLOR` in charts/ccEcharts.tsx is the validated
   source of truth for program identity, and colour follows the entity: a
   program is the same hue in a chart, on a pill and on a progress bar. Tabs
   must therefore NEVER restate the hex — `programVars()` resolves it from that
   map and publishes it as `--cc-prog` / `--cc-prog-soft` on the tab root, so a
   change to the validated palette reaches the CSS automatically.

   Colour is never the only signal: the hue is decoration on elements that are
   already named in text (the tab label, the card eyebrow, the state pill). */
import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from 'antd';
import { ccProgramColor, ccTint } from '../charts/ccEcharts';
import './programs-shared.scss';

/** The five pinned programs. Typed so a tab can't ask for a hue that
 *  `CC_PROGRAM_COLOR` doesn't pin (which would silently fall back to grey). */
export type ProgramName =
  | 'Admissions'
  | 'SAT'
  | 'Research Prep'
  | 'Full Support'
  | 'Community';

/** Publishes the program's validated identity hue to CSS. Read as
 *  `var(--cc-prog)` / `var(--cc-prog-soft)`; never hard-code the hex.
 *  Internal: tabs get this by rendering `<ProgramTab program=…>`, so there is
 *  exactly one place a tab root can be constructed. */
function programVars(program: ProgramName): CSSProperties {
  const hue = ccProgramColor(program);
  return {
    '--cc-prog': hue,
    '--cc-prog-soft': ccTint(hue, 0.1),
  } as CSSProperties;
}

/* ── Tab root ─────────────────────────────────────────────────────────────── */

/**
 * Every program tab's outermost element: one column rhythm, one gap, tabular
 * numerals for every figure inside it.
 */
export function ProgramTab({
  program,
  className = '',
  busy,
  children,
}: {
  program: ProgramName;
  className?: string;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`cc-ptab ${className}`.trim()}
      style={programVars(program)}
      data-program={program}
      aria-busy={busy || undefined}
    >
      {children}
    </div>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────────── */

/**
 * The card anatomy, identical in all five tabs: hairline surface, `--cc-radius`,
 * `--cc-shadow-sm`, small-caps eyebrow over a serif title, optional subtitle
 * under it and optional meta on the right of the rule.
 *
 * `flush` drops the body padding for cards whose content is full-bleed (a
 * ladder, a sticky-header table). It is the ONE sanctioned variant — a tab must
 * not invent a third card shape.
 */
export function ProgramCard({
  eyebrow,
  title,
  sub,
  meta,
  flush,
  titleId,
  className = '',
  children,
}: {
  eyebrow: string;
  title: string;
  sub?: ReactNode;
  meta?: ReactNode;
  flush?: boolean;
  titleId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`cc-ptab-card${flush ? ' cc-ptab-card--flush' : ''} ${className}`.trim()}
      aria-labelledby={titleId}
    >
      <header className="cc-ptab-card-head">
        <div className="cc-ptab-card-heading">
          <div className="cc-ptab-eyebrow">{eyebrow}</div>
          <h3 className="cc-ptab-card-title" id={titleId}>
            {title}
          </h3>
          {sub ? <p className="cc-ptab-card-sub">{sub}</p> : null}
        </div>
        {meta ? <div className="cc-ptab-card-meta">{meta}</div> : null}
      </header>
      {children}
    </section>
  );
}

/* ── States ───────────────────────────────────────────────────────────────── */

export type ProgramStateTone = 'neutral' | 'danger' | 'good';

/**
 * The one empty/error shape. Icon chip, serif title, one guiding sentence, an
 * optional recovery action. Voice: third person about the student — a counselor
 * is reading someone else's record, never their own.
 */
export function ProgramState({
  icon,
  title,
  text,
  tone = 'neutral',
  action,
  page,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  tone?: ProgramStateTone;
  action?: ReactNode;
  /** Fills the tab (nothing else to show) rather than sitting inside a card. */
  page?: boolean;
}) {
  return (
    <div
      className={`cc-ptab-state cc-ptab-state--${tone}${page ? ' cc-ptab-state--page' : ''}`}
      role="status"
    >
      <span className="cc-ptab-state-ico" aria-hidden="true">
        {icon}
      </span>
      <h3 className="cc-ptab-state-title">{title}</h3>
      <p className="cc-ptab-state-text">{text}</p>
      {action ? <div className="cc-ptab-state-action">{action}</div> : null}
    </div>
  );
}

/** A whole-tab message (couldn't load / not enrolled): the state, in a card. */
export function ProgramMessage(props: Parameters<typeof ProgramState>[0]) {
  return (
    <div className="cc-ptab-card">
      <ProgramState {...props} page />
    </div>
  );
}

/** The single recovery affordance. Every tab's load error offers it, because
 *  every tab's data comes from an RTK Query hook that can simply refetch. */
export function ProgramRetry({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="cc-ptab-btn" onClick={onClick}>
      Try again
    </button>
  );
}

/* ── Loading ──────────────────────────────────────────────────────────────── */

/** Stat-tile-shaped skeletons — same footprint as the CcStat row they replace,
 *  so the tab does not shift when the data lands. */
export function ProgramSkeletonTiles({ count }: { count: number }) {
  return (
    <div className="cc-stat-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="cc-ptab-skel-stat">
          <Skeleton active title={{ width: '52%' }} paragraph={{ rows: 1 }} />
        </div>
      ))}
    </div>
  );
}

/** Card-shaped skeleton. */
export function ProgramSkeletonCard({ rows = 4 }: { rows?: number }) {
  return (
    <div className="cc-ptab-card" aria-hidden="true">
      <Skeleton active title={{ width: '38%' }} paragraph={{ rows }} />
    </div>
  );
}
