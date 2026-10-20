import { Check, LoaderCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MEMBERSHIP_BILLING_PATH } from 'src/lib/accountNavigation';
import type { ProfileMembership } from './profileMembershipModel';
import './profileMembership.scss';

export default function ProfileMembershipAction({
  membership,
  loading = false,
  unavailable = false,
  onNavigate,
}: {
  membership: ProfileMembership;
  loading?: boolean;
  unavailable?: boolean;
  onNavigate?: () => void;
}) {
  const { t, i18n } = useTranslation();
  if (loading)
    return (
      <div className="profile-membership" aria-busy="true">
        <span className="profile-membership__loading">
          {t('profileMembership.loading', 'Checking membership…')}
        </span>
      </div>
    );

  const date = membership.expiresAt
    ? new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(membership.expiresAt))
    : null;
  const active = membership.state === 'active';
  const pending = membership.state === 'pending';
  const label = unavailable
    ? t('accountNav.membership', 'Membership & billing')
    : active
      ? t('profileMembership.active', 'Community active')
      : pending
        ? t('profileMembership.pending', 'Payment pending')
        : membership.state === 'expired'
          ? t('profileMembership.renew', 'Renew Community')
          : t('profileMembership.join', 'Join Community');
  const detail = active
    ? date
      ? t('profileMembership.until', 'Until {{date}}', { date })
      : membership.throughOrganization
        ? t('profileMembership.organization', 'Through your organization')
        : t('profileMembership.manage', 'Manage membership')
    : pending
      ? t('profileMembership.check', 'Check status')
      : null;

  return (
    <div
      className="profile-membership"
      data-membership-state={unavailable ? 'unavailable' : membership.state}
    >
      <Link
        to={MEMBERSHIP_BILLING_PATH}
        onClick={onNavigate}
        className={`profile-membership__action ${!unavailable && (active || pending) ? 'profile-membership__status' : unavailable ? 'profile-membership__fallback' : 'profile-membership__join'}`}
        aria-label={[label, !unavailable && detail].filter(Boolean).join(' · ')}
      >
        {!unavailable && (
          <span className="profile-membership__symbol" aria-hidden="true">
            {active ? (
              <Check size={16} />
            ) : pending ? (
              <LoaderCircle size={14} />
            ) : (
              <UserPlus size={14} />
            )}
          </span>
        )}
        <span className="profile-membership__copy">
          <span className="profile-membership__label">{label}</span>
          {!unavailable && detail && (
            <span className="profile-membership__detail">{detail}</span>
          )}
        </span>
      </Link>
    </div>
  );
}
