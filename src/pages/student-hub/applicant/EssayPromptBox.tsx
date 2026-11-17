import { ClampedText } from "./ClampedText";

export function EssayPromptBox({ prompt }: { prompt: string }) {
  return (
    <section className="applicant-editor__prompt" aria-label="Essay prompt">
      <span className="applicant-editor__prompt-eyebrow">Prompt</span>
      <ClampedText text={prompt} lines={3} />
    </section>
  );
}
