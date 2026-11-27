import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useFillViewport } from 'src/hooks/useFillViewport';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Pill buttons (antd Button or .tc-btn). */
  actions?: ReactNode;
  className?: string;
  /** Render as a workspace panel (the white glass card). */
  panel?: boolean;
  /** Grow to the bottom of the window: no gap below, no page scrollbar (wide screens). */
  fill?: boolean;
  /** Heading level: 2 for a page's main empty state, 3 inside a section. */
  level?: 2 | 3;
  /** Extra content under the actions (e.g. a hint line). */
  children?: ReactNode;
}

/**
 * The workspace empty state: icon in a blush tile, a short title, one muted
 * line, pill actions. Renders the existing `.applicant-empty` composition.
 */
export function EmptyState({ icon: Icon, title, description, actions, className, panel, fill, level = 3, children }: EmptyStateProps) {
  const ref = useFillViewport<HTMLDivElement>([fill], fill ? 900 : Number.POSITIVE_INFINITY);
  const Heading = level === 2 ? 'h2' : 'h3';
  const card = (
    <div
      ref={ref}
      className={['applicant-empty', panel && 'applicant-panel', fill && 'applicant-empty--fill', className].filter(Boolean).join(' ')}
    >
      {Icon && <Icon size={24} aria-hidden />}
      <Heading>{title}</Heading>
      {description && <p>{description}</p>}
      {actions && <div className="applicant-actions">{actions}</div>}
      {children}
    </div>
  );
  // useFillViewport measures from the card's parent: give a filling card its
  // own box, so it fits wherever it sits (directly in a page, inside a wrapper).
  return fill ? <div className="applicant-empty-fill">{card}</div> : card;
}
