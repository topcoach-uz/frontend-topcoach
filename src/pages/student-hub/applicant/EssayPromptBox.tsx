import { useState } from "react";

const COLLAPSE_AFTER_CHARS = 220;

export function EssayPromptBox({ prompt }: { prompt: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = prompt.length > COLLAPSE_AFTER_CHARS || prompt.split("\n").length > 3;
  return (
    <section className="applicant-editor__prompt" aria-label="Essay prompt">
      <span className="applicant-editor__prompt-eyebrow">Prompt</span>
      <p className={long && !expanded ? "is-clamped" : undefined}>{prompt}</p>
      {long && (
        <button type="button" className="applicant-editor__prompt-toggle" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </section>
  );
}
