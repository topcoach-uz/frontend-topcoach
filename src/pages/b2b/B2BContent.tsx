import React from 'react';
import { Spin } from 'antd';
import B2BRoutes from './B2BRoutes';
import B2BLayout from './components/B2BLayout';
import { useOrganization } from './context/OrganizationContext';
import OrganizationSelector from './organization-selector';

const B2BContent: React.FC = () => {
  const { selectedOrganizationId, organizations, loading: orgsLoading, isSuperAdmin } = useOrganization();

  // For SuperAdmins: show selector if no org selected, otherwise show dashboard
  if (isSuperAdmin) {
    if (orgsLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Spin size="large" />
        </div>
      );
    }
    // Show selector if no organization selected or no organizations exist
    if (!selectedOrganizationId || organizations.length === 0) {
      return <OrganizationSelector />;
    }
    // Show dashboard if organization is selected
    return (
      <B2BLayout>
        <B2BRoutes />
      </B2BLayout>
    );
  }
  
  // For Counselors: always show dashboard (their org is auto-selected)
  return (
    <B2BLayout>
      <B2BRoutes />
    </B2BLayout>
  );
};

export default B2BContent;

