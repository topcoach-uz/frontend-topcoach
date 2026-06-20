import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';

const ALLOWED = ['Reviewer', 'SuperAdmin', 'Owner'];

/** Gate for the ISC reviewer console — Reviewer role (or a superadmin). */
export default function ReviewerGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const userProfile = useTypedSelector((s) => s.auth.profile);
  const { data, isLoading } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const user = data || userProfile;

  if (!isAuthenticated) return <Navigate to="/auth/signin" replace />;
  if (isLoading && !user?.managementRole) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!ALLOWED.includes((user?.managementRole as string) ?? '')) {
    return <Navigate to="/student-hub" replace />;
  }
  return <>{children}</>;
}
