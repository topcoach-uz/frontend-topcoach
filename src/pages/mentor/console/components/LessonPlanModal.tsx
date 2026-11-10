import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  TimePicker,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { TIMEZONE_OPTIONS } from 'src/constants/timezones';
import {
  useCreateFullSupportPlanMutation,
  useGetFullSupportSchedulingStudentsQuery,
  usePreviewFullSupportPlanMutation,
  type LessonPlanInput,
  type LessonPlanPreview,
} from 'src/app/services/fullSupportLessonPlansApi';
import { useMentorConsole } from '../MentorConsoleContext';
import {
  definitiveRejection,
  lessonPlanError,
  loadLessonDraft,
  storeLessonDraft,
} from '../lessonPlanDraft';
import LessonDatesPreview from './LessonDatesPreview';
import './LessonPlanModal.scss';

type Values = {
  studentUserId: string;
  startsOn: Dayjs;
  time: Dayjs;
  timezone: string;
  repeat: LessonPlanInput['repeat'];
  weekdays: number[];
  endMode: 'count' | 'date';
  count: number;
  until?: Dayjs;
  durationMinutes: number;
  topic: string;
  meetingLink?: string;
};
type Pending = { input: LessonPlanInput; preview: LessonPlanPreview };
const WEEKDAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

