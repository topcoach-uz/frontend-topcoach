/**
 * Returns the number of emoji (1–3) when the text consists solely of emoji,
 * or 0 otherwise. Used to render emoji-only messages enlarged, Telegram-style.
 */
export function countEmojiOnly(text?: string | null): number {
  if (!text) return 0;
  const trimmed = text.trim();
  // Quick reject: any alphanumeric character means it's a regular message
  if (!trimmed || /[A-Za-z0-9]/.test(trimmed)) return 0;

  // Split into grapheme clusters so multi-codepoint emoji (👨‍👩‍👧, 🇺🇿, 👍🏽)
  // count as one. Intl.Segmenter is available in all supported browsers;
  // fall back to code points if not.
  let graphemes: string[];
  const Segmenter = (Intl as { Segmenter?: any }).Segmenter;
  if (Segmenter) {
    const segmenter = new Segmenter(undefined, { granularity: 'grapheme' });
    graphemes = Array.from(
      segmenter.segment(trimmed),
      (s: { segment: string }) => s.segment
    );
  } else {
    graphemes = Array.from(trimmed);
  }

  graphemes = graphemes.filter((g) => g.trim() !== '');
  if (graphemes.length === 0 || graphemes.length > 3) return 0;

  const isEmoji = (g: string) =>
    /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(g);
  return graphemes.every(isEmoji) ? graphemes.length : 0;
}
