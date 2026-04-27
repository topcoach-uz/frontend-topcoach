/**
 * Research authoring modals — lesson editor, quiz question editor,
 * assignment editor drawer, attachment editor.
 *
 * Each modal is independently controllable and self-contained — the parent
 * passes the entity (or null for create) and a save callback.
 */

import React, { useEffect, useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Switch,
  Tag,
  Space,
  message,
} from 'antd';
import { Plus, Trash2 } from 'lucide-react';
import type {
  ResearchAssignment,
  ResearchAttachment,
  ResearchQuizQuestion,
  ResearchVideoLesson,
  ResearchWeek,
} from 'src/app/services/research-prep';

const FILE_TYPE_OPTIONS = ['pdf', 'docx', 'png', 'jpg', 'zip', 'xlsx', 'pptx'].map((v) => ({
  value: v,
  label: v.toUpperCase(),
}));

// ─────────────────────────────────────────────────────────────────────────
// Week details editor — title, tagline, quiz title
// ─────────────────────────────────────────────────────────────────────────

interface WeekDetailsEditorModalProps {
  open: boolean;
  week: ResearchWeek | null;
  onClose: () => void;
  onSave: (patch: { title: string; tagline: string; quizTitle?: string }) => Promise<void> | void;
}

export const WeekDetailsEditorModal: React.FC<WeekDetailsEditorModalProps> = ({
  open,
  week,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && week) {
      form.setFieldsValue({
        title: week.title,
        tagline: week.tagline,
        quizTitle: week.quiz.title,
      });
    }
  }, [open, week, form]);

  const handleSubmit = async () => {
    const v = await form.validateFields().catch(() => null);
    if (!v) return;
    setSubmitting(true);
    try {
      await onSave({
        title: v.title.trim(),
        tagline: v.tagline.trim(),
        quizTitle: v.quizTitle?.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={week ? `Edit Week ${week.weekNumber} details` : 'Edit week'}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
          style={{ background: '#8b0000', borderColor: '#8b0000' }}
        >
          Save changes
        </Button>,
      ]}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="title"
          label="Lesson title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input placeholder="e.g. Introduction to Research" />
        </Form.Item>
        <Form.Item
          name="tagline"
          label="Objectives & content summary"
          rules={[{ required: true, message: 'Summary is required' }]}
          tooltip="A one-paragraph description students see in the week card."
        >
          <Input.TextArea
            rows={3}
            placeholder="Define research as systematic inquiry. Distinguish between Basic, Applied, Qualitative, and Quantitative methods."
          />
        </Form.Item>
        <Form.Item
          name="quizTitle"
          label="Quiz title (optional)"
          tooltip="Defaults to 'Week N quiz — <title>' when blank."
        >
          <Input placeholder="e.g. Week 1 quiz — Introduction to Research" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Lesson editor — video metadata + attachments
// ─────────────────────────────────────────────────────────────────────────

interface LessonEditorModalProps {
  open: boolean;
  weekNumber: number;
  initial: ResearchVideoLesson | null;
  onClose: () => void;
  onSave: (lesson: ResearchVideoLesson) => Promise<void> | void;
}

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  open,
  weekNumber,
  initial,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [attachments, setAttachments] = useState<ResearchAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        title: initial?.title ?? '',
        description: initial?.description ?? '',
        durationMinutes: initial ? Math.round(initial.durationSeconds / 60) : 10,
        vdocipherVideoId: initial?.vdocipherVideoId ?? '',
      });
      setAttachments(initial?.attachments ?? []);
    }
  }, [open, initial, form]);

  const handleSubmit = async () => {
    try {
      const v = await form.validateFields();
      setSubmitting(true);
      const lesson: ResearchVideoLesson = {
        id: initial?.id ?? `w${weekNumber}-v-${Date.now()}`,
        title: v.title.trim(),
        description: v.description?.trim() || undefined,
        durationSeconds: Math.max(1, Math.round((v.durationMinutes ?? 10) * 60)),
        vdocipherVideoId: v.vdocipherVideoId?.trim() || undefined,
        attachments,
      };
      await onSave(lesson);
      onClose();
    } catch (e) {
      // antd form validation throws; we just stop
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={initial ? `Edit lesson — Week ${weekNumber}` : `Add lesson to Week ${weekNumber}`}
      width={680}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
          style={{ background: '#8b0000', borderColor: '#8b0000' }}
        >
          {initial ? 'Save changes' : 'Add lesson'}
        </Button>,
      ]}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="title"
          label="Lesson title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input placeholder="e.g. Why research matters in admissions" />
        </Form.Item>
        <Form.Item name="description" label="Description (optional)">
          <Input.TextArea rows={2} placeholder="Short description students see in the player." />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item
            name="durationMinutes"
            label="Duration (minutes)"
            rules={[{ required: true, message: 'Duration is required' }]}
          >
            <InputNumber min={1} max={600} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="vdocipherVideoId"
            label="VdoCipher video ID"
            tooltip="Set when uploading via VdoCipher. Leave empty to use the placeholder."
          >
            <Input placeholder="e.g. abc123…" />
          </Form.Item>
        </div>

        <div style={{ marginTop: 4 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <strong style={{ fontSize: 13, color: '#1f2937' }}>
              Materials ({attachments.length})
            </strong>
            <Button
              size="small"
              icon={<Plus size={13} />}
              onClick={() =>
                setAttachments((prev) => [
                  ...prev,
                  {
                    id: `att-${Date.now()}-${prev.length}`,
                    kind: 'link',
                    title: '',
                    url: '',
                  },
                ])
              }
            >
              Add material
            </Button>
          </div>
          {attachments.length === 0 && (
            <div
              style={{
                padding: 10,
                border: '1px dashed #d1d5db',
                borderRadius: 8,
                textAlign: 'center',
                color: '#6b7280',
                fontSize: 13,
              }}
            >
              No materials yet. Add files (PDF / docs) or external links.
            </div>
          )}
          {attachments.map((a, idx) => (
            <div
              key={a.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 1fr 36px',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Select
                value={a.kind}
                onChange={(v) =>
                  setAttachments((prev) =>
                    prev.map((p, i) => (i === idx ? { ...p, kind: v } : p)),
                  )
                }
                options={[
                  { value: 'link', label: 'External link' },
                  { value: 'file', label: 'Uploaded file' },
                ]}
              />
              <Input
                placeholder="Title"
                value={a.title}
                onChange={(e) =>
                  setAttachments((prev) =>
                    prev.map((p, i) => (i === idx ? { ...p, title: e.target.value } : p)),
                  )
                }
              />
              <Input
                placeholder={a.kind === 'link' ? 'https://…' : '/uploads/file.pdf'}
                value={a.url}
                onChange={(e) =>
                  setAttachments((prev) =>
                    prev.map((p, i) => (i === idx ? { ...p, url: e.target.value } : p)),
                  )
                }
              />
              <Button
                icon={<Trash2 size={14} />}
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
              />
            </div>
          ))}
        </div>
      </Form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Quiz question editor — prompt, options, correct, hint, explanation
// ─────────────────────────────────────────────────────────────────────────

interface QuestionEditorModalProps {
  open: boolean;
  weekNumber: number;
  initial: ResearchQuizQuestion | null;
  onClose: () => void;
  onSave: (q: ResearchQuizQuestion) => Promise<void> | void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  open,
  weekNumber,
  initial,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        prompt: initial?.prompt ?? '',
        hint: initial?.hint ?? '',
        explanation: initial?.explanation ?? '',
      });
      setOptions(initial?.options ?? ['', '']);
      setCorrectIndex(initial?.correctIndex ?? 0);
    }
  }, [open, initial, form]);

  const handleSubmit = async () => {
    const v = await form.validateFields().catch(() => null);
    if (!v) return;
    const cleaned = options.map((o) => o.trim()).filter((o) => o);
    if (cleaned.length < 2) {
      message.error('Add at least 2 answer options.');
      return;
    }
    if (correctIndex >= cleaned.length) {
      message.error('Choose which option is correct.');
      return;
    }
    setSubmitting(true);
    try {
      const q: ResearchQuizQuestion = {
        id: initial?.id ?? `w${weekNumber}-q-${Date.now()}`,
        prompt: v.prompt.trim(),
        options: cleaned,
        correctIndex,
        hint: v.hint?.trim() || undefined,
        explanation: v.explanation.trim(),
      };
      await onSave(q);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={initial ? `Edit question — Week ${weekNumber}` : `Add question to Week ${weekNumber}`}
      width={640}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
          style={{ background: '#8b0000', borderColor: '#8b0000' }}
        >
          {initial ? 'Save question' : 'Add question'}
        </Button>,
      ]}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="prompt"
          label="Question"
          rules={[{ required: true, message: 'Question is required' }]}
        >
          <Input.TextArea rows={2} placeholder="What are you asking the student?" />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <strong style={{ fontSize: 13, color: '#1f2937' }}>
              Answer options ({options.length})
            </strong>
            <Button
              size="small"
              icon={<Plus size={13} />}
              onClick={() => setOptions((p) => [...p, ''])}
            >
              Add option
            </Button>
          </div>
          <Radio.Group
            value={correctIndex}
            onChange={(e) => setCorrectIndex(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}
          >
            {options.map((opt, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr 36px',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <Radio value={i}>Correct</Radio>
                <Input
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((p, idx) => (idx === i ? e.target.value : p)),
                    )
                  }
                />
                <Button
                  icon={<Trash2 size={14} />}
                  onClick={() => {
                    setOptions((prev) => prev.filter((_, idx) => idx !== i));
                    setCorrectIndex((prev) => (prev === i ? 0 : prev > i ? prev - 1 : prev));
                  }}
                  disabled={options.length <= 2}
                />
              </div>
            ))}
          </Radio.Group>
        </div>

        <Form.Item
          name="hint"
          label="Hint (optional)"
          tooltip="Shown when the student clicks 'Show hint' — should nudge, not give away the answer."
        >
          <Input.TextArea rows={2} placeholder="A nudge in the right direction." />
        </Form.Item>

        <Form.Item
          name="explanation"
          label="Explanation"
          tooltip="Shown after submission, regardless of correctness. Reinforces the concept."
          rules={[{ required: true, message: 'Explanation is required' }]}
        >
          <Input.TextArea rows={3} placeholder="Why this answer is correct." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Assignment editor drawer