export default function LessonPlanModal({
  open,
  onClose,
  studentId,
}: {
  open: boolean;
  onClose: () => void;
  studentId?: string;
}) {
  const { id: mentorId } = useMentorConsole();
  const draftKey = `create:${mentorId}`;
  const [form] = Form.useForm<Values>();
  const repeat = Form.useWatch('repeat', form) ?? 'none';
  const endMode = Form.useWatch('endMode', form) ?? 'count';
  const roster = useGetFullSupportSchedulingStudentsQuery(undefined, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  });
  const [previewPlan, { isLoading: previewing }] =
    usePreviewFullSupportPlanMutation();
  const [createPlan, { isLoading: saving }] =
    useCreateFullSupportPlanMutation();
  const [preview, setPreview] = useState<LessonPlanPreview | null>(null);
  const [input, setInput] = useState<LessonPlanInput | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef('');
  const previewRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (preview) previewRef.current?.scrollIntoView({ block: 'nearest' });
  }, [preview]);
  useEffect(() => {
    if (!open) return;
    const saved = loadLessonDraft<Pending>(draftKey);
    requestId.current = saved?.input.requestId ?? crypto.randomUUID();
    setPending(!!saved);
    setPreview(saved?.preview ?? null);
    setInput(saved?.input ?? null);
    setError(
      saved
        ? 'A previous save could not be confirmed. Confirm it before creating another plan; the same request will be retried safely.'
        : '',
    );
    const tomorrow = dayjs(
      new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10),
    ).add(1, 'day');
    form.resetFields();
    form.setFieldsValue(
      saved
        ? {
            ...saved.input,
            startsOn: dayjs(saved.input.startsOn),
            time: dayjs(`2000-01-01 ${saved.input.time}`),
            until: saved.input.until ? dayjs(saved.input.until) : undefined,
          }
        : {
            studentUserId: studentId,
            startsOn: tomorrow,
            time: dayjs('2000-01-01 18:00'),
            timezone: 'Asia/Tashkent',
            repeat: 'none',
            weekdays: [tomorrow.day()],
            endMode: 'count',
            count: 8,
            until: tomorrow.add(8, 'week'),
            durationMinutes: 60,
            topic: '',
            meetingLink: '',
          },
    );
  }, [open, studentId, draftKey, form]);

  const loadPreview = async (next: LessonPlanInput) => {
    setError('');
    try {
      const result = await previewPlan(next).unwrap();
      setInput(next);
      setPreview(result.data);
    } catch (failure) {
      setPreview(null);
      setError(lessonPlanError(failure));
    }
  };
  const showDates = async () => {
    const v = await form.validateFields().catch(() => null);
    if (!v) return;
    await loadPreview({
      requestId: requestId.current,
      studentUserId: v.studentUserId,
      startsOn: v.startsOn.format('YYYY-MM-DD'),
      time: v.time.format('HH:mm'),
      timezone: v.timezone,
      repeat: v.repeat,
      weekdays: v.repeat === 'none' ? [] : [...v.weekdays].sort(),
      endMode: v.repeat === 'none' ? 'count' : v.endMode,
      ...(v.repeat === 'none' || v.endMode === 'count'
        ? { count: v.repeat === 'none' ? 1 : v.count }
        : { until: v.until!.format('YYYY-MM-DD') }),
      excludedDates: [],
      durationMinutes: v.durationMinutes,
      topic: v.topic.trim(),
      ...(v.meetingLink?.trim() ? { meetingLink: v.meetingLink.trim() } : {}),
    });
  };
  const save = async () => {
    if (!input || !preview) return;
    storeLessonDraft(draftKey, { input, preview });
    setError('');
    try {
      const result = await createPlan(input).unwrap();
      storeLessonDraft(draftKey, null);
      setPending(false);
      message.success(
        `${result.data.sessions.length} lesson${result.data.sessions.length === 1 ? '' : 's'} scheduled`,
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
          'The save could not be confirmed. Confirm the same plan to avoid scheduling the lessons twice.',
        );
      }
    }
  };
  const selected = preview?.sessions.filter((row) => !row.excluded).length ?? 0;
  // Lessons can only be planned for students this mentor is the Full Support
  // mentor of. Say so up front instead of letting the save fail with a 403.
  const chosenStudent = Form.useWatch('studentUserId', form);
  const eligibleIds = new Set((roster.data?.data ?? []).map((row) => row.id));
  const notEligible = roster.isSuccess && !!chosenStudent && !eligibleIds.has(chosenStudent);
  return (
    <Modal
      title="Schedule Full Support lessons"
      width={760}
      style={{ top: 32 }}
      rootClassName="lesson-plan-modal"
      open={open}
      onCancel={() => !saving && onClose()}
      footer={[
        <Button key="cancel" disabled={saving} onClick={onClose}>
          Close
        </Button>,
        <Button
          key="preview"
          loading={previewing}
          disabled={saving || pending || notEligible}
          onClick={() => void showDates()}
        >
          Preview dates
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={saving}
          disabled={
            notEligible || !preview || !selected || preview.conflicts.length > 0 || previewing
          }
          onClick={() => void save()}
        >
          {pending
            ? 'Confirm save'
            : `Schedule ${selected || ''} lesson${selected === 1 ? '' : 's'}`}
        </Button>,
      ]}
      styles={{ body: { overflow: 'visible' } }}
      closable={!saving}
      maskClosable={!saving}
    >
      <p className="lesson-plan-modal__intro">
        Plan one meeting or a repeating series. Google Calendar is optional.
      </p>
      {notEligible && (
        <Alert
          type="warning"
          showIcon
          className="lesson-plan-modal__alert"
          message="You’re not this student’s Full Support mentor yet"
          description="Lessons can only be planned for students assigned to you for Full Support. An admin can assign you in the admin panel under Program access → Full Support. Then reopen this window."
        />
      )}
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          className="lesson-plan-modal__alert"
        />
      )}
      {roster.isError && (
        <Alert
          type="error"
          message="Could not load Full Support students"
          action={<Button onClick={() => void roster.refetch()}>Retry</Button>}
        />
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
        <Row gutter={12}>
          <Col xs={24} sm={10}>
            <Form.Item
              name="studentUserId"
              label="Student"
              rules={[{ required: true, message: 'Choose a Full Support student' }]}
            >
              <Select
                loading={roster.isLoading}
                placeholder="Select a Full Support student"
                status={notEligible ? 'warning' : undefined}
                options={(roster.data?.data ?? []).map((row) => ({
                  value: row.id,
                  label: row.name,
                }))}
                labelRender={(option) => option.label ?? (notEligible ? 'Not one of your Full Support students' : option.value)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={14}>
            <Form.Item
              name="topic"
              label="Session topic"
              rules={[
                { required: true, whitespace: true, message: 'Enter a topic' },
              ]}
            >
              <Input
                placeholder="e.g. Personal statement planning"
                maxLength={2000}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="repeat" label="Repeat">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { value: 'none', label: 'One-time' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'biweekly', label: 'Every two weeks' },
            ]}
          />
        </Form.Item>
        <Row gutter={12}>
          <Col xs={12} sm={6}>
            <Form.Item
              name="startsOn"
              label="Start date"
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={5}>
            <Form.Item name="time" label="Time" rules={[{ required: true }]}>
              <TimePicker
                format="HH:mm"
                minuteStep={5}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={8} sm={4}>
            <Form.Item
              name="durationMinutes"
              label="Minutes"
              rules={[
                { required: true },
                { type: 'integer', min: 15, max: 480 },
              ]}
            >
              <InputNumber
                min={15}
                max={480}
                step={15}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col xs={16} sm={9}>
            <Form.Item
              name="timezone"
              label="Timezone"
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={TIMEZONE_OPTIONS}
                popupMatchSelectWidth={false}
              />
            </Form.Item>
          </Col>
        </Row>
        {repeat !== 'none' && (
          <>
            <Form.Item
              name="weekdays"
              label="Days of the week"
              rules={[
                {
                  type: 'array',
                  min: 1,
                  required: true,
                  message: 'Choose at least one weekday',
                },
              ]}
            >
              <Checkbox.Group options={WEEKDAYS} />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="endMode" label="Series ends">
                  <Select
                    options={[
                      { value: 'count', label: 'After a number of lessons' },
                      { value: 'date', label: 'On a date' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                {endMode === 'count' ? (
                  <Form.Item
                    name="count"
                    label="Number of lessons"
                    rules={[
                      { required: true },
                      { type: 'integer', min: 1, max: 52 },
                    ]}
                  >
                    <InputNumber min={1} max={52} style={{ width: '100%' }} />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="until"
                    label="Last possible lesson date"
                    rules={[{ required: true }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                )}
              </Col>
            </Row>
            <p style={{ color: '#736b60', fontSize: 12 }}>
              Up to 52 lessons within one year. Uncheck individual dates in the
              preview to skip holidays or exams.
            </p>
          </>
        )}
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
          <Input
            placeholder="A link to reuse for these lessons"
            maxLength={2000}
          />
        </Form.Item>
      </Form>
      {preview && (
        <div ref={previewRef}>
          <LessonDatesPreview
            preview={preview}
            disabled={pending || saving || previewing}
            onExclude={(date, excluded) => {
              if (!input) return;
              const dates = new Set(input.excludedDates ?? []);
              if (excluded) dates.add(date);
              else dates.delete(date);
              void loadPreview({ ...input, excludedDates: [...dates].sort() });
            }}
          />
        </div>
      )}
    </Modal>
  );
}
