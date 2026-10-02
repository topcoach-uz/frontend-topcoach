import { ArrowRight, BookOpen, BriefcaseBusiness, ChevronDown, Coins, GraduationCap, Route } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Mm3University } from 'src/app/services/student-hub/majorMatchApi';

/** Display report evidence as supplied; no inferred eligibility or net-cost math. */
export default function UniversityDetailContent({ university }: { university: Mm3University }) {
  const { t } = useTranslation();
  return <>
    {university.whyFit && <section className="mm3-university__match-story">
      <div className="mm3-university__story-heading"><h4>{t('majorMatch3.results.whyFitLabel', 'Why this fits you:')}</h4><span>{t('majorMatch3.results.fromYourReport', 'From your match report')}</span></div>
      <div className="mm3-university__match-map">
        <div><span className="mm3-university__map-label">{t('majorMatch3.results.matchProgramme', 'The programme')}</span><strong>{university.matchedMajor}</strong></div>
        <ArrowRight size={18} aria-hidden="true" />
        <div><span className="mm3-university__map-label">{t('majorMatch3.results.matchRationale', 'The connection')}</span><p>{university.whyFit}</p></div>
        {university.roadmap?.[0]?.actions?.[0] && <><ArrowRight size={18} aria-hidden="true" /><div><span className="mm3-university__map-label">{t('majorMatch3.results.matchFirstStep', 'A first step')}</span><p>{university.roadmap[0].actions[0]}</p></div></>}
      </div>
    </section>}
    <div className="mm3-university__costs">
      <section className="mm3-university__tuition"><span className="mm3-university__section-icon"><Coins size={20} aria-hidden="true" /></span><h4>{t('majorMatch3.results.tuitionLabel', 'Tuition (our records)')}</h4>
        <strong>{university.tuitionUnreliable ? t('majorMatch3.results.tuitionUnreliable', 'See official page (figure under review)') : university.tuition ?? t('majorMatch3.results.tuitionUnknown', 'See official page')}</strong>
        <p>{t('majorMatch3.results.costVerify', 'Confirm current fees and additional costs on the official university website.')}</p>
      </section>
      <section className="mm3-university__aid"><span className="mm3-university__section-icon"><GraduationCap size={20} aria-hidden="true" /></span><h4>{t('majorMatch3.results.potentialAid', 'Potential financial aid')}</h4>
        {university.scholarships?.length ? <ul>{university.scholarships.map((aid, index) => <li key={index}>{aid.amount && <strong>{aid.amount}</strong>}<p>{aid.text}</p></li>)}</ul> : <p>{t('majorMatch3.results.aidUnknown', 'No scholarship details are included in this report. Check the official funding page.')}</p>}
        <small>{t('majorMatch3.results.aidNotGuaranteed', 'Not guaranteed. Eligibility and awards require separate confirmation.')}</small>
      </section>
    </div>
    <div className="mm3-university__application-grid">
      {!!university.requirements?.length && <section className="mm3-university__essentials"><h4><BookOpen size={20} aria-hidden="true" />{t('majorMatch3.results.requirementsLabel', 'Requirements for your intake')}</h4><p className="mm3-university__section-note">{t('majorMatch3.results.requirementsNotChecklist', 'University requirements—not a checklist of what you have completed.')}</p>
        <dl>{university.requirements.map((requirement, index) => <div key={index}><dt>{requirement.label}</dt><dd>{requirement.value}</dd></div>)}</dl>
      </section>}
      {!!university.roadmap?.length && <section className="mm3-university__roadmap"><h4><Route size={20} aria-hidden="true" />{t('majorMatch3.results.uniRoadmapLabel', 'Your roadmap to {{name}}', {name: university.name})}</h4>
        <ol>{university.roadmap.map((phase, index) => <li key={index}><span className="mm3-university__phase-number" aria-hidden="true">{index + 1}</span><div><h5>{phase.when}</h5><ul>{phase.actions.map((action, ai) => <li key={ai}>{action}</li>)}</ul></div></li>)}</ol>
      </section>}
    </div>
    <div className="mm3-university__extras">
      {!!university.professors?.length && <details><summary><GraduationCap size={19} aria-hidden="true" />{t('majorMatch3.results.professorsLabel', 'Professors & labs')}<ChevronDown size={16} aria-hidden="true" /></summary><div>{university.professors.map((professor, index) => <article key={index}><strong>{professor.profileUrl ? <a href={professor.profileUrl} target="_blank" rel="noopener noreferrer">{professor.name}</a> : professor.name}</strong><p>{[professor.title, professor.researchArea].filter(Boolean).join(' · ')}</p></article>)}</div></details>}
      {!!university.employers?.length && <details><summary><BriefcaseBusiness size={19} aria-hidden="true" />{t('majorMatch3.results.employersLabel', 'Where graduates get hired')}<ChevronDown size={16} aria-hidden="true" /></summary><div>{university.employers.map((employer, index) => <article key={index}><strong>{employer.companyName}</strong><p>{[employer.industry, employer.note].filter(Boolean).join(' · ')}</p></article>)}</div></details>}
    </div>
  </>;
}
