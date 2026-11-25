import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { useSearchParams } from 'react-router-dom';
import UserDetailDrawer from './UserDetailDrawer';
import { AcPill, type AcPillVariant } from './AcPill';
import {
  useGetAdminUsersDirectoryQuery,
  type AdminDirectoryRow,
  type AdminDirectoryQuery,
} from 'src/app/services/adminConsoleApi';
import { avatarStyleForId, initialsFromName } from '../utils';

import SearchButton from 'src/components/common/searchButton';
const { Text } = Typography;

export type DirectoryVariant = 'mentees' | 'mentors' | 'counselors' | 'admins';

function formatShortDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function managementRolePill(role: string | null): { label: string; variant: AcPillVariant } | null {
  if (!role) return null;
  const map: Record<string, AcPillVariant> = {
    Owner: 'amber',
    SuperAdmin: 'mint',
    Admin: 'blue',
    Manager: 'purple',
    Assistant: 'neutral',
  };
  return { label: role, variant: map[role] ?? 'neutral' };
}

function userCell(row: AdminDirectoryRow) {
  return (
    <div className="ac-user-cell">
      <div className="ac-avatar" style={avatarStyleForId(row.id)}>
        {initialsFromName(row.displayName)}
      </div>
      <div className="ac-user-cell-text">
        <div className="ac-user-cell-name">{row.displayName}</div>
        <div className="ac-user-cell-email">{row.email}</div>
      </div>
    </div>
  );
}

