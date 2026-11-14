import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Check, CircleDashed, CircleDot, Minus } from "lucide-react";
import { displayDate } from "./ApplicantPage";
import {
  formatAmountRange, formatCostAmount, formatDateText, getStructuredContent, hasStructuredCosts, sharedSource, sortedCostItems,
  type Src, type StructuredUniversityContent,
} from "./structuredContent";

/** Loads structured content for a university (API field, or the pilot fixture when the build flag is on). */
export function useStructuredContent(university?: { id: string; structuredContent?: unknown } | null): StructuredUniversityContent | undefined {
  const [state, setState] = useState<{ id: string; content?: StructuredUniversityContent }>();
  const id = university?.id;
  useEffect(() => {
    if (!university) return;
    let cancelled = false;
    getStructuredContent(university).then((content) => { if (!cancelled) setState({ id: university.id, content }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return state && state.id === id ? state.content : undefined;
}

const SourceLink = ({ src }: { src: Src }) => <a className="applicant-university-detail__item-source" href={src.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Source: ${src.sourceTitle}`}><ArrowUpRight size={14} aria-hidden="true" /></a>;

/** One muted footer line when every item shares a source; otherwise rows carry their own ↗. */
function SourceLine({ items, verifiedAt }: { items: readonly Src[]; verifiedAt: string }) {
  const shared = sharedSource(items);
  if (!shared) return null;
  return <p className="applicant-university-detail__checked">Source: <a href={shared.sourceUrl} target="_blank" rel="noopener noreferrer">{shared.sourceTitle}</a>{Number.isFinite(Date.parse(verifiedAt)) && ` · Checked ${displayDate(verifiedAt)}`}</p>;
}

const STATUS: { key: StructuredUniversityContent["entryRequirements"][number]["status"]; title: string; icon: ReactNode }[] = [
  { key: "required", title: "Required", icon: <Check size={16} aria-hidden="true" /> },
  { key: "recommended", title: "Recommended", icon: <CircleDot size={16} aria-hidden="true" /> },
  { key: "optional", title: "Optional", icon: <CircleDashed size={16} aria-hidden="true" /> },
  { key: "not-required", title: "Not required", icon: <Minus size={16} aria-hidden="true" /> },
];

export function EntryRequirementsList({ content, statuses }: { content: StructuredUniversityContent; statuses?: string[] }) {
  const requirements = content.entryRequirements.filter((item) => !statuses || statuses.includes(item.status));
  const supplementary = statuses ? [] : content.supplementary;
  if (!requirements.length && !supplementary.length) return null;
  const shared = sharedSource([...requirements, ...supplementary]);
  return <div className="applicant-university-detail__reqs">
    {STATUS.map(({ key, title, icon }) => {
      const rows = requirements.filter((item) => item.status === key);
      if (!rows.length) return null;
      return <div key={key} className={`applicant-university-detail__req-group applicant-university-detail__req-group--${key}`}>
        <h3 className="applicant-university-detail__list-title">{title}</h3>
        <ul className="applicant-university-detail__list">{rows.map((item) => <li key={item.label}>
          <span className="applicant-university-detail__list-icon">{icon}</span>
          <span className="applicant-university-detail__list-body"><strong>{item.label}</strong>{item.appliesTo === "international" && <em>International applicants</em>}<span>{item.detail}</span></span>
          {!shared && <SourceLink src={item} />}
        </li>)}</ul>
      </div>;
    })}
    {supplementary.length > 0 && <div className="applicant-university-detail__req-group">
      <h3 className="applicant-university-detail__list-title">Also part of your application</h3>
      <ul className="applicant-university-detail__list">{supplementary.map((item) => <li key={item.label}>
        <span className="applicant-university-detail__list-body"><strong>{item.label}</strong><span>{item.detail}</span></span>
        <span className={`applicant-university-detail__tag${item.required ? " applicant-university-detail__tag--required" : ""}`}>{item.required ? "Required" : "Optional"}</span>
        {!shared && <SourceLink src={item} />}
      </li>)}</ul>
    </div>}
    <SourceLine items={[...requirements, ...supplementary]} verifiedAt={content.verifiedAt} />
  </div>;
}

export function CostTable({ content }: { content: StructuredUniversityContent }) {
  const items = sortedCostItems(content.costItems);
  if (!items.length) return null;
  const sources: Src[] = [...items, ...(content.totalCost ? [content.totalCost] : [])];
  const shared = sharedSource(sources);
  return <div className="applicant-university-detail__cost">
    <h3 className="applicant-university-detail__list-title">Cost of attendance{content.academicYear ? ` · ${content.academicYear}` : ""}</h3>
    <table className="applicant-university-detail__cost-table">
      <caption className="applicant-sr-only">Estimated costs for {content.academicYear}</caption>
      <tbody>
        {items.map((item) => <tr key={`${item.category}-${item.label}`}>
          <th scope="row">{item.label}{item.note && <small>{item.note}</small>}</th>
          <td>{formatCostAmount(item.amount, item.currency, item.period)}{!shared && <SourceLink src={item} />}</td>
        </tr>)}
        {content.totalCost && <tr className="applicant-university-detail__cost-total">
          <th scope="row">{content.totalCost.label}{content.totalCost.note && <small>{content.totalCost.note}</small>}</th>
          <td>{formatCostAmount(content.totalCost.amount, content.totalCost.currency, content.totalCost.period)}{!shared && <SourceLink src={content.totalCost} />}</td>
        </tr>}
      </tbody>
    </table>
    <SourceLine items={sources} verifiedAt={content.verifiedAt} />
  </div>;
}

const TYPE_LABEL = { "need-based": "Need-based", merit: "Merit", other: "Other" } as const;

export function ScholarshipCards({ content }: { content: StructuredUniversityContent }) {
  if (!content.scholarships.length) return null;
  return <div className="applicant-university-detail__scholarships">
    <h3 className="applicant-university-detail__list-title">Scholarships &amp; aid</h3>
    <ul className="applicant-university-detail__cards">{content.scholarships.map((item) => {
      const amount = formatAmountRange(item.amount);
      const deadline = formatDateText(item.deadline);
      const intl = item.internationalEligible === true ? "Eligible" : item.internationalEligible === false ? "Not eligible" : "Unclear";
      return <li key={item.name} className="applicant-university-detail__card-item">
        <div className="applicant-university-detail__card-head"><strong>{item.name}</strong><span className="applicant-university-detail__tag">{TYPE_LABEL[item.type]}</span></div>
        <p className="applicant-university-detail__card-line">{item.coverage}{amount && ` · ${amount}`}</p>
        <p className="applicant-university-detail__card-line">International students: <strong>{intl}</strong></p>
        {item.eligibility.length > 0 && <><h4>Eligibility</h4><ul>{item.eligibility.map((line) => <li key={line}>{line}</li>)}</ul></>}
        {item.howToApply.length > 0 && <><h4>How to apply</h4><ul>{item.howToApply.map((line) => <li key={line}>{line}</li>)}</ul></>}
        {deadline && <p className="applicant-university-detail__card-line">Deadline: <strong>{deadline}</strong></p>}
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Official page <ArrowUpRight size={16} aria-hidden="true" /></a>
      </li>;
    })}</ul>
  </div>;
}

export function StructuredCosts({ content }: { content: StructuredUniversityContent }) {
  if (!hasStructuredCosts(content)) return null;
  return <div className="applicant-university-detail__structured"><CostTable content={content} /><ScholarshipCards content={content} /></div>;
}

export function ApplicationStepper({ content }: { content: StructuredUniversityContent }) {
  const steps = [...content.applicationSteps].sort((a, b) => a.order - b.order);
  if (!steps.length) return null;
  const shared = sharedSource(steps);
  return <div className="applicant-university-detail__stepper-wrap">
    <ol className="applicant-university-detail__stepper">{steps.map((step, index) => {
      const deadline = formatDateText(step.deadline);
      return <li key={`${step.order}-${step.title}`}>
        <span className="applicant-university-detail__step-num" aria-hidden="true">{index + 1}</span>
        <div className="applicant-university-detail__step-body">
          <strong>{step.title}</strong>
          <span>{step.detail}</span>
          <span className="applicant-university-detail__step-meta">
            {deadline && <span className="applicant-university-detail__tag">{deadline}</span>}
            {step.url && <a href={step.url} target="_blank" rel="noopener noreferrer">Open <ArrowUpRight size={14} aria-hidden="true" /></a>}
            {!shared && <SourceLink src={step} />}
          </span>
        </div>
      </li>;
    })}</ol>
    <SourceLine items={steps} verifiedAt={content.verifiedAt} />
  </div>;
}

export function DeadlinesTable({ content }: { content: StructuredUniversityContent }) {
  const rows = content.deadlines;
  if (!rows.length) return null;
  const shared = sharedSource(rows);
  return <div className="applicant-university-detail__deadlines">
    <h3 className="applicant-university-detail__list-title">Deadlines{content.entryCycle ? ` · ${content.entryCycle}` : ""}</h3>
    <div className="applicant-university-detail__table-scroll">
      <table className="applicant-university-detail__deadline-table">
        <thead><tr><th scope="col">Round</th><th scope="col">Apply by</th><th scope="col">Decision</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.round}>
          <th scope="row">{row.round}{!shared && <SourceLink src={row} />}</th>
          <td>{formatDateText(row.applicationDeadline) ?? "—"}</td>
          <td>{formatDateText(row.decisionRelease) ?? "—"}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <SourceLine items={rows} verifiedAt={content.verifiedAt} />
  </div>;
}
