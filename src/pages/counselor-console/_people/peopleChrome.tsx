/* ── Counselor Console — shared chrome for the People pages ───────────────────
   Students and Staff are two multi-tab pages over the same subject: the humans
   attached to an organization. Each tab was previously its own standalone page
   with its own tab bar, its own skeleton, its own error card and its own copy
   of the `err.data.message` unwrap. They are ONE family and must read as one:
   this module is the single definition of that family's anatomy, and
   `people-shared.scss` is the single definition of its styling.

   A tab supplies only what is genuinely its own (a roster column set, an invite
   action bar). Tab chrome, empty/error/loading shape and the no-org placeholder
   come from here — never from a per-tab copy.

   The tab bar is the console's OWN editorial pill row (the same anatomy as
   `.cc-analytics-tabs`), not AntD's `<Tabs>`. AntD's default tab chrome does
   not belong to this design system, and the console has already committed to
   pills everywhere else a section is switched. */
import type { ReactNode } from 'react';
import { Button } from 'antd';
import { Users } from 'lucide-react';

import TableSkeleton from 'src/components/loading/TableSkeleton';
import './people-shared.scss';

/* ── Error text ───────────────────────────────────────────────────────────── */

/**
 * Unwrap an RTK Query error into one sentence a counselor can act on.
 *
 * NestJS's ValidationPipe returns `message` as an ARRAY of constraint strings,
 * while a thrown HttpException returns it as a plain string — five copies of
 * this unwrap had drifted across the People pages, and the array case rendered
 * as "[object Object]" in some of them. This is now the only implementation.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { data?: { message?: unknown } } | undefined)?.data;
  const msg = data?.message;
  if (Array.isArray(msg)) {
    const first = msg.find((m) => typeof m === 'string' && m.trim());
    if (first) return String(first);
  } else if (typeof msg === 'string' && msg.trim()) {
    return msg;
  }
  return fallback;
}

/* ── Tab bar ──────────────────────────────────────────────────────────────── */

export interface PeopleTab<K extends string> {
  key: K;
  label: string;
  icon: ReactNode;
  /** Optional count shown after the label (e.g. how many are archived). */
  count?: number;
}

/**
 * The People pages' section switch. Horizontal, editorial pill row; scrolls on
 * narrow screens so it never pushes the body into a horizontal scroll.
 *
 * `idBase` namespaces the tab/panel ids so the two People pages can both be in
 * the DOM during a route transition without colliding.
 */
export function PeopleTabs<K extends string>({
  tabs,
  active,
  onChange,
  idBase,
  ariaLabel,
}: {
  tabs: PeopleTab<K>[];
  active: K;
  onChange: (key: K) => void;
  idBase: string;
  ariaLabel: string;
}) {
  return (
    <div className="cc-people-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          id={`${idBase}-tab-${t.key}`}
          aria-selected={active === t.key}
          aria-controls={`${idBase}-panel-${t.key}`}
          className={`cc-people-tab ${
            active === t.key ? 'cc-people-tab--active' : ''
          }`}
          onClick={() => onChange(t.key)}
        >
          <span className="cc-people-tab-ico">{t.icon}</span>
          {t.label}
          {t.count != null && t.count > 0 ? (
            <span className="cc-people-tab-count">{t.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** The panel a tab's body sits in — wires the a11y relationship to its tab. */
export function PeoplePanel({
  tabKey,
  idBase,
  children,
}: {
  tabKey: string;
  idBase: string;
  children: ReactNode;
}) {
  return (
    <section
      role="tabpanel"
      id={`${idBase}-panel-${tabKey}`}
      aria-labelledby={`${idBase}-tab-${tabKey}`}
    >
      {children}
    </section>
  );
}

/* ── States ───────────────────────────────────────────────────────────────── */

/**
 * The one empty-state shape, for a table's `locale.emptyText`. Icon, serif
 * title, one guiding sentence, an optional recovery action.
 */
export function PeopleEmpty({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: string;
  text: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="cc-invite-empty">
      {icon}
      <div className="cc-invite-empty-title">{title}</div>
      <div>{text}</div>
      {action ? <div className="cc-people-empty-action">{action}</div> : null}
    </div>
  );
}

/**
 * Loading / error / loaded, in one place.
 *
 * Every People tab loads a table from an RTK Query hook, so all three states
 * have the same shape and the same recovery (refetch). Three hand-rolled copies
 * of this had drifted apart — different skeleton sizes, different error copy,
 * one with no retry at all. A tab now passes its query's flags and its table.
 */
export function PeopleTableShell({
  isLoading,
  isError,
  onRetry,
  errorTitle,
  errorText = 'Something went wrong. Please try again.',
  skeletonColumns = 6,
  skeletonRows = 8,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  errorTitle: string;
  errorText?: string;
  skeletonColumns?: number;
  skeletonRows?: number;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="cc-invite-skeleton">
        <TableSkeleton columns={skeletonColumns} rows={skeletonRows} />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="cc-invite-table">
        <div className="cc-invite-empty">
          <div className="cc-invite-empty-title">{errorTitle}</div>
          <div>{errorText}</div>
          <div className="cc-people-empty-action">
            <Button className="cc-invite-ghost" onClick={onRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return <div className="cc-invite-table">{children}</div>;
}

/**
 * Shown in place of a People page's body when no organization is selected.
 * The page header still renders above it, so the counselor keeps their bearings.
 */
export function NoOrgPlaceholder({
  title = 'No organization selected',
  text,
  icon,
}: {
  title?: string;
  text: string;
  icon?: ReactNode;
}) {
  return (
    <div className="cc-placeholder">
      {icon ?? <Users size={22} color="#7b1f2f" />}
      <div className="cc-placeholder-title">{title}</div>
      <div className="cc-placeholder-text">{text}</div>
    </div>
  );
}

/* ── Page header ──────────────────────────────────────────────────────────── */

/**
 * The console's `cc-page-head--ruled` header: eyebrow → title → lead, with an
 * optional action cluster pinned to the baseline on the right.
 */
export function PeoplePageHead({
  eyebrow,
  orgName,
  title,
  lead,
  actions,
}: {
  eyebrow: string;
  orgName?: string | null;
  title: string;
  lead: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="cc-page-head--ruled">
      <div className="cc-invite-head">
        <div>
          <div className="cc-page-eyebrow">
            <span className="cc-page-eyebrow-accent">{eyebrow}</span>
            {orgName ? <span>· {orgName}</span> : null}
          </div>
          <h1 className="cc-page-title">{title}</h1>
          <p className="cc-page-lead">{lead}</p>
        </div>
        {actions ? (
          <div className="cc-invite-head-actions">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
