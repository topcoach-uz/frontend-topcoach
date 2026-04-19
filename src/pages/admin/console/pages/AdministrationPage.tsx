import { Alert, Button, Card, Empty, Space, Spin, Table, Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  useGetAdminUsersDirectoryQuery,
  type AdminDirectoryRow,
} from 'src/app/services/adminConsoleApi';
import { useAdminConsole } from '../AdminConsoleContext';
import { AcPill, type AcPillVariant } from '../components/AcPill';
import { avatarStyleForId, initialsFromName } from '../utils';

const { Paragraph } = Typography;

function governanceRolePill(role: string) {
  const variant: Record<string, AcPillVariant> = {
    Owner: 'amber',
    SuperAdmin: 'mint',
    Admin: 'blue',
    Manager: 'purple',
    Assistant: 'neutral',
  };
  return <AcPill variant={variant[role] ?? 'neutral'}>{role}</AcPill>;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function AdminConsoleAdministrationPage() {
  const { role: myRole } = useAdminConsole();
  const { data, isLoading, isError, error } = useGetAdminUsersDirectoryQuery({
    role: 'admins',
    pageSize: 100,
  });

  const rows = data?.items ?? [];

  const columns: ColumnsType<AdminDirectoryRow> = [
    {
      title: 'Account',
      key: 'user',
      render: (_, row) => (
        <div className="ac-user-cell">
          <div className="ac-avatar" style={avatarStyleForId(row.id)}>
            {initialsFromName(row.displayName)}
          </div>
          <div className="ac-user-cell-text">
            <div className="ac-user-cell-name">{row.displayName}</div>
            <div className="ac-user-cell-email">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'managementRole',
      key: 'role',
      width: 140,
      render: (r: string | null) => (r ? governanceRolePill(r) : <span style={{ color: 'var(--ac-text-muted)' }}>—</span>),
    },
    {
      title: 'Org',
      dataIndex: 'orgLabel',
      key: 'org',
      render: (v: string | null) => v ?? <span style={{ color: 'var(--ac-text-muted)' }}>—</span>,
    },
    {
      title: 'Last active',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 130,
      render: (iso: string | null) => formatDate(iso),
    },
  ];

  const rosterBody = (() => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      );
    }
    if (isError) {
      return (
        <Alert
          type="error"
          showIcon
          message="Failed to load admin roster"
          description={(error as { status?: number })?.status
            ? `Server returned ${(error as { status?: number }).status}.`
            : 'Check your connection and retry.'}
        />
      );
    }
    if (rows.length === 0) {
      return <Empty description="No admins found" />;
    }
    return <Table<AdminDirectoryRow> rowKey="id" columns={columns} dataSource={rows} pagination={false} />;
  })();

  return (
    <div className="ac-admin-page ac-admin-page--governance">
      <h1 className="ac-page-title">Administration</h1>
      <p className="ac-page-lead">Admin roster, permission templates, and audit log.</p>

      <Tabs
        className="ac-admin-page-tabs"
        items={[
          {
            key: 'roster',
            label: `Admin roster (${data?.total ?? 0})`,
            children: (
              <Card bordered={false} className="ac-panel">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Space wrap>
                    <Button type="primary" disabled>Invite admin (coming soon)</Button>
                    <Button disabled>Promote to SuperAdmin (owner only)</Button>
                    <Button disabled>Deactivate</Button>
                  </Space>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    Signed in as <strong>{myRole}</strong>
                  </Paragraph>
                  {rosterBody}
                </Space>
              </Card>
            ),
          },
          {
            key: 'templates',
            label: 'Role templates',
            children: (
              <Card bordered={false} className="ac-panel">
                <Paragraph type="secondary">Permission bundles — coming soon.</Paragraph>
                <Space wrap>
                  <AcPill variant="neutral">users.read</AcPill>
                  <AcPill variant="neutral">enrollments.grant</AcPill>
                  <AcPill variant="neutral">orgs.read</AcPill>
                  <AcPill variant="danger">admin.roster.write</AcPill>
                </Space>
              </Card>
            ),
          },
          {
            key: 'audit',
            label: 'Audit log',
            children: (
              <Card bordered={false} className="ac-panel">
                <Empty description="Audit stream coming soon — requires backend admin_audit_events endpoint." />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
