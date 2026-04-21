import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RefreshCw, Search, Users as UsersIcon } from 'lucide-react';
import {
  useGetAdminMajorMatchHistoryDetailQuery,
  useGetAdminMajorMatchHistoryQuery,
  useGetAdminMajorMatchPolicyQuery,
  useGetAdminMajorMatchUsageQuery,
  useResetAdminMajorMatchAllMutation,
  useResetAdminMajorMatchUserMutation,
  useUpdateAdminMajorMatchPolicyMutation,
  type AdminMajorMatchHistoryRow,
  type AdminMajorMatchUsageRow,
} from 'src/app/services/adminConsoleApi';
import { AcPill } from '../components/AcPill';

const { Text, Paragraph } = Typography;

function formatDate(iso: string | null) {
  if (!iso) return '—';
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

function riasecScoresToSorted(
  scores: Record<string, number> | null | undefined,
): Array<{ key: string; value: number }> {
  if (!scores) return [];
  return Object.entries(scores)
    .map(([key, value]) => ({ key, value: Number(value) || 0 }))
    .sort((a, b) => b.value - a.value);
}

export default function AdminConsoleMajorMatchPage() {
  const [tab, setTab] = useState<'policy' | 'usage' | 'history'>('policy');

  return (
    <div className="ac-admin-page ac-mm-page">
      <h1 className="ac-page-title">AI Major Match</h1>
      <p className="ac-page-lead">
        Control the free-attempt limit, review per-user usage, and audit every completed assessment.
      </p>

      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as typeof tab)}
        className="ac-admin-page-tabs"
        items={[
          { key: 'policy', label: 'Policy', children: <PolicyPanel /> },
          { key: 'usage', label: 'Per-user usage', children: <UsagePanel /> },
          { key: 'history', label: 'History', children: <HistoryPanel /> },
        ]}
      />
    </div>
  );
}

// ───────── Policy ─────────
type PolicyForm = {
  freeSuccessfulAttempts: number;
  blockAfterFreeAttempts: boolean;
  promptTitle: string;
  promptMessage: string;
};

