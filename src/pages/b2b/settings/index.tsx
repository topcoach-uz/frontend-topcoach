import React, { useState } from 'react';
import { Card, Form, Input, Button, Descriptions, Tag, Avatar, Upload, Switch, Select, message, Row, Col } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  UploadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { mockOrganization } from '../data/mockData';
import './settings.scss';

const { TextArea } = Input;
const { Option } = Select;

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSave = async (values: any) => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    message.success('Settings saved successfully!');
    setLoading(false);
  };

  const handleLogoUpload = (info: any) => {
    if (info.file.status === 'done') {
      message.success('Logo uploaded successfully!');
    }
  };

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
              initialValues={{
                name: mockOrganization.name,
                email: mockOrganization.email,
                phone: mockOrganization.phone,
                address: mockOrganization.address,
              }}
            >
              <Form.Item label="Organization Logo">
                <div className="logo-upload-section">
                  <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#8b0000' }} />
                  <Upload
                    name="logo"
                    action="/api/upload"
                    onChange={handleLogoUpload}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} style={{ marginLeft: 16 }}>
                      Upload Logo
                    </Button>
                  </Upload>
                </div>
              </Form.Item>

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
                  prefix={<EnvironmentOutlined />}
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
              <Descriptions.Item label="Current Plan">
                <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                  {mockOrganization.subscriptionPlan}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Students">
                {mockOrganization.totalStudents}
              </Descriptions.Item>
              <Descriptions.Item label="Active Students">
                {mockOrganization.activeStudents}
              </Descriptions.Item>
              <Descriptions.Item label="Completed Students">
                {mockOrganization.completedStudents}
              </Descriptions.Item>
            </Descriptions>
            <Button
              type="default"
              block
              style={{ marginTop: 16 }}
            >
              Upgrade Plan
            </Button>
          </Card>

          <Card title="Account Information" className="settings-card" style={{ marginTop: 24 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Organization ID">
                {mockOrganization.id}
              </Descriptions.Item>
              <Descriptions.Item label="Account Status">
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Active
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date('2024-01-01').toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Notification Preferences */}
      <Card title="Notification Preferences" className="settings-card" style={{ marginTop: 24 }}>
        <div className="notification-settings">
          <div className="notification-item">
            <div className="notification-info">
              <h4>Email Notifications</h4>
              <p>Receive email updates about student progress and activities</p>
            </div>
            <Switch
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
          </div>
          <div className="notification-item">
            <div className="notification-info">
              <h4>In-App Notifications</h4>
              <p>Get notified within the platform about important updates</p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onChange={setNotificationsEnabled}
            />
          </div>
          <div className="notification-item">
            <div className="notification-info">
              <h4>Weekly Reports</h4>
              <p>Receive weekly summary reports via email</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="notification-item">
            <div className="notification-info">
              <h4>Student Activity Alerts</h4>
              <p>Get notified when students complete courses or reach milestones</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card title="Preferences" className="settings-card" style={{ marginTop: 24 }}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Language">
                <Select defaultValue="en" size="large">
                  <Option value="en">English</Option>
                  <Option value="uz">Uzbek</Option>
                  <Option value="ru">Russian</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Time Zone">
                <Select defaultValue="utc" size="large">
                  <Option value="utc">UTC</Option>
                  <Option value="est">Eastern Time (EST)</Option>
                  <Option value="pst">Pacific Time (PST)</Option>
                  <Option value="cet">Central European Time (CET)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              size="large"
              style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
            >
              Save Preferences
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SettingsPage;
