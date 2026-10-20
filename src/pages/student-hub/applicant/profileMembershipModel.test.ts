import { describe, expect, it } from 'vitest';
import { profileMembership } from './profileMembershipModel';

const now = Date.parse('2026-10-20T12:00:00Z');
const end = '2026-11-18T12:00:00Z';
const past = '2026-10-19T12:00:00Z';

describe('profile membership status', () => {
  it('offers Community when no server entitlement or order exists', () => {
    expect(profileMembership({ now }).state).toBe('unpaid');
  });
  it('keeps a hosted Click order pending until server confirmation', () => {
    expect(
      profileMembership({
        now,
        subscription: {
          status: 'pending',
          currentPeriodEnd: null,
          trialEndsAt: null,
        },
      }).state,
    ).toBe('pending');
  });
  it('shows confirmed access and the actual paid-through date', () => {
    expect(
      profileMembership({
        now,
        subscription: {
          status: 'active',
          currentPeriodEnd: end,
          trialEndsAt: null,
        },
      }),
    ).toEqual({ state: 'active', expiresAt: end.replace('Z', '.000Z') });
  });
  it('does not advertise stale active subscriptions after their expiry', () => {
    expect(
      profileMembership({
        now,
        subscription: {
          status: 'active',
          currentPeriodEnd: past,
          trialEndsAt: null,
        },
      }).state,
    ).toBe('expired');
  });
  it('recognizes an expired hosted grant even when /subscriptions/current returns null', () => {
    expect(
      profileMembership({
        now,
        subscription: null,
        settings: {
          communityExperienceMode: 'community',
          communityAccessExpiresAt: past,
        },
      }).state,
    ).toBe('expired');
  });
  it('uses the later confirmed grant when two entitlements overlap', () => {
    expect(
      profileMembership({
        now,
        subscription: {
          status: 'active',
          currentPeriodEnd: '2026-10-25T12:00:00Z',
          trialEndsAt: null,
        },
        settings: {
          communityExperienceMode: 'community',
          communityAccessExpiresAt: end,
        },
      }).expiresAt,
    ).toBe(end.replace('Z', '.000Z'));
  });
  it('does not invent an expiry for unlimited direct access', () => {
    expect(
      profileMembership({
        now,
        settings: { communityExperienceMode: 'community' },
        subscription: {
          status: 'pending',
          currentPeriodEnd: null,
          trialEndsAt: null,
        },
      }),
    ).toEqual({ state: 'active', expiresAt: null });
  });
  it('keeps organization members active without asking them to pay again', () => {
    expect(
      profileMembership({
        now,
        memberships: [
          {
            role: 'student',
            status: 'active',
            joinedAt: null,
            organization: {
              id: 'school',
              name: 'School',
              logoUrl: null,
              slug: null,
              status: 'active',
            },
          },
        ],
      }),
    ).toEqual({ state: 'active', expiresAt: null, throughOrganization: true });
  });
  it('does not grant access from an archived organization membership', () => {
    expect(
      profileMembership({
        now,
        memberships: [
          {
            role: 'student',
            status: 'archived',
            joinedAt: null,
            organization: {
              id: 'school',
              name: 'School',
              logoUrl: null,
              slug: null,
              status: 'active',
            },
          },
        ],
      }).state,
    ).toBe('unpaid');
  });
  it('does not treat a malformed finite grant as active', () => {
    expect(
      profileMembership({
        now,
        settings: {
          communityExperienceMode: 'community',
          communityAccessExpiresAt: 'not-a-date',
        },
      }).state,
    ).not.toBe('active');
  });
});
