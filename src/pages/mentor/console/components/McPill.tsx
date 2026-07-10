import type { CSSProperties, ReactNode } from 'react';

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
  style,
}: {
  variant?: McPillVariant;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`mc-pill mc-pill--${variant} ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}
