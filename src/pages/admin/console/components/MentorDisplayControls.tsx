import { useState } from 'react';
import { Alert, Button, Select, Space, Switch, Typography } from 'antd';
import { useUpdateAdminMentorDisplayMutation, type AdminUserDetailMentorProfile } from 'src/app/services/adminConsoleApi';
import { useAdminConsole } from '../AdminConsoleContext';

export default function MentorDisplayControls({ userId, profile }: { userId: string; profile: AdminUserDetailMentorProfile }) {
  const { role } = useAdminConsole();
  const [mentorshipType, setType] = useState(profile.mentorshipType ?? 'bachelor');
  const [showPrice, setShowPrice] = useState(profile.showPrice ?? true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [save, { isLoading }] = useUpdateAdminMentorDisplayMutation();
  if (role !== 'SuperAdmin' && role !== 'Owner') return null;

  async function submit() {
    setError(''); setNotice('');
    try {
      await save({ userId, mentorshipType, showPrice }).unwrap();
      setNotice('Mentor display settings saved.');
    } catch (failure) {
      const message = (failure as { data?: { message?: string | string[] } })?.data?.message;
      setError(Array.isArray(message) ? message.join(' ') : message || 'Could not save mentor settings. Please try again.');
    }
  }
  return <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
    <Typography.Text strong>Public mentor display</Typography.Text>
    <label htmlFor={`mentor-type-${userId}`}>Mentorship type</label>
    <Select id={`mentor-type-${userId}`} value={mentorshipType} onChange={setType} disabled={isLoading} style={{ width: '100%' }} options={[
      { value: 'bachelor', label: 'Bachelor’s applicants' },
      { value: 'master', label: 'Master’s applicants' },
      { value: 'both', label: 'Bachelor’s and Master’s applicants' },
    ]} />
    <Space><Switch checked={showPrice} onChange={setShowPrice} disabled={isLoading} aria-label="Show public mentor price" /><Typography.Text>Show price</Typography.Text></Space>
    <Typography.Text type="secondary">Controls public display only. Booking charges and checkout prices stay unchanged.</Typography.Text>
    {error && <Alert type="error" message={error} showIcon />}
    {notice && <Alert type="success" message={notice} showIcon />}
    <Button type="primary" loading={isLoading} onClick={() => void submit()}>Save mentor settings</Button>
  </Space>;
}
