/**
 * Feed access — mirrors the backend gate at
 *   src/modules/community-feed/guards/community-enrollment.guard.ts
 *
 * The feed is open to every community-enrolled user (pass the
 * `isCommunityEnrolled` flag from `useJourneyExperience()`). Staff
 * (SuperAdmin) keep access without enrollment so they can post and
 * moderate. If the frontend shows Feed to someone the backend rejects,
 * they see a 403 when they click it — keep both sides in sync.
 */
export const isFeedAllowed = (
  profile: {
    managementRole?: string | null;
    email?: string | null;
  } | null | undefined,
  isCommunityEnrolled?: boolean,
): boolean => {
  if (isCommunityEnrolled) return true;
  return profile?.managementRole === 'SuperAdmin';
};
