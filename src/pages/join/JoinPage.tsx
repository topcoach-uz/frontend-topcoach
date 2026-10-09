import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Skeleton, message } from 'antd';
import {
  Building2,
  MailCheck,
  ShieldAlert,
  LogIn,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import dayjs from 'dayjs';

import { useTypedSelector } from 'src/app/store';
import {
  useGetInvitationByTokenQuery,
  useAcceptInvitationMutation,
} from 'src/app/services/publicInvitationsApi';
import { useGetMyOrgsQuery } from 'src/app/services/counselorConsoleApi';
import './JoinPage.scss';
import { useGetMyOrgMembershipQuery } from 'src/app/services/student-hub/orgMembershipApi';
import { findInvitedMembership } from './invitationMembership';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  counselor: 'Counselor',
  student: 'Student',
};

/** Staff roles land in the counselor console; only students belong in the hub. */
const isStaffRole = (role?: string | null) =>
  role === 'owner' || role === 'counselor';

const homeForRole = (role?: string | null) =>
  isStaffRole(role) ? '/counselor-console' : '/student-hub';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export default function JoinPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);

  const { data, isLoading, isError } = useGetInvitationByTokenQuery(token, {
    skip: !token,
  });
  const [acceptInvitation, { isLoading: accepting }] =
    useAcceptInvitationMutation();

  /**
   * The server auto-enrols an invitee on the authenticated email (see
   * OrgInvitationsService.onUserAuthenticated), so by the time someone returns
   * here after signing up + verifying, the invitation is usually ALREADY
   * `accepted` and `getPublicByToken` reports `valid: false`. Rendering the
   * "this invitation can't be used" dead end at that point is wrong twice
   * over: they are signed in, and they are already a member. Look up their
   * memberships so we can recognise that case and send them onward instead.
   */
  const { data: myOrgs, isLoading: orgsLoading } = useGetMyOrgsQuery(undefined, {
    skip: !isAuthenticated, refetchOnMountOrArgChange: true,
  });
  const { data: studentOrgs, isLoading: studentOrgsLoading } = useGetMyOrgMembershipQuery(undefined, {
    skip: !isAuthenticated, refetchOnMountOrArgChange: true,
  });

  const org = data?.organization;
  const orgName = org?.name ?? 'this organization';
  const roleLabel = data?.role ? ROLE_LABEL[data.role] ?? data.role : null;

  /** The invitee's existing membership in the invited org, if any. */
  const membership = useMemo(() => {
    return findInvitedMembership(data?.organization.id, [...(myOrgs ?? []), ...(studentOrgs ?? [])]);
  }, [data?.organization.id, myOrgs, studentOrgs]);

  /**
   * Show the "you're already in" exit instead of the accept/invalid states.
   * Guarded on the role: a pending invitation that would UPGRADE an existing
   * member (invited as counselor while already enrolled as a student) still
   * needs to be accepted, so don't swallow it.
   */
  const alreadyIn =
    !!membership && (!data?.valid || membership.role === data?.role);

  const invalidReason = useMemo(() => {
    if (!data) return null;
    if (data.valid) return null;
    if (data.status === 'accepted') return 'This invitation has already been accepted.';
    if (data.status === 'revoked') return 'This invitation has been revoked by the organization.';
    if (data.status === 'expired') return 'This invitation has expired.';
    if (data.expiresAt && dayjs(data.expiresAt).isBefore(dayjs()))
      return 'This invitation has expired.';
    return 'This invitation is no longer valid.';
  }, [data]);

  /**
   * Preserve the invitation through authentication and email verification.
   * The server also enrolls by verified email when the link opens on another device.
   * Staff use the same account registration endpoint; organization membership
   * determines counselor access and bypasses student onboarding.
   */
  const goToAuth = (mode: 'signup' | 'signin') => {
    const target = `/join/${encodeURIComponent(token)}`;
    try {
      localStorage.setItem('redirectAfterLogin', target);
    } catch {
      /* ignore private-mode write failures */
    }
    if (mode === 'signin') {
      navigate(`/auth/signin?redirect=${encodeURIComponent(target)}`);
      return;
    }
    const params = new URLSearchParams({ redirect: target });
    if (data?.email) params.set('email', data.email);
    if (orgName) params.set('org', orgName);
    if (data?.role) params.set('role', data.role);
    navigate(`/auth/signup/student?${params.toString()}`);
  };

  /** Leave the join flow for the surface this person's org role belongs to. */
  const goToConsole = (role?: string | null) => {
    try {
      localStorage.removeItem('redirectAfterLogin');
    } catch {
      /* ignore private-mode failures */
    }
    // Full reload rather than navigate(): the gates key off `/org/me`, which
    // may have been cached before the server auto-enrolled this user.
    window.location.href = homeForRole(role);
  };

  const handleAccept = async () => {
    if (!token) return;
    try {
      await acceptInvitation(token).unwrap();
      message.success(`You’ve joined ${orgName}.`);
      // Land where the invited ROLE belongs. Staff go to their console; only
      // students belong in the student hub. Sending a counselor to
      // /student-hub relied on StudentHubGate bouncing them back, which is a
      // visible detour at best — and silently fails whenever that gate's own
      // ordering disagrees.
      //
      // Full reload, not navigate(): membership is what every gate keys off,
      // and it was just created. A client-side transition would route on the
      // stale `/org/me` cache from before the accept and land them right back
      // in the student hub.
      goToConsole(data?.role);
    } catch (err: any) {
      const reason =
        err?.data?.message ||
        'Could not accept this invitation. Please try again.';
      message.error(String(reason));
    }
  };

  return (
    <div className="cc-join-page">
      <div className="cc-join-card">
        {isLoading ? (
          <div className="cc-join-loading">
            <Skeleton.Avatar active size={64} shape="square" />
            <Skeleton active paragraph={{ rows: 3 }} title />
          </div>
        ) : isError || !data ? (
          <div className="cc-join-state">
            <div className="cc-join-state-icon cc-join-state-icon--warn">
              <ShieldAlert size={26} />
            </div>
            <h1 className="cc-join-title">Invitation not found</h1>
            <p className="cc-join-lead">
              We couldn’t find this invitation. The link may be incomplete or the
              invitation may have been withdrawn.
            </p>
            <Button className="cc-join-secondary" onClick={() => navigate('/')}>
              Go to homepage
            </Button>
          </div>
        ) : isAuthenticated && (orgsLoading || studentOrgsLoading) ? (
          // Don't decide between "already a member" and "can't be used" until
          // the memberships are in — guessing early is exactly what produced
          // the dead end this branch exists to remove.
          <div className="cc-join-loading">
            <Skeleton.Avatar active size={64} shape="square" />
            <Skeleton active paragraph={{ rows: 3 }} title />
          </div>
        ) : alreadyIn && membership ? (
          <div className="cc-join-state">
            <div className="cc-join-state-icon cc-join-state-icon--ok">
              <CheckCircle2 size={26} />
            </div>
            <div className="cc-join-eyebrow">
              <span className="cc-join-eyebrow-accent">You’re in</span>
            </div>
            <h1 className="cc-join-title">You’ve already joined {orgName}</h1>
            <p className="cc-join-lead">
              Your account is connected to {orgName}
              {membership.role ? (
                <>
                  {' '}as a{' '}
                  <b>
                    {(ROLE_LABEL[membership.role] ?? membership.role).toLowerCase()}
                  </b>
                </>
              ) : null}
              . Nothing left to accept — head straight in.
            </p>
            <div className="cc-join-actions">
              <Button
                className="cc-join-primary"
                type="primary"
                onClick={() => goToConsole(membership.role)}
              >
                {isStaffRole(membership.role)
                  ? 'Go to your console'
                  : 'Go to your hub'}{' '}
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        ) : !data.valid ? (
          <div className="cc-join-state">
            <div className="cc-join-state-icon cc-join-state-icon--warn">
              <ShieldAlert size={26} />
            </div>
            <div className="cc-join-eyebrow">
              <span className="cc-join-eyebrow-accent">Invitation</span>
            </div>
            <h1 className="cc-join-title">This invitation can’t be used</h1>
            <p className="cc-join-lead">{invalidReason}</p>
            {/* Authenticated but not a member of the invited org — almost
                always someone signed in under a DIFFERENT address than the one
                invited, since the server enrols by matching the email. Offering
                them "Sign in" would be a no-op loop. */}
            {isAuthenticated ? (
              <>
                <p className="cc-join-help">
                  You’re signed in, but this account isn’t a member of {orgName}.
                  If you were invited at a different email address, sign in with
                  that one — or ask {orgName} to send a fresh invitation.
                </p>
                <div className="cc-join-actions">
                  <Button
                    className="cc-join-secondary"
                    onClick={() => navigate('/')}
                  >
                    Go to homepage
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="cc-join-help">
                  Ask {orgName} to send you a fresh invitation, or sign in if
                  you’ve already joined.
                </p>
                <div className="cc-join-actions">
                  <Button
                    className="cc-join-secondary"
                    onClick={() => goToAuth('signin')}
                  >
                    <LogIn size={16} /> Sign in
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="cc-join-brand">
              {org?.logoUrl ? (
                <img
                  className="cc-join-logo"
                  src={org.logoUrl}
                  alt={`${orgName} logo`}
                />
              ) : (
                <div className="cc-join-logo cc-join-logo--fallback" aria-hidden="true">
                  {org ? initials(org.name) : <Building2 size={26} />}
                </div>
              )}
            </div>

            <div className="cc-join-eyebrow">
              <span className="cc-join-eyebrow-accent">You’re invited</span>
            </div>
            <h1 className="cc-join-title">Join {orgName}</h1>
            <p className="cc-join-lead">
              {org?.name ?? 'This organization'} has invited{' '}
              <b>{data.inviteeName || data.email}</b> to join
              {roleLabel ? (
                <>
                  {' '}as a <b>{roleLabel.toLowerCase()}</b>
                </>
              ) : null}
              . Accept below to connect your account and start your journey.
            </p>

            <div className="cc-join-meta">
              <div className="cc-join-meta-row">
                <span className="cc-join-meta-label">Organization</span>
                <span className="cc-join-meta-value">{orgName}</span>
              </div>
              <div className="cc-join-meta-row">
                <span className="cc-join-meta-label">Invited email</span>
                <span className="cc-join-meta-value">{data.email}</span>
              </div>
              {roleLabel ? (
                <div className="cc-join-meta-row">
                  <span className="cc-join-meta-label">Role</span>
                  <span className="cc-join-meta-value">{roleLabel}</span>
                </div>
              ) : null}
              {data.expiresAt ? (
                <div className="cc-join-meta-row">
                  <span className="cc-join-meta-label">Expires</span>
                  <span className="cc-join-meta-value">
                    {dayjs(data.expiresAt).format('MMM D, YYYY')}
                  </span>
                </div>
              ) : null}
            </div>

            {isAuthenticated ? (
              <div className="cc-join-actions">
                <Button
                  className="cc-join-primary"
                  type="primary"
                  loading={accepting}
                  onClick={handleAccept}
                >
                  <CheckCircle2 size={16} /> Accept invitation
                </Button>
              </div>
            ) : (
              <>
                <div className="cc-join-actions">
                  <Button
                    className="cc-join-primary"
                    type="primary"
                    onClick={() => goToAuth('signup')}
                  >
                    Accept invitation <ArrowRight size={16} />
                  </Button>
                </div>
                <div className="cc-join-signin">
                  <MailCheck size={14} />
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="cc-join-signin-link"
                    onClick={() => goToAuth('signin')}
                  >
                    Sign in
                  </button>{' '}
                  to accept.
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
