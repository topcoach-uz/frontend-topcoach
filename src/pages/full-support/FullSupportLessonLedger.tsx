import { useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Statistic, Table, Tag, message } from 'antd';
import dayjs from 'src/lib/dayjs';
import { useCorrectAdminLessonMutation, useGetAdminLessonsQuery, type SessionLogDto } from 'src/app/services/fullSupportApi';

import SearchButton from 'src/components/common/searchButton';
type Correction = {
  reason: string;
  outcome: 'scheduled' | 'held' | 'cancelled' | 'student_no_show' | 'mentor_no_show';
  attendance?: 'present' | 'late';
  actualDurationMinutes?: number;
  sharedNotes?: string;
};

function lessonStatus(lesson: SessionLogDto): string {
  if (lesson.outcome === 'scheduled' && dayjs(lesson.dateTime).isBefore(dayjs())) return 'Awaiting record';
  return lesson.outcome.replaceAll('_', ' ');
}

export default function FullSupportLessonLedger() {
  const { data, isLoading, isError, refetch } = useGetAdminLessonsQuery();
  const [correctLesson, { isLoading: isCorrecting }] = useCorrectAdminLessonMutation();
  const [selected, setSelected] = useState<SessionLogDto | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [form] = Form.useForm<Correction>();
  const lessons = useMemo(() => data?.data ?? [], [data?.data]);
  const now = dayjs();
  const awaiting = lessons.filter((lesson) => lesson.outcome === 'scheduled' && dayjs(lesson.dateTime).isBefore(now)).length;
  const upcoming = lessons.filter((lesson) => lesson.outcome === 'scheduled' && !dayjs(lesson.dateTime).isBefore(now)).length;
  const noShows = lessons.filter((lesson) => lesson.outcome === 'student_no_show' || lesson.outcome === 'mentor_no_show').length;
  const attended = lessons.filter((lesson) => lesson.outcome === 'held' && ['present', 'late'].includes(lesson.attendance)).length;
  const studentNoShows = lessons.filter((lesson) => lesson.outcome === 'student_no_show').length;
  const attendanceRate = attended + studentNoShows ? Math.round(attended / (attended + studentNoShows) * 100) : null;
  const pendingHomework = lessons.reduce((count, lesson) => count + (lesson.homework ?? []).filter((item) => item.status === 'submitted').length, 0);
  const visible = useMemo(() => lessons.filter((lesson) => {
    const term = search.toLowerCase().trim();
    const matchesSearch = !term || [lesson.studentName, lesson.mentorName, lesson.description].some((text) => text?.toLowerCase().includes(term));
    const matchesFilter = filter === 'all' || (filter === 'awaiting' && lesson.outcome === 'scheduled' && dayjs(lesson.dateTime).isBefore(dayjs())) ||
      (filter === 'upcoming' && lesson.outcome === 'scheduled' && !dayjs(lesson.dateTime).isBefore(dayjs())) ||
      (filter === 'no_show' && ['student_no_show', 'mentor_no_show'].includes(lesson.outcome)) || lesson.outcome === filter;
    return matchesSearch && matchesFilter;
  }), [lessons, search, filter]);

  const openCorrection = () => {
    if (!selected) return;
    form.setFieldsValue({
      outcome: selected.outcome === 'rescheduled' ? 'scheduled' : selected.outcome,
      attendance: selected.attendance === 'late' ? 'late' : 'present',
      actualDurationMinutes: selected.actualDurationMinutes ?? Math.round(parseFloat(selected.duration) * 60),
      sharedNotes: selected.sharedNotes,
      reason: '',
    });
    setEditing(true);
  };

  const submitCorrection = async (values: Correction) => {
    if (!selected) return;
    try {
      const result = await correctLesson({ id: selected.id, ...values }).unwrap();
      setSelected(result.data);
      setEditing(false);
      message.success('Lesson correction saved with an audit reason.');
    } catch { message.error('Could not correct this lesson.'); }
  };

  return <Card title="1:1 lessons" className="full-support-card" style={{ marginTop: 24 }}>
    <p style={{ color: '#606976' }}>Attendance, teaching time, and homework for assigned mentor–student lessons.</p>
    <Space wrap style={{ marginBottom: 20 }}>
      <Statistic title="Upcoming" value={upcoming} />
      <Statistic title="Awaiting record" value={awaiting} valueStyle={{ color: awaiting ? '#ad6800' : undefined }} />
      <Statistic title="No-shows" value={noShows} />
      <Statistic title="Student attendance" value={attendanceRate ?? '—'} suffix={attendanceRate === null ? undefined : '%'} />
      <Statistic title="Homework awaiting review" value={pendingHomework} />
    </Space>
    {isError && <Alert type="error" message="Could not load lessons" action={<Button onClick={() => void refetch()}>Retry</Button>} style={{ marginBottom: 16 }} />}
    <Space wrap style={{ display: 'flex', marginBottom: 16 }}>
      <Input aria-label="Search lessons" placeholder="Student, mentor, or topic" value={search} onChange={(event) => setSearch(event.target.value)} suffix={<SearchButton size={24} />} allowClear style={{ width: 260 }} />
      <Select aria-label="Filter lessons" value={filter} onChange={setFilter} style={{ minWidth: 180 }} options={[
        { value: 'all', label: 'All lessons' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'awaiting', label: 'Awaiting record' },
        { value: 'held', label: 'Held' }, { value: 'no_show', label: 'No-shows' }, { value: 'cancelled', label: 'Cancelled' },
      ]} />
    </Space>
    <Table<SessionLogDto> rowKey="id" loading={isLoading} dataSource={visible} pagination={{ pageSize: 10 }} size="middle" onRow={(record) => ({ onClick: () => setSelected(record), style: { cursor: 'pointer' } })} columns={[
      { title: 'Date', dataIndex: 'dateTime', render: (value: string) => dayjs(value).format('MMM D, YYYY · h:mm A') },
      { title: 'Student', dataIndex: 'studentName', render: (value: string) => value || 'Unknown' },
      { title: 'Mentor', dataIndex: 'mentorName', render: (value: string) => value || 'Unknown' },
      { title: 'Topic', dataIndex: 'description', ellipsis: true },
      { title: 'Outcome', render: (_, lesson) => <Tag color={lessonStatus(lesson) === 'Awaiting record' ? 'orange' : lesson.outcome === 'held' ? 'green' : 'default'}>{lessonStatus(lesson)}</Tag> },
      { title: 'Attendance', render: (_, lesson) => lesson.attendance === 'unknown' ? '—' : lesson.attendance },
      { title: 'Time', render: (_, lesson) => lesson.outcome === 'held' ? `${lesson.actualDurationMinutes ?? Math.round(parseFloat(lesson.duration) * 60)} min` : '—' },
      { title: 'Homework', render: (_, lesson) => lesson.homework?.length ?? 0 },
    ]} />

    <Modal title={selected ? `${selected.studentName || 'Student'} · ${dayjs(selected.dateTime).format('MMM D, YYYY')}` : 'Lesson'} open={!!selected} onCancel={() => { setSelected(null); setEditing(false); }} footer={null} width={700}>
      {selected && <>
        <p><strong>Mentor:</strong> {selected.mentorName || 'Unknown'} · <strong>Topic:</strong> {selected.description}</p>
        <p><strong>Outcome:</strong> {lessonStatus(selected)} · <strong>Attendance:</strong> {selected.attendance} · <strong>Actual time:</strong> {selected.actualDurationMinutes ?? 'Not recorded'} min</p>
        {selected.sharedNotes && <p><strong>Shared notes:</strong> {selected.sharedNotes}</p>}
        <h4>Homework</h4>
        {selected.homework?.length ? <ul>{selected.homework.map((task) => <li key={task.id}>{task.title} · {task.status.replaceAll('_', ' ')} · Due {dayjs(task.deadline).format('MMM D')}</li>)}</ul> : <p>No homework linked to this lesson.</p>}
        <h4>Record history</h4>
        {selected.changeHistory?.length ? <ul>{selected.changeHistory.map((entry, index) => <li key={`${entry.at}-${index}`}>{dayjs(entry.at).format('MMM D, YYYY h:mm A')} · {entry.reason} · By {entry.by}</li>)}</ul> : <p>No changes recorded yet.</p>}
        {!editing ? <Button onClick={openCorrection}>Correct lesson record</Button> : <Form form={form} layout="vertical" onFinish={submitCorrection}>
          <Form.Item name="reason" label="Reason for correction" rules={[{ required: true, whitespace: true }]}><Input.TextArea rows={2} maxLength={500} /></Form.Item>
          <Form.Item name="outcome" label="Outcome" rules={[{ required: true }]}><Select options={[{ value: 'scheduled', label: 'Reopen as scheduled' }, { value: 'held', label: 'Held' }, { value: 'student_no_show', label: 'Student no-show' }, { value: 'mentor_no_show', label: 'Mentor no-show' }, { value: 'cancelled', label: 'Cancelled' }]} /></Form.Item>
          <Form.Item noStyle shouldUpdate={(a, b) => a.outcome !== b.outcome}>{({ getFieldValue }) => getFieldValue('outcome') === 'held' ? <>
            <Form.Item name="attendance" label="Attendance" rules={[{ required: true }]}><Select options={[{ value: 'present', label: 'Present' }, { value: 'late', label: 'Late' }]} /></Form.Item>
            <Form.Item name="actualDurationMinutes" label="Actual minutes" rules={[{ required: true }]}><InputNumber min={1} max={480} style={{ width: '100%' }} /></Form.Item>
          </> : null}</Form.Item>
          <Form.Item name="sharedNotes" label="Shared notes"><Input.TextArea maxLength={5000} rows={3} /></Form.Item>
          <Space><Button type="primary" htmlType="submit" loading={isCorrecting}>Save correction</Button><Button onClick={() => setEditing(false)}>Cancel</Button></Space>
        </Form>}
      </>}
    </Modal>
  </Card>;
}
