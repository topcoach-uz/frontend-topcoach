import { Navigate, Outlet } from 'react-router-dom';
import Loader from 'src/components/loader';
import { MEDIA_TAGS } from 'src/app/api/Api';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMentorRosterQuery } from 'src/app/services/fullSupportApi';
import { useTypedSelector } from 'src/app/store';
import useOrgStaff from 'src/hooks/useOrgStaff';
import { MentorConsoleProvider, type MentorConsoleUser } from './MentorConsoleContext';
import { cleanName } from './utils';
import { isAccessDenied, rosterHasTool } from './programCapabilities';

function pickAvatarUrl(
  media: Array<{ tags?: string[] | null; url?: string; createdAt?: string }> | undefined,
): string | null {
  if (!media || media.length === 0) return null;
  const picks = media
    .filter((m) => m.tags?.includes(MEDIA_TAGS.ProfilePicture) || m.tags === null)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  return picks[0]?.url ?? null;
}

function canEnter(role: string | undefined, managementRole: string | undefined) {
  if (managementRole === 'Owner' || managementRole === 'SuperAdmin') return true;
  return role === 'Mentor';
}

export default function MentorConsoleGate() {
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const userProfile = useTypedSelector((state) => state.auth.profile);
  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const currentUser = userData || userProfile;
  const profileRole = (currentUser as { profile?: { role?: string } } | undefined)
    ?.profile?.role;
  const managementRole = (currentUser as { managementRole?: string } | undefined)
    ?.managementRole;
  const isMentor = profileRole === 'Mentor';

  // Detect program lesson capability through the mentor roster. Non-mentors
  // (e.g. SuperAdmin previewing) skip this fetch.
  const { currentData: rosterRes, error: rosterError } = useGetMentorRosterQuery(undefined, {
    skip: !isAuthenticated || !isMentor,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 30000,
  });
  const roster = isAccessDenied(rosterError) ? [] : rosterRes?.data ?? [];
  const hasProgramLessons = roster.some(student => rosterHasTool(student, 'lessons'));

  // Org owners/counselors belong in the organization console, even when their
  // personal profile role is Mentor (the invite flow makes that common). Note
  // useOrgStaff excludes platform staff, so a SuperAdmin previewing the mentor
  // console is NOT bounced out.
  const { isOrgStaff, isLoading: orgLoading } = useOrgStaff();

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }
  if ((profileLoading && !profileRole && !managementRole) || orgLoading) {
    return <Loader height="60vh" />;
  }
  if (isOrgStaff) {
    return <Navigate to="/counselor-console" replace />;
  }
  if (!canEnter(profileRole, managementRole)) {
    return <Navigate to="/" replace />;
  }

  const media = currentUser?.profile?.media as
    | Array<{ tags?: string[] | null; url?: string; createdAt?: string }>
    | undefined;

  const value: MentorConsoleUser = {
    id: currentUser?.id ?? '',
    email: currentUser?.email ?? '',
    displayName: cleanName(
      currentUser?.profile?.name ?? null,
      currentUser?.email ?? null,
    ),
    avatarUrl: pickAvatarUrl(media),
    managementRole: managementRole ?? null,
    isMentor,
    isSuperAdmin: managementRole === 'SuperAdmin' || managementRole === 'Owner',
    hasProgramLessons,
  };

  return (
    <MentorConsoleProvider value={value}>
      <Outlet />
    </MentorConsoleProvider>
  );
}
