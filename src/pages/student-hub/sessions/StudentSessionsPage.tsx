import { useState } from 'react';
import { Button, Empty, Segmented, Tag } from 'antd';
import { useGetMySessionsQuery } from 'src/app/services/sessions';
import { QueryState } from '../applicant/ApplicantPage';
import { studentAttendance, studentSessionList, studentSessionOutcome } from './studentSessions';

export default function StudentSessionsPage() {
  const query = useGetMySessionsQuery(undefined, { pollingInterval: 15000, refetchOnFocus: true, refetchOnMountOrArgChange: true });
  const [tab, setTab] = useState('Past');
  const sessions = studentSessionList(query.data).filter(session => {
    if (!['individual30m', 'individual60m'].includes(session.type)) return false;
    if (tab === 'Cancelled') return !!session.cancelStatus?.id;
    if (session.cancelStatus?.id) return false;
    const recorded = !!session.attendanceRecord;
    const ended = new Date(session.date).getTime() + (session.type === 'individual30m' ? 30 : 60) * 60000 <= Date.now();
    return tab === 'Past' ? recorded || ended : !recorded && !ended;
  }).sort((a,b) => tab === 'Upcoming' ? new Date(a.date).getTime()-new Date(b.date).getTime() : new Date(b.date).getTime()-new Date(a.date).getTime());
  return <>
    <Button loading={query.isFetching} onClick={() => void query.refetch()} style={{ marginBottom: 16 }}>Refresh sessions</Button>
    <Segmented options={['Upcoming','Past','Cancelled']} value={tab} onChange={value=>setTab(String(value))} style={{ marginBottom: 20 }} />
    <QueryState loading={query.isLoading} error={query.isError} retry={query.refetch}>
      {sessions.length === 0 ? <Empty description={`No ${tab.toLowerCase()} mentor sessions.`} /> : <div className="applicant-stack">
        {sessions.map(session => <article className="applicant-card" key={session.id}>
          <div className="applicant-section-heading"><h2>{session.mentor?.profile?.name || 'Mentor session'}</h2><Tag>{studentSessionOutcome(session)}</Tag></div>
          <p>{new Date(session.date).toLocaleString()}</p>
          <p><strong>Attendance:</strong> {studentAttendance(session)}{session.attendanceRecord?.outcome === 'held' && session.attendanceRecord.actualDurationMinutes !== null ? ` · ${session.attendanceRecord.actualDurationMinutes} min actual teaching time` : ''}</p>
          {session.attendanceRecord?.sharedNotes && <p style={{ whiteSpace: 'pre-wrap' }}>{session.attendanceRecord.sharedNotes}</p>}
          {session.attendanceRecord?.recordedAt && <small className="applicant-muted">Recorded {new Date(session.attendanceRecord.recordedAt).toLocaleString()}</small>}
        </article>)}
      </div>}
    </QueryState>
  </>;
}
