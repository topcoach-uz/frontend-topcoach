import React from 'react';
import { Card, Tabs, Form, Switch, Select, Button, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import './SettingsPage.scss';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();

  const tabItems = [
    {
      key: 'account',
      label: (
        <span>
          <UnifiedIcon name="user" size="sm" color="primary" style={{ marginRight: 8 }} />
          Account
        </span>
      ),
      children: (
        <div className="settings-content">
          <Form form={form} layout="vertical">
            <Form.Item label="Email Notifications">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="SMS Notifications">
              <Switch />
            </Form.Item>
            <Form.Item label="Deadline Reminders">
              <Switch defaultChecked />
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span>
          <UnifiedIcon name="bell" size="sm" color="primary" style={{ marginRight: 8 }} />
          Notifications
        </span>
      ),
      children: (
        <div className="settings-content">
          <Form form={form} layout="vertical">
            <Form.Item label="Application Updates">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="Mentor Messages">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="Event Reminders">
              <Switch defaultChecked />
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'privacy',
      label: (
        <span>
          <UnifiedIcon name="settings" size="sm" color="primary" style={{ marginRight: 8 }} />
          Privacy
        </span>
      ),
      children: (
        <div className="settings-content">
          <Form form={form} layout="vertical">
            <Form.Item label="Profile Visibility">
              <Select defaultValue="private">
                <Select.Option value="private">Private</Select.Option>
                <Select.Option value="mentors">Mentors Only</Select.Option>
                <Select.Option value="public">Public</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Data Sharing">
              <Switch />
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'language',
      label: (
        <span>
          <UnifiedIcon name="globe" size="sm" color="primary" style={{ marginRight: 8 }} />
          Language
        </span>
      ),
      children: (
        <div className="settings-content">
          <Form form={form} layout="vertical">
            <Form.Item label="Language">
              <Select
                value={i18n.language}
                onChange={(value) => i18n.changeLanguage(value)}
              >
                <Select.Option value="en">English</Select.Option>
                <Select.Option value="ru">Русский</Select.Option>
                <Select.Option value="uz">O'zbek</Select.Option>
                <Select.Option value="kk">Қазақ</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <div className="settings-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>
          Settings
        </h1>
        <p style={{ fontSize: 16, color: '#666', marginTop: 8, marginBottom: 0 }}>
          Manage your account settings, preferences, and privacy
        </p>
      </div>

      <Card>
        <Tabs
          defaultActiveKey="account"
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default SettingsPage;
