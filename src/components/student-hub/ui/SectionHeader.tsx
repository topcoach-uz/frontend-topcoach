import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Small trailing text, e.g. a count or "Updated 2h ago". */
  meta?: ReactNode;
  actions?: ReactNode;
  /** 2 for a section on a page (20px), 3 for a heading inside a card (17px). */
  level?: 2 | 3;
}

/** Title + optional subtitle on the left; meta and actions on the right. */
export function SectionHeader({ title, subtitle, meta, actions, level = 2 }: SectionHeaderProps) {
  const Heading = level === 3 ? 'h3' : 'h2';
  return (
    <div className="tc-section-head">
      <div className="tc-section-head__titles">
        {title && <Heading>{title}</Heading>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      {meta && <span className="tc-section-head__meta">{meta}</span>}
      {actions && <div className="tc-section-head__actions">{actions}</div>}
    </div>
  );
}
