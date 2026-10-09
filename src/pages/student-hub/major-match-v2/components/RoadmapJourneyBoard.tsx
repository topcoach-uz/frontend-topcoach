import { ArrowUpRight, Compass, FlaskConical, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Mm3RoadmapPhase } from 'src/app/services/student-hub/majorMatchApi';
import { renderEmphasis } from '../renderEmphasis';
import { journeyStage } from '../journeyStage';
import JourneyStageIllustration from './JourneyStageIllustration';

// Optional shortcuts to existing tools. They do not execute or complete a task.
function relatedTool(action: string) {
  if (/mentor|coach/i.test(action)) return { href: '#mm3-mentor-suggestions', label: 'Explore mentors' };
  if (/essay|statement|draft/i.test(action)) return { href: '/student-hub/essays', label: 'Open essays' };
  if (/document|transcript|certificate/i.test(action)) return { href: '/student-hub/documents', label: 'Open documents' };
  if (/application|submission/i.test(action) && !/universit|college|requirement/i.test(action)) return { href: '/student-hub/applications', label: 'Open applications' };
  if (/universit|college|shortlist|requirement/i.test(action)) return { href: '/student-hub/universities', label: 'Explore universities' };
  if (/project|lesson|course|research/i.test(action)) return { href: '/learning', label: 'Explore learning' };
  if (/major|match|direction/i.test(action)) return { href: '#mm3-matches', label: 'Compare directions' };
  return null;
}

export default function RoadmapJourneyBoard({ phases, readOnly = false }: { phases: Mm3RoadmapPhase[]; readOnly?: boolean }) {
  const { t } = useTranslation();
  const next = phases.flatMap(phase => phase.actions ?? []).find(action => action.trim());
  const tool = next ? relatedTool(next) : null;
  const shortcut = (href: string, label: string) => href.startsWith('#')
    ? <a href={href}>{t(`majorMatch3.board.tool.${label}`, label)} <ArrowUpRight size={15} aria-hidden="true" /></a>
    : <Link to={href}>{t(`majorMatch3.board.tool.${label}`, label)} <ArrowUpRight size={15} aria-hidden="true" /></Link>;
  return <div className="mm3-results__journey-board">
    {next && <div className="mm3-results__move-spotlight">
      <div className="mm3-results__move-art" aria-hidden="true"><Compass size={46} /><Sparkles size={20} /></div>
      <div><div className="mm3-results__eyebrow">{t('majorMatch3.board.nextEyebrow', 'Your next move')}</div><h3>{renderEmphasis(next)}</h3><p>{t('majorMatch3.board.nextNote', 'Start with this suggestion from your report. You do not need to tackle everything at once.')}</p></div>
      {!readOnly && tool && shortcut(tool.href, tool.label)}
    </div>}
    <div className="mm3-results__board-intro"><strong>{t('majorMatch3.board.title', 'The bigger picture')}</strong><span>{t('majorMatch3.board.note', 'Every stage is open. These are suggestions, not tracked completion.')}</span></div>
    <ol className="mm3-results__board-columns">
      {phases.map((phase, index) => {
        const stage = journeyStage(phase.when, phase.actions);
        return <li className={`mm3-results__board-stage mm3-results__board-stage--${index % 4}`} key={index}>
          <header><span className="mm3-results__board-number">{String(index + 1).padStart(2, '0')}</span><JourneyStageIllustration kind={stage.kind} /><h3>{stage.kind === 'plan' ? stage.label : t(`majorMatch3.results.journey${stage.label}`, stage.label)}</h3>{stage.detail && <p className="mm3-results__stage-detail">{stage.detail}</p>}</header>
          <ul>{(phase.actions ?? []).map((action, actionIndex) => {
            const related = relatedTool(action);
            return <li className="mm3-results__board-action" key={actionIndex}><p>{renderEmphasis(action)}</p>{!readOnly && related && shortcut(related.href, related.label)}</li>;
          })}</ul>
        </li>;
      })}
    </ol>
    <div className="mm3-results__board-reflection"><FlaskConical size={24} aria-hidden="true" /><div><strong>{t('majorMatch3.board.reflectTitle', 'Leave room for discovery.')}</strong><p>{t('majorMatch3.board.reflectBody', 'As you explore, ask yourself: what made me curious, what felt difficult, and what would I like to try again? Your direction can change as you learn.')}</p></div></div>
  </div>;
}
