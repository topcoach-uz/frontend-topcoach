import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Descriptions, Tag, message, Row, Col, Spin, Alert } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { api } from 'src/app/api';
import { useOrganization } from '../context/OrganizationContext';
import './settings.scss';

const { TextArea } = Input;

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [counselors, setCounselors] = useState<any[]>([]);
  const { selectedOrganizationId, isSuperAdmin, isCounselor, counselorOrganizationId } = useOrganization();

  const organizationId = isSuperAdmin ? selectedOrganizationId : counselorOrganizationId;

  useEffect(() => {
    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

  // Get analytics for subscription info
  useEffect(() => {
    if (organizationId) {
      api.request({
        path: `/b2b-dashboard/analytics${isSuperAdmin && organizationId ? `?organizationId=${organizationId}` : ''}`,
        method: 'GET',
        secure: true,
      })
        .then((response) => {
          setAnalytics(response.data);
        })
        .catch(() => {
          // Ignore errors for analytics
        });
    }
  }, [organizationId, isSuperAdmin]);

  const fetchOrganization = async () => {
    if (!organizationId) return;
    
    setFetching(true);
    try {
      // Fetch organization with members
      const response = await api.request({
        path: `/organizations/${organizationId}?includeMembers=true`,
        method: 'GET',
        secure: true,
      });
      setOrganization(response.data);
      form.setFieldsValue({
        name: response.data.name,
        email: response.data.contactEmail,
        phone: response.data.contactPhone,
        address: response.data.address,
      });
      
      // Extract counselors from members
      const counselorMembers = response.data.members?.filter((m: any) => m.role === 'counselor') || [];
      setCounselors(counselorMembers);
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      message.error('Failed to load organization details');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (values: any) => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      await api.request({
        path: `/organizations/${organizationId}`,
        method: 'PUT',
        secure: true,
        body: {
          name: values.name,
          contactEmail: values.email,
          contactPhone: values.phone,
          address: values.address,
        },
      });
      message.success('Settings saved successfully!');
      fetchOrganization(); // Refresh data
    } catch (error: any) {
      console.error('Error updating organization:', error);
      message.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading organization settings...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <Alert
        message="No Organization Found"
        description="Please select an organization to view settings."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div className="b2b-settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="page-subtitle">Manage your organization profile and preferences</p>
      </div>

      <Row gutter={[24, 24]}>
        {/* Organization Profile */}
        <Col xs={24} lg={16}>
          <Card title="Organization Profile" className="settings-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Form.Item
                label="Organization Name"
                name="name"
                rules={[{ required: true, message: 'Please enter organization name' }]}
              >
                <Input prefix={<UserOutlined />} size="large" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input prefix={<MailOutlined />} size="large" />
              </Form.Item>

              <Form.Item label="Phone" name="phone">
                <Input prefix={<PhoneOutlined />} size="large" />
              </Form.Item>

              <Form.Item label="Address" name="address">
                <TextArea
                  rows={3}
                  placeholder="Enter organization address"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  size="large"
                  loading={loading}
                  style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Subscription & Account Info */}
        <Col xs={24} lg={8}>
          <Card title="Subscription" className="settings-card">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Total Students">
                {analytics?.totalStudents || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Students with Access">
                {analytics?.studentsWithAccess || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Active Students">
                {analytics?.totalStudents || 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Account Information" className="settings-card" style={{ marginTop: 24 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Organization ID">
                {organization.id}
              </Descriptions.Item>
              <Descriptions.Item label="Account Status">
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Active
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(organization.createdAt).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Counselors" className="settings-card" style={{ marginTop: 24 }}>
            {counselors.length > 0 ? (
              <div>
                {counselors.map((counselor, index) => (
                  <div
                    key={counselor.id || index}
                    style={{
                      padding: '12px',
                      marginBottom: index < counselors.length - 1 ? '8px' : 0,
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {counselor.userName || 'Unknown User'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {counselor.userEmail || 'No email'}
                    </div>
                    {counselor.telegramStatus && (
                      <div style={{ marginTop: '4px' }}>
                        <Tag color={counselor.telegramStatus === 'connected' ? 'green' : 'default'}>
                          Telegram: {counselor.telegramStatus}
                        </Tag>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No counselors assigned
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SettingsPage;
