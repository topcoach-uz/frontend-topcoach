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
        path: `/admin/orgs${cacheBuster}`,
        method: 'GET',
        secure: true,
      });
      setOrganizations(response.data || []);
    } catch (error: any) {
      // `/admin/orgs` always exists now, so any failure here is a real one (auth,
      // permissions, server). Clear the table so we don't show stale rows, but
      // always surface the error instead of silently rendering "no schools".
      console.error('Error loading organizations:', error);
      setOrganizations([]);
      message.error(
        error?.response?.status === 403
          ? 'You do not have permission to view organizations'
          : 'Failed to load organizations',
      );
    } finally {
      setOrganizationsLoading(false);
    }
  }, []);

  const fetchAvailableUsers = useCallback(async (search?: string) => {
    try {
      // Blank `q` is valid — the endpoint returns the first 50 users.
      const params = new URLSearchParams({ q: search ?? '' });
      const response = await api.request({
        path: `/admin/orgs/user-search?${params.toString()}`,
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
          <p>Create schools, assign an owner, counselors, and students, edit details, and manage members.</p>
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
