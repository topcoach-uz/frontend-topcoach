import type { SubscriptionDto } from '../settings/subscription/types';
import type { StudentOrgMembership } from 'src/app/services/student-hub/orgMembershipApi';
import { hasActiveCommunityOrgMembership } from 'src/lib/communityOrgAccess';

export type ProfileMembership = {
  state: 'unpaid' | 'pending' | 'active' | 'expired';
  expiresAt: string | null;
  throughOrganization?: boolean;
};

type AccessSettings = {
  communityExperienceMode?: 'community' | 'standard';
  communityAccessExpiresAt?: string | null;
};

export function profileMembership({
  subscription,
  settings,
  memberships,
  now = Date.now(),
}: {
  subscription?: Pick<
    SubscriptionDto,
    'status' | 'currentPeriodEnd' | 'trialEndsAt'
  > | null;
  settings?: AccessSettings | null;
  memberships?: StudentOrgMembership[];
  now?: number;
}): ProfileMembership {
  if (hasActiveCommunityOrgMembership(memberships)) {
    return { state: 'active', expiresAt: null, throughOrganization: true };
  }

  const timestamp = (value?: string | null) => {
    const parsed = Date.parse(value ?? '');
    return Number.isFinite(parsed) ? parsed : null;
  };
  const directEnd = timestamp(settings?.communityAccessExpiresAt);
  const directGrant = settings?.communityExperienceMode === 'community';
  const liveDirect =
    directGrant &&
    (!settings?.communityAccessExpiresAt ||
      (directEnd !== null && directEnd > now));
  const subscriptionEnd = Math.max(
    timestamp(subscription?.currentPeriodEnd) ?? 0,
    timestamp(subscription?.trialEndsAt) ?? 0,
  );
  const liveSubscription =
    (subscription?.status === 'active' ||
      subscription?.status === 'trialing') &&
    (subscriptionEnd === 0 || subscriptionEnd > now);

  if (liveDirect || liveSubscription) {
    // An unlimited direct grant must not inherit an unrelated subscription's expiry.
    const unlimited = liveDirect && !settings?.communityAccessExpiresAt;
    const end = Math.max(
      liveDirect ? (directEnd ?? 0) : 0,
      liveSubscription ? subscriptionEnd : 0,
    );
    return {
      state: 'active',
      expiresAt: !unlimited && end ? new Date(end).toISOString() : null,
    };
  }
  // Only the server's pending subscription signals a payment in progress.
  // A return URL or browser storage flag never confirms a payment.
  if (subscription?.status === 'pending')
    return { state: 'pending', expiresAt: null };
  if (
    (directGrant && directEnd !== null && directEnd <= now) ||
    (subscriptionEnd > 0 && subscriptionEnd <= now) ||
    ['expired', 'canceled', 'past_due'].includes(subscription?.status ?? '')
  )
    return { state: 'expired', expiresAt: null };
  return { state: 'unpaid', expiresAt: null };
}
