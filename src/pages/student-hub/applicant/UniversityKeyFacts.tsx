import { ArrowUpRight } from "lucide-react";
import type { KeyFactRow } from "./universityKeyFactsModel";

const External = ({ url, children }: { url: string; children: React.ReactNode }) =>
  <a href={url} target="_blank" rel="noopener noreferrer">{children} <ArrowUpRight size={14} aria-hidden="true" /></a>;

export function UniversityKeyFacts({ rows }: { rows: KeyFactRow[] }) {
  if (!rows.length) return null;
  return <aside className="applicant-university-detail__facts" aria-labelledby="university-key-facts-title">
    <h2 id="university-key-facts-title">Key facts</h2>
    <dl>
      {rows.map((row) => <div className="applicant-university-detail__fact" key={row.id}>
        <dt>{row.label}</dt>
        <dd>
          {row.note && <p className="applicant-university-detail__fact-note">{row.note}</p>}
          {row.lines?.map((line, i) => <p key={i}>{line.text}{line.note && <span className="applicant-university-detail__fact-note"> · {line.note}</span>}{line.link && <> <External url={line.link.url}>{line.link.label}</External></>}</p>)}
          {row.chips && <ul className="applicant-university-detail__fact-chips">{row.chips.map((chip) => <li key={chip}>{chip}</li>)}</ul>}
          {row.links?.map((link) => <p key={link.url}><External url={link.url}>{link.label}</External></p>)}
        </dd>
      </div>)}
    </dl>
  </aside>;
}
