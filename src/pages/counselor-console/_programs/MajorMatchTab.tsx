import { Suspense, lazy } from 'react';
import { ProgramSkeletonCard, ProgramTab } from './programChrome';

/**
 * Counselor-side AI Major Match.
 *
 * MAJOR_MATCH_V2_PLAN.md Stage 5 cutover: this tab now embeds
 * `MajorMatchV2Page` instead of the legacy `PsychometricAssessmentPage`.
 * v2 honors the same `readOnly`/`studentId` contract the legacy page did:
 * `readOnly` renders only a "view results" CTA (or an empty-state notice if
 * the student hasn't completed it) via MM2Intro — there is no way for a
 * counselor to start or retake an assessment through this tab, and
 * MM2Results likewise hides its retake action when `readOnly`. The backend
 * independently authorizes the read (major-match module ports the same
 * `canAccessStudentData` ownership-guard pattern the legacy controller
 * used), so this stays a thin pass-through rather than a re-implementation.
 *
 * Because it is a pass-through, it is the ONE program tab that does not own
 * its content's styling: the assessment page brings its own. What it does
 * share with its four siblings is the loading state — a counselor switching
 * between program tabs must not meet a different kind of "wait" on this one.
 *
 * Lazily loaded: the assessment page pulls in its own results/scoring tree,
 * which no other counselor tab needs in its chunk.
 */
const MajorMatchV2Page = lazy(() => import('../../student-hub/major-match-v2/MajorMatchV2Page'));

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
        <MajorMatchV2Page readOnly studentId={userId} />
      </Suspense>
    </ProgramTab>
  );
}
