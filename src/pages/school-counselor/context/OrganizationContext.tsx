import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTypedSelector } from 'src/app/store';
import { api } from 'src/app/api';
import { useGetMyOrganizationsQuery } from 'src/app/services/organizations';
import { message, Alert, Spin } from 'antd';

interface OrganizationContextType {
  selectedOrganizationId: string | null;
  setSelectedOrganizationId: (id: string | null) => void;
  organizations: any[];
  /** Organizations from my-organizations API (for counselors). Used for sidebar org name. */
  counselorOrganizations: any[];
  loading: boolean;
  isSuperAdmin: boolean;
  isCounselor: boolean;
  counselorOrganizationId: string | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const user = useTypedSelector((state) => state.auth.profile);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const isSuperAdmin = user?.managementRole === 'SuperAdmin' || user?.managementRole === 'Owner';
  
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Counselor status is derived from the my-organizations query. The router
  // bootstrap (src/lib/router) already fetches this endpoint behind its
  // single app-level loader, so this hook resolves instantly from the RTK
  // cache on repeat visits instead of re-fetching on every mount.
  // On error (e.g. 403), data stays undefined → user is not a counselor.
  const { data: myOrganizationsData, isLoading: counselorCheckLoading } = useGetMyOrganizationsQuery(
    undefined,
    { skip: !isAuthenticated || isSuperAdmin },
  );

  const counselorOrganizations = (!isSuperAdmin && (myOrganizationsData as any[])) || [];
  const isCounselor = counselorOrganizations.length > 0;
  const counselorOrganizationId = isCounselor ? counselorOrganizations[0].id : null;

  // Counselors get their (first) organization auto-selected; SuperAdmins pick
  // one explicitly via the organization selector. Derived (not synced via an
  // effect) so it's available in the same render as isCounselor.
  const effectiveSelectedOrganizationId = selectedOrganizationId ?? counselorOrganizationId;

  // Fetch organizations for SuperAdmins
  useEffect(() => {
    if (isSuperAdmin && isAuthenticated) {
      setLoading(true);
      api.request({
        path: '/organizations',
        method: 'GET',
        secure: true,
      })
        .then((response) => {
          setOrganizations(response.data || []);
        })
        .catch((error: any) => {
          console.error('Error fetching organizations:', error);
          // If 403, 404, or 500, it means no organizations exist or there's a migration issue - just set empty array
          // Don't show error message, just show empty state
          if (error.response?.status === 403 || error.response?.status === 404 || error.response?.status === 500) {
            setOrganizations([]);
          } else {
            // Only show error for other unexpected errors
            message.error('Failed to load organizations');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isSuperAdmin, isAuthenticated]);

  // Check if user has access (SuperAdmin or Counselor)
  const hasAccess = isSuperAdmin || isCounselor;

  // Show loading while checking access (only for non-SuperAdmins). With the
  // bootstrap having warmed the cache, this only appears on a genuinely cold
  // cache — isLoading is false when cached data is already available.
  if (!isSuperAdmin && isAuthenticated && counselorCheckLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Checking access...</div>
      </div>
    );
  }

  // Show access denied message if user doesn't have access
  if (isAuthenticated && !counselorCheckLoading && !hasAccess) {
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert
          message="Access Denied"
          description={
            <div>
              <p style={{ marginBottom: 8 }}>You need to be a <strong>Counselor</strong> or <strong>SuperAdmin</strong> to access the School Counselor dashboard.</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: 8 }}>
                If you believe you should have access, please contact your administrator.
              </p>
            </div>
          }
          type="error"
          showIcon
          style={{ maxWidth: 600 }}
        />
      </div>
    );
  }

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrganizationId: effectiveSelectedOrganizationId,
        setSelectedOrganizationId,
        organizations,
        counselorOrganizations,
        loading,
        isSuperAdmin,
        isCounselor,
        counselorOrganizationId,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

