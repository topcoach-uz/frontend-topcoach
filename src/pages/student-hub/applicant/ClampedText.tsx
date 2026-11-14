import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/** Paragraph clamped to 4 lines; the toggle only appears when the text really overflows. */
export function ClampedText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const measure = () => setOverflowing(el.scrollHeight - el.clientHeight > 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  useEffect(() => { setExpanded(false); }, [text]);

  return <>
    <p id={id} ref={ref} className={`applicant-university-detail__clamp${expanded ? " applicant-university-detail__clamp--open" : ""}`}>{text}</p>
    {(overflowing || expanded) && <button type="button" className="applicant-university-detail__clamp-toggle" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((v) => !v)}>{expanded ? "Show less" : "Read more"}</button>}
  </>;
}
