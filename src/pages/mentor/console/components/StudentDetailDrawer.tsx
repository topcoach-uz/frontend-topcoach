import { useMemo } from 'react';
import {
  Alert,
  Drawer,
  Empty,
  Progress,
  Space,
  Spin,
  Table,
  Tabs,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  useGetMentorCurriculumProgressQuery,
  useGetMentorMilestonesQuery,
  useGetMentorPipelineQuery,
  useGetMentorSessionsQuery,
  useGetMentorTasksQuery,
  type MilestoneDto,
  type PipelineDto,
  type SessionLogDto,
  type TaskDto,
  type CurriculumWatchlistItemDto,
} from 'src/app/services/fullSupportApi';
import { McPill } from './McPill';
import { avatarStyleForId, formatDate, formatDateTime, initialsFromName } from '../utils';

const { Text } = Typography;

type RosterStudent = {
  id: string;
  name: string;
  initials: string;
  used: number;
  allocated: number;
  sessionsCount: number;
};

type Props = {
  student: RosterStudent | null;
  open: boolean;
  onClose: () => void;
};

function pipelineStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const s = (status || '').toLowerCase();
  if (s === 'accepted' || s === 'admitted') return 'success';
  if (s === 'rejected' || s === 'denied') return 'danger';
  if (s === 'waitlist' || s === 'deferred') return 'warning';
  if (s === 'submitted' || s === 'applied') return 'info';
  return 'neutral';
}

