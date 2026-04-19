import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';
import { AdminConsoleProvider } from './AdminConsoleContext';

function canEnterAdminConsole(managementRole: string | undefined) {
  return managementRole === 'Owner' || managementRole === 'SuperAdmin';
}

export default function AdminConsoleGate() {
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const userProfile = useTypedSelector((state) => state.auth.profile);
  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const currentUser = userData || userProfile;

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }
  if (profileLoading && !currentUser?.managementRole) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!canEnterAdminConsole(currentUser?.managementRole)) {
    return <Navigate to="/student-hub" replace />;
  }

  return (
    <AdminConsoleProvider>
      <Outlet />
    </AdminConsoleProvider>
  );
}
