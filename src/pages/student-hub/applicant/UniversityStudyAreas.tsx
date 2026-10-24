import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { VerifiedProgramLink } from 'src/app/services/universities';

type Major = { id: string; type?: string; name?: unknown };
type Field = { value: string; label: string };
export const normalizeStudyArea = (value: string) => value.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
const majorName = (name: unknown): string => typeof name === 'string' ? name : (name && typeof name === 'object' && 'en' in name && typeof name.en === 'string' ? name.en : '');
export function verifiedStudyAreaUrl(field: string, majors: readonly Major[], links: readonly VerifiedProgramLink[]): string | undefined {
  const ids = new Set(majors.filter(major => major.type === 'undergraduate' && normalizeStudyArea(majorName(major.name)) === normalizeStudyArea(field)).map(major => major.id));
  for (const link of links) {
    if (link.degreeLevel !== 'undergraduate' || !ids.has(link.majorId)) continue;
    try { const url = new URL(link.url); if (url.protocol === 'https:' && !url.username && !url.password) return link.url; } catch { /* Leave malformed sources unavailable. */ }
  }
  return undefined;
}
export function UniversityStudyAreas({ fields, majors, links = [], selectedField, universityId }: { fields: Field[]; majors: Major[]; links?: VerifiedProgramLink[]; selectedField: string; universityId?: string }) {
  if (!fields.length) return null;
  return <div className="applicant-university-detail__catalogue">
    <div className="applicant-university-detail__catalogue-note"><h3>Undergraduate study areas</h3><p>Open a study area to review available sources and plan your application. Detailed degree requirements are still being verified.</p></div>
    <div className="applicant-university-detail__catalogue-grid">{fields.map(field => {
      const href = verifiedStudyAreaUrl(field.value, majors, links);
      const matched = normalizeStudyArea(field.value) === normalizeStudyArea(selectedField);
      const content = <>{matched && <span>Matches selected field</span>}<strong>{field.label}</strong>{href ? <span className="applicant-university-detail__program-link">Official program <ArrowUpRight size={15} aria-hidden="true" /></span> : <small>Official program link not yet verified</small>}</>;
      const className = `applicant-university-detail__catalogue-field${matched ? ' applicant-university-detail__catalogue-field--match' : ''}`;
      const major = majors.find(item => item.type === 'undergraduate' && normalizeStudyArea(majorName(item.name)) === normalizeStudyArea(field.value));
      if (universityId && major) return <Link key={field.value} className={`${className} applicant-university-detail__catalogue-field--linked`} to={`/student-hub/universities/${universityId}/study-areas/${major.id}${selectedField ? '?field=' + encodeURIComponent(selectedField) : ''}`} aria-label={`${field.label} — view study area`}>{matched && <span>Matches selected field</span>}<strong>{field.label}</strong><span className="applicant-university-detail__program-link">View study area</span></Link>;
      return href ? <a key={field.value} className={`${className} applicant-university-detail__catalogue-field--linked`} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${field.label} — official undergraduate program (opens in a new tab)`}>{content}</a> : <div key={field.value} className={className}>{content}</div>;
    })}</div>
  </div>;
}
