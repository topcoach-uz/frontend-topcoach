import { BriefcaseBusiness, Compass, Flag, Lightbulb, Puzzle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Mm3Major } from 'src/app/services/student-hub/majorMatchApi';

const signals = [
  { key: 'interests', label: 'Interests', Icon: Lightbulb },
  { key: 'skills', label: 'Skills', Icon: Puzzle },
  { key: 'workStyle', label: 'Work style', Icon: Compass },
  { key: 'goals', label: 'Goals', Icon: Flag },
] as const;

export default function MajorProfileOverview({ major }: { major: Mm3Major }) {
  const { t } = useTranslation();
  return <div className="mm3-results__profile-overview">
    <div className="mm3-results__profile-copy">
      <span className="mm3-results__eyebrow">{t('majorMatch3.results.closerLook', 'A closer look')}</span>
      <h3>{major.name}</h3>
      {major.why && <p className="mm3-results__profile-reason">{major.why}</p>}
      {major.about && <div className="mm3-results__profile-study"><h4>{t('majorMatch3.results.aboutTitle', 'What is {{name}}?', { name: major.name })}</h4><p>{major.about}</p></div>}
      {!!major.careers?.length && <div className="mm3-results__profile-careers">
        <h4><BriefcaseBusiness size={16} aria-hidden="true" />{t('majorMatch3.results.workLens', 'Work you could explore')}</h4>
        <div className="mm3-results__chips">{major.careers.map((career, index) => <span className="mm3-results__chip" key={index}>{career}</span>)}</div>
      </div>}
    </div>
    {major.breakdown && <div className="mm3-results__profile-signals">
      <div className="mm3-results__profile-signals-header"><h4>{t('majorMatch3.results.fitSignals', 'Your fit, in four signals')}</h4><span>{major.fitScore}<small>{t('majorMatch3.results.fitSuffix', '/100 FIT')}</small></span></div>
      <div className="mm3-results__signal-grid">{signals.map(({key, label, Icon}) => <div className="mm3-results__signal" key={key}>
        <Icon size={18} aria-hidden="true" /><span>{t(`majorMatch3.results.breakdown${key === 'workStyle' ? 'WorkStyle' : key[0].toUpperCase() + key.slice(1)}`, label)}</span>
        <strong>{major.breakdown![key]}<small>/100</small></strong>
        <div className="mm3-results__signal-track" aria-hidden="true"><span style={{width:`${Math.max(0, Math.min(100, major.breakdown![key]))}%`}} /></div>
      </div>)}</div>
      <p>{t('majorMatch3.results.breakdownNote', 'How your answers scored across four signals. This shows fit, not ability.')}</p>
    </div>}
  </div>;
}
