import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ArrowLeft, Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

import {
  useGetTopcoachLaunchEventAdminListQuery,
  useGetTopcoachLaunchEventAdminStatsQuery,
  type TopcoachLaunchEventRegistrationDto,
  type TopcoachLaunchEventStatus,
} from 'src/app/services/topcoachLaunchEventApi';

const { Paragraph } = Typography;

/** Tag color per status. */
function statusTag(s: TopcoachLaunchEventStatus): { color: string; label: string } {
  switch (s) {
    case 'confirmed':
      return { color: 'green', label: 'Confirmed' };
    case 'cancelled':
      return { color: 'red', label: 'Cancelled' };
    default:
      return { color: 'default', label: s };
  }
}

function safe(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

function rowToExport(r: TopcoachLaunchEventRegistrationDto): Record<string, string> {
  const d = r.draft ?? ({} as TopcoachLaunchEventRegistrationDto['draft']);
  return {
    'Registration ID': r.id,
    Status: r.status,
    'Submitted at': dayjs(r.submittedAt).format('YYYY-MM-DD HH:mm'),
    'Full name': safe(d.fullName),
    Email: safe(d.email),
    'Account email': safe(r.user?.email),
    Phone: safe(d.phone),
    Telegram: safe(d.telegramUsername),
    Grade: safe(d.grade),
    'English level': safe(d.englishLevel),
    Fields: safe(d.fields),
    Countries: safe(d.countries),
    'Heard via': safe(d.referralSource),
    Attendance: safe(d.attendance),
    Expectations: safe(d.expectations),
    'Admissions question': safe(d.admissionsQuestion),
  };
}

export default function TopcoachLaunchEventAdminPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | TopcoachLaunchEventStatus>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<TopcoachLaunchEventRegistrationDto | null>(null);

  const { data, isLoading, isError, error } =
    useGetTopcoachLaunchEventAdminListQuery({
      status: statusFilter,
      q: search.trim() || undefined,
    });
  const { data: stats } = useGetTopcoachLaunchEventAdminStatsQuery();

  const rows = data?.registrations ?? [];

  const columns: ColumnsType<TopcoachLaunchEventRegistrationDto> = useMemo(
    () => [
      {
        title: 'Submitted',
        key: 'submittedAt',
        dataIndex: 'submittedAt',
        width: 150,
        render: (iso: string) => dayjs(iso).format('MMM D, YYYY · HH:mm'),
        sorter: (a, b) => dayjs(a.submittedAt).valueOf() - dayjs(b.submittedAt).valueOf(),
        defaultSortOrder: 'descend',
      },
      {
        title: 'Name',
        key: 'fullName',
        render: (_, r) => <strong>{r.draft?.fullName ?? '—'}</strong>,
      },
      {
        title: 'Email',
        key: 'email',
        render: (_, r) => (
          <Space direction="vertical" size={0}>
            <span>{r.draft?.email ?? '—'}</span>
            {r.user?.email && r.user.email !== r.draft?.email && (
              <span style={{ fontSize: 11, color: 'var(--ac-text-muted, #999)' }}>
                Account: {r.user.email}
              </span>
            )}
          </Space>
        ),
      },
      {
        title: 'Phone',
        key: 'phone',
        dataIndex: ['draft', 'phone'],
        width: 150,
        render: (v: string) => v ?? '—',
      },
      {
        title: 'Telegram',
        key: 'telegram',
        dataIndex: ['draft', 'telegramUsername'],
        width: 150,
        render: (v: string) => (v ? `@${v.replace(/^@+/, '')}` : '—'),
      },
      {
        title: 'Grade',
        key: 'grade',
        dataIndex: ['draft', 'grade'],
        width: 110,
        render: (v: string) => v ?? '—',
      },
      {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        width: 110,
        render: (s: TopcoachLaunchEventStatus) => {
          const t = statusTag(s);
          return <Tag color={t.color}>{t.label}</Tag>;
        },
      },
      {
        title: '',
        key: 'actions',
        width: 80,
        render: (_, r) => (
          <Button size="small" onClick={() => setOpen(r)}>
            Open
          </Button>
        ),
      },
    ],
    [],
  );

  const exportCsv = () => {
    if (!rows.length) {
      message.info('No registrations to export.');
      return;
    }
    const sheet = XLSX.utils.json_to_sheet(rows.map(rowToExport));
    const csv = XLSX.utils.sheet_to_csv(sheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topcoach-launch-event-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`Exported ${rows.length} registration${rows.length === 1 ? '' : 's'}.`);
  };

  const exportXlsx = () => {
    if (!rows.length) {
      message.info('No registrations to export.');
      return;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows.map(rowToExport)),
      'Registrations',
    );
    XLSX.writeFile(wb, `topcoach-launch-event-${dayjs().format('YYYYMMDD-HHmm')}.xlsx`);
    message.success(`Exported ${rows.length} registration${rows.length === 1 ? '' : 's'}.`);
  };

  return (
    <div className="ac-admin-page">
      <Space style={{ marginBottom: 12 }}>
        <Button
          size="small"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate('/new-admin/events')}
        >
          Back to Events
        </Button>
      </Space>

      <h1 className="ac-page-title">New Feature Launch</h1>
      <p className="ac-page-lead">
        Free event · Sunday, May 24, 2026 · Youth Affairs Agency,
        Tashkent. Registrations are captured here. Use the search to
        filter by name, email, phone or Telegram handle.
      </p>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card bordered={false} className="ac-panel">
            <Statistic title="Total" value={stats?.total ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} className="ac-panel">
            <Statistic
              title="Confirmed"
              value={stats?.confirmed ?? 0}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} className="ac-panel">
            <Statistic
              title="Cancelled"
              value={stats?.cancelled ?? 0}
              valueStyle={{ color: '#dc2626' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} className="ac-panel">
            <Statistic title="Last 24h" value={stats?.last24h ?? 0} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="ac-panel" style={{ marginBottom: 16 }}>
        <Space wrap size={12} style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap size={8}>
            <Input
              prefix={<Search size={14} />}
              placeholder="Search name, email, phone, telegram, id"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ width: 320 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </Space>
          <Space>
            <Button icon={<Download size={14} />} onClick={exportCsv} disabled={!rows.length}>
              CSV
            </Button>
            <Button
              type="primary"
              icon={<Download size={14} />}
              onClick={exportXlsx}
              disabled={!rows.length}
            >
              XLSX
            </Button>
          </Space>
        </Space>
      </Card>

      {isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Failed to load registrations"
          description={
            (error as { status?: number })?.status
              ? `Server returned ${(error as { status?: number }).status}.`
              : 'Check your connection and retry.'
          }
        />
      )}

      <Card bordered={false} className="ac-panel">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : rows.length === 0 ? (
          <Empty description="No registrations yet" />
        ) : (
          <Table<TopcoachLaunchEventRegistrationDto>
            rowKey="id"
            columns={columns}
            dataSource={rows}
            pagination={{
              pageSize: 25,
              showSizeChanger: true,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            size="middle"
          />
        )}
      </Card>

      <Drawer
        title={open?.draft?.fullName ?? 'Registration'}
        open={!!open}
        onClose={() => setOpen(null)}
        width={520}
        destroyOnClose
      >
        {open && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card bordered={false} size="small">
              <Paragraph type="secondary" style={{ margin: 0, fontSize: 11, letterSpacing: 1 }}>
                STATUS
              </Paragraph>
              <Tag color={statusTag(open.status).color} style={{ marginTop: 6 }}>
                {statusTag(open.status).label}
              </Tag>
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                Submitted {dayjs(open.submittedAt).format('MMM D, YYYY · HH:mm')}
                {open.cancelledAt &&
                  ` · cancelled ${dayjs(open.cancelledAt).format('MMM D, YYYY · HH:mm')}`}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                Registration id: <code>{open.id}</code>
              </div>
              {open.user?.email && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                  Account email: {open.user.email}
                </div>
              )}
            </Card>

            <DetailRow label="Full name" value={open.draft?.fullName} />
            <DetailRow label="Email" value={open.draft?.email} />
            <DetailRow label="Phone" value={open.draft?.phone} />
            <DetailRow
              label="Telegram"
              value={open.draft?.telegramUsername ? `@${open.draft.telegramUsername.replace(/^@+/, '')}` : undefined}
            />
            <DetailRow label="Grade" value={open.draft?.grade} />
            <DetailRow label="English level" value={open.draft?.englishLevel} />
            <DetailRow label="Fields of interest" value={open.draft?.fields?.join(', ')} />
            <DetailRow label="Countries" value={open.draft?.countries?.join(', ')} />
            <DetailRow label="Heard about us via" value={open.draft?.referralSource} />
            <DetailRow label="Can attend on May 24?" value={open.draft?.attendance} />
            <DetailRow label="Expectations" value={open.draft?.expectations} multiline />
            <DetailRow
              label="Admissions question"
              value={open.draft?.admissionsQuestion}
              multiline
            />
          </Space>
        )}
      </Drawer>
    </div>
  );
}

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'var(--ac-text-muted, #666)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>
        {value && value.toString().trim().length > 0 ? value : '—'}
      </div>
    </div>
  );
}
