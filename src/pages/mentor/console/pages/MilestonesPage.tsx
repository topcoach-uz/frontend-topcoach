import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { Plus } from 'lucide-react';
import {
  useCreateMentorMilestoneMutation,
  useDeleteMentorMilestoneMutation,
  useGetMentorMilestonesQuery,
  useGetMentorRosterQuery,
  useUpdateMentorMilestoneMutation,
  type MilestoneDto,
} from 'src/app/services/fullSupportApi';
import { McPill } from '../components/McPill';
import { formatDate } from '../utils';

const { Text } = Typography;

export default function MentorConsoleMilestonesPage() {
  const { data: rosterRes } = useGetMentorRosterQuery();
  const roster = rosterRes?.data ?? [];

  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId && roster.length > 0 && roster[0]) {
      setStudentId(roster[0].id);
    }
  }, [roster, studentId]);

  const {
    data: milestonesRes,
    isLoading,
    isError,
  } = useGetMentorMilestonesQuery(studentId ?? '', { skip: !studentId });
  const milestones = milestonesRes?.data ?? [];

  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm<{ label: string; date: Dayjs | null }>();

  const [createMilestone, { isLoading: creating }] = useCreateMentorMilestoneMutation();
  const [updateMilestone] = useUpdateMentorMilestoneMutation();
  const [deleteMilestone] = useDeleteMentorMilestoneMutation();

  const counts = useMemo(
    () => ({
      total: milestones.length,
      done: milestones.filter((m) => m.done).length,
      pending: milestones.filter((m) => !m.done).length,
    }),
    [milestones],
  );

  const columns: ColumnsType<MilestoneDto> = [
    { title: 'Milestone', dataIndex: 'label', key: 'label' },
    {
      title: 'Target date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: 'Status',
      dataIndex: 'done',
      key: 'done',
      width: 110,
      render: (done: boolean) =>
        done ? <McPill variant="success">Done</McPill> : <McPill variant="neutral">Pending</McPill>,
    },
    {
      title: 'Toggle',
      key: 'toggle',
      width: 100,
      render: (_, row) => (
        <Switch
          checked={row.done}
          onChange={(v) =>
            updateMilestone({ id: row.id, done: v })
              .unwrap()
              .catch(() => message.error('Failed'))
          }
        />
      ),
    },
    {
      title: '',
      key: 'del',
      width: 80,
      render: (_, row) => (
        <Popconfirm
          title="Delete this milestone?"
          onConfirm={() =>
            deleteMilestone(row.id)
              .unwrap()
              .then(() => message.success('Deleted'))
              .catch(() => message.error('Failed'))
          }
        >
          <Button size="small" danger type="text">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const submit = async () => {
    if (!studentId) return;
    const values = await form.validateFields();
    await createMilestone({
      studentUserId: studentId,
      label: values.label,
      date: values.date ? values.date.toISOString() : null,
    })
      .unwrap()
      .then(() => {
        message.success('Milestone added');
        setAddOpen(false);
        form.resetFields();
      })
      .catch(() => message.error('Failed to add'));
  };

  return (
    <div>
      <h1 className="mc-page-title">Milestones</h1>
      <p className="mc-page-lead">
        Track major milestones per student — app deadlines, essay drafts, interview prep, and more.
      </p>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="mc-kpi-card">
            <div className="mc-kpi-label">Milestones</div>
            <div className="mc-kpi-value">{counts.total}</div>
            <div className="mc-kpi-meta">For selected student</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="mc-kpi-card mc-kpi-card--warning">
            <div className="mc-kpi-label">Pending</div>
            <div className="mc-kpi-value">{counts.pending}</div>
            <div className="mc-kpi-meta">Not yet complete</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} className="mc-kpi-card mc-kpi-card--success">
            <div className="mc-kpi-label">Completed</div>
            <div className="mc-kpi-value">{counts.done}</div>
            <div className="mc-kpi-meta">Closed out</div>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="mc-panel">
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>
          <Col flex="auto">
            <Space wrap>
              <Text style={{ color: 'var(--mc-text-muted)' }}>Student</Text>
              <Select
                placeholder="Pick a student"
                style={{ minWidth: 240 }}
                value={studentId ?? undefined}
                onChange={(v) => setStudentId(v)}
                options={roster.map((r) => ({ value: r.id, label: r.name }))}
                disabled={roster.length === 0}
              />
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setAddOpen(true)}
              disabled={!studentId}
            >
              Add milestone
            </Button>
          </Col>
        </Row>

        {!studentId ? (
          <Empty description="No students assigned yet" />
        ) : isError ? (
          <Alert type="error" showIcon message="Failed to load milestones" />
        ) : isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : milestones.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message="No milestones yet"
            description="Add the first milestone to start tracking progress for this student."
          />
        ) : (
          <Table<MilestoneDto>
            rowKey="id"
            columns={columns}
            dataSource={milestones}
            pagination={false}
            size="middle"
          />
        )}
      </Card>

      <Modal
        title="Add milestone"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={submit}
        confirmLoading={creating}
        okText="Add"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="label"
            label="Milestone"
            rules={[{ required: true, message: 'Describe the milestone' }]}
          >
            <Input placeholder="e.g. Submit Common App early decision" />
          </Form.Item>
          <Form.Item name="date" label="Target date (optional)">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
