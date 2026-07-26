import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Gift, Search } from 'lucide-react';

import {
  useAdjustAdminReferralBalanceMutation,
  useGetAdminReferralCodesQuery,
  useGetAdminReferralSummaryQuery,
  useGetAdminReferralUsageQuery,
  useGetAdminReferralUserDetailQuery,
  useGetAdminReferralWalletsQuery,
  useRecordAdminReferralPayoutMutation,
  useReverseAdminReferralUsageMutation,
  useSetAdminReferralCodeActiveMutation,
  type AdminReferralCodeRow,
  type AdminReferralUsageRow,
  type AdminReferralWalletRow,
} from 'src/app/services/adminConsoleApi';
import { AcPill, type AcPillVariant } from '../components/AcPill';
import { cleanUserName } from '../utils';

const { Paragraph, Text } = Typography;

type TabKey = 'codes' | 'usage' | 'wallets';

const usd = (value: string | number | null | undefined) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value ?? 0));

const PRODUCT_LABEL: Record<string, string> = {
  course: 'Program',
  session: '1:1 session',
  package: 'Session package',
  custom: 'Custom program',
};

function statusPill(status: string): { label: string; variant: AcPillVariant } {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
      return { label: 'Confirmed', variant: 'mint' };
    case 'pending':
      return { label: 'Pending', variant: 'info' };
    case 'paid':
      return { label: 'Paid out', variant: 'neutral' };
    case 'reversed':
      return { label: 'Reversed', variant: 'danger' };
    default:
      return { label: status || '—', variant: 'neutral' };
  }
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card size="small" style={{ height: '100%' }}>
      <Text type="secondary" style={{ fontSize: 12, letterSpacing: '0.08em' }}>
        {label.toUpperCase()}
      </Text>
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.3,
        }}
      >
        {value}
      </div>
      {hint && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {hint}
        </Text>
      )}
    </Card>
  );
}

