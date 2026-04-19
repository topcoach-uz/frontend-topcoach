import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { Navigate } from 'react-router-dom';
import { useAdminConsole } from './AdminConsoleContext';
import './AdminConsoleLayout.scss';

const CentralAsianAdmissionsForumAdminLazy = lazy(
  () => import('src/pages/admin/central-asian-admissions-forum'),
);

/** CAAF admin: Owner / SuperAdmin only. Opened from Content & events (no separate sidebar item). */
export default function CaafAdminRoute() {
  const { role } = useAdminConsole();
  const allowed = role === 'Owner' || role === 'SuperAdmin';
  if (!allowed) {
    return <Navigate to="/new-admin/dashboard" replace />;
  }
  return (
    <div className="ac-caaf-admin-root">
      <Suspense
        fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
            <Spin size="large" />
          </div>
        }
      >
        <CentralAsianAdmissionsForumAdminLazy />
      </Suspense>
    </div>
  );
}
