import { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';

import { useAdminConsole } from './AdminConsoleContext';
import './AdminConsoleLayout.scss';

const TopcoachLaunchEventAdminLazy = lazy(
  () => import('src/pages/admin/topcoach-launch-event'),
);

/**
 * Top Coach Launch Event admin page wrapper. Owner / SuperAdmin only —
 * mirrors `CaafAdminRoute`. Mounted at `/new-admin/events/topcoach-launch-event`.
 */
export default function TopcoachLaunchEventAdminRoute() {
  const { role } = useAdminConsole();
  const allowed = role === 'Owner' || role === 'SuperAdmin';
  if (!allowed) {
    return <Navigate to="/new-admin/dashboard" replace />;
  }
  return (
    <div className="ac-caaf-admin-root">
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 320,
            }}
          >
            <Spin size="large" />
          </div>
        }
      >
        <TopcoachLaunchEventAdminLazy />
      </Suspense>
    </div>
  );
}
