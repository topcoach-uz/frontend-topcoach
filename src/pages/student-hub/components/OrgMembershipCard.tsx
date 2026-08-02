/**
 * Org Membership Card
 * Ambient, informational card shown at the top of My Journey when the student
 * belongs to an organization. Renders nothing for students with no org
 * membership (the vast majority), while loading, or on fetch error.
 */

import React from 'react';
import { Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { useGetMyOrgMembershipQuery } from '../../../app/services/student-hub/orgMembershipApi';
import './OrgMembershipCard.scss';

interface OrgMembershipCardProps {
  /** When true, do not fetch or render (e.g. read-only / counselor view) */
  skip?: boolean;
}

/** "Springfield High School" -> "SH" */
const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

const OrgMembershipCard: React.FC<OrgMembershipCardProps> = ({ skip }) => {
  const { t } = useTranslation();
  const {
    data: memberships,
    isLoading,
    isError,
    error,
  } = useGetMyOrgMembershipQuery(undefined, { skip: !!skip });

  // Ambient info: stay silent while loading, on error, and when there is no
  // membership. Never render a placeholder or an error box.
  //
  // Silence is right for the user but was miserable to debug: a 404 from a
  // backend that predates GET /org/my-membership looked identical to "this
  // student has no organization", and cost real time working out which it was.
  // Announce the failure to the console in development only.
  if (isError && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      '[OrgMembershipCard] hidden because GET /org/my-membership failed. ' +
        'A 404 usually means the backend is older than this endpoint.',
      error,
    );
  }

  if (skip || isLoading || isError) return null;
  if (!memberships?.length) return null;

  // A student can belong to more than one organization: the membership unique
  // index is (organization, user), not user alone, so render one card each
  // rather than silently hiding all but the first.
  return (
    <div style={{ marginBottom: 24 }}>
      {memberships
        .filter((membership) => !!membership.organization)
        .map(({ organization: org }) => (
          <Card size="small" className="org-membership-card" key={org.id}>
            <div className="org-membership-body">
              {org.logoUrl ? (
                <img
                  className="org-membership-logo"
                  src={org.logoUrl}
                  alt={t('studentHub.orgMembership.logoAlt', '{{orgName}} logo', {
                    orgName: org.name,
                  })}
                />
              ) : (
                <div
                  className="org-membership-logo org-membership-logo--fallback"
                  aria-hidden="true"
                >
                  {initials(org.name)}
                </div>
              )}

              <div className="org-membership-text">
                <p className="org-membership-title">{org.name}</p>
                <p className="org-membership-subtitle">
                  {t(
                    'studentHub.orgMembership.subtitle',
                    "You're a member of this organization."
                  )}
                </p>
              </div>
            </div>
          </Card>
        ))}
    </div>
  );
};

export default OrgMembershipCard;