/** One user's full referral standing, plus the money actions. */
function UserDetailModal({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const { data, isFetching } = useGetAdminReferralUserDetailQuery(
    userId as string,
    { skip: !userId },
  );
  const [adjust, { isLoading: adjusting }] =
    useAdjustAdminReferralBalanceMutation();
  const [payout, { isLoading: payingOut }] =
    useRecordAdminReferralPayoutMutation();
  const [reverse] = useReverseAdminReferralUsageMutation();

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutRef, setPayoutRef] = useState('');

  const balance = Number(data?.balance?.balanceUsd ?? 0);

  const submitAdjust = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value === 0) {
      message.warning('Enter a non-zero amount');
      return;
    }
    if (!reason.trim()) {
      message.warning('A reason is required and is recorded');
      return;
    }
    try {
      await adjust({
        userId: userId as string,
        amountUsd: value,
        reason: reason.trim(),
      }).unwrap();
      message.success('Balance adjusted');
      setAmount('');
      setReason('');
    } catch (e: any) {
      message.error(e?.data?.message || 'Adjustment failed');
    }
  };

  const submitPayout = async () => {
    if (!payoutRef.trim()) {
      message.warning('A payment reference is required');
      return;
    }
    const parsed = payoutAmount.trim() ? Number(payoutAmount) : undefined;
    if (parsed !== undefined && (!Number.isFinite(parsed) || parsed <= 0)) {
      message.warning('Amount must be positive, or blank for the full balance');
      return;
    }
    try {
      const res = await payout({
        userId: userId as string,
        ...(parsed !== undefined ? { amountUsd: parsed } : {}),
        reference: payoutRef.trim(),
      }).unwrap();
      message.success(
        `Paid ${usd(res.paidUsd)}. ${res.redemptionsMarkedPaid} redemptions marked paid, ${usd(res.remainingBalanceUsd)} left.`,
      );
      setPayoutAmount('');
      setPayoutRef('');
    } catch (e: any) {
      message.error(e?.data?.message || 'Payout failed');
    }
  };

  const reverseOne = async (usageId: string) => {
    const why = window.prompt('Why is this being reversed?');
    if (!why?.trim()) return;
    try {
      await reverse({ usageId, reason: why.trim() }).unwrap();
      message.success('Redemption reversed');
    } catch (e: any) {
      message.error(e?.data?.message || 'Reversal failed');
    }
  };

  return (
    <Modal
      open={!!userId}
      onCancel={onClose}
      footer={null}
      width={860}
      title="Referral detail"
      destroyOnClose
      // Modals portal to <body>, outside the console's dark theme, so AntD's
      // white default wins without this. `.ac-dark-modal` is the existing
      // console-wide fix for exactly that.
      className="ac-dark-modal"
    >
      {isFetching && !data ? (
        <Spin />
      ) : (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Text type="secondary">Code</Text>
            <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 600 }}>
              {data?.code?.code ?? 'No active code'}
            </div>
            <Text>
              Balance <strong>{usd(balance)}</strong> · lifetime{' '}
              {usd(data?.balance?.lifetimeEarnedUsd)}
            </Text>
          </div>

          {/* Closes the loop the Wallets tab opens. Without it the balance only
              ever grows and the console keeps asking you to pay someone you
              already paid. */}
          <Card size="small" title="Record a payout">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                style={{ width: 200 }}
                placeholder={`Blank = full ${usd(balance)}`}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
              <Input
                placeholder="Payment reference (also the idempotency key)"
                value={payoutRef}
                onChange={(e) => setPayoutRef(e.target.value)}
              />
              <Button
                type="primary"
                loading={payingOut}
                disabled={balance <= 0}
                onClick={submitPayout}
              >
                Mark paid
              </Button>
            </Space.Compact>
          </Card>

          {/* Writes a ledger row rather than editing history: a balance that can
              be silently rewritten is not auditable. */}
          <Card size="small" title="Adjust balance">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                style={{ width: 200 }}
                placeholder="Amount, negative claws back"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Input
                placeholder="Reason (recorded on the ledger)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button loading={adjusting} onClick={submitAdjust}>
                Apply
              </Button>
            </Space.Compact>
          </Card>

          <Card size="small" title={`Redemptions (${data?.usage?.length ?? 0})`}>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data?.usage ?? []}
              locale={{ emptyText: 'Nobody has used this code yet.' }}
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'createdAt',
                  render: (v: string) => new Date(v).toLocaleDateString(),
                },
                {
                  title: 'Used by',
                  dataIndex: 'refereeDisplayName',
                  render: (v: string) => v || 'Deleted user',
                },
                {
                  title: 'Earned',
                  dataIndex: 'commissionAmount',
                  align: 'right',
                  render: (v: number) => usd(v),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (v: string) => {
                    const p = statusPill(v);
                    return <AcPill variant={p.variant}>{p.label}</AcPill>;
                  },
                },
                {
                  title: '',
                  key: 'actions',
                  align: 'right',
                  render: (_: unknown, row: any) =>
                    row.status !== 'reversed' ? (
                      // Click and Atmos have no working refund integration, so a
                      // refund on the provider's side never reaches us.
                      <Button size="small" onClick={() => reverseOne(row.id)}>
                        Reverse
                      </Button>
                    ) : null,
                },
              ]}
            />
          </Card>

          <Card size="small" title={`Ledger (${data?.ledger?.length ?? 0})`}>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data?.ledger ?? []}
              locale={{ emptyText: 'No balance movements yet.' }}
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'createdAt',
                  render: (v: string) => new Date(v).toLocaleDateString(),
                },
                { title: 'Event', dataIndex: 'eventType' },
                {
                  title: 'Amount',
                  dataIndex: 'amountUsd',
                  align: 'right',
                  render: (v: number) => usd(v),
                },
              ]}
            />
          </Card>
        </Space>
      )}
    </Modal>
  );
}

