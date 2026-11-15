import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { ClampedText } from "./ClampedText";
import { DeadlinesTable, EntryRequirementsList, ScoresBlock, StructuredCosts } from "./StructuredSections";
import { hasStructuredCosts, type StructuredUniversityContent } from "./structuredContent";
import { UniversityCompare, type CollegeListEntry } from "./UniversityCompare";
import type { ComparableFacts, GlanceTile, KeyFactRow } from "./universityKeyFactsModel";

export function UniversityGlance({ tiles, compare }: { tiles: GlanceTile[]; compare?: { id: string; name: string; facts: ComparableFacts; list: CollegeListEntry[] } }) {
  const [open, setOpen] = useState(false);
  if (!tiles.length) return null;
  return <section id="ud-glance" className="applicant-university-detail__glance" aria-label="At a glance">
    <div className="applicant-university-detail__glance-top">
      <dl>{tiles.map((tile) => <div className="applicant-university-detail__tile" key={tile.id}>
        <dt>{tile.label}</dt><dd>{tile.value}</dd>{tile.sub && <small>{tile.sub}</small>}
      </div>)}</dl>
      {compare && <button type="button" className="applicant-university-detail__compare-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}><ArrowLeftRight size={14} aria-hidden="true" />Compare</button>}
    </div>
    {compare && open && <UniversityCompare currentId={compare.id} currentName={compare.name} currentFacts={compare.facts} list={compare.list} onClose={() => setOpen(false)} />}
  </section>;
}

export function UniversityAdmissions({ deadlines, exams, structured }: { deadlines: KeyFactRow[]; exams: string[]; structured?: StructuredUniversityContent }) {
  const structuredDeadlines = !!structured && structured.deadlines.length > 0;
  const structuredRequired = !!structured && structured.entryRequirements.some((item) => item.status === "required");
  if (!deadlines.length && !exams.length && !structuredDeadlines && !structuredRequired) return null;
  return <section id="ud-admissions" className="applicant-university-detail__admissions">
    <h2>Admissions</h2>
    {structured && (structuredDeadlines || structuredRequired) ? <div className="applicant-university-detail__admissions-stack">
      {structuredDeadlines && <DeadlinesTable content={structured} />}
      <ScoresBlock content={structured} />
      {structuredRequired && <div className="applicant-university-detail__admissions-need">
        <h3 className="applicant-university-detail__list-title">What you need</h3>
        <EntryRequirementsList content={structured} statuses={["required"]} />
      </div>}
    </div> : <dl className="applicant-university-detail__admissions-grid">
      {!structuredDeadlines && deadlines.length > 0 && <div>
        {deadlines.map((row) => <div className="applicant-university-detail__admissions-group" key={row.id}>
          <dt>{row.id === "deadlines" ? "Deadlines" : row.label}</dt>
          <dd>{row.note && <small>{row.note}</small>}{row.lines?.map((line, i) => <p key={i}>{line.text}{line.note && <span> · {line.note}</span>}</p>)}</dd>
        </div>)}
      </div>}
      {exams.length > 0 && <div><dt>Required exams</dt><dd><ul className="applicant-university-detail__fact-chips">{exams.map((exam) => <li key={exam}>{exam}</li>)}</ul></dd></div>}
    </dl>}
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

/** Sections are looked up inside the page layout so ids can never collide with the app shell. */
function findSection(nav: HTMLElement | null, id: string): HTMLElement | null {
  return nav?.parentElement?.querySelector<HTMLElement>(`[id="${id}"]`) ?? null;
}

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
  const [scrollMargin, setScrollMargin] = useState(64);
  const key = items.map((item) => item.id).join("|");

  useLayoutEffect(() => {
    const update = () => {
      const next = pinnedHeaderHeight();
      setOffset(next);
      const nav = navRef.current;
      if (!nav) return;
      const margin = next + nav.offsetHeight + 12;
      setScrollMargin(margin);
      nav.parentElement?.style.setProperty("--ud-nav-offset", `${next}px`);
      nav.parentElement?.style.setProperty("--ud-scroll-margin", `${margin}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [key]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) { if (entry.isIntersecting) visible.add(entry.target.id); else visible.delete(entry.target.id); }
      const first = items.find((item) => visible.has(item.id));
      if (first) setActive(first.id);
    }, { rootMargin: `-${scrollMargin}px 0px -55% 0px`, threshold: 0 });
    items.forEach((item) => { const el = findSection(navRef.current, item.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scrollMargin]);

  if (items.length < 2) return null;
  return <nav ref={navRef} className="applicant-university-detail__sectionnav" aria-label="Page sections" style={{ top: offset }}>
    {items.map((item) => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "true" : undefined}
      onClick={(event) => { event.preventDefault(); findSection(navRef.current, item.id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }); setActive(item.id); }}>{item.label}</a>)}
  </nav>;
}

export interface CostColumn { text?: string; url?: string; linkLabel: string }

/** Costs & funding card: two clamped columns, shared by the university and degree pages. */
export function CostsFundingSection({ tuition, funding, checked, structured }: { tuition: CostColumn; funding: CostColumn; checked?: string; structured?: StructuredUniversityContent }) {
  if (hasStructuredCosts(structured)) return <section id="ud-costs" className="applicant-university-detail__funding"><h2>Costs &amp; funding</h2><StructuredCosts content={structured!} /></section>;
  if (!tuition.text && !funding.text) return null;
  const column = (label: string, col: CostColumn) => <div><dt>{label}</dt><dd>
    {col.text ? <ClampedText text={col.text} /> : <p>Not yet verified.</p>}
    {col.text && col.url && <a href={col.url} target="_blank" rel="noopener noreferrer">{col.linkLabel} <ArrowUpRight size={17} aria-hidden="true" /></a>}
  </dd></div>;
  return <section id="ud-costs" className="applicant-university-detail__funding"><h2>Costs &amp; funding</h2>
    <dl className="applicant-university-detail__finance">{column("Tuition & fees", tuition)}{column("Scholarships & funding", funding)}</dl>
    {checked && <p className="applicant-university-detail__checked">Checked {checked}</p>}
  </section>;
}
