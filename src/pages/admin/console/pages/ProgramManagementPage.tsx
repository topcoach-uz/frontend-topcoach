import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import ProgramDashboard from 'src/pages/admin/topcoach-management';

/** URL slug ↔ ProgramDashboard internal tab key. */
const SLUG_TO_TAB: Record<string, string> = {
  enrollments: 'users',
  analytics: 'analytics',
  organizations: 'organizations',
  'full-support': 'full_support',
  'research-prep': 'research_prep',
};

const TAB_TO_SLUG: Record<string, string> = {
  users: 'enrollments',
  analytics: 'analytics',
  organizations: 'organizations',
  full_support: 'full-support',
  research_prep: 'research-prep',
};

export default function AdminProgramManagementPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const slug = pathname.replace(/^\/new-admin\/programs\/?/, '').trim();
  const tab = SLUG_TO_TAB[slug];

  if (!tab) {
    return <Navigate to="/new-admin/programs/enrollments" replace />;
  }

  return (
    <ProgramDashboard
      embedInAdminConsole
      routeTab={tab}
      onRouteTabChange={(next) => {
        const nextSlug = TAB_TO_SLUG[next] ?? 'enrollments';
        navigate(`/new-admin/programs/${nextSlug}`, { replace: true });
      }}
    />
  );
}
