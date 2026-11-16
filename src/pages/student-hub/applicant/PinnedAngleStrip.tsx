import { useId, useState } from "react";
import { X } from "lucide-react";
import type { PinnedAngle } from "./essayAngles";

interface Props {
  angle: PinnedAngle;
  onChange: () => void;
  onRemove: () => void;
}

export function PinnedAngleStrip({ angle, onChange, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const qId = useId();
  const hasQuestions = angle.questions.length > 0;
  return (
    <section className="pinned-angle" aria-label="Your angle">
      <div className="pinned-angle__row">
        <div className="pinned-angle__main">
          <span className="pinned-angle__eyebrow">Your angle</span>
          <span className="pinned-angle__title">{angle.title}</span>
        </div>
        <div className="pinned-angle__actions">
          {hasQuestions && (
            <button type="button" className="pinned-angle__btn" aria-expanded={open} aria-controls={qId} onClick={() => setOpen((v) => !v)}>
              Questions
            </button>
          )}
          <button type="button" className="pinned-angle__btn" onClick={onChange}>Change</button>
          <button type="button" className="pinned-angle__icon" onClick={onRemove} aria-label="Remove angle">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      {hasQuestions && open && (
        <ol className="pinned-angle__questions" id={qId}>
          {angle.questions.map((q) => <li key={q}>{q}</li>)}
        </ol>
      )}
    </section>
  );
}
