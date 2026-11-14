import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeftRight, Check } from "lucide-react";
import { UniversityCompare, type CollegeListEntry } from "./UniversityCompare";
import { loadReadyExams, saveReadyExams, toggleExam } from "./examChecklist";
import type { ComparableFacts, GlanceTile, KeyFactRow } from "./universityKeyFactsModel";

export function UniversityGlance({ tiles, compare }: { tiles: GlanceTile[]; compare?: { name: string; facts: ComparableFacts; list: CollegeListEntry[] } }) {
  const [open, setOpen] = useState(false);
  if (!tiles.length) return null;
  return <section id="glance" className="applicant-university-detail__glance" aria-label="At a glance">
    <div className="applicant-university-detail__glance-top">
      <dl>{tiles.map((tile) => <div className="applicant-university-detail__tile" key={tile.id}>
        <dt>{tile.label}</dt><dd>{tile.value}</dd>{tile.sub && <small>{tile.sub}</small>}
      </div>)}</dl>
      {compare && <button type="button" className="applicant-university-detail__compare-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}><ArrowLeftRight size={14} aria-hidden="true" />Compare</button>}
    </div>
    {compare && open && <UniversityCompare currentName={compare.name} currentFacts={compare.facts} list={compare.list} onClose={() => setOpen(false)} />}
  </section>;
}

export function UniversityAdmissions({ universityId, deadlines, exams }: { universityId: string; deadlines: KeyFactRow[]; exams: string[] }) {
  const [ready, setReady] = useState<string[]>(() => loadReadyExams(universityId, exams));
  const toggle = (exam: string) => setReady((current) => { const next = toggleExam(current, exam); saveReadyExams(universityId, next); return next; });
  if (!deadlines.length && !exams.length) return null;
  return <section id="admissions" className="applicant-university-detail__admissions">
    <h2>Admissions</h2>
    <dl className="applicant-university-detail__admissions-grid">
      {deadlines.length > 0 && <div>
        {deadlines.map((row) => <div className="applicant-university-detail__admissions-group" key={row.id}>
          <dt>{row.id === "deadlines" ? "Deadlines" : row.label}</dt>
          <dd>{row.note && <small>{row.note}</small>}{row.lines?.map((line, i) => <p key={i}>{line.text}{line.note && <span> · {line.note}</span>}</p>)}</dd>
        </div>)}
      </div>}
      {exams.length > 0 && <div><dt>Required exams</dt><dd>
        <p className="applicant-university-detail__exam-progress" aria-live="polite">{ready.length} of {exams.length} ready</p>
        <ul className="applicant-university-detail__fact-chips">{exams.map((exam) => {
          const on = ready.includes(exam);
          return <li key={exam}><button type="button" className={`applicant-university-detail__exam${on ? " applicant-university-detail__exam--ready" : ""}`} aria-pressed={on} onClick={() => toggle(exam)}>{on && <Check size={14} aria-hidden="true" />}{exam}</button></li>;
        })}</ul>
        <small className="applicant-university-detail__exam-note">Saved on this device</small>
      </dd></div>}
    </dl>
  </section>;
}

const Bar = ({ className = "" }: { className?: string }) => <span className={`applicant-university-detail__skel-bar ${className}`} />;

/** Layout-shaped placeholder shown while the university detail loads. */
export function UniversityDetailSkeleton() {
  return <div className="applicant-university-detail__skeleton" aria-busy="true" aria-label="Loading university">
    <div className="applicant-university-detail__skel-card">
      <div className="applicant-university-detail__skel-row">
        <span className="applicant-university-detail__skel-tile" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}><Bar className="applicant-university-detail__skel-bar--title" /><Bar className="applicant-university-detail__skel-bar--short" /></div>
        <Bar className="applicant-university-detail__skel-bar--button" />
      </div>
    </div>
    <div className="applicant-university-detail__skel-card"><div className="applicant-university-detail__skel-grid">{[0, 1, 2, 3].map((i) => <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}><Bar className="applicant-university-detail__skel-bar--short" /><Bar className="applicant-university-detail__skel-stat" /></div>)}</div></div>
    <div className="applicant-university-detail__skel-card"><Bar className="applicant-university-detail__skel-bar--title" /><Bar className="applicant-university-detail__skel-bar--input" /></div>
    <div className="applicant-university-detail__skel-card"><Bar className="applicant-university-detail__skel-bar--title" /><div className="applicant-university-detail__skel-grid applicant-university-detail__skel-grid--2"><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><Bar /><Bar /><Bar /></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><Bar /><Bar /><Bar /></div></div></div>
  </div>;
}

export interface SectionNavItem { id: string; label: string }

const prefersReducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Height of the site header when it stays pinned to the top (fixed/sticky); 0 when it scrolls away. */
function pinnedHeaderHeight(): number {
  const header = document.querySelector("header");
  if (!header) return 0;
  const position = getComputedStyle(header).position;
  return position === "fixed" || position === "sticky" ? Math.round(header.getBoundingClientRect().height) : 0;
}

export function UniversitySectionNav({ items }: { items: SectionNavItem[] }) {
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [offset, setOffset] = useState(0);
  const key = items.map((item) => item.id).join("|");

  useLayoutEffect(() => {
    const update = () => {
      const next = pinnedHeaderHeight();
      setOffset(next);
      navRef.current?.parentElement?.style.setProperty("--ud-nav-offset", `${next}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) { if (entry.isIntersecting) visible.add(entry.target.id); else visible.delete(entry.target.id); }
      const first = items.find((item) => visible.has(item.id));
      if (first) setActive(first.id);
    }, { rootMargin: `-${offset + 64}px 0px -55% 0px`, threshold: 0 });
    items.forEach((item) => { const el = document.getElementById(item.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, offset]);

  if (items.length < 2) return null;
  return <nav ref={navRef} className="applicant-university-detail__sectionnav" aria-label="Page sections" style={{ top: offset }}>
    {items.map((item) => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "true" : undefined}
      onClick={(event) => { event.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }); setActive(item.id); }}>{item.label}</a>)}
  </nav>;
}
