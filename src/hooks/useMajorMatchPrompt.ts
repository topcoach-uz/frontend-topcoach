import { useMemo } from 'react';
import { useStudentProfile } from './useStudentHub';
import {
  useGetLatestAssessmentQuery,
  useGetMajorMatchAccessStatusQuery,
} from 'src/app/services/student-hub/psychometricApi';
import { useCommunityAccessGate } from 'src/lib/communityAccess';

export const MAJOR_MATCH_PROMPT_CLOSED_KEY = 'topcoach_mm_prompt_closed';

/**
 * Shared derived state for the two "you haven't taken Major Match yet"
 * landing-page nudges (MajorMatchPromptModal + MajorMatchStickyBanner).
 * Both components call this independently — the underlying RTK Query hooks
 * dedupe on identical args/skip, so mounting it twice in the same tree
 * costs nothing extra over the network (same pattern as StepAcademic and
 * AssessmentStart each independently calling useCommunityAccessGate()).
 *
 * "No completed assessment" = `getLatestAssessment` returning no data
 * (404 when the student has never completed one) — see psychometricApi.ts.
 * That query is tagged `PsychometricAssessment` and `completeAssessment`
 * invalidates the same tag, so finishing the assessment anywhere in the app
 * flips `shouldPrompt` to false without a reload, as long as a component
 * using this hook stays mounted (StudentHubLayout wraps every /student-hub
 * route, including the psychometric-assessment route itself, so that's
 * satisfied for the lifetime of the session).
 */
export function useMajorMatchPromptState() {
  const { profile, isLoading: profileLoading } = useStudentProfile();
  const studentProfileId = profile?.id;

  const {
    data: latestAssessment,
    isLoading: assessmentLoading,
  } = useGetLatestAssessmentQuery(studentProfileId ?? '', {
    skip: !studentProfileId,
  });

  const {
    data: accessStatus,
    isLoading: accessLoading,
  } = useGetMajorMatchAccessStatusQuery(studentProfileId ?? '', {
    skip: !studentProfileId,
  });

  // Cheapest to mount unconditionally here (2 extra queries) rather than
  // gating it behind the used-attempt edge case — see StepAcademic.tsx's
  // comment on the same tradeoff. Both landing surfaces need `destination`
  // any time they're visible, not only in the rare used-attempt branch.
  const gate = useCommunityAccessGate();

  const hasCompletedAssessment = !!latestAssessment;
  const loading = profileLoading || (!!studentProfileId && (assessmentLoading || accessLoading));

  const canStart = accessStatus?.canStart ?? true;
  const requiresCommunityEnrollment = !!accessStatus?.requiresCommunityEnrollment;

  const destination = useMemo(
    () =>
      !canStart && requiresCommunityEnrollment
        ? gate.destination
        : '/student-hub?section=ai-major-match',
    [canStart, requiresCommunityEnrollment, gate.destination],
  );

  // Only meaningful once the profile has actually loaded and (if it
  // exists) the assessment/access queries have settled — never true while
  // anything is still loading, and never true without a student profile at
  // all (matches the "never show for readOnly/counselor mounts" guard —
  // those never reach this hook, but a missing profile is an extra
  // safety net).
  const shouldPrompt = !profileLoading && !!studentProfileId && !loading && !hasCompletedAssessment;

  return {
    profile,
    studentProfileId,
    loading,
    hasCompletedAssessment,
    shouldPrompt,
    canStart,
    requiresCommunityEnrollment,
    destination,
  };
}
