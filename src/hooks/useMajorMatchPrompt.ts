import { useMemo } from 'react';
import { useStudentProfile } from './useStudentHub';
import { useGetMajorMatchStatusQuery } from 'src/app/services/student-hub/majorMatchApi';
import { useCommunityAccessGate } from 'src/lib/communityAccess';

export const MAJOR_MATCH_PROMPT_CLOSED_KEY = 'topcoach_mm_prompt_closed';

/**
 * Shared derived state for the two "you haven't taken Major Match yet"
 * landing-page nudges (MajorMatchPromptModal + MajorMatchStickyBanner).
 * Both components call this independently — the underlying RTK Query hook
 * dedupes on identical args/skip, so mounting it twice in the same tree
 * costs nothing extra over the network (same pattern as StepAcademic and
 * AssessmentStart each independently calling useCommunityAccessGate()).
 *
 * MAJOR_MATCH_V2_PLAN.md Stage 5 cutover: this used to fan out to two
 * queries on the legacy `psychometricApi` slice — `getLatestAssessment` +
 * `getMajorMatchAccessStatus` — which shared that module's single bare
 * `'PsychometricAssessment'` RTK tag with 6 other queries and 4 mutations,
 * the documented cause of an app-wide runaway-refetch storm (this hook is
 * mounted unconditionally on every /student-hub/* route via
 * StudentHubLayout, so that storm ran continuously on every hub page load).
 * It now calls the ONE consolidated `/major-match/status/:studentProfileId`
 * endpoint on the new, properly tag-scoped `majorMatchApi` slice instead —
 * a single round trip, and a tag keyed by studentProfileId that nothing
 * else on the page can accidentally invalidate.
 *
 * "Completed" (plan §6 Q4 — an explicit human decision): a student who
 * completed the OLD/legacy engine must NOT be re-nagged to retake it on v2,
 * so this is `hasCompletedV2 || hasCompletedLegacy`, not v2-only. The
 * status endpoint reports both flags in the same response specifically so
 * this hook can make that call without a second request against the old
 * module. Finishing the (v2) assessment anywhere in the app invalidates
 * this same status tag, so `shouldPrompt` flips to false without a reload,
 * as long as a component using this hook stays mounted (StudentHubLayout
 * wraps every /student-hub route, including the psychometric-assessment
 * route itself, so that's satisfied for the lifetime of the session).
 */
export function useMajorMatchPromptState() {
  const { profile, isLoading: profileLoading } = useStudentProfile();
  const studentProfileId = profile?.id;

  const {
    data: status,
    isLoading: statusLoading,
  } = useGetMajorMatchStatusQuery(studentProfileId ?? '', {
    skip: !studentProfileId,
  });

  // Cheapest to mount unconditionally here rather than gating it behind the
  // used-attempt edge case — see StepAcademic.tsx's comment on the same
  // tradeoff. Both landing surfaces need `destination` any time they're
  // visible, not only in the rare used-attempt branch.
  const gate = useCommunityAccessGate();

  const hasCompletedAssessment = !!status && (status.hasCompletedV2 || status.hasCompletedLegacy);
  const loading = profileLoading || (!!studentProfileId && statusLoading);

  const canStart = status?.access?.canStart ?? true;
  const requiresCommunityEnrollment = !!status?.access?.requiresCommunityEnrollment;

  const destination = useMemo(
    () =>
      !canStart && requiresCommunityEnrollment
        ? gate.destination
        : '/student-hub?section=ai-major-match',
    [canStart, requiresCommunityEnrollment, gate.destination],
  );

  // Only meaningful once the profile has actually loaded and (if it
  // exists) the status query has settled — never true while anything is
  // still loading, and never true without a student profile at all
  // (matches the "never show for readOnly/counselor mounts" guard — those
  // never reach this hook, but a missing profile is an extra safety net).
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
