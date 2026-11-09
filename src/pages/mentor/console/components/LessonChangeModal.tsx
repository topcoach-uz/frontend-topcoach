import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Col,
  TimePicker,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { SessionLogDto } from 'src/app/services/fullSupportApi';
import {
  useChangeFullSupportPlanMutation,
  usePreviewFullSupportChangeMutation,
  type LessonChangeInput,
  type LessonPlanPreview,
} from 'src/app/services/fullSupportLessonPlansApi';
import { useMentorConsole } from '../MentorConsoleContext';
import {
  definitiveRejection,
  lessonPlanError,
  loadLessonDraft,
  storeLessonDraft,
} from '../lessonPlanDraft';
import { lessonMinutes } from '../fullSupportLessons';
import LessonDatesPreview from './LessonDatesPreview';
dayjs.extend(utc);
dayjs.extend(timezone);
type Values = {
  scope: 'one' | 'following';
  startsOn: Dayjs;
  time: Dayjs;
  durationMinutes: number;
  meetingLink?: string;
  reason?: string;
};
type Pending = { input: LessonChangeInput; preview: LessonPlanPreview };

export default function LessonChangeModal({
  lesson,
  action,
  onClose,
}: {
  lesson: SessionLogDto | null;
  action: 'reschedule' | 'cancel';
  onClose: () => void;
}) {
  const { id: mentorId } = useMentorConsole();
  const [form] = Form.useForm<Values>();
  const [previewRequest, { isLoading: previewing }] =
    usePreviewFullSupportChangeMutation();
  const [change, { isLoading: saving }] = useChangeFullSupportPlanMutation();
  const [preview, setPreview] = useState<LessonPlanPreview | null>(null);
  const [input, setInput] = useState<LessonChangeInput | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef('');
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (preview) previewRef.current?.scrollIntoView({ block: 'nearest' });
  }, [preview]);
  const zone = lesson?.recurrence?.timezone ?? 'Asia/Tashkent';
  const draftKey = `change:${mentorId}:${lesson?.id ?? ''}`;
  useEffect(() => {
    if (!lesson) return;
    const saved = loadLessonDraft<Pending>(draftKey);
    const local = dayjs(lesson.dateTime).tz(zone);
    requestId.current = saved?.input.requestId ?? crypto.randomUUID();
    setPending(!!saved);
    setPreview(saved?.preview ?? null);
    setInput(saved?.input ?? null);
    setError(
      saved ? 'Confirm the previous save before making another change.' : '',
    );
    form.setFieldsValue(
      saved
        ? {
            ...saved.input,
            meetingLink: saved.input.meetingLink ?? '',
            startsOn: dayjs(saved.input.startsOn),
            time: dayjs(`2000-01-01 ${saved.input.time ?? '18:00'}`),
            durationMinutes:
              saved.input.durationMinutes ?? lessonMinutes(lesson.duration),
          }
        : {
            scope: 'one',
            startsOn: dayjs(local.format('YYYY-MM-DD')),
            time: dayjs(`2000-01-01 ${local.format('HH:mm')}`),
            durationMinutes: lessonMinutes(lesson.duration),
            meetingLink: lesson.meetingLink ?? '',
            reason: '',
          },
    );
  }, [lesson, action, form, zone, draftKey]);
  const showPreview = async () => {
    if (!lesson) return;
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    const body: LessonChangeInput = {
      requestId: requestId.current,
      action,
      scope: values.scope,
      timezone: zone,
      expectedDateTime: lesson.dateTime,
      reason: values.reason?.trim(),
      ...(action === 'reschedule'
        ? {
            startsOn: values.startsOn.format('YYYY-MM-DD'),
            time: values.time.format('HH:mm'),
            durationMinutes: values.durationMinutes,
            meetingLink: values.meetingLink?.trim() || null,
          }
        : {}),
    };
    setError('');
    try {
      const result = await previewRequest({ id: lesson.id, body }).unwrap();
      setInput(body);
      setPreview(result.data);
    } catch (failure) {
      setPreview(null);
      setError(lessonPlanError(failure));
    }
  };
  const save = async () => {
    if (!lesson || !input || !preview) return;
    storeLessonDraft(draftKey, { input, preview });
    setError('');
    try {
      await change({ id: lesson.id, body: input }).unwrap();
      storeLessonDraft(draftKey, null);
      setPending(false);
      message.success(
        action === 'cancel' ? 'Lessons cancelled' : 'Lesson schedule updated',
      );
      onClose();
    } catch (failure) {
      if (definitiveRejection(failure)) {
        storeLessonDraft(draftKey, null);
        setPending(false);
        setPreview(null);
        requestId.current = crypto.randomUUID();
        setError(lessonPlanError(failure));
      } else {
        setPending(true);
        setError(
          'The save could not be confirmed. Confirm the same request to avoid applying the change twice.',
        );
      }
    }
  };
  return (
    <Modal
      title={
        action === 'cancel' ? 'Cancel scheduled lessons' : 'Reschedule lessons'
      }
      open={!!lesson}
      width={700}
      onCancel={() => !saving && onClose()}
      closable={!saving}
      maskClosable={!saving}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      footer={[
        <Button key="close" disabled={saving} onClick={onClose}>
          Close
        </Button>,
        <Button
          key="preview"
          loading={previewing}
          disabled={saving || pending}
          onClick={() => void showPreview()}
        >
          Preview changes
        </Button>,
        <Button
          key="save"
          type="primary"
          danger={action === 'cancel'}
          loading={saving}
          disabled={
            !preview ||
            !preview.sessions.length ||
            preview.conflicts.length > 0 ||
            previewing
          }
          onClick={() => void save()}
        >
          {pending
            ? 'Confirm save'
            : action === 'cancel'
              ? 'Confirm cancellation'
              : 'Save changes'}
        </Button>,
      ]}
    >
      {error && (
        <Alert type="error" message={error} style={{ marginBottom: 16 }} />
      )}
      <Form
        form={form}
        layout="vertical"
        disabled={saving || previewing || pending}
        onValuesChange={() => {
          setPreview(null);
          setInput(null);
        }}
      >
        <Form.Item name="scope" label="Apply to">
          <Radio.Group
            options={[
              { value: 'one', label: 'This lesson' },
              {
                value: 'following',
                label: 'This and following lessons',
                disabled:
                  !lesson?.recurrence || lesson.recurrence.repeat === 'none',
              },
            ]}
          />
        </Form.Item>
        <p>
          Only future, unrecorded lessons are changed. Completed lessons keep
          their attendance and notes.
        </p>
        {action === 'reschedule' && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="startsOn"
                  label="New date"
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="time"
                  label="New time"
                  rules={[{ required: true }]}
                >
                  <TimePicker
                    format="HH:mm"
                    minuteStep={5}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <p style={{ color: '#736b60' }}>
              Timezone: {zone}. Following lessons move by the same number of
              days and use this time.
            </p>
            <Form.Item
              name="durationMinutes"
              label="Duration (minutes)"
              rules={[
                { required: true },
                { type: 'integer', min: 15, max: 480 },
              ]}
            >
              <InputNumber min={15} max={480} step={15} />
            </Form.Item>
            <Form.Item
              name="meetingLink"
              label="Meeting link (optional)"
              rules={[
                {
                  pattern: /^https:\/\/\S+$/i,
                  message: 'Use an HTTPS meeting link',
                },
              ]}
            >
              <Input maxLength={2000} />
            </Form.Item>
          </>
        )}
        <Form.Item name="reason" label="Reason for change (optional)">
          <Input.TextArea rows={2} maxLength={500} />
        </Form.Item>
      </Form>
      {preview && (
        <div ref={previewRef}>
          <LessonDatesPreview
            preview={preview}
            cancelling={action === 'cancel'}
          />
        </div>
      )}
    </Modal>
  );
}
