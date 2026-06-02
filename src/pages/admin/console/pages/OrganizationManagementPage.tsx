import { useCallback, useEffect, useState } from 'react';
import { Card, message } from 'antd';
import { api } from 'src/app/api';
import ProgramManagementOrganizationsTab from 'src/pages/admin/topcoach-management/ProgramManagementOrganizationsTab';

/**
 * Standalone "Organization Management" page for the admin console (sidebar →
 * Organization Management). Previously this lived as a tab inside the Programs
 * page; it was extracted so managing schools is its own destination. Data
 * fetching mirrors what the Programs page used to do for the organizations tab.
 */
export default function OrganizationManagementPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const fetchOrganizations = useCallback(async (bypassCache = false) => {
    setOrganizationsLoading(true);
    try {
      const cacheBuster = bypassCache ? `?_t=${Date.now()}` : '';
      const response = await api.request({
        path: `/organizations${cacheBuster}`,
        method: 'GET',
        secure: true,
      });
      setOrganizations(response.data || []);
    } catch (error: any) {
      const status = error.response?.status;
      // No orgs / endpoint unavailable → render an empty table rather than an error toast.
      if (status === 403 || status === 404 || status === 500) {
        setOrganizations([]);
      } else {
        message.error('Failed to load organizations');
      }
    } finally {
      setOrganizationsLoading(false);
    }
  }, []);

  const fetchAvailableUsers = useCallback(async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const response = await api.request({
        path: `/organizations/users/available?${params.toString()}`,
        method: 'GET',
        secure: true,
      });
      setAvailableUsers(response.data || []);
    } catch {
      setAvailableUsers([]);
    }
  }, []);

  useEffect(() => {
    void fetchOrganizations();
  }, [fetchOrganizations]);

  return (
    <div className="ac-program-management-root">
      <div className="program-dashboard program-dashboard--embed program-dashboard--admin-dark">
        <Card className="dashboard-header dashboard-header--embed">
          <h1>Organization Management</h1>
          <p>Create schools, assign counselors and students, edit details, and manage members.</p>
        </Card>

        <div style={{ marginTop: 16 }}>
          <ProgramManagementOrganizationsTab
            organizations={organizations}
            organizationsLoading={organizationsLoading}
            fetchOrganizations={fetchOrganizations}
            fetchAvailableUsers={fetchAvailableUsers}
            availableUsers={availableUsers}
          />
        </div>
      </div>
    </div>
  );
}
