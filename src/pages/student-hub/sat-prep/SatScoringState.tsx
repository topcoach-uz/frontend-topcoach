import React, { useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

const STEPS = [
  "Checking your answers",
  "Estimating your score",
  "Saving to your progress",
];

/**
 * Shown between "Submit" and the result screen while the session is saved.
 * Steps advance on a timer (the save itself is a single request); if the
 * save fails the answers are kept and the student can retry.
 */
export const SatScoringState: React.FC<{ failed: boolean; onRetry: () => void }> = ({
  failed,
  onRetry,
}) => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (failed) return;
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 450);
    const t2 = setTimeout(() => setStep(2), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [failed]);

  if (failed) {
    return (
      <div className="sat-scoring sat-scoring--failed" role="alert">
        <AlertTriangle size={32} />
        <h2>We couldn’t save your test</h2>
        <p>Your answers are still here. Check your connection and try again.</p>
        <button className="sat-btn sat-btn--primary" onClick={onRetry}>
          Retry saving
        </button>
      </div>
    );
  }
  return (
    <div className="sat-scoring" role="status" aria-live="polite">
      <Loader2 className="sat-scoring__spinner" size={32} />
      <h2>Scoring your test…</h2>
      <ol className="sat-scoring__steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i < step ? "is-done" : i === step ? "is-active" : ""}
          >
            {i < step ? <Check size={14} /> : <span className="sat-scoring__dot" />}
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
};
