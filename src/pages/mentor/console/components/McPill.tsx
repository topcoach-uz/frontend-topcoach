import type { ReactNode } from 'react';

export type McPillVariant =
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export function McPill({
  variant = 'neutral',
  children,
  className = '',
}: {
  variant?: McPillVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`mc-pill mc-pill--${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}
