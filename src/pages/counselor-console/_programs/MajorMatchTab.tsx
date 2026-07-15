import { Suspense, lazy } from 'react';
import { ProgramSkeletonCard, ProgramTab } from './programChrome';

/**
 * Counselor-side AI Major Match.
 *
 * The student-facing PsychometricAssessmentPage already supports a counselor
 * view: `readOnly` skips the active-session and access-status queries, blocks
 * `handleStartAssessment`, short-circuits the session-recovery effect, and
 * hides the Delete action in AssessmentStart. The backend independently
 * authorises the read (psychometric-assessment.controller's
 * canAccessStudentData) and refuses deletes from non-owners. So this tab is a
 * thin pass-through rather than a re-implementation — one surface, one set of
 * bugs to fix.
 *
 * Because it is a pass-through, it is the ONE program tab that does not own its
 * content's styling: the assessment page brings its own. What it does share
 * with its four siblings is the loading state — a counselor switching between
 * program tabs must not meet a different kind of "wait" on this one.
 *
 * Lazily loaded: the assessment page pulls in the whole results/recharts tree,
 * which no other counselor tab needs in its chunk.
 */
const PsychometricAssessmentPage = lazy(
  () => import('../../student-hub/psychometric-assessment/PsychometricAssessmentPage'),
);

/* Major Match is an AI assessment rather than one of the five pinned programs,
   so it has no slot in CC_PROGRAM_COLOR. It borrows Admissions' identity for
   the shared chrome's accent — the only thing --cc-prog drives here is the
   skeleton's context, and inventing a sixth hue is exactly what the palette's
   own note forbids. The tab is named in the profile's tab strip. */
export default function MajorMatchTab({ userId }: { userId: string }) {
  return (
    <ProgramTab program="Admissions" className="cc-mm">
      <Suspense
        fallback={
          <>
            <ProgramSkeletonCard rows={2} />
            <ProgramSkeletonCard rows={6} />
          </>
        }
      >
        <PsychometricAssessmentPage readOnly studentId={userId} />
      </Suspense>
    </ProgramTab>
  );
}
