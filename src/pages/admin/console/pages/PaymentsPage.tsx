import {
  Alert,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';

import dayjs, { type Dayjs } from 'dayjs';
import {
  useGetAdminPaymentsQuery,
  type AdminPaymentRow,
} from 'src/app/services/adminConsoleApi';
import { AcPill, type AcPillVariant } from '../components/AcPill';
import { cleanUserName, formatUZS } from '../utils';

import SearchButton from 'src/components/common/searchButton';
const { Paragraph } = Typography;
const { RangePicker } = DatePicker;

type StatusKey = 'all' | 'paid' | 'pending' | 'failed';

function statusPill(status: string): { label: string; variant: AcPillVariant } {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'paid' || s === 'success') return { label: 'Paid', variant: 'mint' };
  if (s === 'pending' || s === 'processing') return { label: 'Pending', variant: 'info' };
  if (s === 'failed' || s === 'rejected' || s === 'cancelled') return { label: s, variant: 'danger' };
  return { label: status || '—', variant: 'neutral' };
}

function statusBucket(status: string): StatusKey {
  const s = (status || '').toLowerCase();
  if (['completed', 'paid', 'success'].includes(s)) return 'paid';
  if (['pending', 'processing'].includes(s)) return 'pending';
  if (['failed', 'rejected', 'cancelled'].includes(s)) return 'failed';
  return 'all';
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function AdminConsolePaymentsPage() {
  const { data, isLoading, isError, error } = useGetAdminPaymentsQuery({ start: 0, end: 500 });

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusKey>('all');
  const [method, setMethod] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const allRows = data?.items ?? [];

  const methodOptions = useMemo(() => {
    const set = new Set<string>();
    allRows.forEach((r) => r.method && set.add(r.method));
    return [
      { value: 'all', label: 'All methods' },
      ...[...set].sort().map((m) => ({ value: m, label: m })),
    ];
  }, [allRows]);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const [from, to] = dateRange ?? [null, null];
    return allRows.filter((r) => {
      if (status !== 'all' && statusBucket(r.status) !== status) return false;
      if (method !== 'all' && r.method !== method) return false;
      if (s) {
        const userName = r.user?.profile?.name ?? '';
        const email = r.user?.email ?? '';
        const txn = r.transactionId ?? '';
        const hay = `${userName} ${email} ${txn}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (from || to) {
        const ts = new Date(r.createdAt).getTime();
        if (from && ts < from.startOf('day').toDate().getTime()) return false;
        if (to && ts > to.endOf('day').toDate().getTime()) return false;
      }
      return true;
    });
  }, [allRows, search, status, method, dateRange]);

  const kpis = useMemo(() => {
    const paid = allRows
      .filter((r) => statusBucket(r.status) === 'paid')
      .reduce((a, r) => a + Number(r.amount || 0), 0);
    const pending = allRows
      .filter((r) => statusBucket(r.status) === 'pending')
      .reduce((a, r) => a + Number(r.amount || 0), 0);
    const failed = allRows
      .filter((r) => statusBucket(r.status) === 'failed')
      .reduce((a, r) => a + Number(r.amount || 0), 0);
    return { paid, pending, failed, count: allRows.length };
  }, [allRows]);

  const columns: ColumnsType<AdminPaymentRow> = [
    {
      title: 'User',
      key: 'user',
      render: (_, row) =>
        cleanUserName(row.user?.profile?.name ?? null, row.user?.email ?? null),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (v: number) => formatUZS(v),
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (v: string | null) => v ?? <span style={{ color: 'var(--ac-text-muted)' }}>—</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v: string | null) => v ?? <span style={{ color: 'var(--ac-text-muted)' }}>—</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const p = statusPill(s);
        return <AcPill variant={p.variant}>{p.label}</AcPill>;
      },
    },
    {
      title: 'Transaction',
      dataIndex: 'transactionId',
      key: 'transactionId',
      ellipsis: true,
      render: (v: string | null) =>
        v ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> : '—',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (d: string) => <span style={{ color: 'var(--ac-text-secondary)' }}>{formatDate(d)}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="ac-admin-page">
        <div className="admin-console-suspense">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ac-admin-page">
        <h1 className="ac-page-title">Payments</h1>
        <Alert
          type="error"
          showIcon
          message="Failed to load payments"
          description={(error as { status?: number })?.status
            ? `Server returned ${(error as { status?: number }).status}.`
            : 'Check your connection or try again.'}
        />
      </div>
    );
  }

  return (
    <div className="ac-admin-page">
      <h1 className="ac-page-title">Payments</h1>
      <p className="ac-page-lead">Payouts and billing — all amounts in UZS.</p>

      <Row gutter={[16, 16]} className="ac-kpi-row">
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-green">
            <div className="ac-kpi-label">Total paid</div>
            <div className="ac-kpi-value">{formatUZS(kpis.paid)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-amber">
            <div className="ac-kpi-label">Pending</div>
            <div className="ac-kpi-value">{formatUZS(kpis.pending)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-red">
            <div className="ac-kpi-label">Failed / cancelled</div>
            <div className="ac-kpi-value">{formatUZS(kpis.failed)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-blue">
            <div className="ac-kpi-label">Records</div>
            <div className="ac-kpi-value">{kpis.count.toLocaleString()}</div>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="ac-panel" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>Pay policy</Typography.Title>
          <Space wrap size="large">
            <Space align="center" size={8}>
              <AcPill variant="mint">Completed 100%</AcPill>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>Full session payout</Paragraph>
            </Space>
            <Space align="center" size={8}>
              <AcPill variant="warning">Delayed 75%</AcPill>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>25% deducted if &gt; 30 min late</Paragraph>
            </Space>
            <Space align="center" size={8}>
              <AcPill variant="danger">Cancelled 0%</AcPill>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: 12 }}>No payout on cancel</Paragraph>
            </Space>
          </Space>
        </Space>
      </Card>

      <Card bordered={false} className="ac-panel" title="Payment ledger">
        <div className="ac-directory-toolbar" style={{ marginBottom: 12 }}>
          <Input
            allowClear
            size="large"
            placeholder="Search name, email, transaction ID"
            suffix={<SearchButton size={30} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ac-directory-search"
          />
          <Segmented
            value={status}
            onChange={(v) => setStatus(v as StatusKey)}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Paid', value: 'paid' },
              { label: 'Pending', value: 'pending' },
              { label: 'Failed', value: 'failed' },
            ]}
          />
          <Select
            value={method}
            onChange={setMethod}
            style={{ minWidth: 160 }}
            options={methodOptions}
          />
          <RangePicker
            value={dateRange as [Dayjs | null, Dayjs | null] | null}
            onChange={(vals) => setDateRange(vals as [Dayjs | null, Dayjs | null] | null)}
            allowEmpty={[true, true]}
          />
        </div>

        <div className="ac-directory-table-meta">
          <Typography.Text type="secondary">
            Showing <strong style={{ color: 'var(--ac-text)' }}>{rows.length}</strong> of {allRows.length}
          </Typography.Text>
        </div>

        <Table<AdminPaymentRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
          size="middle"
        />
      </Card>
    </div>
  );
}

// keep dayjs referenced
void dayjs;
