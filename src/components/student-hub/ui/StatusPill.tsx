import type { ReactNode } from 'react';

export type StatusTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export interface StatusPillProps {
  tone?: StatusTone;
  icon?: ReactNode;
  children: ReactNode;
}

/** A small status label. Replaces antd Tag presets (processing/blue/gold…) in student pages. */
export function StatusPill({ tone = 'neutral', icon, children }: StatusPillProps) {
  return (
    <span className={`tc-pill tc-pill--${tone}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
