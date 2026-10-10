import {
  Alert,
  ConfigProvider,
  Descriptions,
  Drawer,
  Empty,
  Space,
  Spin,
  Table,
  Tabs,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  useGetAdminUserDetailQuery,
  type AdminDirectoryRow,
  type AdminUserDetailEnrollment,
  type AdminUserDetailPayment,
  type AdminUserDetailSession,
} from 'src/app/services/adminConsoleApi';
import { getAdminConsoleAntdTheme } from '../adminConsoleThemeConfig';
import { AcPill, type AcPillVariant } from './AcPill';
import { avatarStyleForId, formatUZS, initialsFromName } from '../utils';
import UserSetupControls from './UserSetupControls';
import AccountAccessPanel from './AccountAccessPanel';
import MentorDisplayControls from './MentorDisplayControls';

const { Text, Paragraph } = Typography;

function sessionStatusPill(status: AdminUserDetailSession['status']): {
  label: string;
  variant: AcPillVariant;
} {
  switch (status) {
    case 'upcoming':
      return { label: 'Upcoming', variant: 'blue' };
    case 'completed':
      return { label: 'Completed', variant: 'mint' };
    case 'delayed':
      return { label: 'Delayed', variant: 'warning' };
    case 'cancelled':
      return { label: 'Cancelled', variant: 'danger' };
  }
}

function paymentStatusPill(status: string): AcPillVariant {
  const s = (status || '').toLowerCase();
  if (['completed', 'paid', 'success'].includes(s)) return 'mint';
  if (['pending', 'processing'].includes(s)) return 'info';
  if (['failed', 'rejected', 'cancelled'].includes(s)) return 'danger';
  return 'neutral';
}

