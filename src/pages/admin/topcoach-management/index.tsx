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
  Form,
  Select,
  Popconfirm,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
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

const { Search } = Input;

interface DashboardData {
  id: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  telegramPhoneNumber: string | null;
  telegramStatus: string | null;
  courseType: string | null;
  courseName?: 'admissions' | 'sat';
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
  const [selectedCourseName, setSelectedCourseName] = useState<'admissions' | 'sat'>('admissions');
  const [activeTab, setActiveTab] = useState('users');
  const [courseFilter, setCourseFilter] = useState<'all' | 'admissions' | 'sat'>('all');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<'admissions' | 'sat'>('admissions');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

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
  }, [isAuthenticated, isSuperAdmin, searchText, sortBy, sortOrder, courseFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(searchText && { search: searchText }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(courseFilter !== 'all' && { courseName: courseFilter }),
      });
      const url = `/program-dashboard?${queryParams.toString()}`;
      console.log('[TopCoach Management] Fetching dashboard data from:', url);
      
      const response = await api.request({
        path: url,
        method: 'GET',
        secure: true,
      });
      
      const responseData = response.data || [];
      console.log('[TopCoach Management] Dashboard data received:', responseData.length, 'items');
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

  const handleGrantAccess = (enrollmentId: string | null, userId: string, userName?: string, courseName?: 'admissions' | 'sat') => {
    setSelectedUser({ id: enrollmentId, userId, userName: userName || 'this student' });
    setSelectedPlan('standard'); // Reset to default
    setSelectedCourseName(courseName || 'admissions');
    setGrantAccessModalVisible(true);
  };

  const handleConfirmGrantAccess = async () => {
    if (!selectedUser) return;

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

  const fetchAnalytics = async (courseName?: 'admissions' | 'sat') => {
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
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics(analyticsTab);
    }
  }, [activeTab, analyticsTab]);

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

  const renderOrganizationsTab = () => {
    const [createOrgModalVisible, setCreateOrgModalVisible] = useState(false);
    const [assignUserModalVisible, setAssignUserModalVisible] = useState(false);
    const [createForm] = Form.useForm();
    const [assignForm] = Form.useForm();

    const handleCreateOrganization = async (values: any) => {
      try {
        await api.request({
          path: '/organizations',
          method: 'POST',
          secure: true,
          body: values,
        });
        message.success('Organization created successfully');
        setCreateOrgModalVisible(false);
        createForm.resetFields();
        // Bypass cache to get the newly created organization
        fetchOrganizations(true);
      } catch (error: any) {
        console.error('Error creating organization:', error);
        message.error(error.response?.data?.message || 'Failed to create organization');
      }
    };

    const handleAssignUser = async (values: any) => {
      if (!selectedOrg) return;
      try {
        await api.request({
          path: `/organizations/${selectedOrg}/members`,
          method: 'POST',
          secure: true,
          body: {
            userId: values.userId,
            role: values.role,
          },
        });
        message.success('User assigned successfully');
        setAssignUserModalVisible(false);
        assignForm.resetFields();
        setSelectedOrg(null);
        // Bypass cache to get updated organization data
        fetchOrganizations(true);
        fetchAvailableUsers();
      } catch (error: any) {
        console.error('Error assigning user:', error);
        message.error(error.response?.data?.message || 'Failed to assign user');
      }
    };

    const handleRemoveUser = async (orgId: string, userId: string) => {
      try {
        await api.request({
          path: `/organizations/${orgId}/members/${userId}`,
          method: 'DELETE',
          secure: true,
        });
        message.success('User removed from organization');
        // Bypass cache to get updated organization data
        fetchOrganizations(true);
      } catch (error: any) {
        console.error('Error removing user:', error);
        message.error('Failed to remove user');
      }
    };

    const handleDeleteOrganization = async (orgId: string, orgName: string) => {
      try {
        await api.request({
          path: `/organizations/${orgId}`,
          method: 'DELETE',
          secure: true,
        });
        message.success(`Organization "${orgName}" deleted successfully`);
        // Bypass cache to get updated organization data
        fetchOrganizations(true);
      } catch (error: any) {
        console.error('Error deleting organization:', error);
        message.error(error.response?.data?.message || 'Failed to delete organization');
      }
    };

    if (organizationsLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading organizations...</div>
        </div>
      );
    }

    return (
      <div style={{ paddingBottom: 0, marginBottom: 0 }}>
        <Card style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>Organizations</h2>
            <Button type="primary" onClick={() => setCreateOrgModalVisible(true)}>
              Create Organization
            </Button>
          </Space>

          <Table
            dataSource={organizations}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Contact Email',
                dataIndex: 'contactEmail',
                key: 'contactEmail',
              },
              {
                title: 'Contact Phone',
                dataIndex: 'contactPhone',
                key: 'contactPhone',
              },
              {
                title: 'Location',
                key: 'location',
                render: (_, record) => {
                  const parts = [];
                  if (record.address) {
                    parts.push(record.address);
                  }
                  if (record.city) {
                    parts.push(record.city);
                  }
                  if (record.state) {
                    parts.push(record.state);
                  }
                  if (record.country) {
                    parts.push(record.country);
                  }
                  return parts.length > 0 ? parts.join(', ') : 'N/A';
                },
              },
              {
                title: 'Members',
                dataIndex: 'memberCount',
                key: 'memberCount',
                render: (count) => count || 0,
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedOrg(record.id);
                        fetchAvailableUsers();
                        setAssignUserModalVisible(true);
                      }}
                    >
                      Assign User
                    </Button>
                    <Button
                      size="small"
                      onClick={async () => {
                        try {
                          const response = await api.request({
                            path: `/organizations/${record.id}?includeMembers=true`,
                            method: 'GET',
                            secure: true,
                          });
                          Modal.info({
                            title: `Members of ${record.name}`,
                            width: 800,
                            content: (
                              <Table
                                dataSource={response.data.members || []}
                                rowKey="id"
                                columns={[
                                  { title: 'Name', dataIndex: 'userName', key: 'userName' },
                                  { title: 'Email', dataIndex: 'userEmail', key: 'userEmail' },
                                  {
                                    title: 'Role',
                                    dataIndex: 'role',
                                    key: 'role',
                                    render: (role) => (
                                      <Tag color={role === 'counselor' ? 'blue' : 'green'}>
                                        {role}
                                      </Tag>
                                    ),
                                  },
                                  {
                                    title: 'Actions',
                                    key: 'actions',
                                    render: (_, member: any) => (
                                      <Popconfirm
                                        title="Remove user from organization?"
                                        onConfirm={() => handleRemoveUser(record.id, member.userId)}
                                      >
                                        <Button size="small" danger>Remove</Button>
                                      </Popconfirm>
                                    ),
                                  },
                                ]}
                                pagination={false}
                              />
                            ),
                          });
                        } catch (error: any) {
                          message.error('Failed to load members');
                        }
                      }}
                    >
                      View Members
                    </Button>
                    <Popconfirm
                      title="Delete Organization"
                      description={`Are you sure you want to delete "${record.name}"? This will remove all counselors and students from this organization, and unlink all course enrollments. This action cannot be undone.`}
                      onConfirm={() => handleDeleteOrganization(record.id, record.name)}
                      okText="Yes, Delete"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancel"
                    >
                      <Button size="small" danger>
                        Delete
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            pagination={false}
          />
        </Card>

        <Modal
          title="Create Organization"
          open={createOrgModalVisible}
          onOk={() => createForm.submit()}
          onCancel={() => {
            setCreateOrgModalVisible(false);
            createForm.resetFields();
          }}
        >
          <Form form={createForm} onFinish={handleCreateOrganization} layout="vertical">
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="contactEmail" label="Contact Email">
              <Input type="email" />
            </Form.Item>
            <Form.Item name="contactPhone" label="Contact Phone">
              <Input />
            </Form.Item>
            <Form.Item name="address" label="Address">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="city" label="City">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="state" label="State">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="country" label="Country">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="postalCode" label="Postal Code">
              <Input />
            </Form.Item>
            <Form.Item name="website" label="Website">
              <Input type="url" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Assign User to Organization"
          open={assignUserModalVisible}
          onOk={() => assignForm.submit()}
          onCancel={() => {
            setAssignUserModalVisible(false);
            assignForm.resetFields();
            setSelectedOrg(null);
          }}
        >
          <Form form={assignForm} onFinish={handleAssignUser} layout="vertical">
            <Form.Item name="userId" label="User" rules={[{ required: true }]}>
              <Select
                showSearch
                placeholder="Search by name or email"
                optionFilterProp="children"
                onSearch={(value) => fetchAvailableUsers(value)}
                filterOption={false}
                notFoundContent={availableUsers.length === 0 ? <Spin size="small" /> : null}
              >
                {availableUsers.map((user) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
              <Radio.Group>
                <Radio value="counselor">Counselor</Radio>
                <Radio value="student">Student</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  };

  const renderAnalyticsTab = () => {
    if (analyticsLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading analytics...</div>
        </div>
      );
    }

    if (!analyticsData) {
      return <Alert message="No analytics data available" type="info" />;
    }

    const courseTabs = [
      { key: 'admissions', label: 'Admissions Program' },
      { key: 'sat', label: 'SAT Prep Course' },
    ];

    return (
      <div>
        <Tabs
          activeKey={analyticsTab}
          onChange={(key) => setAnalyticsTab(key as 'admissions' | 'sat')}
          items={courseTabs.map(tab => ({
            key: tab.key,
            label: tab.label,
          }))}
          style={{ marginBottom: 24 }}
        />
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Users"
                value={analyticsData.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Students with Access"
                value={analyticsData.studentsWithAccess}
                prefix={<CheckCircleOutlined />}
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
          {analyticsTab === 'admissions' && (
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
          )}
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
      render: (text: string) => <span>{text}</span>,
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
          <Tag color={getTelegramStatusColor(status)}>
            {status?.toUpperCase()}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
        )
      ),
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
      sorter: true,
      width: 120,
      render: (courseName: 'admissions' | 'sat' | undefined, record: DashboardData) => {
        if (!courseName) {
          return <span style={{ color: '#999' }}>N/A</span>;
        }
        return (
          <Tag color={courseName === 'sat' ? 'purple' : 'blue'}>
            {courseName === 'sat' ? 'SAT Prep' : 'Admissions'}
          </Tag>
        );
      },
    },
    {
      title: 'Course Type',
      dataIndex: 'courseType',
      key: 'courseType',
      sorter: true,
      width: 120,
      render: (type: string | null, record: DashboardData) => {
        // For SAT, don't show courseType (it's always standard)
        if (record.courseName === 'sat') {
          return <span style={{ color: '#999' }}>N/A</span>;
        }
        return type ? (
          <Tag color={type === 'premium' ? 'gold' : 'blue'}>
            {type.toUpperCase()}
          </Tag>
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
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
            status={Math.round(progress) === 100 ? 'success' : 'active'}
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
        // Check if telegram is connected
        const isTelegramConnected = record.telegramStatus === 'connected';
        
        return (
          <Space>
            {!hasAccess ? (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleGrantAccess(record.id, record.userId, record.userName, record.courseName)}
                disabled={!isTelegramConnected}
                title={!isTelegramConnected ? 'User must have Telegram connected to grant access' : ''}
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
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading...</div>
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
        <h1>TopCoach Management</h1>
        <p>Manage users, enrollments, and organizations</p>
      </Card>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        style={{ marginTop: 16, marginBottom: 0 }}
        items={[
          {
            key: 'users',
            label: 'Users & Enrollments',
            children: (
              <>
                <Card className="dashboard-filters" style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Space>
                    <Search
                      placeholder="Search by user name or email"
                      allowClear
                      enterButton={<SearchOutlined />}
                      size="large"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onSearch={fetchData}
                      style={{ maxWidth: 400 }}
                    />
                      <Select
                        value={courseFilter}
                        onChange={setCourseFilter}
                        style={{ width: 200 }}
                        size="large"
                      >
                        <Select.Option value="all">All Courses</Select.Option>
                        <Select.Option value="admissions">Admissions Program</Select.Option>
                        <Select.Option value="sat">SAT Prep Course</Select.Option>
                      </Select>
                    </Space>
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
          {
            key: 'organizations',
            label: 'Organizations',
            children: renderOrganizationsTab(),
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
              {selectedUser.id 
                ? `This will update the existing ${selectedCourseName === 'admissions' ? 'Admissions' : 'SAT'} enrollment and grant access.`
                : `This will create a new ${selectedCourseName === 'admissions' ? 'Admissions' : 'SAT'} enrollment and grant access.`
              }
              {selectedUser.id && (
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
                <Radio value="admissions">Admissions Program</Radio>
                <Radio value="sat">SAT Prep Course</Radio>
              </Radio.Group>
            </div>
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
    </div>
  );
};

export default ProgramDashboard;

