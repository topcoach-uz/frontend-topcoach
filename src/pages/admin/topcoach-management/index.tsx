import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  message,
  Alert,
  Spin,
  Modal,
  Radio,
  Tabs,
  Row,
  Col,
  Progress,
  Select,
  Popconfirm,
  Tooltip,
  Typography,
} from 'antd';
import { Search as SearchIcon, CheckCircle2 } from 'lucide-react';
import { useTypedSelector } from 'src/app/store';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetAdminStudentsQuery, useAdminEnrollMutation, useAdminUnenrollMutation } from 'src/app/services/fullSupportApi';
import FullSupportAdminDashboard from 'src/pages/full-support/FullSupportAdminDashboard';
import ProgramManagementAnalyticsTab, { type AnalyticsProgramScope } from './ProgramManagementAnalyticsTab';
import ProgramManagementOrganizationsTab from './ProgramManagementOrganizationsTab';
import useColors from 'src/hooks/useColors';
import type { ColumnsType } from 'antd/es/table';
import { AcPill, type AcPillVariant } from 'src/pages/admin/console/components/AcPill';
import { cleanUserName } from 'src/pages/admin/console/utils';
import './index.scss';

const { Search } = Input;
const { Text: AntText } = Typography;

interface DashboardData {
  id: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  telegramPhoneNumber: string | null;
  telegramStatus: string | null;
  courseType: string | null;
  courseName?: 'admissions' | 'sat' | 'full_support';
  amount: number | null;
  paymentStatus: string | null;
  status: string | null;
  enrolledAt: string | null;
  createdAt: string;
  updatedAt: string;
  accessGrantedAt: string | null;
  progressPercentage: number | null;
  communityAccessEnabled?: boolean;
}

type SortOrder = 'ASC' | 'DESC';

export type ProgramDashboardProps = {
  /** Renders inside admin console with light embed + URL-driven tabs. */
  embedInAdminConsole?: boolean;
  routeTab?: string;
  onRouteTabChange?: (tab: string) => void;
};

const MANAGEMENT_TAB_KEYS = new Set(['users', 'analytics', 'organizations', 'full_support']);

