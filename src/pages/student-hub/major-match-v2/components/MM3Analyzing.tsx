import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ANALYZING_STAGES,
  analyzingStageIndex,
  showAnalyzingReassurance,
} from '../mm3-progress';
import '../mm3-motion.scss';

/**
 * Covers the REAL two-stage analyse call (grounding query + two chained
 * Gemini calls, 15-40s) with honest status: stage labels that rotate on a
 * timer (they describe the kind of work, not measured progress), an elapsed
 * counter and, after 20s, a reassurance line. No fake percentage.
 * This component is mounted for exactly as long as the `analyseMm3`
 * mutation is in flight.
 */
export const MM3Analyzing: React.FC = () => {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const stage = ANALYZING_STAGES[analyzingStageIndex(elapsed)];

  return (
    <div className="mm2__state mm2__state--analyzing" role="status" aria-live="polite">
      <span className="mm2__spinner" />
      <p className="mm2__state-title">{t('majorMatch3.analyzing.title', 'Analyzing your profile…')}</p>
      <p className="mm3-analyzing__stage mm3-analyzing__stage--shimmer">{t(`majorMatch3.analyzing.stage.${stage.key}`, stage.fallback)}…</p>
      <p className="mm3-analyzing__elapsed">
        {t('majorMatch3.analyzing.elapsed', '{{seconds}}s elapsed', { seconds: elapsed })}
      </p>
      {showAnalyzingReassurance(elapsed) && (
        <p className="mm3-analyzing__reassure">
          {t('majorMatch3.analyzing.reassure', 'This usually takes under a minute.')}
        </p>
      )}
      <p className="mm2__state-text">
        {t(
          'majorMatch3.analyzing.subtitle',
          "We're matching your answers against real universities in the TopCoach catalogue to build your personalized report.",
        )}
      </p>
    </div>
  );
};
