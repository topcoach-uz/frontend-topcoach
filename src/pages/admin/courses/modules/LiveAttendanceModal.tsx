import React, { useCallback, useEffect, useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { ACCESS_TOKEN } from 'src/constants/storage';

type Session = { id: string; startsAt: string; durationMinutes: number; meetingUrl: string | null; status: 'scheduled' | 'held' | 'cancelled'; summary: string };
type Student = { userId: string; name: string; email: string; attendance: { status: string; note: string } | null; homework: { assigned: number; submitted: number; correct: number } };

async function request<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const response = await fetch(`/api/courses/live/${path}`, {
    method,
    headers: { Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN) || ''}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || `Request failed (${response.status})`);
  return response.json();
}

export default function LiveAttendanceModal({ lesson, open, onClose }: { lesson: { id: string; title: string; duration: number } | null; open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const selected = sessions.find((session) => session.id === selectedId);

  const reload = useCallback(async () => {
    if (!lesson) return;
    setLoading(true);
    try {
      const list = await request<Session[]>(`lessons/${lesson.id}/sessions`);
      setSessions(list);
      setSelectedId((previous) => list.some((session) => session.id === previous) ? previous : list[0]?.id ?? null);
    } catch (error) { message.error((error as Error).message); }
    finally { setLoading(false); }
  }, [lesson]);

  const reloadRoster = useCallback(async () => {
    if (!selectedId) { setStudents([]); return; }
    try {
      const result = await request<{ students: Student[] }>(`sessions/${selectedId}/roster`);
      setStudents(result.students);
    } catch (error) { message.error((error as Error).message); }
  }, [selectedId]);

  useEffect(() => { if (open) void reload(); }, [open, reload]);
  useEffect(() => { if (open) void reloadRoster(); }, [open, reloadRoster]);
  useEffect(() => { if (open && lesson) form.setFieldValue('durationMinutes', lesson.duration); }, [form, lesson, open]);

  const schedule = async (values: { startsAt: dayjs.Dayjs; durationMinutes: number; meetingUrl?: string }) => {
    if (!lesson) return;
    setBusy(true);
    try {
      const session = await request<Session>(`lessons/${lesson.id}/sessions`, 'POST', { ...values, startsAt: values.startsAt.toISOString() });
      form.resetFields();
      setSelectedId(session.id);
      await reload();
      message.success('Class scheduled');
    } catch (error) { message.error((error as Error).message); }
    finally { setBusy(false); }
  };

  const setStatus = async (status: Session['status']) => {
    if (!selectedId) return;
    setBusy(true);
    try { await request(`sessions/${selectedId}`, 'PATCH', { status }); await reload(); message.success('Class updated'); }
    catch (error) { message.error((error as Error).message); }
    finally { setBusy(false); }
  };

  const mark = async (userId: string, status: string) => {
    if (!selectedId) return;
    try { await request(`sessions/${selectedId}/attendance/${userId}`, 'PATCH', { status }); await reloadRoster(); }
    catch (error) { message.error((error as Error).message); }
  };

  return <Modal title={`Live classes · ${lesson?.title ?? ''}`} open={open} onCancel={onClose} footer={null} width={900} destroyOnClose>
    <Typography.Paragraph type="secondary">Schedule each class, then mark every enrolled student's attendance. Unmarked students stay unmarked until a mentor or admin records them.</Typography.Paragraph>
    <Form form={form} layout="inline" onFinish={schedule} style={{ marginBottom: 20, gap: 8 }}>
      <Form.Item name="startsAt" rules={[{ required: true, message: 'Choose a date and time' }]}><DatePicker showTime format="DD MMM YYYY HH:mm" placeholder="Class date and time" /></Form.Item>
      <Form.Item name="durationMinutes" rules={[{ required: true }]}><InputNumber min={1} max={480} placeholder="Minutes" /></Form.Item>
      <Form.Item name="meetingUrl"><Input type="url" placeholder="https://meeting-link" style={{ width: 220 }} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={busy}>Schedule class</Button>
    </Form>
    {sessions.length === 0 ? <Typography.Paragraph type="secondary">No classes scheduled yet.</Typography.Paragraph> : <Select style={{ width: '100%', marginBottom: 16 }} value={selectedId} onChange={setSelectedId} options={sessions.map((session) => ({ value: session.id, label: `${dayjs(session.startsAt).format('DD MMM YYYY, HH:mm')} · ${session.status}` }))} />}
    {selected && <>
      <Space style={{ marginBottom: 16 }}><Tag color={selected.status === 'held' ? 'green' : selected.status === 'cancelled' ? 'red' : 'blue'}>{selected.status}</Tag><Button size="small" disabled={busy || selected.status === 'held'} onClick={() => void setStatus('held')}>Mark class held</Button><Button size="small" disabled={busy || selected.status === 'cancelled'} onClick={() => void setStatus('cancelled')}>Cancel class</Button>{selected.meetingUrl && <a href={selected.meetingUrl} target="_blank" rel="noreferrer">Meeting link</a>}</Space>
      <Table rowKey="userId" loading={loading} dataSource={students} pagination={{ pageSize: 10 }} columns={[
        { title: 'Student', render: (_, student: Student) => <><strong>{student.name}</strong><br/><Typography.Text type="secondary">{student.email}</Typography.Text></> },
        { title: 'Attendance', render: (_, student: Student) => <Select aria-label={`Attendance for ${student.name}`} placeholder="Not marked" value={student.attendance?.status || undefined} disabled={selected.status === 'cancelled'} style={{ width: 145 }} onChange={(status) => void mark(student.userId, status)} options={['present','late','absent','excused'].map((status) => ({ value: status, label: status[0].toUpperCase() + status.slice(1) }))} /> },
        { title: 'Lesson work', render: (_, student: Student) => student.homework.assigned ? `${student.homework.submitted}/${student.homework.assigned} submitted · ${student.homework.correct} correct` : 'No tasks assigned' },
      ]} />
    </>}
  </Modal>;
}
