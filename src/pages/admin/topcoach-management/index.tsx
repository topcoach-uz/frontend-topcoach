import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  message,
  Alert,
  Spin,
  Tabs,
  Progress,
  Select,
  Tooltip,
  Typography,
} from 'antd';
import { Settings2 } from 'lucide-react';
import SearchButton from 'src/components/common/searchButton';
import { useTypedSelector } from 'src/app/store';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { useGetMeQuery } from 'src/app/services/users';
import { useGetAdminStudentsQuery } from 'src/app/services/fullSupportApi';
import FullSupportAdminDashboard from 'src/pages/full-support/FullSupportAdminDashboard';
import ResearchPrepProgressTab from './ResearchPrepProgressTab';
import type { ColumnsType } from 'antd/es/table';
import { AcPill, type AcPillVariant } from 'src/pages/admin/console/components/AcPill';
import { cleanUserName } from 'src/pages/admin/console/utils';
import { ManageAccessModal, type ManageAccessRow } from './ManageAccessModal';
import './index.scss';

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

const MANAGEMENT_TAB_KEYS = new Set([
  'users',
  'full_support',
  'research_prep',
]);

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
  // `searchText` drives the controlled input; `debouncedSearchText` is what the
  // fetch effect actually reacts to (300ms after the last keystroke), so we
  // don't hit /program-dashboard once per character.
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [manageAccessRow, setManageAccessRow] = useState<ManageAccessRow | null>(null);
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

  // Check if user is SuperAdmin
  const isSuperAdmin = currentUser?.managementRole === 'SuperAdmin' || currentUser?.managementRole === 'Owner';

  // Debug logging
  useEffect(() => {
    console.log('ProgramDashboard - Current user:', currentUser);
    console.log('ProgramDashboard - managementRole:', currentUser?.managementRole);
    console.log('ProgramDashboard - isSuperAdmin:', isSuperAdmin);
  }, [currentUser, isSuperAdmin]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchText(searchText.trim()), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }

    if (!isSuperAdmin) {
      return;
    }

    fetchData();
  }, [isAuthenticated, isSuperAdmin, debouncedSearchText, sortBy, sortOrder, courseFilter, communityFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(debouncedSearchText && { search: debouncedSearchText }),
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

  const openManageAccess = (record: DashboardData) => {
    setManageAccessRow({
      id: record.id,
      userId: record.userId,
      userName: record.userName,
      userEmail: record.userEmail,
      courseName: record.courseName,
      telegramStatus: record.telegramStatus,
      communityAccessEnabled: record.communityAccessEnabled,
    });
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
      width: 200,
      fixed: 'right',
      render: (_: any, record: DashboardData) => {
        const hasAccess = record.paymentStatus === 'completed' && record.status === 'completed';
        const communityEnabled = Boolean(record.communityAccessEnabled);

        return (
          <div className="enrollment-actions">
            <div className="enrollment-actions__pills">
              <AcPill variant={hasAccess ? 'mint' : 'neutral'}>
                {hasAccess ? 'Access granted' : 'No access'}
              </AcPill>
              <AcPill variant={communityEnabled ? 'info' : 'slate'}>
                {communityEnabled ? 'Community' : 'No community'}
              </AcPill>
            </div>

            <div className="enrollment-actions__links">
              <Button
                type="link"
                size="small"
                icon={<Settings2 size={14} />}
                onClick={() => openManageAccess(record)}
              >
                Manage access
              </Button>
            </div>
          </div>
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
        <p>Enrollments, Full Support, and program progress. Analytics moved to Insights.</p>
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
                    <Input
                      placeholder="Search by user name or email"
                      allowClear
                      suffix={<SearchButton size={30} onClick={() => setDebouncedSearchText(searchText.trim())} />}
                      size="large"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      // Enter / search button flushes the debounce immediately;
                      // the fetch effect fires when the value actually changes.
                      onPressEnter={() => setDebouncedSearchText(searchText.trim())}
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
                      width: 160,
                      render: (_: unknown, record: { id: string; name: string; email?: string }) => (
                        <Button
                          type="link"
                          size="small"
                          icon={<Settings2 size={14} />}
                          onClick={() =>
                            setManageAccessRow({
                              id: null,
                              userId: record.id,
                              userName: record.name,
                              userEmail: record.email ?? '',
                              courseName: 'full_support',
                              telegramStatus: 'connected',
                            })
                          }
                        >
                          Manage access
                        </Button>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          },
          {
            key: 'research_prep',
            label: 'Research Prep',
            children: <ResearchPrepProgressTab />,
          },
        ]}
      />

      <ManageAccessModal
        open={!!manageAccessRow}
        row={manageAccessRow}
        onClose={() => setManageAccessRow(null)}
        onMutated={() => fetchData()}
      />
    </>
  );

  return wrapProgramShell(dashboardMain);
};

export default ProgramDashboard;
