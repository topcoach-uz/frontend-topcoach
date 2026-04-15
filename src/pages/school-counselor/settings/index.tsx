import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Descriptions, Tag, message, Row, Col, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Save, CheckCircle2, Globe } from 'lucide-react';
import { api } from 'src/app/api';
import { useOrganization } from '../context/OrganizationContext';
import './settings.scss';

const { TextArea } = Input;

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
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
        path: `/school-counselor-dashboard/analytics${isSuperAdmin && organizationId ? `?organizationId=${organizationId}` : ''}`,
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
        description: response.data.description,
        website: response.data.website,
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
          description: values.description,
          website: values.website,
        },
      });
      message.success(t('schoolCounselor.settings.saveSuccess', 'Settings saved successfully!'));
      fetchOrganization(); // Refresh data
    } catch (error: any) {
      console.error('Error updating organization:', error);
      message.error(error.response?.data?.message || t('schoolCounselor.settings.saveFailed', 'Failed to save settings'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{
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
        <div>{t('schoolCounselor.settings.loading', 'Loading organization settings...')}</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <Alert
        message={t('schoolCounselor.settings.noOrganization', 'No Organization Found')}
        description={t('schoolCounselor.settings.noOrganizationDesc', 'Please select an organization to view settings.')}
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div className="school-counselor-settings">
      <div className="settings-header">
        <h1>{t('schoolCounselor.settings.title', 'Settings')}</h1>
        <p className="page-subtitle">{t('schoolCounselor.settings.subtitle', 'Manage your organization profile and preferences')}</p>
      </div>

      <Row gutter={[24, 24]}>
        {/* Organization Profile */}
        <Col xs={24} lg={16}>
          <Card title={t('schoolCounselor.settings.organizationProfile', 'Organization Profile')} className="settings-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Form.Item
                label={t('schoolCounselor.settings.organizationName', 'Organization Name')}
                name="name"
                rules={[{ required: true, message: t('schoolCounselor.settings.pleaseEnterOrgName', 'Please enter organization name') }]}
              >
                <Input prefix={<User size={16} />} size="large" />
              </Form.Item>

              <Form.Item
                label={t('schoolCounselor.settings.email', 'Email')}
                name="email"
                rules={[
                  { required: true, message: t('schoolCounselor.settings.pleaseEnterEmail', 'Please enter email') },
                  { type: 'email', message: t('schoolCounselor.settings.pleaseEnterValidEmail', 'Please enter a valid email') },
                ]}
              >
                <Input prefix={<Mail size={16} />} size="large" />
              </Form.Item>

              <Form.Item label={t('schoolCounselor.settings.phone', 'Phone')} name="phone">
                <Input prefix={<Phone size={16} />} size="large" />
              </Form.Item>

              <Form.Item label={t('schoolCounselor.settings.address', 'Address')} name="address">
                <TextArea
                  rows={3}
                  placeholder={t('schoolCounselor.settings.enterOrgAddress', 'Enter organization address')}
                />
              </Form.Item>

              <Form.Item label={t('schoolCounselor.settings.description', 'Description')} name="description">
                <TextArea
                  rows={4}
                  placeholder={t('schoolCounselor.settings.orgDescriptionPlaceholder', 'Brief description of your organization or school')}
                />
              </Form.Item>

              <Form.Item
                label={t('schoolCounselor.settings.website', 'Website')}
                name="website"
                rules={[
                  {
                    type: 'url',
                    message: t('schoolCounselor.settings.pleaseEnterValidUrl', 'Please enter a valid URL (e.g. https://example.com)'),
                  },
                ]}
              >
                <Input prefix={<Globe size={16} />} size="large" placeholder="https://" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<Save size={16} />}
                  size="large"
                  loading={loading}
                  style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
                >
                  {t('schoolCounselor.settings.saveChanges', 'Save Changes')}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Subscription & Account Info */}
        <Col xs={24} lg={8}>
          <Card title={t('schoolCounselor.settings.subscription', 'Subscription')} className="settings-card">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('schoolCounselor.settings.totalStudents', 'Total Students')}>
                {analytics?.totalStudents || 0}
              </Descriptions.Item>
              <Descriptions.Item label={t('schoolCounselor.settings.studentsWithAccess', 'Students with Access')}>
                {analytics?.studentsWithAccess || 0}
              </Descriptions.Item>
              <Descriptions.Item label={t('schoolCounselor.settings.activeStudents', 'Active Students')}>
                {analytics?.totalStudents || 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t('schoolCounselor.settings.accountInformation', 'Account Information')} className="settings-card" style={{ marginTop: 24 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('schoolCounselor.settings.organizationId', 'Organization ID')}>
                {organization.id}
              </Descriptions.Item>
              <Descriptions.Item label={t('schoolCounselor.settings.accountStatus', 'Account Status')}>
                <Tag color="green" icon={<CheckCircle2 size={16} />}>
                  {t('common.active', 'Active')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('schoolCounselor.settings.created', 'Created')}>
                {new Date(organization.createdAt).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={t('schoolCounselor.settings.counselors', 'Counselors')} className="settings-card" style={{ marginTop: 24 }}>
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
                      {counselor.userName || t('common.unknownUser', 'Unknown User')}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {counselor.userEmail || t('common.noEmail', 'No email')}
                    </div>
                    {counselor.telegramStatus && (
                      <div style={{ marginTop: '4px' }}>
                        <Tag color={counselor.telegramStatus === 'connected' ? 'green' : 'default'}>
                          {t('schoolCounselor.settings.telegramConnected', 'Telegram: connected')}
                        </Tag>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                {t('schoolCounselor.settings.noCounselorsAssigned', 'No counselors assigned')}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SettingsPage;
