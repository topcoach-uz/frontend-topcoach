import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Segmented,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search as SearchIcon } from 'lucide-react';
import {
  useCancelAdminSubscriptionMutation,
  useExtendAdminSubscriptionMutation,
  useForceChargeAdminSubscriptionMutation,
  useGetAdminSubscriptionDetailQuery,
  useGetAdminSubscriptionStatsQuery,
  useGetAdminSubscriptionsQuery,
  type AdminSubscriptionRow,
  type AdminSubscriptionStatus,
} from 'src/app/services/adminConsoleApi';
import { AcPill, type AcPillVariant } from '../components/AcPill';

const { Paragraph } = Typography;

type TabKey = 'subscriptions' | 'stats';

function statusPill(s: AdminSubscriptionStatus | string): { label: string; variant: AcPillVariant } {
  switch (s) {
    case 'active': return { label: 'Active', variant: 'mint' };
    case 'trialing': return { label: 'Trialing', variant: 'info' };
    case 'past_due': return { label: 'Past due', variant: 'warning' };
    case 'pending': return { label: 'Pending', variant: 'neutral' };
    case 'canceled': return { label: 'Canceled', variant: 'slate' };
    case 'expired': return { label: 'Expired', variant: 'danger' };
    default: return { label: String(s || '—'), variant: 'neutral' };
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ────────────────────────────────────────────────────────────────────
// Tab 1 — Subscriptions list + detail drawer
// ────────────────────────────────────────────────────────────────────

function SubscriptionsTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminSubscriptionStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useGetAdminSubscriptionsQuery({
    q: search.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: pageSize,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: ColumnsType<AdminSubscriptionRow> = useMemo(() => [
    {
      title: 'User',
      key: 'user',
      width: 260,
      render: (_, r) => (
        <span>
          {r.userEmail ?? <span style={{ color: 'var(--ac-text-muted)' }}>—</span>}
        </span>
      ),
    },
    {
      title: 'Plan',
      key: 'plan',
      width: 180,
      render: (_, r) => (
        <span>
          {r.planName ?? '—'}
          {r.planPeriod && <span style={{ color: 'var(--ac-text-muted)', fontSize: 12 }}> · {r.planPeriod}</span>}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, r) => {
        const p = statusPill(r.status);
        return <AcPill variant={p.variant}>{p.label}</AcPill>;
      },
    },
    {
      title: 'Trial ends',
      dataIndex: 'trialEndsAt',
      key: 'trialEndsAt',
      width: 120,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: 'Period ends',
      dataIndex: 'currentPeriodEnd',
      key: 'currentPeriodEnd',
      width: 120,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: 'Auto-renew',
      key: 'autoRenew',
      width: 110,
      render: (_, r) =>
        r.cancelAtPeriodEnd ? (
          <Tag color="default">Cancels at end</Tag>
        ) : (
          <Tag color="default" style={{ color: 'var(--ac-text-secondary)' }}>On</Tag>
        ),
    },
    {
      title: 'Failed in cycle',
      dataIndex: 'failedAttemptsInCycle',
      key: 'failedAttemptsInCycle',
      width: 130,
      render: (v: number) =>
        v > 0 ? <AcPill variant="warning">{v}</AcPill> : <span style={{ color: 'var(--ac-text-muted)' }}>0</span>,
    },
    {
      title: 'Card',
      key: 'card',
      width: 140,
      render: (_, r) =>
        r.cardLast4
          ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>•••• {r.cardLast4}</span>
          : <span style={{ color: 'var(--ac-text-muted)' }}>—</span>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (d: string) => <span style={{ color: 'var(--ac-text-secondary)' }}>{formatDate(d)}</span>,
    },
  ], []);

  return (
    <>
      <Card bordered={false} className="ac-panel" title="All subscriptions">
        <div className="ac-directory-toolbar" style={{ marginBottom: 12 }}>
          <Input
            allowClear
            size="large"
            placeholder="Search by user email"
            prefix={<SearchIcon size={18} style={{ opacity: 0.45 }} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="ac-directory-search"
          />
          <Segmented
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Trialing', value: 'trialing' },
              { label: 'Past due', value: 'past_due' },
              { label: 'Canceled', value: 'canceled' },
            ]}
          />
        </div>

        {isError && (
          <Alert
            type="error"
            showIcon
            message="Failed to load subscriptions"
            description="Try refreshing the page."
            style={{ marginBottom: 12 }}
          />
        )}

        <div className="ac-directory-table-meta">
          <Typography.Text type="secondary">
            Showing <strong style={{ color: 'var(--ac-text)' }}>{rows.length}</strong> of {total.toLocaleString()}
          </Typography.Text>
        </div>

        <Table<AdminSubscriptionRow>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            onChange: (p, s) => { setPage(p); setPageSize(s); },
          }}
          onRow={(record) => ({ onClick: () => setOpenId(record.id), style: { cursor: 'pointer' } })}
          size="middle"
        />
      </Card>

      <SubscriptionDetailDrawer
        id={openId}
        onClose={() => setOpenId(null)}
        onMutated={() => { void refetch(); }}
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Detail drawer — basic status block + actions
// ────────────────────────────────────────────────────────────────────

function SubscriptionDetailDrawer({
  id,
  onClose,
  onMutated,
}: {
  id: string | null;
  onClose: () => void;
  onMutated: () => void;
}) {
  const { data, isFetching } = useGetAdminSubscriptionDetailQuery(id ?? '', { skip: !id });
  const [extend, { isLoading: extending }] = useExtendAdminSubscriptionMutation();
  const [forceCharge, { isLoading: charging }] = useForceChargeAdminSubscriptionMutation();
  const [cancel, { isLoading: canceling }] = useCancelAdminSubscriptionMutation();
  const [extendDays, setExtendDays] = useState<number>(7);

  const handleExtend = async () => {
    if (!id) return;
    try {
      await extend({ id, days: extendDays }).unwrap();
      message.success(`Period extended by ${extendDays} day${extendDays === 1 ? '' : 's'}.`);
      onMutated();
    } catch {
      message.error('Extend failed.');
    }
  };

  const handleCharge = async () => {
    if (!id) return;
    try {
      await forceCharge({ id }).unwrap();
      message.success('Charge triggered.');
      onMutated();
    } catch {
      message.error('Charge failed.');
    }
  };

  const handleCancel = async (immediate: boolean) => {
    if (!id) return;
    try {
      await cancel({ id, immediate }).unwrap();
      message.success(immediate ? 'Canceled immediately.' : 'Will cancel at period end.');
      onMutated();
      onClose();
    } catch {
      message.error('Cancel failed.');
    }
  };

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title="Subscription details"
      width={520}
      destroyOnClose
    >
      {isFetching && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin />
        </div>
      )}
      {!isFetching && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <DetailRow label="User" value={data.userEmail ?? '—'} />
          <DetailRow
            label="Status"
            valueNode={<AcPill variant={statusPill(data.status).variant}>{statusPill(data.status).label}</AcPill>}
          />
          <DetailRow
            label="Plan"
            value={data.planName ? `${data.planName} · ${data.planPeriod}` : '—'}
          />
          <DetailRow label="Started" value={formatDateTime(data.startDate)} />
          <DetailRow label="Trial ends" value={formatDateTime(data.trialEndsAt)} />
          <DetailRow label="Current period ends" value={formatDateTime(data.currentPeriodEnd)} />
          <DetailRow
            label="Auto-renew"
            value={data.cancelAtPeriodEnd ? 'Off — cancels at end of period' : 'On'}
          />
          <DetailRow
            label="Failed attempts in cycle"
            value={String(data.failedAttemptsInCycle ?? 0)}
          />
          {data.nextRetryAt && (
            <DetailRow label="Next retry" value={formatDateTime(data.nextRetryAt)} />
          )}
          <DetailRow
            label="Card"
            value={data.cardLast4 ? `•••• ${data.cardLast4} (${data.cardProvider ?? '—'})` : '—'}
          />

          <div style={{ borderTop: '1px solid var(--ac-border)', paddingTop: 16, marginTop: 4 }}>
            <Typography.Text strong style={{ color: 'var(--ac-text)', display: 'block', marginBottom: 12 }}>
              Support actions
            </Typography.Text>

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space>
                <InputNumber
                  min={1}
                  max={365}
                  value={extendDays}
                  onChange={(v) => setExtendDays(Number(v ?? 7))}
                  style={{ width: 90 }}
                />
                <Button onClick={handleExtend} loading={extending}>Extend by N days</Button>
              </Space>

              <Button onClick={handleCharge} loading={charging}>Force charge now</Button>

              <Popconfirm
                title="Cancel this subscription?"
                description="Sets cancel_at_period_end so access continues until the current period ends."
                onConfirm={() => void handleCancel(false)}
                okText="Cancel at period end"
              >
                <Button loading={canceling}>Cancel at period end</Button>
              </Popconfirm>

              <Popconfirm
                title="Cancel immediately?"
                description="Access is revoked right now. No refund is issued."
                onConfirm={() => void handleCancel(true)}
                okText="Yes, cancel now"
                okButtonProps={{ danger: true }}
              >
                <Button danger loading={canceling}>Cancel immediately</Button>
              </Popconfirm>
            </Space>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function DetailRow({ label, value, valueNode }: { label: string; value?: string; valueNode?: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'baseline' }}>
      <Typography.Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </Typography.Text>
      <div style={{ color: 'var(--ac-text)' }}>{valueNode ?? value ?? '—'}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Tab — Stats
// ────────────────────────────────────────────────────────────────────

function StatsTab() {
  const { data, isLoading, isError } = useGetAdminSubscriptionStatsQuery();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert type="error" showIcon message="Failed to load stats" />
    );
  }

  const byStatus = data.byStatus ?? {};

  return (
    <>
      <Row gutter={[16, 16]} className="ac-kpi-row">
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-green">
            <div className="ac-kpi-label">MRR (USD)</div>
            <div className="ac-kpi-value">${data.mrrUsd.toLocaleString()}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-blue">
            <div className="ac-kpi-label">MRR (UZS)</div>
            <div className="ac-kpi-value">{data.mrrUzs.toLocaleString()}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-amber">
            <div className="ac-kpi-label">Charges last 24h</div>
            <div className="ac-kpi-value">{data.charges24h.toLocaleString()}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} className="ac-kpi-card ac-kpi-card--accent-red">
            <div className="ac-kpi-label">Failures last 24h</div>
            <div className="ac-kpi-value">{data.failures24h.toLocaleString()}</div>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="ac-panel" title="By status">
        <Row gutter={[12, 12]}>
          {(['active', 'trialing', 'past_due', 'canceled', 'expired', 'pending'] as const).map((s) => {
            const p = statusPill(s);
            return (
              <Col xs={12} sm={8} md={6} key={s}>
                <Card bordered={false} className="ac-panel" style={{ background: 'var(--ac-bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <AcPill variant={p.variant}>{p.label}</AcPill>
                    <Typography.Title level={3} style={{ margin: 0, color: 'var(--ac-text)' }}>
                      {(byStatus[s] ?? 0).toLocaleString()}
                    </Typography.Title>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
        Past-due overdue (failed cycle, last retry passed): <strong>{data.pastDueOverdue}</strong>
        {' · '}Last generated: {formatDateTime(data.generatedAt)}
      </Paragraph>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────
// Page shell
// ────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<TabKey>('subscriptions');

  return (
    <div className="ac-admin-page">
      <h1 className="ac-page-title">Subscriptions</h1>
      <p className="ac-page-lead">
        Manage user subscriptions, plans, and billing health for Community.
      </p>

      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: 'subscriptions', label: 'Subscriptions', children: <SubscriptionsTab /> },
          { key: 'stats', label: 'Trials & Churn', children: <StatsTab /> },
        ]}
      />
    </div>
  );
}