const ProgramDashboard: React.FC<ProgramDashboardProps> = ({
  embedInAdminConsole = false,
  routeTab,
  onRouteTabChange,
}) => {
  const navigate = useNavigate();
  const user = useTypedSelector((state) => state.auth.profile);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  
  // Fetch user profile to ensure managementRole is loaded
  const { data: userData, isLoading: profileLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  
  // Use userData if available, otherwise fall back to user from store
  const currentUser = userData || user;
  
  const [data, setData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [grantAccessModalVisible, setGrantAccessModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string | null; userId: string; userName: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium'>('standard');
  const [selectedCourseName, setSelectedCourseName] = useState<'admissions' | 'sat' | 'full_support'>('admissions');
  const [activeTab, setActiveTab] = useState(() => {
    if (embedInAdminConsole && routeTab && MANAGEMENT_TAB_KEYS.has(routeTab)) {
      return routeTab;
    }
    return 'users';
  });

  useEffect(() => {
    if (!embedInAdminConsole || !routeTab || !MANAGEMENT_TAB_KEYS.has(routeTab)) return;
    setActiveTab(routeTab);
  }, [embedInAdminConsole, routeTab]);
  const [courseFilter, setCourseFilter] = useState<'all' | 'admissions' | 'sat' | 'full_support'>('all');
  const [communityFilter, setCommunityFilter] = useState<'all' | 'community' | 'standard'>('all');
  const { data: fullSupportStudentsData, isLoading: fullSupportStudentsLoading } = useGetAdminStudentsQuery(undefined, { skip: activeTab !== 'full_support' });
  const fullSupportEnrolledUsers = fullSupportStudentsData?.data ?? [];
  const [adminEnroll, { isLoading: adminEnrollLoading }] = useAdminEnrollMutation();
  const [adminUnenroll, { isLoading: adminUnenrollLoading }] = useAdminUnenrollMutation();
  const [removeFullSupportStudent, setRemoveFullSupportStudent] = useState<{ id: string; name: string } | null>(null);
  const colors = useColors();
  const primaryRed = colors?.colorPrimary ?? '#8b0000';
  const actionAccent = embedInAdminConsole ? '#10b981' : primaryRed;
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsCourseFilter, setAnalyticsCourseFilter] = useState<AnalyticsProgramScope>('all');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Check if user is SuperAdmin
  const isSuperAdmin = currentUser?.managementRole === 'SuperAdmin' || currentUser?.managementRole === 'Owner';

  // Debug logging
  useEffect(() => {
    console.log('ProgramDashboard - Current user:', currentUser);
    console.log('ProgramDashboard - managementRole:', currentUser?.managementRole);
    console.log('ProgramDashboard - isSuperAdmin:', isSuperAdmin);
  }, [currentUser, isSuperAdmin]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }

    if (!isSuperAdmin) {
      return;
    }

    fetchData();
  }, [isAuthenticated, isSuperAdmin, searchText, sortBy, sortOrder, courseFilter, communityFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(searchText && { search: searchText }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(courseFilter !== 'all' && { courseName: courseFilter }),
        ...(communityFilter !== 'all' && { communityAccess: communityFilter }),
      });
      const url = `/program-dashboard?${queryParams.toString()}`;
      console.log('[TopCoach Management] Fetching dashboard data from:', url);
      
      const response = await api.request({
        path: url,
        method: 'GET',
        secure: true,
      });
      
      const raw = response?.data;
      const responseData = Array.isArray(raw) ? raw : (raw?.data != null && Array.isArray(raw.data) ? raw.data : []);
      console.log('[TopCoach Management] Dashboard data received:', responseData.length, 'items', courseFilter !== 'all' ? `(filter: ${courseFilter})` : '');
      setData(responseData);
      setTotal(responseData.length); // Set total for pagination
    } catch (error: any) {
      console.error('[TopCoach Management] Error fetching dashboard data:', error);
      console.error('[TopCoach Management] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      });
      
      if (error.response?.status === 404) {
        message.error('Dashboard endpoint not found. Please ensure the backend is deployed with the latest changes.');
      } else if (error.response?.status === 403) {
        message.error('Access denied. SuperAdmin role required.');
      } else {
        message.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = (enrollmentId: string | null, userId: string, userName?: string, courseName?: 'admissions' | 'sat' | 'full_support') => {
    setSelectedUser({ id: enrollmentId, userId, userName: cleanUserName(userName, undefined) || 'this student' });
    setSelectedPlan('standard'); // Reset to default
    setSelectedCourseName(courseName || 'admissions');
    setGrantAccessModalVisible(true);
  };

  const handleConfirmGrantAccess = async () => {
    if (!selectedUser) return;

    if (selectedCourseName === 'full_support') {
      try {
        await adminEnroll({ userId: selectedUser.userId }).unwrap();
        message.success(`${selectedUser.userName} enrolled in Full Support.`);
        setGrantAccessModalVisible(false);
        setSelectedUser(null);
        fetchData();
      } catch (err: any) {
        message.error(err?.data?.message ?? 'Failed to enroll in Full Support.');
      }
      return;
    }

    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('courseName', selectedCourseName);
      // For SAT, courseType is ignored (always standard), but we still send it for consistency
      if (selectedCourseName === 'admissions') {
        params.append('courseType', selectedPlan);
      } else {
        params.append('courseType', 'standard'); // SAT always uses standard
      }
      
      // If user has enrollment, use enrollment endpoint; otherwise use user endpoint
      const path = selectedUser.id 
        ? `/program-dashboard/enrollments/${selectedUser.id}/grant-access?${params.toString()}`
        : `/program-dashboard/users/${selectedUser.userId}/grant-access?${params.toString()}`;
      
      await api.request({
        path,
        method: 'POST',
        secure: true,
      });
      message.success('Access granted successfully');
      setGrantAccessModalVisible(false);
      setSelectedUser(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error granting access:', error);
      message.error(error.response?.data?.message || 'Failed to grant access');
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'ASC' : 'DESC');
    } else {
      setSortBy('');
      setSortOrder('DESC');
    }
  };

  const handleToggleCommunityAccess = async (userId: string, enabled: boolean) => {
    try {
      await api.request({
        path: `/program-dashboard/users/${userId}/community-access`,
        method: 'POST',
        secure: true,
        body: { enabled },
      });
      message.success(enabled ? 'Community access granted' : 'Community access revoked');
      fetchData();
    } catch (error: any) {
      console.error('Error updating community access:', error);
      message.error(error.response?.data?.message || 'Failed to update community access');
    }
  };

  const pillPayment = (status: string | null): AcPillVariant => {
    if (!status) return 'neutral';
    const s = status.toLowerCase();
    if (s === 'completed') return 'mint';
    if (s === 'pending') return 'warning';
    if (['failed', 'rejected', 'cancelled'].includes(s)) return 'danger';
    return 'neutral';
  };

  const pillTelegram = (status: string | null): AcPillVariant => {
    const s = (status || '').toLowerCase();
    if (s === 'connected') return 'mint';
    if (s === 'pending') return 'warning';
    if (s === 'failed') return 'danger';
    return 'neutral';
  };

  const emptyMuted = embedInAdminConsole ? 'var(--ac-text-muted)' : '#999';

  const fetchAnalytics = useCallback(async (courseName?: 'admissions' | 'sat') => {
    setAnalyticsLoading(true);
    try {
      const params = courseName ? `?courseName=${courseName}` : '';
      console.log(`[TopCoach Management] Fetching analytics data from: /program-dashboard/analytics${params}`);
      
      const response = await api.request({
        path: `/program-dashboard/analytics${params}`,
        method: 'GET',
        secure: true,
      });
      
      console.log('[TopCoach Management] Analytics data received');
      setAnalyticsData(response.data);
    } catch (error: any) {
      console.error('[TopCoach Management] Error fetching analytics:', error);
      console.error('[TopCoach Management] Analytics error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
      });
      
      if (error.response?.status === 404) {
        message.error('Analytics endpoint not found. Please ensure the backend is deployed with the latest changes.');
      } else if (error.response?.status === 403) {
        message.error('Access denied. SuperAdmin role required.');
      } else {
        message.error('Failed to load analytics data');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'analytics') return;
    void fetchAnalytics(analyticsCourseFilter === 'all' ? undefined : analyticsCourseFilter);
  }, [activeTab, analyticsCourseFilter, fetchAnalytics]);

  const fetchOrganizations = async (bypassCache = false) => {
    setOrganizationsLoading(true);
    try {
      // Add cache-busting parameter to force fresh fetch
      const cacheBuster = bypassCache ? `?_t=${Date.now()}` : '';
      const url = `/organizations${cacheBuster}`;
      console.log('[TopCoach Management] Fetching organizations from:', url);
      
      const response = await api.request({
        path: url,
        method: 'GET',
        secure: true,
      });
      
      console.log('[TopCoach Management] Organizations data received:', response.data?.length || 0, 'organizations');
      setOrganizations(response.data || []);
    } catch (error: any) {
      console.error('[TopCoach Management] Error fetching organizations:', error);
      console.error('[TopCoach Management] Organizations error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
      });
      
      // If 403, 404, or 500, just set empty array (no organizations exist or endpoint not available)
      if (error.response?.status === 403 || error.response?.status === 404 || error.response?.status === 500) {
        if (error.response?.status === 404) {
          console.warn('[TopCoach Management] Organizations endpoint not found (404). Backend may need to be redeployed.');
        }
        setOrganizations([]);
      } else {
        message.error('Failed to load organizations');
      }
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const fetchAvailableUsers = async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      const response = await api.request({
        path: `/organizations/users/available?${params.toString()}`,
        method: 'GET',
        secure: true,
      });
      setAvailableUsers(response.data || []);
    } catch (error: any) {
      console.error('Error fetching available users:', error);
      setAvailableUsers([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'organizations' && isSuperAdmin) {
      fetchOrganizations();
    }
  }, [activeTab, isSuperAdmin]);

  // Merge user and mentor signups by month for the line chart - moved to top level to follow Rules of Hooks
  const chartData = useMemo(() => {
    if (!analyticsData?.userSignups) return [];
    
    const monthMap = new Map<string, { month: string; users: number; mentors: number }>();
    
    // Add user signups
    analyticsData.userSignups.forEach((item: any) => {
      monthMap.set(item.month, { month: item.month, users: item.count, mentors: 0 });
    });
    
    // Add mentor signups
    if (analyticsData.mentorSignups) {
      analyticsData.mentorSignups.forEach((item: any) => {
        const existing = monthMap.get(item.month);
        if (existing) {
          existing.mentors = item.count;
        } else {
          monthMap.set(item.month, { month: item.month, users: 0, mentors: item.count });
        }
      });
    }
    
    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [analyticsData?.userSignups, analyticsData?.mentorSignups]);

  const renderAnalyticsTab = () => (
    <ProgramManagementAnalyticsTab
      analyticsData={analyticsData}
      analyticsLoading={analyticsLoading}
      embedInAdminConsole={Boolean(embedInAdminConsole)}
      chartData={chartData}
      programScope={analyticsCourseFilter}
      onProgramScopeChange={setAnalyticsCourseFilter}
    />
  );

  const rowProgramLabel = (courseName: DashboardData['courseName']) => {
    if (courseName === 'sat') return 'SAT Prep';
    if (courseName === 'full_support') return 'Full Support';
    if (courseName === 'admissions') return 'Admissions';
    return 'this row’s program';
  };

  const columns: ColumnsType<DashboardData> = [
    {
      title: 'Name',
      dataIndex: 'userName',
      key: 'name',
      sorter: true,
      width: 200,
      render: (text: string, record: DashboardData) => <span>{cleanUserName(text, record.userEmail)}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'userEmail',
      key: 'email',
      sorter: true,
      width: 250,
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: 'Telegram Phone',
      dataIndex: 'telegramPhoneNumber',
      key: 'telegramPhoneNumber',
      sorter: true,
      width: 180,
      render: (text: string | null) => (
        text ? (
          <span>{text}</span>
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
        )
      ),
    },
    {
      title: 'Telegram Status',
      dataIndex: 'telegramStatus',
      key: 'telegramStatus',
      sorter: true,
      width: 150,
      render: (status: string | null) => (
        status ? (
          <AcPill variant={pillTelegram(status)}>{status.toUpperCase()}</AcPill>
        ) : (
          <span style={{ color: emptyMuted }}>N/A</span>
        )
      ),
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
      sorter: true,
      width: 120,
      render: (courseName: 'admissions' | 'sat' | 'full_support' | undefined, record: DashboardData) => {
        if (!courseName) {
          return <span style={{ color: '#999' }}>N/A</span>;
        }
        if (courseName === 'full_support') {
          return <AcPill variant="mint">Full Support</AcPill>;
        }
        return (
          <AcPill variant={courseName === 'sat' ? 'purple' : 'cyan'}>
            {courseName === 'sat' ? 'SAT Prep' : 'Admissions'}
          </AcPill>
        );
      },
    },
    {
      title: 'Course type (Admissions tier)',
      dataIndex: 'courseType',
      key: 'courseType',
      sorter: true,
      width: 120,
      render: (type: string | null, record: DashboardData) => {
        if (record.courseName === 'sat' || record.courseName === 'full_support') {
          return <span style={{ color: '#999' }}>N/A</span>;
        }
        return type ? (
          <AcPill variant={type === 'premium' ? 'amber' : 'cyan'}>{type.toUpperCase()}</AcPill>
        ) : (
          <span style={{ color: emptyMuted }}>N/A</span>
        );
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      sorter: true,
      width: 120,
      render: (amount: number | null) => (
        amount !== null ? `$${Number(amount).toFixed(2)}` : <span style={{ color: '#999' }}>N/A</span>
      ),
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      sorter: true,
      width: 140,
      render: (status: string | null, record: DashboardData) => (
        status ? (
          <Tooltip title={`Payment for ${rowProgramLabel(record.courseName)} (see Course column).`}>
            <span>
              <AcPill variant={pillPayment(status)}>{status.toUpperCase()}</AcPill>
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: emptyMuted }}>N/A</span>
        )
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      width: 120,
      render: (status: string | null, record: DashboardData) => (
        status ? (
          <Tooltip title={`Course enrollment status for ${rowProgramLabel(record.courseName)}.`}>
            <span>
              <AcPill variant={pillPayment(status)}>{status.toUpperCase()}</AcPill>
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: emptyMuted }}>N/A</span>
        )
      ),
    },
    {
      title: 'Enrolled At',
      dataIndex: 'enrolledAt',
      key: 'enrolledAt',
      sorter: true,
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: true,
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Access Granted At',
      dataIndex: 'accessGrantedAt',
      key: 'accessGrantedAt',
      sorter: true,
      width: 180,
      render: (date: string | null) => (
        date ? new Date(date).toLocaleString() : <span style={{ color: '#999' }}>Not granted</span>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progressPercentage',
      key: 'progressPercentage',
      sorter: true,
      width: 150,
      render: (progress: number | null, record: DashboardData) =>
        progress !== null ? (
          <Tooltip title={`Course completion for ${rowProgramLabel(record.courseName)}.`}>
            <div>
              <Progress
                percent={Math.round(progress)}
                size="small"
                status={Math.round(progress) === 100 ? 'success' : 'active'}
              />
            </div>
          </Tooltip>
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 260,
      fixed: 'right',
      render: (_: any, record: DashboardData) => {
        const hasAccess = record.paymentStatus === 'completed' && record.status === 'completed';
        const isTelegramConnected = record.telegramStatus === 'connected';
        const communityEnabled = Boolean(record.communityAccessEnabled);
        return (
          <Space direction="vertical" size={4}>
            <Space>
              {!hasAccess ? (
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircle2 size={16} />}
                  onClick={() => handleGrantAccess(record.id, record.userId, record.userName, record.courseName)}
                  disabled={!isTelegramConnected}
                  title={!isTelegramConnected ? 'User must have Telegram connected to grant access' : ''}
                >
                  Grant Access
                </Button>
              ) : (
                <AcPill variant="mint">Access Granted</AcPill>
              )}
              <Button
                type="link"
                size="small"
                onClick={() => handleGrantAccess(null, record.userId, record.userName, undefined)}
                disabled={!isTelegramConnected}
                title={!isTelegramConnected ? 'User must have Telegram connected' : 'Grant access to another program'}
              >
                Add program
              </Button>
            </Space>
            <Space size={6}>
              {communityEnabled && <AcPill variant="info">Community</AcPill>}
              <Popconfirm
                title={communityEnabled ? 'Revoke community access?' : 'Grant community access?'}
                description={
                  communityEnabled
                    ? `This will move ${cleanUserName(record.userName, record.userEmail)} to standard experience mode.`
                    : `This will unlock Community features for ${cleanUserName(record.userName, record.userEmail)}.`
                }
                onConfirm={() => handleToggleCommunityAccess(record.userId, !communityEnabled)}
                okText={communityEnabled ? 'Revoke' : 'Grant'}
                cancelText="Cancel"
                placement="topRight"
                getPopupContainer={(trigger) => trigger.parentElement || document.body}
              >
                <Button type="link" size="small">
                  {communityEnabled ? 'Revoke community' : 'Grant community'}
                </Button>
              </Popconfirm>
            </Space>
          </Space>
        );
      },
    },
  ];

  const wrapProgramShell = (inner: React.ReactNode) =>
    embedInAdminConsole ? (
      <div className="ac-program-management-root">
        <div className="program-dashboard program-dashboard--embed program-dashboard--admin-dark">{inner}</div>
      </div>
    ) : (
      <div className="program-dashboard">{inner}</div>
    );

  if (!isAuthenticated) {
    return wrapProgramShell(
      <Alert
        message="Authentication Required"
        description="You need to be logged in to access the program dashboard."
        type="warning"
        showIcon
      />,
    );
  }

  // Show loading while fetching profile
  if (profileLoading) {
    return wrapProgramShell(
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
          padding: 50,
          gap: 16,
          textAlign: 'center',
        }}
      >
        <Spin size="large" />
        <div>Loading...</div>
      </div>,
    );
  }

  if (!isSuperAdmin) {
    return wrapProgramShell(
      <Alert
        message="Access Denied"
        description={`You need SuperAdmin or Owner privileges to access the program dashboard. Your current role is: ${currentUser?.managementRole || 'Unknown'}.`}
        type="error"
        showIcon
      />,
    );
  }

  const dashboardMain = (
    <>
      <Card className={`dashboard-header${embedInAdminConsole ? ' dashboard-header--embed' : ''}`}>
        <h1>Programs</h1>
        <p>Enrollments, analytics, organizations, and Full Support.</p>
      </Card>

      <Tabs 
        activeKey={activeTab} 
        onChange={(key) => {
          setActiveTab(key);
          if (embedInAdminConsole) {
            onRouteTabChange?.(key);
          }
        }} 
        style={{ marginTop: 16, marginBottom: 0 }}
        items={[
          {
            key: 'users',
            label: 'Users & Enrollments',
            children: (
              <>
                <Card className="dashboard-filters" style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Space wrap align="center">
                    <Search
                      placeholder="Search by user name or email"
                      allowClear
                      enterButton={<SearchIcon size={16} />}
                      size="large"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onSearch={fetchData}
                      style={{ maxWidth: 400 }}
                    />
                      <Select
                        value={courseFilter}
                        onChange={setCourseFilter}
                        style={{ width: 220 }}
                        size="large"
                      >
                        <Select.Option value="all">All programs (table rows)</Select.Option>
                        <Select.Option value="admissions">Admissions only</Select.Option>
                        <Select.Option value="sat">SAT Prep only</Select.Option>
                        <Select.Option value="full_support">Full Support only</Select.Option>
                      </Select>
                      <Select
                        value={communityFilter}
                        onChange={setCommunityFilter}
                        style={{ width: 220 }}
                        size="large"
                      >
                        <Select.Option value="all">All Community States</Select.Option>
                        <Select.Option value="community">Community Enrolled</Select.Option>
                        <Select.Option value="standard">Community Not Enrolled</Select.Option>
                      </Select>
                    </Space>
                    <AntText type="secondary" style={{ fontSize: 13, display: 'block', maxWidth: 920 }}>
                      Each row is one program enrollment (Admissions, SAT Prep, or Full Support). Payment, enrollment
                      status, timestamps, and progress apply to that row's program (see the Course column).
                    </AntText>
                  </Space>
                </Card>

                <Card className="dashboard-table" style={{ marginTop: 16 }}>
                  <Spin spinning={loading}>
                    <Table
                      columns={columns}
                      dataSource={data}
                      rowKey={(record) => `${record.userId}-${record.courseName ?? 'none'}-${record.id ?? ''}`}
                      scroll={{ x: 2000 }}
                      pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showTotal: (total) => `Total ${total} rows`,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, size) => {
                          setCurrentPage(page);
                          setPageSize(size);
                        },
                      }}
                      onChange={handleTableChange}
                    />
                  </Spin>
                </Card>
              </>
            ),
          },
          {
            key: 'analytics',
            label: 'Analytics',
            children: renderAnalyticsTab(),
          },
          {
            key: 'organizations',
            label: 'School organizations',
            children: (
              <ProgramManagementOrganizationsTab
                organizations={organizations}
                organizationsLoading={organizationsLoading}
                fetchOrganizations={fetchOrganizations}
                fetchAvailableUsers={fetchAvailableUsers}
                availableUsers={availableUsers}
              />
            ),
          },
          {
            key: 'full_support',
            label: 'Full Support',
            children: embedInAdminConsole ? (
              <div className="tc-program-mgmt-full-support-embed">
                <p className="tc-program-mgmt-full-support-hint">
                  Grant access from <strong>Users &amp; Enrollments</strong> (Full Support), then manage assignments,
                  sessions, and pipeline below.
                </p>
                <FullSupportAdminDashboard integratedInAdminConsole />
              </div>
            ) : (
              <Card style={{ marginTop: 16 }}>
                <p style={{ marginBottom: 16, color: '#666' }}>
                  Users enrolled in the Full Support Mentorship Program. Enroll students from <strong>Users &amp; Enrollments</strong> by choosing &quot;Full Support Mentorship Program&quot; in the Grant Access modal.
                </p>
                <Table
                  dataSource={fullSupportEnrolledUsers}
                  rowKey="id"
                  pagination={{ pageSize: 20 }}
                  loading={fullSupportStudentsLoading}
                  columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name', width: 200 },
                    { title: 'Assigned Mentor', dataIndex: 'mentorName', key: 'mentorName', width: 180, render: (v: string | null) => v ?? <span style={{ color: '#999' }}>Unassigned</span> },
                    { title: 'Sessions', dataIndex: 'sessions', key: 'sessions', width: 100 },
                    { title: 'Tasks', dataIndex: 'tasks', key: 'tasks', width: 80 },
                    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => <AcPill variant={s === 'Active' ? 'mint' : 'neutral'}>{s}</AcPill> },
                    {
                      title: 'Actions',
                      key: 'actions',
                      width: 120,
                      render: (_: unknown, record: { id: string; name: string }) => (
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={() => setRemoveFullSupportStudent({ id: record.id, name: record.name })}
                        >
                          Remove from Full Support
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="Remove from Full Support"
        open={!!removeFullSupportStudent}
        onCancel={() => setRemoveFullSupportStudent(null)}
        footer={[
          <Button key="cancel" onClick={() => setRemoveFullSupportStudent(null)}>Cancel</Button>,
          <Button
            key="remove"
            type="primary"
            loading={adminUnenrollLoading}
            style={{ backgroundColor: actionAccent, borderColor: actionAccent, color: embedInAdminConsole ? '#04120c' : undefined }}
            onClick={() => {
              if (!removeFullSupportStudent) return;
              adminUnenroll(removeFullSupportStudent.id)
                .unwrap()
                .then(() => {
                  message.success(`${removeFullSupportStudent.name} has been removed from Full Support.`);
                  setRemoveFullSupportStudent(null);
                })
                .catch(() => message.error('Failed to remove from Full Support.'));
            }}
          >
            Remove
          </Button>,
        ]}
      >
        {removeFullSupportStudent && (
          <p style={{ marginBottom: 0 }}>Remove {removeFullSupportStudent.name}? They will lose access.</p>
        )}
      </Modal>

      <Modal
        title="Grant Access"
        open={grantAccessModalVisible}
        width={560}
        onOk={handleConfirmGrantAccess}
        onCancel={() => {
          setGrantAccessModalVisible(false);
          setSelectedUser(null);
        }}
        okText="Grant Access"
        cancelText="Cancel"
        okButtonProps={{
          type: 'primary',
          loading: adminEnrollLoading,
          ...(embedInAdminConsole
            ? { style: { backgroundColor: actionAccent, borderColor: actionAccent, color: '#04120c' } }
            : {}),
        }}
      >
        {selectedUser && (
          <div>
            <p>
              Are you sure you want to grant access to <strong>{selectedUser.userName}</strong>?
            </p>
            <p style={{ marginBottom: 16 }}>
              {selectedCourseName === 'full_support'
                ? `This will enroll ${selectedUser.userName} in the Full Support Mentorship Program.`
                : selectedUser.id 
                  ? `This will update the existing ${selectedCourseName === 'admissions' ? 'Admissions' : 'SAT'} enrollment and grant access.`
                  : `This will create a new ${selectedCourseName === 'admissions' ? 'Admissions' : 'SAT'} enrollment and grant access.`
              }
              {selectedUser.id && selectedCourseName !== 'full_support' && (
                <span style={{ display: 'block', marginTop: 8, color: '#666', fontSize: '13px' }}>
                  Note: If the user already has access to {selectedCourseName === 'admissions' ? 'Admissions' : 'SAT'}, this will update that enrollment. 
                  If they have access to the other course, a separate enrollment will be created for this course.
                </span>
              )}
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Select Course:
              </label>
              <Radio.Group
                value={selectedCourseName}
                onChange={(e) => {
                  setSelectedCourseName(e.target.value);
                  // Reset plan to standard when switching courses
                  setSelectedPlan('standard');
                }}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Radio value="admissions"><strong>Admissions Program</strong></Radio>
                  <Radio value="sat"><strong>SAT Prep Course</strong></Radio>
                  <Radio value="full_support"><strong>Full Support Mentorship Program</strong></Radio>
                </Space>
              </Radio.Group>
            </div>
            {selectedCourseName === 'full_support' && (
              <div style={{ padding: '8px 12px', background: '#f0f9ff', borderRadius: 4, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#666' }}>
                  Enrolls the student in the Full Support program. They will get access to the mentee dashboard, session tracking, and task assignments.
                </span>
              </div>
            )}
            {selectedCourseName === 'admissions' && (
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Select Course Plan:
              </label>
              <Radio.Group
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                style={{ width: '100%' }}
              >
                <Radio value="standard">Standard</Radio>
                <Radio value="premium">Premium</Radio>
              </Radio.Group>
            </div>
            )}
            {selectedCourseName === 'sat' && (
              <div style={{ padding: '8px 12px', background: '#f0f9ff', borderRadius: 4, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#666' }}>
                  Note: SAT Prep Course has a single tier (no standard/premium distinction)
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );

  return wrapProgramShell(dashboardMain);
};

export default ProgramDashboard;

