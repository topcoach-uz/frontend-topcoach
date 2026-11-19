import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Card,
  Input,
  Button,
  Space,
  Tag,
  message,
  Alert,
  Spin,
  Modal,
  Radio,
  Tabs,
  Row,
  Col,
  Statistic,
  Progress,
} from 'antd';
import { CheckCircle2, User, Mail, Phone } from 'lucide-react';
import SearchButton from 'src/components/common/searchButton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import { useTypedSelector } from 'src/app/store';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/app/api';
import { useGetMeQuery } from 'src/app/services/users';
import type { ColumnsType } from 'antd/es/table';
import './index.scss';


interface DashboardData {
  id: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  telegramPhoneNumber: string | null;
  telegramStatus: string | null;
  courseType: string | null;
  amount: number | null;
  paymentStatus: string | null;
  status: string | null;
  enrolledAt: string | null;
  createdAt: string;
  updatedAt: string;
  accessGrantedAt: string | null;
  progressPercentage: number | null;
}

type SortOrder = 'ASC' | 'DESC';

const ProgramDashboard: React.FC = () => {
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
  const [activeTab, setActiveTab] = useState('users');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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
  }, [isAuthenticated, isSuperAdmin, searchText, sortBy, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.request({
        path: `/program-dashboard?${new URLSearchParams({
          ...(searchText && { search: searchText }),
          ...(sortBy && { sortBy }),
          ...(sortOrder && { sortOrder }),
        })}`,
        method: 'GET',
        secure: true,
      });
      const responseData = response.data || [];
      setData(responseData);
      setTotal(responseData.length); // Set total for pagination
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 403) {
        message.error('Access denied. SuperAdmin role required.');
      } else {
        message.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = (enrollmentId: string | null, userId: string, userName?: string) => {
    setSelectedUser({ id: enrollmentId, userId, userName: userName || 'this student' });
    setSelectedPlan('standard'); // Reset to default
    setGrantAccessModalVisible(true);
  };

  const handleConfirmGrantAccess = async () => {
    if (!selectedUser) return;

    try {
      // If user has enrollment, use enrollment endpoint; otherwise use user endpoint
      const path = selectedUser.id 
        ? `/program-dashboard/enrollments/${selectedUser.id}/grant-access?courseType=${selectedPlan}`
        : `/program-dashboard/users/${selectedUser.userId}/grant-access?courseType=${selectedPlan}`;
      
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'green',
      pending: 'orange',
      failed: 'red',
      cancelled: 'default',
      rejected: 'red',
    };
    return colors[status] || 'default';
  };

  const getTelegramStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      connected: 'green',
      pending: 'orange',
      failed: 'red',
    };
    return colors[status || ''] || 'default';
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await api.request({
        path: '/program-dashboard/analytics',
        method: 'GET',
        secure: true,
      });
      setAnalyticsData(response.data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      message.error('Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      fetchAnalytics();
    }
  }, [activeTab]);

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

  const renderAnalyticsTab = () => {
    if (analyticsLoading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '50px',
          gap: 16,
          textAlign: 'center',
        }}>
          <Spin size="large" />
          <div>Loading analytics...</div>
        </div>
      );
    }

    if (!analyticsData) {
      return <Alert message="No analytics data available" type="info" />;
    }

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={analyticsData.totalUsers}
                prefix={<User size={16} />}
                valueStyle={{ fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Students with Access"
                value={analyticsData.studentsWithAccess}
                prefix={<CheckCircle2 size={16} />}
                valueStyle={{ color: '#3f8600', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Average Course Progress"
                value={analyticsData.averageProgress}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Access Rate"
                value={analyticsData.totalUsers > 0 
                  ? ((analyticsData.studentsWithAccess / analyticsData.totalUsers) * 100).toFixed(1)
                  : 0}
                suffix="%"
                valueStyle={{ color: '#722ed1', fontSize: '24px' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="User & Mentor Signups (Last 12 Months)" loading={analyticsLoading}>
              <div style={{ minHeight: 400, padding: '20px 0' }}>
                {analyticsData.userSignups && analyticsData.userSignups.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      onClick={(data: any) => {
                        if (data && data.activePayload && data.activePayload[0]) {
                          const payload = data.activePayload[0].payload;
                          message.info(`${payload.month}: ${payload.users.toLocaleString()} users, ${payload.mentors.toLocaleString()} mentors`);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#666"
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#666"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          value.toLocaleString(),
                          name === 'users' ? 'Users' : 'Mentors'
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{ 
                          backgroundColor: '#fff',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          padding: '8px'
                        }}
                      />
                      <Legend 
                        formatter={(value) => value === 'users' ? 'Users' : 'Mentors'}
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#1890ff" 
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#1890ff' }}
                        activeDot={{ r: 8, fill: '#1890ff' }}
                        name="users"
                        animationDuration={1000}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="mentors" 
                        stroke="#52c41a" 
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#52c41a' }}
                        activeDot={{ r: 8, fill: '#52c41a' }}
                        name="mentors"
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>No data available</div>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Course Enrollments (Last 12 Months)" loading={analyticsLoading}>
              <div style={{ minHeight: 400, padding: '20px 0' }}>
                {analyticsData.enrollmentsPerMonth && analyticsData.enrollmentsPerMonth.length > 0 ? (
                  analyticsData.enrollmentsPerMonth.map((item: any, index: number) => {
                    const maxCount = analyticsData.enrollmentsPerMonth.length > 0 
                      ? Math.max(...analyticsData.enrollmentsPerMonth.map((i: any) => i.count))
                      : 0;
                    return (
                      <div key={index} style={{ width: '100%', marginBottom: 16, padding: '8px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.month}</span>
                          <span style={{ fontSize: '16px', fontWeight: 600 }}>{item.count.toLocaleString()}</span>
                        </div>
                        <Progress 
                          percent={maxCount > 0 ? (item.count / maxCount * 100) : 0} 
                          showInfo={false}
                          strokeColor="#52c41a"
                          strokeWidth={20}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>No data available</div>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="Enrollment Status (With Access)" loading={analyticsLoading}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {analyticsData.enrollmentStatusBreakdown && analyticsData.enrollmentStatusBreakdown.length > 0 ? (
                  analyticsData.enrollmentStatusBreakdown.map((item: any, index: number) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: index < analyticsData.enrollmentStatusBreakdown.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <Tag color={getStatusColor(item.status)} style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {item.status?.toUpperCase()}
                      </Tag>
                      <span style={{ fontSize: '18px', fontWeight: 600 }}>{item.count.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>No data available</div>
                )}
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Course Type" loading={analyticsLoading}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {analyticsData.courseTypeBreakdown && analyticsData.courseTypeBreakdown.length > 0 ? (
                  analyticsData.courseTypeBreakdown.map((item: any, index: number) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: index < analyticsData.courseTypeBreakdown.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <Tag color={item.courseType === 'premium' ? 'gold' : 'blue'} style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {item.courseType?.toUpperCase()}
                      </Tag>
                      <span style={{ fontSize: '18px', fontWeight: 600 }}>{item.count.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>No data available</div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="Telegram Status" loading={analyticsLoading}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {analyticsData.telegramStatusBreakdown && analyticsData.telegramStatusBreakdown.length > 0 ? (
                  analyticsData.telegramStatusBreakdown.map((item: any, index: number) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: index < analyticsData.telegramStatusBreakdown.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <Tag color={getTelegramStatusColor(item.telegramStatus)} style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {item.telegramStatus?.toUpperCase()}
                      </Tag>
                      <span style={{ fontSize: '18px', fontWeight: 600 }}>{item.count.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>No data available</div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const columns: ColumnsType<DashboardData> = [
    {
      title: 'Name',
      dataIndex: 'userName',
      key: 'name',
      sorter: true,
      width: 200,
      render: (text: string) => (
        <Space>
          <User size={16} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'userEmail',
      key: 'email',
      sorter: true,
      width: 250,
      render: (text: string) => (
        <Space>
          <Mail size={16} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Telegram Phone',
      dataIndex: 'telegramPhoneNumber',
      key: 'telegramPhoneNumber',
      sorter: true,
      width: 180,
      render: (text: string | null) => (
        text ? (
          <Space>
            <Phone size={16} />
            <span>{text}</span>
          </Space>
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
          <Tag color={getTelegramStatusColor(status)}>
            {status?.toUpperCase()}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
        )
      ),
    },
    {
      title: 'Course Type',
      dataIndex: 'courseType',
      key: 'courseType',
      sorter: true,
      width: 120,
      render: (type: string | null) => (
        type ? (
          <Tag color={type === 'premium' ? 'gold' : 'blue'}>
            {type.toUpperCase()}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
        )
      ),
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
      render: (status: string | null) => (
        status ? (
          <Tag color={getStatusColor(status)}>
            {status.toUpperCase()}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
        )
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: true,
      width: 120,
      render: (status: string | null) => (
        status ? (
          <Tag color={getStatusColor(status)}>
            {status.toUpperCase()}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
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
      render: (progress: number | null) => (
        progress !== null ? (
          <Progress 
            percent={Math.round(progress)} 
            size="small" 
            status={progress === 100 ? 'success' : 'active'}
          />
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: DashboardData) => {
        // Check if access is already granted (both payment and status must be completed)
        const hasAccess = record.paymentStatus === 'completed' && record.status === 'completed';
        return (
          <Space>
            {!hasAccess ? (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircle2 size={16} />}
                onClick={() => handleGrantAccess(record.id, record.userId, record.userName)}
              >
                Grant Access
              </Button>
            ) : (
              <Tag color="green">Access Granted</Tag>
            )}
          </Space>
        );
      },
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="program-dashboard">
        <Alert
          message="Authentication Required"
          description="You need to be logged in to access the program dashboard."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // Show loading while fetching profile
  if (profileLoading) {
    return (
      <div className="program-dashboard" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        padding: 50,
        gap: 16,
        textAlign: 'center',
      }}>
        <Spin size="large" />
        <div>Loading...</div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="program-dashboard">
        <Alert
          message="Access Denied"
          description={`You need SuperAdmin privileges to access the program dashboard. Your current role is: ${currentUser?.managementRole || 'Unknown'}.`}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="program-dashboard">
      <Card className="dashboard-header">
        <h1>Program Dashboard</h1>
        <p>Track all users and course enrollments</p>
      </Card>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        style={{ marginTop: 16 }}
        items={[
          {
            key: 'users',
            label: 'Users & Enrollments',
            children: (
              <>
                <Card className="dashboard-filters" style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Input
                      placeholder="Search by user name or email"
                      allowClear
                      suffix={<SearchButton size={30} onClick={() => void fetchData()} />}
                      size="large"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onPressEnter={() => void fetchData()}
                      style={{ maxWidth: 400 }}
                    />
                  </Space>
                </Card>

                <Card className="dashboard-table" style={{ marginTop: 16 }}>
                  <Spin spinning={loading}>
                    <Table
                      columns={columns}
                      dataSource={data}
                      rowKey={(record) => record.userId}
                      scroll={{ x: 2000 }}
                      pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: total,
                        showTotal: (total) => `Total ${total} users`,
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
        ]}
      />

      <Modal
        title="Grant Access"
        open={grantAccessModalVisible}
        onOk={handleConfirmGrantAccess}
        onCancel={() => {
          setGrantAccessModalVisible(false);
          setSelectedUser(null);
        }}
        okText="Grant Access"
        cancelText="Cancel"
        okButtonProps={{ type: 'primary' }}
      >
        {selectedUser && (
          <div>
            <p>
              Are you sure you want to grant access to <strong>{selectedUser.userName}</strong>?
            </p>
            <p style={{ marginBottom: 16 }}>
              This will {selectedUser.id ? 'update the enrollment and' : 'create an enrollment and'} grant access, and record the access granted date.
            </p>
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProgramDashboard;
