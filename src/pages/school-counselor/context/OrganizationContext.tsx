import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTypedSelector } from 'src/app/store';
import { api } from 'src/app/api';
import { message, Alert, Spin } from 'antd';

interface OrganizationContextType {
  selectedOrganizationId: string | null;
  setSelectedOrganizationId: (id: string | null) => void;
  organizations: any[];
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
  const [isCounselor, setIsCounselor] = useState(false);
  const [counselorOrganizationId, setCounselorOrganizationId] = useState<string | null>(null);
  const [hasCheckedCounselor, setHasCheckedCounselor] = useState(false);

  // Check if user is a counselor and get their organization
  useEffect(() => {
    if (!isAuthenticated) {
      setIsCounselor(false);
      setCounselorOrganizationId(null);
      setHasCheckedCounselor(false);
      return;
    }
    
    // SuperAdmins don't need to check counselor status
    if (isSuperAdmin) {
      setHasCheckedCounselor(true);
      return;
    }

    const checkCounselorStatus = async () => {
      try {
        // Use the my-organizations endpoint to get counselor's organizations
        const response = await api.request({
          path: '/organizations/my-organizations',
          method: 'GET',
          secure: true,
        });
        
        // If we get organizations, user is a counselor
        if (response.data && response.data.length > 0) {
          setIsCounselor(true);
          const orgId = response.data[0].id; // Get first organization
          setCounselorOrganizationId(orgId);
          setSelectedOrganizationId(orgId);
        } else {
          setIsCounselor(false);
        }
      } catch (error: any) {
        // If 403 or other error, user is not a counselor
        setIsCounselor(false);
        setCounselorOrganizationId(null);
      } finally {
        setHasCheckedCounselor(true);
      }
    };

    checkCounselorStatus();
  }, [isAuthenticated, isSuperAdmin, user?.id]);

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

  // Show loading while checking access (only for non-SuperAdmins)
  if (!isSuperAdmin && isAuthenticated && !hasCheckedCounselor) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Checking access...</div>
      </div>
    );
  }

  // Show access denied message if user doesn't have access
  if (hasCheckedCounselor && isAuthenticated && !hasAccess) {
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
        selectedOrganizationId,
        setSelectedOrganizationId,
        organizations,
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

