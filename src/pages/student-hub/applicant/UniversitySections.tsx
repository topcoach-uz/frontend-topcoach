import type { GlanceTile, KeyFactRow } from "./universityKeyFactsModel";

export function UniversityGlance({ tiles }: { tiles: GlanceTile[] }) {
  if (!tiles.length) return null;
  return <section className="applicant-university-detail__glance" aria-label="At a glance">
    <dl>{tiles.map((tile) => <div className="applicant-university-detail__tile" key={tile.id}>
      <dt>{tile.label}</dt><dd>{tile.value}</dd>{tile.sub && <small>{tile.sub}</small>}
    </div>)}</dl>
  </section>;
}

export function UniversityAdmissions({ deadlines, exams }: { deadlines: KeyFactRow[]; exams: string[] }) {
  if (!deadlines.length && !exams.length) return null;
  return <section className="applicant-university-detail__admissions">
    <h2>Admissions</h2>
    <dl className="applicant-university-detail__admissions-grid">
      {deadlines.length > 0 && <div>
        {deadlines.map((row) => <div className="applicant-university-detail__admissions-group" key={row.id}>
          <dt>{row.id === "deadlines" ? "Deadlines" : row.label}</dt>
          <dd>{row.note && <small>{row.note}</small>}{row.lines?.map((line, i) => <p key={i}>{line.text}{line.note && <span> · {line.note}</span>}</p>)}</dd>
        </div>)}
      </div>}
      {exams.length > 0 && <div><dt>Required exams</dt><dd><ul className="applicant-university-detail__fact-chips">{exams.map((exam) => <li key={exam}>{exam}</li>)}</ul></dd></div>}
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
