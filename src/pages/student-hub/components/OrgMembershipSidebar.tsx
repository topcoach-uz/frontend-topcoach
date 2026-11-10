/**
 * Org Membership (sidebar)
 *
 * Shown under the profile card in the student hub sidebar, so a student who
 * belongs to an organization sees it on every page of the hub rather than on
 * one screen they may never open.
 *
 * This replaces the placement in the legacy `Dashboard.tsx`, which stopped
 * rendering when the hub moved to the editorial layout: `<Dashboard />` was
 * swapped for `<MyProgressEditorialView />` and nothing imports it any more,
 * so `OrgMembershipCard` became unreachable. The endpoint and the data were
 * fine the whole time; only the mount point was gone.
 *
 * Unlike the old card this one does NOT stay silent on error. Silence made a
 * failed request indistinguishable from "no organization", which is exactly
 * how the previous placement went unnoticed. A student who IS in an org should
 * not be told nothing because a request failed.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Eye } from 'lucide-react';
import { useGetMyOrgMembershipQuery } from '../../../app/services/student-hub/orgMembershipApi';
import './OrgMembershipSidebar.scss';

interface OrgMembershipSidebarProps {
  /** When true, do not fetch or render (read-only / staff preview). */
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

/** "Mar 2026", or null when the backend has no join date on the row. Short
    month so "Member since …" fits one line in the narrow sidebar. */
const joinedLabel = (joinedAt: string | null): string | null => {
  if (!joinedAt) return null;
  const date = new Date(joinedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
};

const OrgMembershipSidebar: React.FC<OrgMembershipSidebarProps> = ({
  skip,
}) => {
  const { t } = useTranslation();
  const {
    data: memberships,
    isLoading,
    isError,
  } = useGetMyOrgMembershipQuery(undefined, { skip: !!skip });

  if (skip || isLoading) return null;

  // A student with no organization is the common case and gets nothing. An
  // error is different: we do not know whether they have one, so say that
  // rather than implying they have none.
  if (isError) {
    return (
      <div className="org-side org-side--error">
        <p className="org-side-fallback">
          {t(
            'studentHub.orgMembership.loadFailed',
            'Your organization details could not be loaded just now.',
          )}
        </p>
      </div>
    );
  }

  const rows = (memberships ?? []).filter((m) => !!m.organization);
  if (!rows.length) return null;

  return (
    <div className="org-side">
      {rows.map(({ organization: org, joinedAt }) => {
        const joined = joinedLabel(joinedAt);
        return (
          <div className="org-side-item" key={org.id}>
            <div className="org-side-head">
              {org.logoUrl ? (
                <img
                  className="org-side-logo"
                  src={org.logoUrl}
                  alt={t(
                    'studentHub.orgMembership.logoAlt',
                    '{{orgName}} logo',
                    { orgName: org.name },
                  )}
                />
              ) : (
                <div
                  className="org-side-logo org-side-logo--fallback"
                  aria-hidden="true"
                >
                  {initials(org.name) || <Building2 size={16} />}
                </div>
              )}
              <div className="org-side-headtext">
                <p className="org-side-name" title={org.name}>
                  {org.name}
                </p>
                <p className="org-side-meta">
                  {joined
                    ? t('studentHub.orgMembership.memberSince', 'Member since {{joined}}', { joined })
                    : t('studentHub.orgMembership.eyebrow', 'Your organization')}
                </p>
              </div>
            </div>

            {/* What membership means in practice. A student should not have
                to infer that staff can see their work. */}
            <p className="org-side-body">
              <Eye size={13} aria-hidden="true" />
              <span>
                {t(
                  'studentHub.orgMembership.visibility',
                  'Your counselors can see your progress, programs, tasks and sessions.',
                )}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default OrgMembershipSidebar;
