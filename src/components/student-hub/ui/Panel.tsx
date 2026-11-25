import type { ReactNode } from 'react';
import { SectionHeader } from './SectionHeader';

export interface PanelProps {
  as?: 'section' | 'div' | 'article';
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** glass: a card on the canvas; inset: nested inside glass (never glass on glass); plain: solid. */
  tone?: 'glass' | 'inset' | 'plain';
  padding?: 'md' | 'lg' | 'none';
  className?: string;
  children?: ReactNode;
}

/** A section card. Renders a SectionHeader when given a title. */
export function Panel({
  as: Tag = 'section',
  title,
  subtitle,
  actions,
  tone = 'glass',
  padding = 'md',
  className,
  children,
}: PanelProps) {
  const cls = ['tc-panel', `tc-panel--${tone}`, `tc-panel--pad-${padding}`, className].filter(Boolean).join(' ');
  return (
    <Tag className={cls}>
      {(title || actions) && <SectionHeader title={title} subtitle={subtitle} actions={actions} />}
      {children}
    </Tag>
  );
}