function enrollmentStatusPill(status: string): AcPillVariant {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'mint';
  if (s === 'rejected') return 'danger';
  return 'warning';
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

type Props = {
  user: AdminDirectoryRow | null;
  open: boolean;
  onClose: () => void;
};

export default function UserDetailDrawer({ user, open, onClose }: Props) {
  const { data, isFetching, isError, error } = useGetAdminUserDetailQuery(user?.id ?? '', {
    skip: !user?.id,
  });

  if (!user) return null;

  const detail = data;
  const name = detail?.displayName ?? user.displayName;
  const email = detail?.email ?? user.email;

  const sessionColumns: ColumnsType<AdminUserDetailSession> = [
    {
      title: 'When',
      dataIndex: 'date',
      key: 'date',
      render: (iso: string) => <span style={{ fontSize: 12 }}>{formatDateTime(iso)}</span>,
    },
    {
      title: 'With',
      dataIndex: 'otherPartyName',
      key: 'other',
      render: (v: string | null) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 90,
      render: (r: string) => (r === 'mentor' ? 'Mentor' : 'Participant'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: AdminUserDetailSession['status']) => {
        const p = sessionStatusPill(s);
        return <AcPill variant={p.variant}>{p.label}</AcPill>;
      },
    },
  ];

  const enrollmentColumns: ColumnsType<AdminUserDetailEnrollment> = [
    {
      title: 'Program',
      dataIndex: 'programLabel',
      key: 'programLabel',
      render: (v: string) => <AcPill variant="cyan">{v}</AcPill>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => <AcPill variant={enrollmentStatusPill(s)}>{s || '—'}</AcPill>,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 110,
      render: (s: string) => <AcPill variant={paymentStatusPill(s)}>{s || '—'}</AcPill>,
    },
    {
      title: 'Enrolled',
      dataIndex: 'enrolledAt',
      key: 'enrolledAt',
      width: 130,
      render: (v: string | null) => formatDate(v),
    },
  ];

  const paymentColumns: ColumnsType<AdminUserDetailPayment> = [
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => formatUZS(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => <AcPill variant={paymentStatusPill(s)}>{s || '—'}</AcPill>,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (v: string | null) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (v: string | null) => formatDate(v),
    },
  ];

  const body = (() => {
    if (isFetching) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      );
    }
    if (isError || !detail) {
      return (
        <Alert
          type="error"
          showIcon
          message="Failed to load user detail"
          description={(error as { status?: number })?.status
            ? `Server returned ${(error as { status?: number }).status}.`
            : 'Retry shortly.'}
        />
      );
    }

    const mp = detail.mentorProfile;

    return (
      <Tabs
        items={[
          {
            key: 'identity',
            label: 'Identity',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Descriptions
                  column={1}
                  size="small"
                  labelStyle={{ color: 'var(--ac-text-muted)', width: 130 }}
                >
                  <Descriptions.Item label="User ID">
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{detail.id}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">{detail.email}</Descriptions.Item>
                  <Descriptions.Item label="Platform role">{detail.platformRole}</Descriptions.Item>
                  {detail.managementRole && (
                    <Descriptions.Item label="Admin role">
                      <AcPill variant="purple">{detail.managementRole}</AcPill>
                    </Descriptions.Item>
                  )}
                  {detail.phoneNumber && (
                    <Descriptions.Item label="Phone">{detail.phoneNumber}</Descriptions.Item>
                  )}
                  {detail.location && (
                    <Descriptions.Item label="Location">{detail.location}</Descriptions.Item>
                  )}
                  <Descriptions.Item label="Joined">{formatDate(detail.createdAt)}</Descriptions.Item>
                </Descriptions>
                <UserSetupControls key={`setup-${detail.id}`} userId={detail.id} />
                <AccountAccessPanel key={detail.id} userId={detail.id} />
                {detail.bio && (
                  <div>
                    <Text style={{ color: 'var(--ac-text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Bio
                    </Text>
                    <Paragraph style={{ marginTop: 6, marginBottom: 0 }}>{detail.bio}</Paragraph>
                  </div>
                )}
                {mp && (
                  <div>
                    <Text style={{ color: 'var(--ac-text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Mentor profile
                    </Text>
                    <Descriptions
                      column={1}
                      size="small"
                      style={{ marginTop: 8 }}
                      labelStyle={{ color: 'var(--ac-text-muted)', width: 130 }}
                    >
                      {mp.title && <Descriptions.Item label="Title">{mp.title}</Descriptions.Item>}
                      {mp.university && <Descriptions.Item label="University">{mp.university}</Descriptions.Item>}
                      {mp.major && <Descriptions.Item label="Major">{mp.major}</Descriptions.Item>}
                      {mp.level && (
                        <Descriptions.Item label="Tier">
                          <AcPill variant="blue">{mp.level}</AcPill>
                        </Descriptions.Item>
                      )}
                      {mp.status && (
                        <Descriptions.Item label="Status">
                          <AcPill variant={mp.status === 'accepted' ? 'mint' : mp.status === 'rejected' ? 'danger' : 'warning'}>
                            {mp.status}
                          </AcPill>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Visible">
                        {mp.visibleOnMentorsPage ? 'Yes' : 'No'}
                      </Descriptions.Item>
                    </Descriptions>
                    {mp.summary && (
                      <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 13 }}>
                        {mp.summary}
                      </Paragraph>
                    )}
                    <MentorDisplayControls key={detail.id} userId={detail.id} profile={mp} />
                  </div>
                )}
              </Space>
            ),
          },
          {
            key: 'sessions',
            label: `Sessions (${detail.sessionStats.total})`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Space wrap size={8}>
                  <AcPill variant="blue">Upcoming · {detail.sessionStats.upcoming}</AcPill>
                  <AcPill variant="mint">Completed · {detail.sessionStats.completed}</AcPill>
                  <AcPill variant="warning">Delayed · {detail.sessionStats.delayed}</AcPill>
                  <AcPill variant="danger">Cancelled · {detail.sessionStats.cancelled}</AcPill>
                </Space>
                {detail.recentSessions.length === 0 ? (
                  <Empty description="No sessions yet" />
                ) : (
                  <Table<AdminUserDetailSession>
                    rowKey="id"
                    columns={sessionColumns}
                    dataSource={detail.recentSessions}
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                )}
              </Space>
            ),
          },
          {
            key: 'programs',
            label: `Programs (${detail.enrollments.length})`,
            children: detail.enrollments.length === 0 ? (
              <Empty description="No program enrollments" />
            ) : (
              <Table<AdminUserDetailEnrollment>
                rowKey="id"
                columns={enrollmentColumns}
                dataSource={detail.enrollments}
                pagination={false}
                size="small"
              />
            ),
          },
          {
            key: 'payments',
            label: `Payments (${detail.recentPayments.length})`,
            children: detail.recentPayments.length === 0 ? (
              <Empty description="No payment history" />
            ) : (
              <Table<AdminUserDetailPayment>
                rowKey="id"
                columns={paymentColumns}
                dataSource={detail.recentPayments}
                pagination={false}
                size="small"
              />
            ),
          },
          {
            key: 'orgs',
            label: `Orgs (${detail.organizations.length})`,
            children: detail.organizations.length === 0 ? (
              <Empty description="No organization memberships" />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {detail.organizations.map((org) => (
                  <div
                    key={org.id}
                    style={{
                      padding: '12px 14px',
                      border: '1px solid var(--ac-border)',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{org.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Role: {org.memberRole}
                    </Text>
                  </div>
                ))}
              </Space>
            ),
          },
        ]}
      />
    );
  })();

  return (
    <ConfigProvider theme={getAdminConsoleAntdTheme()}>
      <Drawer
        title={
          <Space align="start" size={14}>
            <div className="ac-avatar ac-avatar--lg" style={avatarStyleForId(user.id)}>
              {initialsFromName(name)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--ac-text)' }}>{name}</div>
              <Text style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>{email}</Text>
            </div>
          </Space>
        }
        placement="right"
        width={640}
        onClose={onClose}
        open={open}
        className="ac-user-drawer"
      >
        {body}
      </Drawer>
    </ConfigProvider>
  );
}
