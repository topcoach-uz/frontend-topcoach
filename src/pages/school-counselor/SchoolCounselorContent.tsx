import React from 'react';
import { Spin } from 'antd';
import SchoolCounselorRoutes from './SchoolCounselorRoutes';
import SchoolCounselorLayout from './components/SchoolCounselorLayout';
import { useOrganization } from './context/OrganizationContext';
import OrganizationSelector from './organization-selector';

const SchoolCounselorContent: React.FC = () => {
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
      <SchoolCounselorLayout>
        <SchoolCounselorRoutes />
      </SchoolCounselorLayout>
    );
  }
  
  // For Counselors: always show dashboard (their org is auto-selected)
  return (
    <SchoolCounselorLayout>
      <SchoolCounselorRoutes />
    </SchoolCounselorLayout>
  );
};

export default SchoolCounselorContent;