// ─────────────────────────────────────────────────────────────────────────

interface AssignmentEditorDrawerProps {
  open: boolean;
  weekNumber: number;
  initial: ResearchAssignment | null;
  onClose: () => void;
  onSave: (a: ResearchAssignment) => Promise<void> | void;
}

export const AssignmentEditorDrawer: React.FC<AssignmentEditorDrawerProps> = ({
  open,
  weekNumber,
  initial,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        title: initial?.title ?? '',
        instructionsMd: initial?.instructionsMd ?? '',
        acceptedFileTypes: initial?.acceptedFileTypes ?? ['pdf', 'docx'],
        maxFileSizeMb: initial?.maxFileSizeMb ?? 5,
        allowText: initial?.allowText ?? true,
      });
    }
  }, [open, initial, form]);

  const handleSubmit = async () => {
    const v = await form.validateFields().catch(() => null);
    if (!v) return;
    setSubmitting(true);
    try {
      const assignment: ResearchAssignment = {
        id: initial?.id ?? `w${weekNumber}-assignment`,
        title: v.title.trim(),
        instructionsMd: v.instructionsMd.trim(),
        acceptedFileTypes: v.acceptedFileTypes,
        maxFileSizeMb: v.maxFileSizeMb,
        allowText: v.allowText,
      };
      await onSave(assignment);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Week ${weekNumber} assignment`}
      width={560}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
            style={{ background: '#8b0000', borderColor: '#8b0000' }}
          >
            Save
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="title"
          label="Assignment title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input placeholder="e.g. Draft your niche statement" />
        </Form.Item>
        <Form.Item
          name="instructionsMd"
          label="Instructions"
          tooltip="Markdown supported. Bullet lists render correctly in the student card."
          rules={[{ required: true, message: 'Instructions are required' }]}
        >
          <Input.TextArea rows={8} placeholder="Tell the student what to submit and how to format it." />
        </Form.Item>

        <Form.Item
          name="acceptedFileTypes"
          label="Accepted file types"
          rules={[{ required: true, message: 'Select at least one file type' }]}
        >
          <Select mode="multiple" options={FILE_TYPE_OPTIONS} />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item name="maxFileSizeMb" label="Max file size (MB)" rules={[{ required: true }]}>
            <InputNumber min={1} max={500} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="allowText" label="Allow text body" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>

        <div
          style={{
            padding: 10,
            background: '#fdecec',
            border: '1px solid rgba(139,0,0,0.18)',
            borderRadius: 8,
            color: '#7c1f1f',
            fontSize: 12.5,
            marginTop: 8,
          }}
        >
          <strong>Routing:</strong> Submissions from Full Support students go to their assigned
          teacher's grader inbox. Submissions from non-Full-Support students stay as{' '}
          <Tag color="blue">submitted</Tag> and the student gets a "Book a mentor review" CTA.
        </div>
      </Form>
    </Drawer>
  );
};
