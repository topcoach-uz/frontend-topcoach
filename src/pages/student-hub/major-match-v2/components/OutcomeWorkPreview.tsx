import { ArrowUpRight, Bookmark, Check, MapPin, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Authored illustrative work, never a student's saved data or mentor feedback. */
export default function OutcomeWorkPreview({ kind }: { kind: number }) {
  const { t } = useTranslation();
  const copy = (key: string, fallback: string) => t(`majorMatch3.programs.workPreview.${key}`, fallback);
  return <div className={`mm3-work-preview mm3-work-preview--${kind}`}>
    <header><span>TOPCOACH / {copy('workbench', 'WORKBENCH')}</span><small>{copy('example', 'Illustrative example')}</small></header>
    {kind === 0 ? <>
      <div className="mm3-work-preview__screen"><div className="mm3-work-preview__screen-title"><Bookmark size={14} aria-hidden="true" /><strong>{copy('collegeList', 'My college list')}</strong></div>
        <div className="mm3-work-preview__shortlist">{[['REACH', 'Ambitious options'], ['MATCH', 'Well-aligned options'], ['SAFETY', 'Broader options']].map(([tier, label], index) => <div key={tier}><span className={`mm3-work-preview__tier mm3-work-preview__tier--${index}`}>{copy(`tier${index}`, tier)}</span><strong>{copy(`list${index}`, label)}</strong><ArrowUpRight size={12} aria-hidden="true" /></div>)}</div>
        <div className="mm3-work-preview__timeline"><span>{copy('research', 'Research')}</span><span>{copy('shortlist', 'Shortlist')}</span><span>{copy('prepare', 'Prepare')}</span></div>
      </div><p className="mm3-work-preview__annotation">{copy('planNote', 'A balanced list. A clear next move.')}<span aria-hidden="true">↗</span></p>
    </> : kind === 1 ? <>
      <div className="mm3-work-preview__research"><span>{copy('questionLabel', '01 / THE QUESTION')}</span><h5>{copy('question', 'What makes a city easier to walk in?')}</h5><p>{copy('questionDetail', 'Explore how street design shapes everyday journeys.')}</p><div className="mm3-work-preview__evidence"><span>{copy('observe', 'Observe')}</span><span>{copy('compare', 'Compare')}</span><span>{copy('write', 'Write')}</span></div></div>
      <div className="mm3-work-preview__review"><MessageCircle size={15} aria-hidden="true" /><div><strong>{copy('reviewLabel', 'Example review prompt')}</strong><p>{copy('reviewPrompt', 'Narrow your question. Which two streets could you compare?')}</p></div></div>
    </> : <>
      <div className="mm3-work-preview__project"><div className="mm3-work-preview__project-meta"><span>{copy('caseStudy', 'PROJECT / CASE STUDY')}</span><ArrowUpRight size={15} aria-hidden="true" /></div><h5>{copy('project', 'A better place to study')}</h5><p>{copy('projectBody', 'Designing a campus study-space finder.')}</p><div className="mm3-work-preview__project-map" aria-hidden="true"><span /><span /><span /><MapPin size={23} /><div><Check size={10} />{copy('quietSpace', 'Quiet space')}</div></div><div className="mm3-work-preview__project-process"><span>{copy('problem', 'Problem')}</span><span>{copy('prototype', 'Prototype')}</span><span>{copy('reflection', 'Reflection')}</span></div></div>
    </>}
  </div>;
}
