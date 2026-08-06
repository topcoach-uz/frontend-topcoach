import React from 'react';

/**
 * Renders LLM-generated text that may contain `**bold**` markers (our Major
 * Match prompts are instructed to wrap the single most load-bearing fact in
 * a sentence/bullet in double asterisks) into real React elements.
 *
 * Deliberately NOT `dangerouslySetInnerHTML` — the input is model output, so
 * any stray HTML in it must render as literal text, not be parsed. Splitting
 * into strings + `<strong>` elements keeps React's normal escaping intact.
 *
 * Safe on `undefined`/empty strings and on text with no `**` markers at all
 * (returned unchanged, just wrapped in a fragment).
 */
export function renderEmphasis(text: string | undefined | null): React.ReactNode {
  if (!text) return text;

  const parts = text.split(/\*\*(.+?)\*\*/g);
  // String.split with a capturing group interleaves: [plain, bold, plain, bold, ...].
  // Odd indices are the captured bold groups.
  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
      )}
    </>
  );
}