export default function StudentDetailDrawer({ student, open, onClose }: Props) {
  const studentId = student?.id ?? '';

  const { data: sessionsRes, isFetching: loadingSessions } =
    useGetMentorSessionsQuery(studentId || null, { skip: !studentId });
  const { data: tasksRes } = useGetMentorTasksQuery(undefined, { skip: !studentId });
  const { data: milestonesRes, isFetching: loadingMilestones } =
    useGetMentorMilestonesQuery(studentId, { skip: !studentId });
  const { data: pipelineRes } = useGetMentorPipelineQuery(undefined, { skip: !studentId });
  const { data: curriculumRes } = useGetMentorCurriculumProgressQuery(studentId, {
    skip: !studentId,
  });

  const sessions = sessionsRes?.data ?? [];
  const tasks = useMemo<TaskDto[]>(
    () => (tasksRes?.data ?? []).filter((t) => t.studentUserId === studentId),
    [tasksRes?.data, studentId],
  );
  const milestones = milestonesRes?.data ?? [];
  const pipeline = useMemo<PipelineDto[]>(
    () => (pipelineRes?.data ?? []).filter((p) => p.studentUserId === studentId),
    [pipelineRes?.data, studentId],
  );
  const curriculum = curriculumRes?.data ?? [];

  if (!student) return null;

  const sessionColumns: ColumnsType<SessionLogDto> = [
    {
      title: 'When',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (v: string) => <span style={{ fontSize: 13 }}>{formatDateTime(v)}</span>,
    },
    { title: 'Duration', dataIndex: 'duration', key: 'duration', width: 90 },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'done',
      key: 'done',
      width: 120,
      render: (done: boolean, row) => {
        const isPast = new Date(row.dateTime).getTime() < Date.now();
        if (done) return <McPill variant="success">Completed</McPill>;
        if (isPast) return <McPill variant="danger">Report due</McPill>;
        return <McPill variant="info">Upcoming</McPill>;
      },
    },
  ];

  const taskColumns: ColumnsType<TaskDto> = [
    { title: 'Task', dataIndex: 'task', key: 'task' },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 130,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, row) =>
        row.hasFeedback ? (
          <McPill variant="success">Feedback given</McPill>
        ) : row.submissionText || (row.submissionFileUrls && row.submissionFileUrls.length > 0) ? (
          <McPill variant="warning">Awaiting review</McPill>
        ) : (
          <McPill variant="info">Assigned</McPill>
        ),
    },
  ];

  const milestoneColumns: ColumnsType<MilestoneDto> = [
    { title: 'Milestone', dataIndex: 'label', key: 'label' },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (v: string | null) => formatDate(v),
    },
    {
      title: 'Status',
      dataIndex: 'done',
      key: 'done',
      width: 110,
      render: (done: boolean) =>
        done ? (
          <McPill variant="success">Done</McPill>
        ) : (
          <McPill variant="neutral">Pending</McPill>
        ),
    },
  ];

  const pipelineColumns: ColumnsType<PipelineDto> = [
    { title: 'Program', dataIndex: 'program', key: 'program' },
    { title: 'Stage', dataIndex: 'stage', key: 'stage', width: 130 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s: string) => <McPill variant={pipelineStatusVariant(s)}>{s || '—'}</McPill>,
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 130,
      render: (v: string | null) => formatDate(v),
    },
  ];

  const curriculumItems = curriculum.filter((c) => c.percent >= 0);
  const hoursPct = student.allocated > 0
    ? Math.min(100, Math.round((student.used / student.allocated) * 100))
    : 0;

  return (
    <Drawer
      title={
        <Space align="start" size={14}>
          <div className="mc-avatar" style={avatarStyleForId(student.id)}>
            {initialsFromName(student.name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--mc-text)' }}>
              {student.name}
            </div>
            <Text style={{ fontSize: 12, color: 'var(--mc-text-muted)' }}>
              {student.used}h of {student.allocated}h used · {student.sessionsCount} sessions
            </Text>
          </div>
        </Space>
      }
      width={680}
      placement="right"
      onClose={onClose}
      open={open}
    >
      <div style={{ marginBottom: 18 }}>
        <Text style={{ fontSize: 12, color: 'var(--mc-text-muted)' }}>Hours used</Text>
        <Progress
          percent={hoursPct}
          strokeColor="var(--mc-accent)"
          format={() => `${student.used}/${student.allocated}h`}
        />
      </div>

      <Tabs
        items={[
          {
            key: 'sessions',
            label: `Sessions (${sessions.length})`,
            children: loadingSessions ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Spin />
              </div>
            ) : sessions.length === 0 ? (
              <Empty description="No sessions logged yet" />
            ) : (
              <Table<SessionLogDto>
                rowKey="id"
                columns={sessionColumns}
                dataSource={sessions}
                pagination={{ pageSize: 10 }}
                size="small"
              />
            ),
          },
          {
            key: 'tasks',
            label: `Tasks (${tasks.length})`,
            children:
              tasks.length === 0 ? (
                <Empty description="No tasks assigned yet" />
              ) : (
                <Table<TaskDto>
                  rowKey="id"
                  columns={taskColumns}
                  dataSource={tasks}
                  pagination={false}
                  size="small"
                />
              ),
          },
          {
            key: 'milestones',
            label: `Milestones (${milestones.length})`,
            children: loadingMilestones ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Spin />
              </div>
            ) : milestones.length === 0 ? (
              <Empty description="No milestones yet" />
            ) : (
              <Table<MilestoneDto>
                rowKey="id"
                columns={milestoneColumns}
                dataSource={milestones}
                pagination={false}
                size="small"
              />
            ),
          },
          {
            key: 'pipeline',
            label: `Applications (${pipeline.length})`,
            children:
              pipeline.length === 0 ? (
                <Alert type="info" showIcon message="No application rows yet" />
              ) : (
                <Table<PipelineDto>
                  rowKey="id"
                  columns={pipelineColumns}
                  dataSource={pipeline}
                  pagination={false}
                  size="small"
                />
              ),
          },
          {
            key: 'curriculum',
            label: `Curriculum (${curriculumItems.length})`,
            children:
              curriculumItems.length === 0 ? (
                <Empty description="No curriculum items tracked yet" />
              ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {curriculumItems.map((item: CurriculumWatchlistItemDto) => (
                    <div key={item.key}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        <span>{item.label}</span>
                        <span style={{ color: 'var(--mc-text-muted)' }}>
                          {item.percent}%{item.target ? ` · target ${item.target}` : ''}
                        </span>
                      </div>
                      <Progress
                        percent={item.percent}
                        showInfo={false}
                        strokeColor="var(--mc-accent)"
                        size="small"
                      />
                    </div>
                  ))}
                </Space>
              ),
          },
        ]}
      />
    </Drawer>
  );
}
