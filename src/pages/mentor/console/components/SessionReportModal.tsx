import { useEffect, useState } from 'react';
import { Form, Input, Modal, message } from 'antd';
import { CheckCircle2 } from 'lucide-react';
import { useSubmitSessionReportMutation } from 'src/app/services/sessions';
import type { MentorBooking } from '../sessionSources';
import { formatDateTime } from '../utils';
import './SessionReportModal.scss';

const RATINGS = [
  { value: 'tough', label: 'Tough', emoji: '😣' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'great', label: 'Great', emoji: '🚀' },
] as const;

type Rating = (typeof RATINGS)[number]['value'];

export default function SessionReportModal({
  booking,
  open,
  onClose,
}: {
  booking: MentorBooking | null;
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm<{ topicsCovered: string; notes: string; homework?: string }>();
  const [rating, setRating] = useState<Rating | null>(null);
  const [submit, { isLoading }] = useSubmitSessionReportMutation();

  const existing = booking?.report ?? null;
  const editing = !!existing;

  useEffect(() => {
    if (open && booking) {
      form.setFieldsValue({
        topicsCovered: existing?.topicsCovered ?? '',
        notes: existing?.notes ?? '',
        homework: existing?.homework ?? '',
      });
      setRating((existing?.rating as Rating) ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking]);

  const handleSubmit = async () => {
    if (!booking) return;
    const values = await form.validateFields();
    if (!rating) {
      message.warning('Pick a session rating');
      return;
    }
    const sessionId = (booking.raw as { id: string }).id;
    try {
      await submit({
        id: sessionId,
        topicsCovered: values.topicsCovered,
        notes: values.notes,
        homework: values.homework,
        rating,
      }).unwrap();
      message.success(editing ? 'Report updated' : 'Report submitted');
      onClose();
    } catch {
      message.error('Could not submit report');
    }
  };

  return (
    <Modal
      rootClassName="mc-report-modal"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={editing ? 'Save report' : 'Submit & mark done'}
      cancelText="Cancel"
      confirmLoading={isLoading}
      okButtonProps={{ icon: <CheckCircle2 size={15} /> }}
      title={null}
      width={560}
      destroyOnClose
    >
      <div className="mc-report-eyebrow">Session report</div>
      <h3 className="mc-report-title">{editing ? 'Edit report' : 'Write your report'}</h3>
      {booking && (
        <p className="mc-report-sub">
          Session with {booking.studentName || 'your student'} · {formatDateTime(booking.dateTime)}
          {booking.durationLabel ? ` · ${booking.durationLabel}` : ''}. Required for admin records.
        </p>
      )}

      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="topicsCovered"
          label="Topics covered"
          rules={[{ required: true, message: 'What did you cover?' }]}
        >
          <Input.TextArea rows={2} maxLength={2000} placeholder="e.g. Essay structure, hook writing, intro rewrite…" />
        </Form.Item>
        <Form.Item
          name="notes"
          label="Key takeaways & notes"
          rules={[{ required: true, message: 'Add a few notes on how it went' }]}
        >
          <Input.TextArea rows={3} maxLength={4000} placeholder="What went well? Any breakthroughs or challenges?" />
        </Form.Item>
        <Form.Item name="homework" label="Homework assigned (optional)">
          <Input.TextArea rows={2} maxLength={2000} placeholder="e.g. Rewrite intro paragraph, research 3 college programs…" />
        </Form.Item>

        <div className="mc-report-rating-label">Session rating</div>
        <div className="mc-report-ratings">
          {RATINGS.map((r) => (
            <button
              type="button"
              key={r.value}
              className={`mc-report-rating${rating === r.value ? ' mc-report-rating--on' : ''}`}
              onClick={() => setRating(r.value)}
            >
              <span aria-hidden>{r.emoji}</span> {r.label}
            </button>
          ))}
        </div>
      </Form>
    </Modal>
  );
}