function PolicyPanel() {
  const { data, isLoading, isError } = useGetAdminMajorMatchPolicyQuery();
  const [updatePolicy, { isLoading: saving }] = useUpdateAdminMajorMatchPolicyMutation();
  const [form] = Form.useForm<PolicyForm>();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        freeSuccessfulAttempts: data.freeSuccessfulAttempts,
        blockAfterFreeAttempts: data.blockAfterFreeAttempts,
        promptTitle: data.promptTitle,
        promptMessage: data.promptMessage,
      });
    }
  }, [data, form]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return <Alert type="error" showIcon message="Failed to load Major Match policy" />;
  }

  const onSave = async (values: PolicyForm) => {
    await updatePolicy(values)
      .unwrap()
      .then(() => message.success('Policy updated'))
      .catch(() => message.error('Failed to update policy'));
  };

  const confirmSave = async () => {
    let values: PolicyForm;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const freeChanged = values.freeSuccessfulAttempts !== data.freeSuccessfulAttempts;
    const blockChanged = values.blockAfterFreeAttempts !== data.blockAfterFreeAttempts;
    const titleChanged = values.promptTitle !== data.promptTitle;
    const messageChanged = values.promptMessage !== data.promptMessage;

    if (!freeChanged && !blockChanged && !titleChanged && !messageChanged) {
      message.info('No changes to save');
      return;
    }

    Modal.confirm({
      title: 'Apply policy changes?',
      icon: null,
      okText: 'Apply now',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      maskClosable: false,
      content: (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              color: 'var(--ac-text-muted)',
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            These changes take effect immediately and affect every user attempt.
          </div>
          <div style={{ display: 'grid', rowGap: 6, fontSize: 13 }}>
            {freeChanged && (
              <div>
                <strong>Free attempts:</strong> {data.freeSuccessfulAttempts} →{' '}
                <span style={{ color: 'var(--ac-accent)' }}>
                  {values.freeSuccessfulAttempts}
                </span>
              </div>
            )}
            {blockChanged && (
              <div>
                <strong>Blocking:</strong>{' '}
                {data.blockAfterFreeAttempts ? 'Enforced' : 'Off'} →{' '}
                <span style={{ color: 'var(--ac-accent)' }}>
                  {values.blockAfterFreeAttempts ? 'Enforced' : 'Off'}
                </span>
              </div>
            )}
            {titleChanged && (
              <div>
                <strong>Paywall title:</strong> updated
              </div>
            )}
            {messageChanged && (
              <div>
                <strong>Paywall message:</strong> updated
              </div>
            )}
          </div>
        </div>
      ),
      onOk: () => onSave(values),
    });
  };

  return (
    <Card bordered={false} className="ac-panel">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Form<PolicyForm>
            form={form}
            layout="vertical"
            initialValues={{
              freeSuccessfulAttempts: data.freeSuccessfulAttempts,
              blockAfterFreeAttempts: data.blockAfterFreeAttempts,
              promptTitle: data.promptTitle,
              promptMessage: data.promptMessage,
            }}
          >
            <Form.Item
              label="Free successful attempts"
              name="freeSuccessfulAttempts"
              rules={[{ required: true, message: 'Pick a number' }]}
              extra="How many successful assessments each user gets before they hit the paywall."
            >
              <InputNumber min={0} max={1000} style={{ width: 180 }} />
            </Form.Item>

            <Form.Item
              label="Block after free attempts"
              name="blockAfterFreeAttempts"
              valuePropName="checked"
              extra="When off, the limit is shown but users are never blocked. When on, users over the limit must join Community."
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Paywall title"
              name="promptTitle"
              rules={[{ max: 180 }]}
            >
              <Input placeholder="Unlock unlimited AI Major Match with Community" />
            </Form.Item>

            <Form.Item
              label="Paywall message"
              name="promptMessage"
              rules={[{ max: 600 }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Space>
              <Button type="primary" onClick={confirmSave} loading={saving}>
                Save policy
              </Button>
              <Button onClick={() => form.resetFields()}>Revert</Button>
            </Space>
          </Form>
        </Col>

        <Col xs={24} lg={10}>
          <div className="ac-mm-summary">
            <div className="ac-mm-summary-label">Current state</div>
            <div className="ac-mm-summary-row">
              Free attempts: <strong>{data.freeSuccessfulAttempts}</strong>
            </div>
            <div className="ac-mm-summary-row">
              Blocking:
              <AcPill variant={data.blockAfterFreeAttempts ? 'danger' : 'mint'}>
                {data.blockAfterFreeAttempts ? 'Enforced' : 'Off'}
              </AcPill>
            </div>
            <Paragraph
              style={{
                marginTop: 14,
                marginBottom: 0,
                fontSize: 12,
                color: 'var(--ac-text-secondary)',
                lineHeight: 1.5,
              }}
            >
              Changes apply immediately — the service reads the policy on every attempt.
              Community members always have unlimited access regardless of this setting.
            </Paragraph>
          </div>
        </Col>
      </Row>
    </Card>
  );
}

// ───────── Usage ─────────
function UsagePanel() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, isFetching, isError } = useGetAdminMajorMatchUsageQuery({
    search: search.trim() || undefined,
    page,
    pageSize,
  });
  const [resetUser] = useResetAdminMajorMatchUserMutation();
  const [resetAll, { isLoading: resettingAll }] = useResetAdminMajorMatchAllMutation();

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: ColumnsType<AdminMajorMatchUsageRow> = [
    {
      title: 'User',
      key: 'user',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ac-text)' }}>{row.displayName}</div>
          <div style={{ fontSize: 12, color: 'var(--ac-text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      title: 'Successful',
      dataIndex: 'successfulAttempts',
      key: 'successful',
      width: 120,
      sorter: (a, b) => a.successfulAttempts - b.successfulAttempts,
      render: (v: number) => <strong style={{ color: 'var(--ac-text)' }}>{v}</strong>,
    },
    {
      title: 'Started',
      dataIndex: 'startedAttempts',
      key: 'started',
      width: 100,
    },
    {
      title: 'Blocked',
      dataIndex: 'blockedAttempts',
      key: 'blocked',
      width: 100,
      render: (v: number) =>
        v > 0 ? (
          <AcPill variant="danger">{v}</AcPill>
        ) : (
          <span style={{ color: 'var(--ac-text-muted)' }}>0</span>
        ),
    },
    {
      title: 'Last success',
      dataIndex: 'lastSuccessfulAt',
      key: 'lastSuccess',
      width: 180,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, row) => (
        <Popconfirm
          title="Reset this user's counters?"
          description="Allows them another free attempt."
          onConfirm={() =>
            resetUser(row.userId)
              .unwrap()
              .then(() => message.success('Reset'))
              .catch(() => message.error('Failed'))
          }
        >
          <Button size="small" type="primary" ghost icon={<RefreshCw size={13} />}>
            Reset
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card bordered={false} className="ac-panel">
      <Space
        wrap
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 14,
          width: '100%',
        }}
      >
        <Input
          size="large"
          allowClear
          prefix={<Search size={16} style={{ opacity: 0.5 }} />}
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 340 }}
        />
        <Popconfirm
          title="Reset counters for every user?"
          description="All users get another free attempt. This cannot be undone."
          okText="Reset all"
          okButtonProps={{ danger: true }}
          onConfirm={() =>
            resetAll()
              .unwrap()
              .then((r) => message.success(`Reset ${r.resetCount} user${r.resetCount === 1 ? '' : 's'}`))
              .catch(() => message.error('Failed'))
          }
        >
          <Button danger loading={resettingAll} icon={<UsersIcon size={14} />}>
            Reset all users
          </Button>
        </Popconfirm>
      </Space>

      {isError ? (
        <Alert type="error" showIcon message="Failed to load usage" />
      ) : isFetching && rows.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : rows.length === 0 ? (
        <Empty description="No usage rows yet" />
      ) : (
        <Table<AdminMajorMatchUsageRow>
          rowKey="userId"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [25, 50, 100],
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s);
            },
          }}
          size="middle"
        />
      )}
    </Card>
  );
}