export default function ReferralsPage() {
  const [tab, setTab] = useState<TabKey>('codes');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [inspecting, setInspecting] = useState<string | null>(null);

  const { data: summary, isLoading: summaryLoading } =
    useGetAdminReferralSummaryQuery();
  const [setActive] = useSetAdminReferralCodeActiveMutation();

  const codesQuery = useGetAdminReferralCodesQuery(
    { search, page, pageSize },
    { skip: tab !== 'codes' },
  );
  const usageQuery = useGetAdminReferralUsageQuery(
    { search, status, page, pageSize },
    { skip: tab !== 'usage' },
  );
  const walletsQuery = useGetAdminReferralWalletsQuery(
    { page, pageSize },
    { skip: tab !== 'wallets' },
  );

  const active =
    tab === 'codes' ? codesQuery : tab === 'usage' ? usageQuery : walletsQuery;

  const toggleActive = async (row: AdminReferralCodeRow) => {
    try {
      await setActive({ id: row.id, isActive: !row.isActive }).unwrap();
      message.success(row.isActive ? 'Code deactivated' : 'Code reactivated');
    } catch (e: any) {
      message.error(e?.data?.message || 'Could not change the code');
    }
  };

  const codeColumns: ColumnsType<AdminReferralCodeRow> = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'code',
        render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
      },
      {
        title: 'Owner',
        key: 'owner',
        render: (_, row) => (
          <div>
            <div>{cleanUserName(row.ownerName, row.ownerEmail)}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.ownerEmail}
            </Text>
          </div>
        ),
      },
      {
        title: 'Rate',
        key: 'rate',
        align: 'right',
        render: (_, row) =>
          `${Number(row.discountPercentage)}% / ${Number(row.bonusPercentage)}%`,
      },
      {
        title: 'Times used',
        dataIndex: 'timesUsed',
        align: 'right',
        render: (v) => Number(v),
      },
      {
        title: 'Earned',
        dataIndex: 'totalEarnedUsd',
        align: 'right',
        render: (v) => usd(v),
      },
      {
        title: 'Wallet',
        dataIndex: 'walletUsd',
        align: 'right',
        render: (v) => usd(v),
      },
      {
        title: 'Active',
        key: 'active',
        align: 'center',
        render: (_, row) => (
          <Tooltip title={row.isActive ? 'Deactivate' : 'Reactivate'}>
            <Switch
              size="small"
              checked={row.isActive}
              onClick={(_checked, e) => e.stopPropagation()}
              onChange={() => toggleActive(row)}
            />
          </Tooltip>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const usageColumns: ColumnsType<AdminReferralUsageRow> = useMemo(
    () => [
      {
        title: 'Date',
        dataIndex: 'createdAt',
        render: (v: string) => new Date(v).toLocaleDateString(),
      },
      {
        title: 'Code',
        dataIndex: 'code',
        render: (v: string) => (
          <span style={{ fontFamily: 'monospace' }}>{v || '—'}</span>
        ),
      },
      {
        title: 'Owner (earns)',
        key: 'owner',
        render: (_, row) => cleanUserName(row.ownerName, row.ownerEmail),
      },
      {
        // Snapshot, so this survives the referee deleting their account.
        title: 'Used by',
        dataIndex: 'refereeName',
        render: (v: string) => v || 'Deleted user',
      },
      {
        title: 'Product',
        dataIndex: 'productType',
        render: (v: string) => PRODUCT_LABEL[v] ?? v ?? '—',
      },
      {
        title: 'Their spend',
        dataIndex: 'grossAmount',
        align: 'right',
        render: (v) => usd(v),
      },
      {
        title: 'Discount',
        dataIndex: 'discountAmount',
        align: 'right',
        render: (v) => usd(v),
      },
      {
        title: 'Owner earned',
        dataIndex: 'commissionAmount',
        align: 'right',
        render: (v) => <strong>{usd(v)}</strong>,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render: (v: string) => {
          const p = statusPill(v);
          return <AcPill variant={p.variant}>{p.label}</AcPill>;
        },
      },
    ],
    [],
  );

  const walletColumns: ColumnsType<AdminReferralWalletRow> = useMemo(
    () => [
      {
        title: 'User',
        key: 'user',
        render: (_, row) => (
          <div>
            <div>{cleanUserName(row.ownerName, row.ownerEmail)}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.ownerEmail}
            </Text>
          </div>
        ),
      },
      {
        title: 'Lifetime earned',
        dataIndex: 'lifetimeEarnedUsd',
        align: 'right',
        render: (v) => usd(v),
      },
      {
        title: 'Balance',
        dataIndex: 'balanceUsd',
        align: 'right',
        render: (v) => <strong>{usd(v)}</strong>,
      },
    ],
    [],
  );

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 4 }}>
        <Gift size={20} style={{ marginRight: 8, verticalAlign: '-3px' }} />
        Referrals
      </Typography.Title>
      <Paragraph type="secondary">
        Every code, who used it, and what is owed. Amounts in USD.
      </Paragraph>

      {summaryLoading ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Stat
              label="Outstanding liability"
              value={usd(summary?.outstandingLiabilityUsd)}
              hint="What we owe referrers right now"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Stat
              label="Bonus accrued"
              value={usd(summary?.totalBonusAccruedUsd)}
              hint="All time, excluding reversals"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Stat
              label="Discount given"
              value={usd(summary?.totalDiscountGivenUsd)}
              hint="All time, excluding reversals"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Stat
              label="Redemptions"
              value={String(summary?.totalRedemptions ?? 0)}
              hint={`${summary?.activeCodes ?? 0} active codes · ${summary?.reversedRedemptions ?? 0} reversed`}
            />
          </Col>
        </Row>
      )}

      <Card>
        <Space
          style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}
          wrap
        >
          <Segmented
            value={tab}
            onChange={(value) => {
              setTab(value as TabKey);
              setPage(1);
            }}
            options={[
              { label: 'Codes', value: 'codes' },
              { label: 'Redemptions', value: 'usage' },
              { label: 'Wallets', value: 'wallets' },
            ]}
          />
          <Space wrap>
            {tab === 'usage' && (
              <Select
                allowClear
                placeholder="All statuses"
                style={{ width: 170 }}
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                options={[
                  { label: 'Confirmed', value: 'confirmed' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Paid out', value: 'paid' },
                  { label: 'Reversed', value: 'reversed' },
                ]}
              />
            )}
            {tab !== 'wallets' && (
              <Input
                allowClear
                prefix={<Search size={15} />}
                placeholder="Search code, name or email"
                style={{ width: 280 }}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            )}
          </Space>
        </Space>

        {active.isError && (
          <Alert
            type="error"
            showIcon
            message="Could not load referral data"
            style={{ marginBottom: 16 }}
          />
        )}

        {tab === 'codes' && (
          <Table<AdminReferralCodeRow>
            rowKey="id"
            size="small"
            columns={codeColumns}
            dataSource={codesQuery.data?.items ?? []}
            loading={codesQuery.isFetching}
            onRow={(row) => ({
              onClick: () => setInspecting(row.userId),
              style: { cursor: 'pointer' },
            })}
            locale={{ emptyText: 'No codes match that search.' }}
            pagination={{
              current: page,
              pageSize,
              total: codesQuery.data?.total ?? 0,
              showSizeChanger: true,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        )}

        {tab === 'usage' && (
          <Table<AdminReferralUsageRow>
            rowKey="id"
            size="small"
            columns={usageColumns}
            dataSource={usageQuery.data?.items ?? []}
            loading={usageQuery.isFetching}
            onRow={(row) => ({
              onClick: () => row.ownerUserId && setInspecting(row.ownerUserId),
              style: { cursor: 'pointer' },
            })}
            locale={{ emptyText: 'Nobody has redeemed a code yet.' }}
            scroll={{ x: 1100 }}
            pagination={{
              current: page,
              pageSize,
              total: usageQuery.data?.total ?? 0,
              showSizeChanger: true,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        )}

        {tab === 'wallets' && (
          <Table<AdminReferralWalletRow>
            rowKey="userId"
            size="small"
            columns={walletColumns}
            dataSource={walletsQuery.data?.items ?? []}
            loading={walletsQuery.isFetching}
            onRow={(row) => ({
              onClick: () => setInspecting(row.userId),
              style: { cursor: 'pointer' },
            })}
            locale={{ emptyText: 'Nobody holds a balance yet.' }}
            pagination={{
              current: page,
              pageSize,
              total: walletsQuery.data?.total ?? 0,
              showSizeChanger: true,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        )}
      </Card>

      <UserDetailModal
        userId={inspecting}
        onClose={() => setInspecting(null)}
      />
    </div>
  );
}
