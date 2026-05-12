import { Alert, Button, Card, Col, Empty, Row, Space, Spin, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetAdminEventsQuery,
  type AdminEventRow,
} from 'src/app/services/adminConsoleApi';
import { AcPill, type AcPillVariant } from '../components/AcPill';
import { formatUZS } from '../utils';

const { Paragraph } = Typography;

function eventTitle(raw: AdminEventRow['title']): string {
  if (!raw) return '—';
  if (typeof raw === 'string') return raw;
  return raw.en ?? raw.ru ?? raw.uz ?? Object.values(raw)[0] ?? '—';
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function typePill(type: string): AcPillVariant {
  const t = (type || '').toLowerCase();
  if (t === 'workshop') return 'cyan';
  if (t === 'event') return 'mint';
  return 'neutral';
}

export default function AdminConsoleEventsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useGetAdminEventsQuery({ start: 0, end: 200 });

  const rows = data?.items ?? [];

  const columns: ColumnsType<AdminEventRow> = [
    {
      title: 'Title',
      key: 'title',
      render: (_, row) => <strong>{eventTitle(row.title)}</strong>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (t: string) => <AcPill variant={typePill(t)}>{t || 'event'}</AcPill>,
    },
    {
      title: 'Starts',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 140,
      render: (iso: string | null) => formatDate(iso),
    },
    {
      title: 'Ends',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 140,
      render: (iso: string | null) => formatDate(iso),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      align: 'right' as const,
      render: (v: number) => (v > 0 ? formatUZS(v) : <AcPill variant="mint">Free</AcPill>),
    },
    {
      title: 'Participants',
      key: 'participants',
      width: 140,
      render: (_, row) => {
        const curr = row.currentParticipants ?? 0;
        const max = row.maxParticipants ?? 0;
        return max > 0 ? `${curr} / ${max}` : `${curr}`;
      },
    },
  ];

  return (
    <div className="ac-admin-page">
      <h1 className="ac-page-title">Events</h1>
      <p className="ac-page-lead">Events catalog, registrations, and CA Admissions Forum administration.</p>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card bordered={false} className="ac-panel" title="Top Coach Launch Event">
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Free event · May 24, 2026 · Tashkent. Browse registrations,
              search by name / email, export the attendee list.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              block
              icon={<Sparkles size={18} />}
              onClick={() => navigate('/new-admin/events/topcoach-launch-event')}
            >
              Open launch-event admin
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} className="ac-panel" title="CA Admissions Forum">
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Review registrations, manage payments, export applicant lists.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              block
              icon={<Sparkles size={18} />}
              onClick={() => navigate('/new-admin/events/caaf')}
            >
              Open CAAF admin
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} className="ac-panel" title="Quick stats">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <span style={{ color: 'var(--ac-text-muted)' }}>Total events: </span>
                <strong>{rows.length}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ac-text-muted)' }}>Workshops: </span>
                <strong>{rows.filter((r) => (r.type || '').toLowerCase() === 'workshop').length}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--ac-text-muted)' }}>Upcoming: </span>
                <strong>
                  {rows.filter((r) => r.startDate && new Date(r.startDate).getTime() > Date.now()).length}
                </strong>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Failed to load events"
          description={(error as { status?: number })?.status
            ? `Server returned ${(error as { status?: number }).status}.`
            : 'Check your connection and retry.'}
        />
      )}

      <Card bordered={false} className="ac-panel" title="All events">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : rows.length === 0 ? (
          <Empty description="No events yet" />
        ) : (
          <Table<AdminEventRow>
            rowKey="id"
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
}