// ───────── History ─────────
function HistoryPanel() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching, isError } = useGetAdminMajorMatchHistoryQuery({
    search: search.trim() || undefined,
    page,
    pageSize,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;

  const columns: ColumnsType<AdminMajorMatchHistoryRow> = [
    {
      title: 'User',
      key: 'user',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ac-text)' }}>{row.displayName}</div>
          <div style={{ fontSize: 12, color: 'var(--ac-text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      title: 'RIASEC code',
      dataIndex: 'riasecCode',
      key: 'riasec',
      width: 140,
      render: (v: string) => <AcPill variant="purple">{v}</AcPill>,
    },
    {
      title: 'Top majors',
      dataIndex: 'topMajors',
      key: 'majors',
      render: (m: string[]) =>
        m && m.length > 0 ? (
          <Space wrap size={4}>
            {m.map((label) => (
              <AcPill key={label} variant="blue">
                {label}
              </AcPill>
            ))}
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Completed',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 180,
      render: (v: string) => formatDate(v),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, row) => (
        <Button size="small" type="primary" ghost onClick={() => setDetailId(row.id)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card bordered={false} className="ac-panel">
        <div style={{ marginBottom: 14 }}>
          <Input
            size="large"
            allowClear
            prefix={<Search size={16} style={{ opacity: 0.5 }} />}
            placeholder="Search by name, email, or RIASEC code"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: 420 }}
          />
        </div>

        {isError ? (
          <Alert type="error" showIcon message="Failed to load history" />
        ) : isFetching && rows.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : rows.length === 0 ? (
          <Empty description="No completions yet" />
        ) : (
          <Table<AdminMajorMatchHistoryRow>
            rowKey="id"
            columns={columns}
            dataSource={rows}
            loading={isFetching}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [25, 50, 100],
              onChange: (p, s) => {
                setPage(p);
                setPageSize(s);
              },
            }}
            size="middle"
          />
        )}
      </Card>

      <HistoryDetailDrawer id={detailId} open={!!detailId} onClose={() => setDetailId(null)} />
    </>
  );
}

function HistoryDetailDrawer({
  id,
  open,
  onClose,
}: {
  id: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isFetching, isError } = useGetAdminMajorMatchHistoryDetailQuery(id ?? '', {
    skip: !id,
  });

  const body = (() => {
    if (isFetching) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin />
        </div>
      );
    }
    if (isError || !data) {
      return <Alert type="error" showIcon message="Failed to load result" />;
    }
    const riasec = riasecScoresToSorted(data.riasecScores);
    const big5 = riasecScoresToSorted(data.bigFiveScores);
    const values = riasecScoresToSorted(data.valuesScores);

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ac-text)' }}>
            {data.user.displayName}
          </div>
          <div style={{ color: 'var(--ac-text-muted)', fontSize: 13 }}>{data.user.email}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AcPill variant="purple">RIASEC {data.riasecCode}</AcPill>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Completed {formatDate(data.completedAt)}
            </Text>
          </div>
        </div>

        <ScoreGroup title="RIASEC interests" scores={riasec} />
        <ScoreGroup title="Big Five" scores={big5} />
        <ScoreGroup title="Values" scores={values} />

        {data.academicConfidenceScore != null && (
          <div>
            <Text
              style={{ color: 'var(--ac-text-muted)', fontSize: 11, letterSpacing: '0.08em' }}
            >
              ACADEMIC CONFIDENCE
            </Text>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {data.academicConfidenceScore}
            </div>
          </div>
        )}

        {Array.isArray(data.riskFlags) && data.riskFlags.length > 0 && (
          <div>
            <Text
              style={{ color: 'var(--ac-text-muted)', fontSize: 11, letterSpacing: '0.08em' }}
            >
              RISK FLAGS
            </Text>
            <Space wrap size={6} style={{ marginTop: 6 }}>
              {data.riskFlags.map((f, i) => (
                <AcPill key={i} variant="warning">
                  {typeof f === 'string' ? f : JSON.stringify(f)}
                </AcPill>
              ))}
            </Space>
          </div>
        )}
      </Space>
    );
  })();

  return (
    <Drawer title="Assessment result" placement="right" width={560} open={open} onClose={onClose}>
      {body}
    </Drawer>
  );
}

function ScoreGroup({
  title,
  scores,
}: {
  title: string;
  scores: Array<{ key: string; value: number }>;
}) {
  if (scores.length === 0) return null;
  return (
    <div>
      <Text style={{ color: 'var(--ac-text-muted)', fontSize: 11, letterSpacing: '0.08em' }}>
        {title.toUpperCase()}
      </Text>
      <Space direction="vertical" size={6} style={{ width: '100%', marginTop: 8 }}>
        {scores.map(({ key, value }) => (
          <div key={key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                marginBottom: 2,
              }}
            >
              <span style={{ textTransform: 'capitalize' }}>{key}</span>
              <span style={{ color: 'var(--ac-text-muted)' }}>{Math.round(value)}</span>
            </div>
            <Progress
              percent={Math.max(0, Math.min(100, value))}
              size="small"
              showInfo={false}
              strokeColor="var(--ac-accent)"
            />
          </div>
        ))}
      </Space>
    </div>
  );
}