export default function DirectoryPageContent({ variant }: { variant: DirectoryVariant }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const setQ = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v) next.set('q', v);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const [selected, setSelected] = useState<AdminDirectoryRow | null>(null);
  const [adminFilter, setAdminFilter] = useState<'all' | 'any' | 'none'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // The input stays controlled by the raw `q` URL param; only the debounced
  // value feeds the query args, so we fire one request per pause instead of
  // one per keystroke.
  const [debouncedQ, setDebouncedQ] = useState(q.trim());
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      // Reset paging together with the debounced term so both land in the
      // same render — one fetch, not two.
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const queryParams = useMemo<AdminDirectoryQuery>(
    () => ({
      role: variant,
      search: debouncedQ || undefined,
      managementRole: adminFilter,
      page,
      pageSize,
    }),
    [variant, debouncedQ, adminFilter, page, pageSize],
  );

  const { data, isFetching, isError, error } = useGetAdminUsersDirectoryQuery(queryParams);

  // Keep the last resolved payload visible while a new page/search is in
  // flight so the stat tiles and table don't reset to 0/empty mid-fetch.
  const lastDataRef = useRef<typeof data>(undefined);
  if (data !== undefined) lastDataRef.current = data;
  const viewData = data ?? lastDataRef.current;

  const rows = viewData?.items ?? [];
  const total = viewData?.total ?? 0;

  // Per-tab column sets
  const menteeColumns: ColumnsType<AdminDirectoryRow> = [
    { title: 'Mentee', key: 'user', width: 280, render: (_, row) => userCell(row) },
    {
      title: 'Program',
      dataIndex: 'programLabel',
      key: 'programLabel',
      width: 150,
      render: (v: string | null) =>
        v ? <AcPill variant="cyan">{v}</AcPill> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Primary org',
      dataIndex: 'orgLabel',
      key: 'orgLabel',
      ellipsis: true,
      render: (v: string | null) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Last active',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 130,
      render: (iso: string | null) => <span style={{ color: 'var(--ac-text-secondary)' }}>{formatShortDate(iso)}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 88,
      fixed: 'right',
      render: (_, row) => (
        <Button size="small" type="primary" ghost onClick={() => setSelected(row)}>
          Open
        </Button>
      ),
    },
  ];

  const mentorColumns: ColumnsType<AdminDirectoryRow> = [
    { title: 'Mentor', key: 'user', width: 300, render: (_, row) => userCell(row) },
    {
      title: 'Tier',
      dataIndex: 'mentorTier',
      key: 'tier',
      width: 110,
      render: (v: string | undefined) =>
        v ? <AcPill variant="blue">{v}</AcPill> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Admin role',
      dataIndex: 'managementRole',
      key: 'managementRole',
      width: 130,
      render: (r: string | null) => {
        const p = managementRolePill(r);
        return p ? <AcPill variant={p.variant}>{p.label}</AcPill> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (iso: string) => <span style={{ color: 'var(--ac-text-secondary)' }}>{formatShortDate(iso)}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 88,
      fixed: 'right',
      render: (_, row) => (
        <Button size="small" type="primary" ghost onClick={() => setSelected(row)}>
          Open
        </Button>
      ),
    },
  ];

  const counselorColumns: ColumnsType<AdminDirectoryRow> = [
    { title: 'Counselor', key: 'user', width: 300, render: (_, row) => userCell(row) },
    {
      title: 'Organization',
      dataIndex: 'orgLabel',
      key: 'orgLabel',
      ellipsis: true,
      render: (v: string | null) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (iso: string) => <span style={{ color: 'var(--ac-text-secondary)' }}>{formatShortDate(iso)}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 88,
      fixed: 'right',
      render: (_, row) => (
        <Button size="small" type="primary" ghost onClick={() => setSelected(row)}>
          Open
        </Button>
      ),
    },
  ];

  const adminColumns: ColumnsType<AdminDirectoryRow> = [
    { title: 'Account', key: 'user', render: (_, row) => userCell(row) },
    {
      title: 'Role',
      dataIndex: 'managementRole',
      key: 'managementRole',
      width: 150,
      render: (r: string | null) => {
        const p = managementRolePill(r);
        return p ? <AcPill variant={p.variant}>{p.label}</AcPill> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (iso: string) => <span style={{ color: 'var(--ac-text-secondary)' }}>{formatShortDate(iso)}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 88,
      fixed: 'right',
      render: (_, row) => (
        <Button size="small" type="primary" ghost onClick={() => setSelected(row)}>
          Open
        </Button>
      ),
    },
  ];

  const columns =
    variant === 'mentees' ? menteeColumns
      : variant === 'mentors' ? mentorColumns
        : variant === 'counselors' ? counselorColumns
          : adminColumns;

  type StatTile = {
    title: string;
    value: number;
    color: string;
    subtitle?: string;
  };

  // Compact stat tiles per tab (only meaningful counts). Counts come from the
  // backend over the whole filtered set; counting `rows` would only see the
  // current page. The row-based fallback covers an older backend.
  const statTiles = ((): StatTile[] => {
    if (variant === 'admins') {
      const superAdmins =
        viewData?.superAdminsTotal ??
        rows.filter((r) => r.managementRole === 'SuperAdmin').length;
      const others = total - superAdmins;
      return [
        { title: 'Total admins', value: total, color: 'var(--ac-text)' },
        { title: 'SuperAdmins', value: superAdmins, color: '#6ee7b7' },
        { title: 'Other roles', value: others, color: '#c4b5fd' },
      ];
    }
    if (variant === 'counselors') {
      return [
        { title: 'Total counselors', value: total, color: 'var(--ac-text)' },
      ];
    }
    if (variant === 'mentors') {
      const admins =
        viewData?.mentorsWithAdminRole ??
        rows.filter((r) => r.managementRole != null).length;
      const tiered =
        viewData?.mentorsWithTier ?? rows.filter((r) => r.mentorTier).length;
      return [
        { title: 'Total mentors', value: total, color: 'var(--ac-text)' },
        { title: 'With admin role', value: admins, color: '#c4b5fd' },
        { title: 'Tier assigned', value: tiered, color: '#93c5fd' },
      ];
    }
    // mentees
    return [
      { title: 'Total mentees', value: total, color: 'var(--ac-text)' },
      {
        title: 'Telegram profiles',
        value: viewData?.telegramProfilesTotal ?? 0,
        color: '#7dd3fc',
        subtitle: 'Platform-wide users with a Telegram status set',
      },
    ];
  })();

  const statCol = statTiles.length >= 3 ? 8 : statTiles.length === 2 ? 12 : 24;

  return (
    <div className="ac-directory-section">
      <Row gutter={[12, 12]} className="ac-directory-stats">
        {statTiles.map((tile) => (
          <Col key={tile.title} xs={24} sm={statCol}>
            <Card size="small" bordered={false} className="ac-stat-tile">
              <Statistic title={tile.title} value={tile.value} valueStyle={{ color: tile.color }} />
              {tile.subtitle && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ac-text-muted)' }}>
                  {tile.subtitle}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Failed to load users directory"
          description={(error as { status?: number })?.status
            ? `Server returned ${(error as { status?: number }).status}.`
            : 'Check your connection and retry.'}
        />
      )}

      <Card bordered={false} className="ac-panel ac-directory-card">
        <div className="ac-directory-toolbar">
          <Input
            allowClear
            size="large"
            placeholder="Search name, email"
            suffix={<SearchButton size={30} />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ac-directory-search"
          />
          {variant !== 'admins' && (
            <Select
              value={adminFilter}
              onChange={(v) => {
                setAdminFilter(v);
                setPage(1);
              }}
              style={{ minWidth: 180 }}
              options={[
                { value: 'all', label: 'Admin: any' },
                { value: 'any', label: 'Has admin role' },
                { value: 'none', label: 'No admin role' },
              ]}
            />
          )}
        </div>

        <div className="ac-directory-table-meta">
          <Text type="secondary">
            {isFetching ? (
              <Spin size="small" />
            ) : (
              <>
                Showing <strong style={{ color: 'var(--ac-text)' }}>{rows.length}</strong> of {total}
              </>
            )}
          </Text>
        </div>

        <Table<AdminDirectoryRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          pagination={{
            pageSize,
            current: page,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 900 }}
          size="middle"
          onRow={(record) => ({
            onClick: () => setSelected(record),
            className: 'ac-directory-row',
          })}
        />
      </Card>

      <UserDetailDrawer user={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
