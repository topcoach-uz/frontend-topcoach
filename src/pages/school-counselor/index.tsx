import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { OrganizationProvider } from './context/OrganizationContext';
import SchoolCounselorContent from './SchoolCounselorContent';

const SchoolCounselorPage = () => {
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  // No getMe gate here: the router bootstrap (src/lib/router) fetches getMe +
  // my-organizations behind a single app-level overlay and syncs the profile
  // into the auth slice, so the layout renders immediately and any remaining
  // loading state lives inline inside the content area (dashboard/selector).
  return (
    <OrganizationProvider>
      <SchoolCounselorContent />
    </OrganizationProvider>
  );
};

export default SchoolCounselorPage;
