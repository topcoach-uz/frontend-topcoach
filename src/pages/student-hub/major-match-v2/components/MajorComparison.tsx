import { BookOpen, BriefcaseBusiness, ChevronDown, Columns3, FlaskConical, Fingerprint } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Mm3Major } from 'src/app/services/student-hub/majorMatchApi';
import MajorIllustration from './MajorIllustration';

/** Same report evidence in a desktop matrix and a readable mobile card layout. */
export default function MajorComparison({ majors }: { majors: Mm3Major[] }) {
  const { t } = useTranslation();
  const title = t('majorMatch3.results.compareTitle', 'Compare your possibilities');
  const lenses = [
    { key: 'study', label: t('majorMatch3.results.studyLens', 'What you would study'), Icon: BookOpen },
    { key: 'fit', label: t('majorMatch3.results.fitLens', 'Why it fits your answers'), Icon: Fingerprint },
    { key: 'work', label: t('majorMatch3.results.workLens', 'Work you could explore'), Icon: BriefcaseBusiness },
  ] as const;

  const evidence = (major: Mm3Major, lens: typeof lenses[number]['key']) => {
    if (lens === 'study') return major.about || t('majorMatch3.results.studyUnknown', 'Course details are not included in this report. Check a university course page.');
    if (lens === 'fit') return major.why || '—';
    return major.careers?.length ? <ul className="mm3-results__comparison-careers">{major.careers.map((career, index) => <li key={index}>{career}</li>)}</ul> : '—';
  };
  const heading = (major: Mm3Major) => <div className="mm3-results__comparison-major">
    <MajorIllustration name={major.name} />
    <div><strong>{major.name}</strong><span className="mm3-results__comparison-score">{major.fitScore} <small>{t('majorMatch3.results.fitSuffix', '/100 FIT')}</small></span></div>
  </div>;

  return <details className="mm3-results__comparison">
    <summary>
      <Columns3 size={21} aria-hidden="true" />
      <div><strong>{title}</strong><span>{t('majorMatch3.results.compareHint', 'Study, work & personal fit')}</span></div>
      <ChevronDown className="mm3-results__comparison-chevron" size={20} aria-hidden="true" />
    </summary>
    <div className="mm3-results__comparison-desktop">
      <div className="mm3-results__comparison-scroll" tabIndex={0} role="region" aria-label={title}>
        <table>
          <thead><tr><th scope="col" className="mm3-results__comparison-corner"><span>{t('majorMatch3.results.compareLens', 'Look through a different lens')}</span></th>{majors.map((major, index) => <th scope="col" key={index}>{heading(major)}</th>)}</tr></thead>
          <tbody>{lenses.map(({ key, label, Icon }) => <tr key={key}><th scope="row"><Icon size={19} aria-hidden="true" /><span>{label}</span></th>{majors.map((major, index) => <td key={index}>{evidence(major, key)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
    <div className="mm3-results__comparison-mobile">{majors.map((major, index) => <article key={index} aria-label={major.name}>
      <header>{heading(major)}</header>
      <dl>{lenses.map(({ key, label, Icon }) => <div key={key}><dt><Icon size={16} aria-hidden="true" />{label}</dt><dd>{evidence(major, key)}</dd></div>)}</dl>
    </article>)}</div>
    <div className="mm3-results__comparison-note"><FlaskConical size={20} aria-hidden="true" /><p>{t('majorMatch3.results.compareTest', 'Before choosing: try an introductory course or a small project in each direction. Notice which questions make you want to keep going.')}</p></div>
  </details>;
}
