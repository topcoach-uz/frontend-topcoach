import { Alert, Button, Empty, Segmented, Tabs, Tag } from 'antd';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetEnrollmentMeQuery, useGetMenteeSessionsQuery } from 'src/app/services/fullSupportApi';
import { fullSupportDisplay } from '../../mentor/console/sessionDisplay';
import { ApplicantPage, QueryState } from '../applicant/ApplicantPage';
import StudentSessionsPage from './StudentSessionsPage';

export default function StudentAttendancePage() {
  const [params, setParams] = useSearchParams();
  const { t } = useTranslation();
  const tab = params.get('tab') === 'standalone' ? 'standalone' : 'full-support';
  return <ApplicantPage title={t('attendanceNavigation.title', 'Attendance')}
    subtitle="Your Full Support and standalone 1:1 attendance, teaching time, and mentor notes."
    actions={<Link to="/student-hub/overview">Overview</Link>}>
    <Tabs aria-label="Attendance type" activeKey={tab}
      onChange={value => setParams({ tab: value })}
      destroyInactiveTabPane
      items={[
        { key: 'full-support', label: 'Full Support', children: <FullSupportAttendance /> },
        { key: 'standalone', label: 'Standalone 1:1', children: <StudentSessionsPage /> },
      ]} />
  </ApplicantPage>;
}

function FullSupportAttendance() {
  const enrollment = useGetEnrollmentMeQuery();
  const enrolled = !!enrollment.data?.data?.enrolled;
  const query = useGetMenteeSessionsQuery(undefined, {
    skip: !enrolled,
    pollingInterval: 15000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const [scope, setScope] = useState('Past');
  const sessions = (query.data?.data?.sessions ?? []).filter(session => {
    const cancelled = session.outcome === 'cancelled' || session.outcome === 'rescheduled';
    if (scope === 'Cancelled') return cancelled;
    if (cancelled) return false;
    const upcoming = fullSupportDisplay(session).label === 'Upcoming';
    return scope === 'Upcoming' ? upcoming : !upcoming;
  }).sort((a, b) => scope === 'Upcoming'
    ? new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    : new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  return <QueryState loading={enrollment.isLoading} error={enrollment.isError} retry={enrollment.refetch}>
    {!enrolled ? <Alert type="info" showIcon message="Full Support attendance is available when you are enrolled."
      description={<Link to="/student-hub?section=others&target=full-support">View Full Support program</Link>} /> : <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <Button loading={query.isFetching} onClick={() => void query.refetch()}>Refresh sessions</Button>
        <Link to="/student-hub?section=others&target=full-support">Full Support program</Link>
        {query.data && <span>Actual teaching time this month: {query.data.data.usedHours}h</span>}
      </div>
      <Segmented options={['Upcoming', 'Past', 'Cancelled']} value={scope} onChange={value => setScope(String(value))} style={{ marginBottom: 20 }} />
      <QueryState loading={query.isLoading} error={query.isError} retry={query.refetch}>
        {!sessions.length ? <Empty description={`No ${scope.toLowerCase()} Full Support sessions.`} /> : <div className="applicant-stack">
          {sessions.map(session => {
            const display = fullSupportDisplay(session);
            return <article className="applicant-card" key={session.id}>
              <div className="applicant-section-heading"><h2>{session.description || 'Full Support session'}</h2><Tag>{display.label}</Tag></div>
              <p>{new Date(session.dateTime).toLocaleString()}</p>
              <p><strong>Attendance:</strong> {display.attendance}{display.actualMinutes !== null ? ` · ${display.actualMinutes} min actual teaching time` : ''}</p>
              {display.notes && <p style={{ whiteSpace: 'pre-wrap' }}>{display.notes}</p>}
            </article>;
          })}
        </div>}
      </QueryState>
    </>}
  </QueryState>;
}
