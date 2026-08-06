import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Covers the REAL two-stage analyse call (grounding query + two chained
 * Gemini calls, roughly 15s) — no artificial delay, no fake progress bar,
 * and no promised duration in the copy since the real timing can vary.
 * This component is mounted for exactly as long as the `analyseMm3`
 * mutation is in flight.
 */
export const MM3Analyzing: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="mm2__state mm2__state--analyzing">
      <span className="mm2__spinner" />
      <p className="mm2__state-title">{t('majorMatch3.analyzing.title', 'Analyzing your profile…')}</p>
      <p className="mm2__state-text">
        {t(
          'majorMatch3.analyzing.subtitle',
          "We're matching your answers against real universities in the TopCoach catalogue to build your personalized report.",
        )}
      </p>
    </div>
  );
};
