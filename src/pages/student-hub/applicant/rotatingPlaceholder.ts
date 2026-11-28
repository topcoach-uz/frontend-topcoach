import { useEffect, useMemo, useState } from "react";

export type TypewriterPhase = "typing" | "holding" | "erasing" | "gap";
export interface TypewriterState { index: number; length: number; phase: TypewriterPhase }

export const TYPE_MS = 65;
export const ERASE_MS = 30;
export const HOLD_MS = 1700;
export const GAP_MS = 350;

export const initialTypewriterState: TypewriterState = { index: 0, length: 0, phase: "typing" };

/** Pure state machine: returns the next state and how long to wait before applying it. */
export function stepTypewriter(state: TypewriterState, examples: readonly string[]): { state: TypewriterState; delay: number } {
  if (!examples.length) return { state, delay: HOLD_MS };
  const index = state.index % examples.length;
  const text = examples[index];
  switch (state.phase) {
    case "typing": {
      const length = Math.min(text.length, state.length + 1);
      return { state: { index, length, phase: length >= text.length ? "holding" : "typing" }, delay: length >= text.length ? HOLD_MS : TYPE_MS };
    }
    case "holding":
      return { state: { index, length: text.length, phase: "erasing" }, delay: ERASE_MS };
    case "erasing": {
      const length = Math.max(0, state.length - 1);
      return { state: { index, length, phase: length === 0 ? "gap" : "erasing" }, delay: length === 0 ? GAP_MS : ERASE_MS };
    }
    default:
      return { state: { index: (index + 1) % examples.length, length: 0, phase: "typing" }, delay: TYPE_MS };
  }
}

export function typewriterText(state: TypewriterState, examples: readonly string[]): string {
  if (!examples.length) return "";
  return examples[state.index % examples.length].slice(0, state.length);
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Typewriter-style rotating placeholder text. Returns `staticText` when disabled
 * (e.g. input focused or filled), when there are no examples, or under reduced motion.
 */
export function useRotatingPlaceholder(examples: readonly string[], staticText: string, enabled = true): string {
  const key = examples.join("\u0001");
  const list = useMemo(() => (key ? key.split("\u0001") : []), [key]);
  const [state, setState] = useState<TypewriterState>(initialTypewriterState);
  const active = enabled && list.length > 0 && !prefersReducedMotion();

  useEffect(() => {
    if (!active) { setState(initialTypewriterState); return undefined; }
    let timer: number | undefined;
    let current = initialTypewriterState;
    const tick = () => {
      const next = stepTypewriter(current, list);
      current = next.state;
      timer = window.setTimeout(() => { setState(current); tick(); }, next.delay);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [active, list]);

  if (!active) return staticText;
  const text = typewriterText(state, list);
  return text || " ";
}
