import { useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Spin, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetMentorRosterQuery,
  useGetMentorTasksQuery,
} from 'src/app/services/fullSupportApi';
import { McPill } from '../components/McPill';
import { useMentorBookings, useMentorMentees } from '../sessionSources';
import { avatarStyleForId, formatDateTime, initialsFromName } from '../utils';

const { Text } = Typography;

/** Row model unifying Full Support roster students and 1:1 platform mentees. */
type ConsoleStudent = {
  id: string;
  name: string;
  initials: string;
  used: number;
  allocated: number;
  sessionsCount: number;
  isFullSupport: boolean;
};

export default function MentorConsoleStudentsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const { data, isLoading, isError } = useGetMentorRosterQuery();
  const { mentees, isLoading: menteesLoading } = useMentorMentees();

  // Full Support roster first (richer record); then 1:1 mentees the mentor
  // isn't formally assigned to, deduped against the roster.
  const rows = useMemo<ConsoleStudent[]>(() => {
    const fs: ConsoleStudent[] = (data?.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      initials: r.initials,
      used: r.used,
      allocated: r.allocated,
      sessionsCount: r.sessionsCount,
      isFullSupport: true,
    }));
    const fsIds = new Set(fs.map((r) => r.id));
    const oneOnOne: ConsoleStudent[] = mentees
      .filter((m) => !fsIds.has(m.id))
      .map((m) => ({
        id: m.id,
        name: m.name,
        initials: initialsFromName(m.name),
        used: 0,
        allocated: 0,
        sessionsCount: m.sessionsCount,
        isFullSupport: false,
      }));
    return [...fs, ...oneOnOne];
  }, [data?.data, mentees]);

  // Answer "who needs me?" from the list itself — next session + attention.
  const { bookings } = useMentorBookings(null, { includeFullSupport: true });
  const { data: tasksRes } = useGetMentorTasksQuery();

  const nextSessionByStudent = useMemo(() => {
    const map = new Map<string, string>();
    bookings
      .filter((b) => b.status === 'upcoming' && b.studentUserId)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .forEach((b) => {
        if (!map.has(b.studentUserId!)) map.set(b.studentUserId!, b.dateTime);
      });
    return map;
  }, [bookings]);

  const reportsDueByStudent = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((b) => {
      if (b.status === 'report-due' && b.studentUserId) {
        map.set(b.studentUserId, (map.get(b.studentUserId) ?? 0) + 1);
      }
    });
    return map;
  }, [bookings]);

  const awaitingReviewByStudent = useMemo(() => {
    const map = new Map<string, number>();
    (tasksRes?.data ?? []).forEach((t) => {
      const awaiting =
        !t.hasFeedback && (t.submissionText || (t.submissionFileUrls?.length ?? 0) > 0);
      if (awaiting && t.studentUserId) {
        map.set(t.studentUserId, (map.get(t.studentUserId) ?? 0) + 1);
      }
    });
    return map;
  }, [tasksRes?.data]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(s));
  }, [q, rows]);

  const columns: ColumnsType<ConsoleStudent> = [
    {
      title: 'Student',
      key: 'name',
      render: (_, row) => (
        <div className="mc-user-cell">
          <div className="mc-avatar" style={avatarStyleForId(row.id)}>
            {initialsFromName(row.name)}
          </div>
          <div className="mc-user-cell-text">
            <div className="mc-user-cell-name">{row.name}</div>
            <div className="mc-user-cell-email">{row.initials}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      key: 'type',
      width: 130,
      render: (_, row) =>
        row.isFullSupport ? (
          <McPill variant="accent">Full Support</McPill>
        ) : (
          <McPill variant="info">1:1 mentee</McPill>
        ),
    },
    {
      title: 'Next session',
      key: 'next',
      width: 170,
      render: (_, row) => {
        const next = nextSessionByStudent.get(row.id);
        return next ? (
          <Text style={{ color: 'var(--mc-text)', fontSize: 13 }}>{formatDateTime(next)}</Text>
        ) : (
          <Text style={{ color: 'var(--mc-text-muted)', fontSize: 13 }}>—</Text>
        );
      },
    },
    {
      title: 'Hours used',
      key: 'hours',
      width: 130,
      render: (_, row) =>
        row.isFullSupport ? (
          <Text style={{ color: 'var(--mc-text)' }}>
            {row.used}h <span style={{ color: 'var(--mc-text-muted)' }}>/ {row.allocated}h</span>
          </Text>
        ) : (
          <Text style={{ color: 'var(--mc-text-muted)' }}>—</Text>
        ),
    },
    {
      title: 'Sessions',
      dataIndex: 'sessionsCount',
      key: 'sessionsCount',
      width: 100,
    },
    {
      title: 'Attention',
      key: 'attention',
      width: 150,
      render: (_, row) => {
        const due = reportsDueByStudent.get(row.id) ?? 0;
        const review = awaitingReviewByStudent.get(row.id) ?? 0;
        if (due > 0) {
          return <McPill variant="danger">{due} report{due === 1 ? '' : 's'} due</McPill>;
        }
        if (review > 0) {
          return <McPill variant="warning">{review} to review</McPill>;
        }
        return <McPill variant="success">Caught up</McPill>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      fixed: 'right',
      render: (_, row) => (
        <Button
          size="small"
          type="primary"
          ghost
          onClick={() => navigate(`/mentor/students/${row.id}`)}
          style={{
            borderColor: 'var(--mc-accent)',
            color: 'var(--mc-accent)',
          }}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mc-page-head mc-page-head--ruled">
        <div className="mc-page-eyebrow">
          Mentor <span className="mc-page-eyebrow-accent">· Mentorship</span>
        </div>
        <h1 className="mc-page-title">Students</h1>
        <p className="mc-page-lead">
          Your Full Support students and 1:1 mentees. Open a workspace to manage tasks, review
          sessions and message them in one place.
        </p>
      </div>

      <Card bordered={false} className="mc-panel">
        <div style={{ marginBottom: 12 }}>
          <Input
            size="large"
            allowClear
            prefix={<Search size={16} style={{ opacity: 0.45 }} />}
            placeholder="Search by name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>

        {isError && (
          <Alert
            type="error"
            showIcon
            message="Failed to load your roster"
            description="Retry shortly."
            style={{ marginBottom: 12 }}
          />
        )}

        {isLoading || menteesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message="No students yet"
            description={
              rows.length === 0
                ? 'Students appear here once you have a 1:1 session booked or an admin assigns you Full Support students.'
                : 'Try clearing the search.'
            }
          />
        ) : (
          <Table<ConsoleStudent>
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 20 }}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
}
