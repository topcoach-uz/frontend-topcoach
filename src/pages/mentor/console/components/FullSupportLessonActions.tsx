import { useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useRecordMentorLessonMutation,
  useRescheduleMentorLessonMutation,
  useUpdateMentorLessonLogMutation,
  type SessionLogDto,
} from 'src/app/services/fullSupportApi';
import { lessonError, lessonMinutes, lessonOutcome } from '../fullSupportLessons';

type Outcome = 'held' | 'cancelled' | 'student_no_show' | 'mentor_no_show';
type RecordValues = { outcome: Outcome; attendance?: 'present' | 'late'; actualDurationMinutes?: number; sharedNotes?: string };
type ScheduleValues = { when: Dayjs; minutes: number; meetingLink?: string };

export default function FullSupportLessonActions({ lesson, showAttendance = true }: { lesson: SessionLogDto; showAttendance?: boolean }) {
  const [mode, setMode] = useState<'record' | 'reschedule' | 'log' | null>(null);
  const [logForm] = Form.useForm<{ description: string; sharedNotes: string }>();
  const [updateLog, { isLoading: savingLog }] = useUpdateMentorLessonLogMutation();
  const [recordForm] = Form.useForm<RecordValues>();
  const [scheduleForm] = Form.useForm<ScheduleValues>();
  const [record, { isLoading: recording }] = useRecordMentorLessonMutation();
  const [reschedule, { isLoading: rescheduling }] = useRescheduleMentorLessonMutation();
  const selectedOutcome = Form.useWatch('outcome', recordForm);
  const future = dayjs(lesson.dateTime).isAfter(dayjs());
  const scheduled = ['scheduled', 'rescheduled'].includes(lessonOutcome(lesson));

  const openRecord = () => {
    const outcome = lessonOutcome(lesson);
    recordForm.setFieldsValue({
      outcome: future ? 'cancelled' : outcome === 'scheduled' || outcome === 'rescheduled' ? 'held' : outcome,
      attendance: lesson.attendance === 'late' ? 'late' : 'present',
      actualDurationMinutes: lesson.actualDurationMinutes ?? lessonMinutes(lesson.duration),
      sharedNotes: lesson.sharedNotes ?? '',
    });
    setMode('record');
  };
  const openSchedule = () => {
    scheduleForm.setFieldsValue({ when: dayjs(lesson.dateTime), minutes: lessonMinutes(lesson.duration), meetingLink: lesson.meetingLink ?? '' });
    setMode('reschedule');
  };
  const saveRecord = async () => {
    const values = await recordForm.validateFields();
    try {
      await record({ id: lesson.id, outcome: values.outcome, sharedNotes: values.sharedNotes,
        ...(values.outcome === 'held' ? { attendance: values.attendance, actualDurationMinutes: values.actualDurationMinutes } : {}) }).unwrap();
      message.success('Attendance saved'); setMode(null);
    } catch (error) { message.error(lessonError(error)); }
  };
  const saveSchedule = async () => {
    const values = await scheduleForm.validateFields();
    try {
      await reschedule({ id: lesson.id, dateTime: values.when.toISOString(), duration: `${values.minutes}m`, meetingLink: values.meetingLink?.trim() || null }).unwrap();
      message.success('Class rescheduled'); setMode(null);
    } catch (error) { message.error(lessonError(error)); }
  };
  const saveLog = async () => {
    const values = await logForm.validateFields();
    try {
      await updateLog({ id: lesson.id, description: values.description ?? '', sharedNotes: values.sharedNotes ?? '' }).unwrap();
      message.success('Session log saved'); setMode(null);
    } catch (error) { message.error(lessonError(error)); }
  };

  return <>
    <Space wrap size="small">
      <Button size="small" onClick={() => { logForm.setFieldsValue({ description: lesson.description ?? '', sharedNotes: lesson.sharedNotes ?? '' }); setMode('log'); }}>{lesson.sharedNotes ? 'Edit log' : 'Write log'}</Button>
      {scheduled && <Button size="small" onClick={openSchedule}>Reschedule</Button>}
      {showAttendance && <Button size="small" type={scheduled && !future ? 'primary' : 'default'} onClick={openRecord}>
        {future ? 'Cancel class' : scheduled ? 'Record attendance' : 'Edit attendance'}
      </Button>}
    </Space>
    <Modal title="Session log" open={mode === 'log'} onCancel={() => setMode(null)} onOk={saveLog} okText="Save log" confirmLoading={savingLog}>
      <Form name={`lesson-log-${lesson.id}`} form={logForm} layout="vertical">
        <Form.Item name="description" label="Session topic" rules={[{ max: 5000 }]}><Input.TextArea autoSize={{ minRows: 1, maxRows: 3 }} maxLength={5000} /></Form.Item>
        <Form.Item name="sharedNotes" label="Session notes" extra="Shared with the student. Record what you covered, progress and next steps." rules={[{ max: 5000 }]}><Input.TextArea autoSize={{ minRows: 6, maxRows: 14 }} maxLength={5000} showCount placeholder="What did you work on? What should happen next?" /></Form.Item>
      </Form>
    </Modal>
    <Modal title="Record attendance" open={mode === 'record'} onCancel={() => setMode(null)} onOk={saveRecord} okText="Save attendance" confirmLoading={recording}>
      <Form name={`lesson-record-${lesson.id}`} form={recordForm} layout="vertical">
        <Form.Item name="outcome" label="Class outcome" rules={[{ required: true }]}>
          <Select options={[
            { value: 'held', label: 'Held', disabled: future },
            { value: 'student_no_show', label: 'Student absent', disabled: future },
            { value: 'mentor_no_show', label: 'Mentor absent', disabled: future },
            { value: 'cancelled', label: 'Cancelled' },
          ]} />
        </Form.Item>
        {selectedOutcome === 'held' && <>
          <Form.Item name="attendance" label="Student attendance" rules={[{ required: true }]}><Select options={[{ value: 'present', label: 'Present' }, { value: 'late', label: 'Late' }]} /></Form.Item>
          <Form.Item name="actualDurationMinutes" label="Actual teaching time (minutes)" rules={[{ required: true }, { type: 'integer', min: 1, max: 480 }]}><InputNumber min={1} max={480} /></Form.Item>
        </>}
        <Form.Item name="sharedNotes" label="Notes for the student"><Input.TextArea rows={3} maxLength={5000} /></Form.Item>
      </Form>
    </Modal>
    <Modal title="Reschedule class" open={mode === 'reschedule'} onCancel={() => setMode(null)} onOk={saveSchedule} okText="Save schedule" confirmLoading={rescheduling}>
      <Form name={`lesson-reschedule-${lesson.id}`} form={scheduleForm} layout="vertical">
        <Form.Item name="when" label="Date & time" rules={[{ required: true }]}><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="minutes" label="Duration (minutes)" rules={[{ required: true }, { type: 'integer', min: 1, max: 480 }]}><InputNumber min={1} max={480} /></Form.Item>
        <Form.Item name="meetingLink" label="Meeting link" rules={[{ pattern: /^https:\/\/\S+$/i, message: 'Use an HTTPS meeting link' }]}><Input placeholder="https://meet.google.com/…" /></Form.Item>
      </Form>
    </Modal>
  </>;
}
