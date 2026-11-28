import { useState } from 'react';
import { Alert, Button, Collapse, Empty, Input, Spin, Typography } from 'antd';
import { useGetMentorReportsQuery } from 'src/app/services/fullSupportApi';
import { historicalReportText } from '../historicalReportText';

/** Historical reports are source material, not new student review requests. */
export default function MentorReports({ studentUserId }: { studentUserId?: string }) {
  const { data, isLoading, isError, refetch } = useGetMentorReportsQuery(studentUserId ?? null);
  const [search, setSearch] = useState('');
  const reports = (data?.data ?? []).filter(r => `${r.studentName} ${r.fileName} ${r.text}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div>
    <Typography.Paragraph>Historical progress reports and notes for your assigned students. These source records have not been independently verified.</Typography.Paragraph>
    <Input.Search allowClear aria-label="Search historical reports" placeholder="Search reports or student names" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 480, marginBottom: 16 }} />
    {isLoading ? <Spin /> : isError ? <Alert type="error" message="Could not load historical reports" action={<Button onClick={() => void refetch()}>Retry</Button>} /> : !reports.length ? <Empty description="No historical reports found." /> : <>
      <Typography.Paragraph>{reports.length} historical report{reports.length === 1 ? '' : 's'}</Typography.Paragraph>
      <Collapse items={reports.map(r => ({ key: r.id, label: `${r.studentName} — ${r.fileName.replace(/\.txt$/, '')}`, children: <>
        <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{historicalReportText(r.text)}</div>
        {r.sourceUrl && /^https:\/\/docs\.google\.com\//.test(r.sourceUrl) && <Typography.Link href={r.sourceUrl} target="_blank" rel="noopener noreferrer">Open original source</Typography.Link>}
      </> }))} />
    </>}
  </div>;
}
