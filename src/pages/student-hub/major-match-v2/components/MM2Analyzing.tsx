import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Covers the REAL submit network call — unlike Dinara's prototype, which
 * faked this with a 2.2s setTimeout regardless of when scoring actually
 * finished. This component is mounted for exactly as long as the
 * `submitMajorMatch` mutation is in flight; there is no artificial delay.
 */
export const MM2Analyzing: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="mm2__state mm2__state--analyzing">
      <span className="mm2__spinner" />
      <p className="mm2__state-title">{t('majorMatch.analyzing.title', 'Matching your answers...')}</p>
      <p className="mm2__state-text">
        {t(
          'majorMatch.analyzing.subtitle',
          "We're comparing your responses against 13 majors to find your best fit.",
        )}
      </p>
    </div>
  );
};
