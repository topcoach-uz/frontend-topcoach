import dayjs from 'dayjs';
import { Button, Popconfirm, Space, message } from 'antd';
import { CalendarCheck2, Trash2 } from 'lucide-react';
import type { SessionLogDto } from 'src/app/services/fullSupportApi';
import {
  useDeleteMentorSessionMutation,
  useUpdateMentorSessionMutation,
} from 'src/app/services/fullSupportApi';
import { McPill } from './McPill';

type Props = {
  session: SessionLogDto;
  studentName: string | null;
  status: 'upcoming' | 'completed' | 'report-due' | 'cancelled';
};

export default function FullSupportBookingCard({ session, studentName, status }: Props) {
  const [updateSession, { isLoading: updating }] = useUpdateMentorSessionMutation();
  const [deleteSession, { isLoading: deleting }] = useDeleteMentorSessionMutation();

  const pill = (() => {
    if (status === 'completed') return <McPill variant="success">Completed</McPill>;
    if (status === 'report-due') return <McPill variant="danger">Report due</McPill>;
    if (status === 'cancelled') return <McPill variant="neutral">Cancelled</McPill>;
    return <McPill variant="info">Upcoming</McPill>;
  })();

  const dateStr = dayjs(session.dateTime).format('MMMM D, YYYY');
  const timeStr = dayjs(session.dateTime).format('h:mm A');

  return (
    <div
      style={{
        background: 'var(--mc-bg-surface)',
        border: '1px solid var(--mc-border)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <McPill variant="accent">Full Support</McPill>
        {pill}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--mc-text)' }}>{dateStr}</div>
      <div style={{ fontSize: 13, color: 'var(--mc-text-muted)' }}>{timeStr}</div>
      <div style={{ fontSize: 15, color: 'var(--mc-text)' }}>
        {session.duration || '—'} session with{' '}
        <span style={{ color: 'var(--mc-accent)', fontWeight: 600 }}>
          {studentName ?? 'Student'}
        </span>
      </div>
      {session.description && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--mc-text-secondary)',
            background: 'var(--mc-bg-subtle)',
            borderRadius: 8,
            padding: '8px 10px',
            marginTop: 4,
          }}
        >
          {session.description}
        </div>
      )}
      <Space size={6} style={{ marginTop: 'auto', paddingTop: 10 }}>
        {session.done ? (
          <Button
            size="small"
            type="text"
            loading={updating}
            onClick={() =>
              updateSession({ id: session.id, done: false })
                .unwrap()
                .catch(() => message.error('Failed'))
            }
          >
            Reopen
          </Button>
        ) : (
          <Button
            size="small"
            type="primary"
            icon={<CalendarCheck2 size={14} />}
            loading={updating}
            onClick={() =>
              updateSession({ id: session.id, done: true })
                .unwrap()
                .then(() => message.success('Marked complete'))
                .catch(() => message.error('Failed'))
            }
          >
            Mark done
          </Button>
        )}
        <Popconfirm
          title="Delete this session?"
          onConfirm={() =>
            deleteSession(session.id)
              .unwrap()
              .then(() => message.success('Deleted'))
              .catch(() => message.error('Failed'))
          }
        >
          <Button size="small" danger type="text" icon={<Trash2 size={14} />} loading={deleting}>
            Delete
          </Button>
        </Popconfirm>
      </Space>
    </div>
  );
}
