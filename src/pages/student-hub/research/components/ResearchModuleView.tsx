/**
 * Research Prep — single-week deep-dive.
 *
 * One full-width column of steps, in unlock order:
 *   1  Lessons          — player beside the lesson list and resources
 *   2  Knowledge check  — answer options in two columns on wide screens
 *   3  Assignment       — brief and requirements beside the submission
 *   Up next — the following week, locked or ready.
 *
 * The week title and status live in the page header (ResearchTopBar).
 */

import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import type {
  ResearchSubmission,
  ResearchWeek,
  WeekLockState,
} from 'src/app/services/research-prep';
import MaterialsColumn from './MaterialsColumn';
import KnowledgeCheckColumn from './KnowledgeCheckColumn';
import AssignmentColumn from './AssignmentColumn';

interface ResearchModuleViewProps {
  week: ResearchWeek;
  lock: WeekLockState;
  nextWeek?: ResearchWeek;
  mySubmissions: ResearchSubmission[];
  isFullSupport: boolean;
  onBookMentorReview?: (submissionId: string) => void;
  /** Opens another week (used by the "Go to Week N" button). */
  onOpenWeek?: (weekNumber: number) => void;
}

const ResearchModuleView: React.FC<ResearchModuleViewProps> = ({
  week,
  lock,
  nextWeek,
  mySubmissions,
  isFullSupport,
  onBookMentorReview,
  onOpenWeek,
}) => {
  const isComplete =
    lock.assignment.submissionStatus !== 'none' &&
    lock.assignment.submissionStatus !== 'returned_for_revision';

  return (
    <div className="rp-module">
      {/* One column: each step spans the full width, in unlock order. */}
      <div className="rp-module__steps">
        <MaterialsColumn
          weekId={week.id}
          weekLocked={lock.weekLocked}
          lessons={week.videoLessons}
          videoStates={lock.videos}
        />
        <KnowledgeCheckColumn weekId={week.id} quiz={week.quiz} lock={lock.quiz} />
        <AssignmentColumn
          weekId={week.id}
          weekNumber={week.weekNumber}
          assignment={week.assignment}
          lock={lock.assignment}
          submissions={mySubmissions.filter((s) => s.weekNumber === week.weekNumber)}
          isFullSupport={isFullSupport}
          onBookMentorReview={onBookMentorReview}
        />
      </div>

      {nextWeek && (
        <div className={`rp-upnext${isComplete ? ' is-ready' : ''}`}>
          <div className="rp-upnext__body">
            <span className="rp-upnext__label">Up next</span>
            <strong>
              Week {nextWeek.weekNumber} · {nextWeek.title}
            </strong>
            <small>
              {isComplete
                ? `Week ${week.weekNumber} is done. Week ${nextWeek.weekNumber} is ready when you are.`
                : `Pass the Week ${week.weekNumber} knowledge check and submit the assignment to unlock it.`}
            </small>
          </div>
          {isComplete ? (
            <button
              type="button"
              className="rp-btn rp-btn--primary"
              onClick={() => onOpenWeek?.(nextWeek.weekNumber)}
            >
              Go to Week {nextWeek.weekNumber}
              <ArrowRight size={16} aria-hidden />
            </button>
          ) : (
            <span className="rp-pill rp-pill--locked">
              <Lock size={11} aria-hidden /> Locked
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ResearchModuleView;
