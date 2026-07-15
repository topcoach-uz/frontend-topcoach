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
import './JoinPage.scss';

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  counselor: 'Counselor',
  student: 'Student',
};

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

  const org = data?.organization;
  const orgName = org?.name ?? 'this organization';
  const roleLabel = data?.role ? ROLE_LABEL[data.role] ?? data.role : null;

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
   * Send the invitee to auth, carrying the invitation with them.
   *
   * `redirectAfterLogin` is best-effort only — it does NOT survive the signup →
   * email-verification hop, and it obviously can't follow someone who opens the
   * link on another device. Membership no longer depends on it: the server
   * auto-enrols on the authenticated email (see OrgInvitationsService
   * .onUserAuthenticated). This just gets them back here when it does work.
   *
   * Signup goes STRAIGHT to the student form, skipping /auth/signup's
   * Student-or-Mentor chooser. Asking a counselor to pick is nonsense, and the
   * choice is irrelevant: the org role comes from the invitation, and the gates
   * route on org membership rather than the profile role. The invited email is
   * passed through so the form can lock it — registering with a different
   * address is what silently breaks the enrolment.
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
    navigate(`/auth/signup/student?${params.toString()}`);
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
      const isStaff = data?.role === 'owner' || data?.role === 'counselor';
      window.location.href = isStaff ? '/counselor-console' : '/student-hub';
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
            <p className="cc-join-help">
              Ask {orgName} to send you a fresh invitation, or sign in if you’ve
              already joined.
            </p>
            <div className="cc-join-actions">
              <Button className="cc-join-secondary" onClick={() => goToAuth('signin')}>
                <LogIn size={16} /> Sign in
              </Button>
            </div>
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
