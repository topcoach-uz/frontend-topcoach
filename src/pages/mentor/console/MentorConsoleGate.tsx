import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { MEDIA_TAGS } from 'src/app/api/Api';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetMentorRosterQuery } from 'src/app/services/fullSupportApi';
import { useTypedSelector } from 'src/app/store';
import { MentorConsoleProvider, type MentorConsoleUser } from './MentorConsoleContext';
import { cleanName } from './utils';

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

  // Detect Full Support participation by checking the mentor roster. Non-mentors
  // (e.g. SuperAdmin previewing) skip this fetch.
  const { data: rosterRes } = useGetMentorRosterQuery(undefined, {
    skip: !isAuthenticated || !isMentor,
  });
  const hasFullSupport = (rosterRes?.data?.length ?? 0) > 0;

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }
  if (profileLoading && !profileRole && !managementRole) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
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
    hasFullSupport,
  };

  return (
    <MentorConsoleProvider value={value}>
      <Outlet />
    </MentorConsoleProvider>
  );
}
