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
