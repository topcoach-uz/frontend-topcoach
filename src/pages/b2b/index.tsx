import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useTypedSelector } from 'src/app/store';
import { useGetMeQuery } from 'src/app/services/users';
import { OrganizationProvider } from './context/OrganizationContext';
import B2BContent from './B2BContent';

const B2BPage = () => {
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const userProfile = useTypedSelector((state) => state.auth.profile);
  
  // Fetch user profile to ensure we have the latest data
  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  
  const currentUser = userData || userProfile;
  const isSuperAdmin = currentUser?.managementRole === 'SuperAdmin' || currentUser?.managementRole === 'Owner';

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <OrganizationProvider>
      <B2BContent />
    </OrganizationProvider>
  );
};

export default B2BPage;

