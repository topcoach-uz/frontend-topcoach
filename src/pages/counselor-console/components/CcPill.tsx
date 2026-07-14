import type { CSSProperties, ReactNode } from 'react';

export type CcPillVariant =
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

/**
 * Pill badge for the counselor console. Cloned from the mentor console's
 * McPill into the `cc-*` namespace. Styles live in CounselorConsoleLayout.scss.
 */
export function CcPill({
  variant = 'neutral',
  children,
  className = '',
  style,
}: {
  variant?: CcPillVariant;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`cc-pill cc-pill--${variant} ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}
