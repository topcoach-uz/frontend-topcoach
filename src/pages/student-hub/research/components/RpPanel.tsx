import React from 'react';
import { Check } from 'lucide-react';

interface RpPanelProps {
  step: number;
  title: string;
  subtitle?: React.ReactNode;
  done?: boolean;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** A numbered step card in the module view (1 Lessons, 2 Knowledge check, 3 Assignment). */
const RpPanel: React.FC<RpPanelProps> = ({ step, title, subtitle, done, aside, className, children }) => (
  <section className={`rp-panel${className ? ` ${className}` : ''}`} aria-label={title}>
    <header className="rp-panel__head">
      <span className={`rp-panel__step${done ? ' is-done' : ''}`} aria-hidden>
        {done ? <Check size={14} strokeWidth={3} /> : step}
      </span>
      <div className="rp-panel__titles">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {aside && <div className="rp-panel__aside">{aside}</div>}
    </header>
    <div className="rp-panel__body">{children}</div>
  </section>
);

export default RpPanel;
