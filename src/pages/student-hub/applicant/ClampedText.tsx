import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

const LINES = 4;

/** Paragraph limited to 4 lines with a bottom fade; the toggle only appears when the text really overflows. */
export function ClampedText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<{ full: number; collapsed: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
      setHeights({ full: el.scrollHeight, collapsed: Math.round(lineHeight * LINES) });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  useEffect(() => { setExpanded(false); }, [text]);

  const overflowing = !!heights && heights.full - heights.collapsed > 1;
  const maxHeight = heights && overflowing ? (expanded ? heights.full : heights.collapsed) : undefined;

  return <>
    <div className="applicant-university-detail__clamp-wrap" style={maxHeight ? { maxHeight } : undefined}>
      <p id={id} ref={ref} className={`applicant-university-detail__clamp${overflowing && !expanded ? " applicant-university-detail__clamp--fade" : ""}`}>{text}</p>
    </div>
    {overflowing && <button type="button" className="applicant-university-detail__clamp-toggle" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((v) => !v)}>{expanded ? "Show less" : "Read more"}</button>}
  </>;
}
