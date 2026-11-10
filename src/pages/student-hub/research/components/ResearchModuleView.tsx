/**
 * Research Prep — single-week deep-dive view.
 *
 * Three-column layout:
 *   ┌──────────────────┬──────────────────┬──────────────────┐
 *   │  Learning        │  Knowledge       │  Assignment      │
 *   │  Materials       │  Check (quiz)    │  Submission      │
 *   └──────────────────┴──────────────────┴──────────────────┘
 *
 * Plus a "UP NEXT — Complete Week N to unlock" banner at the bottom.
 */

import React from 'react';
import { FileText, FlaskConical, Sparkles, ArrowRight } from 'lucide-react';
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
  const totalResources = week.videoLessons.reduce((a, v) => a + v.attachments.length, 0);
  const isComplete = lock.assignment.submissionStatus !== 'none' && lock.assignment.submissionStatus !== 'returned_for_revision';
  const status =
    lock.weekLocked
      ? 'Locked'
      : lock.assignment.submissionStatus === 'graded'
        ? 'Complete'
        : lock.assignment.submissionStatus === 'submitted'
          ? 'Submitted'
          : lock.assignment.submissionStatus === 'returned_for_revision'
            ? 'Revision'
            : 'In Progress';

  const statusCls =
    status === 'Complete'
      ? 'rp-module-status--complete'
      : status === 'Locked'
        ? 'rp-module-status--locked'
        : '';

  return (
    <div className="rp-module">
      <div className="rp-module-head">
        <div className="rp-module-title-row">
          <h1 className="rp-module-title">
            Week {week.weekNumber}: {week.title}
          </h1>
          <span className={`rp-module-status ${statusCls}`}>{status}</span>
        </div>
        <div className="rp-module-meta">
          <span className="meta-item">
            <FileText size={13} /> {totalResources} Resource{totalResources === 1 ? '' : 's'}
          </span>
          <span className="meta-item">
            <Sparkles size={13} /> {week.quiz.questions.length} Quiz
          </span>
          <span className="meta-item">
            <FlaskConical size={13} /> 1 Assignment
          </span>
        </div>
      </div>

      <div className="rp-module-grid">
        <MaterialsColumn
          weekId={week.id}
          weekLocked={lock.weekLocked}
          lessons={week.videoLessons}
          videoStates={lock.videos}
        />
        <KnowledgeCheckColumn
          weekId={week.id}
          quiz={week.quiz}
          lock={lock.quiz}
        />
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

      {/* UP NEXT — only if there's a next week and current isn't fully complete */}
      {nextWeek && !isComplete && (
        <div className="rp-upnext">
          <div className="label">↑ Up Next — Complete Week {week.weekNumber} to Unlock</div>
          <div className="body">
            <div className="title">
              Week {nextWeek.weekNumber} — {nextWeek.title}
            </div>
            <div className="sub">
              Complete the Week {week.weekNumber} quiz and submit your assignment to unlock this
              module.
            </div>
          </div>
          <span className="end-cta">Locked</span>
        </div>
      )}
      {nextWeek && isComplete && (
        <div className="rp-upnext">
          <div className="label">↑ Up Next — Ready</div>
          <div className="body">
            <div className="title">
              Week {nextWeek.weekNumber} — {nextWeek.title}
            </div>
            <div className="sub">
              Week {week.weekNumber} complete. Open Week {nextWeek.weekNumber} to continue.
            </div>
          </div>
          <button
            type="button"
            className="end-cta end-cta--go"
            onClick={() => onOpenWeek?.(nextWeek.weekNumber)}
          >
            Go to Week {nextWeek.weekNumber}
            <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
};

export default ResearchModuleView;
