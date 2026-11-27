import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Pill buttons (antd Button or .tc-btn). */
  actions?: ReactNode;
  className?: string;
}

/**
 * The workspace empty state: icon in a blush tile, a short title, one muted
 * line, pill actions. Renders the existing `.applicant-empty` composition.
 */
export function EmptyState({ icon: Icon, title, description, actions, className }: EmptyStateProps) {
  return (
    <div className={['applicant-empty', className].filter(Boolean).join(' ')}>
      {Icon && <Icon size={24} aria-hidden />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {actions && <div className="applicant-actions">{actions}</div>}
    </div>
  );
}
