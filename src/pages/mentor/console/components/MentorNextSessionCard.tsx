import { useState } from 'react';
import dayjs from 'dayjs';
import { Dropdown, Input, Modal, message } from 'antd';
import { ArrowRight, MessageCircle, MoreVertical } from 'lucide-react';
import { GoogleMeetingSvg } from 'src/assets/svg';
import { useCancelSessionMutation } from 'src/app/services/sessions';
import type { MentorBooking } from '../sessionSources';
import './MentorNextSessionCard.scss';

/**
 * Editorial session card for the mentor console (dashboard "Next up" + the
 * Sessions page upcoming list) — mirrors the student My-Progress session card
 * style. Join opens the meeting link; Chat opens the global chat modal; the
 * ⋮ menu cancels an upcoming platform booking.
 */
export default function MentorNextSessionCard({ booking }: { booking: MentorBooking }) {
  const date = dayjs(booking.dateTime);
  const cancellable = booking.source === 'platform' && booking.status === 'upcoming';
  const sessionId = (booking.raw as { id?: string }).id ?? '';

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelSession, { isLoading: cancelling }] = useCancelSessionMutation();

  const join = () => {
    if (booking.joinUrl) window.open(booking.joinUrl, '_blank', 'noopener,noreferrer');
  };
  const openChat = () => window.dispatchEvent(new CustomEvent('openChat', { detail: {} }));

  const doCancel = async () => {
    try {
      await cancelSession({ id: sessionId, reason: reason.trim() || 'Cancelled by mentor' }).unwrap();
      message.success('Session cancelled');
      setCancelOpen(false);
      setReason('');
    } catch {
      message.error('Could not cancel the session');
    }
  };

  return (
    <div className="mc-nsc">
      {booking.status === 'upcoming' && (
        <div className="mc-nsc-top">
          <span className="mc-nsc-meet" aria-hidden>
            <GoogleMeetingSvg />
          </span>
          {booking.joinUrl ? (
            <button type="button" className="mc-nsc-join" onClick={join}>
              Join the session <ArrowRight size={11} />
            </button>
          ) : (
            <span className="mc-nsc-join mc-nsc-join--idle">Pending link</span>
          )}
          <span className="mc-nsc-live" aria-hidden />
          {cancellable && (
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{
                items: [
                  {
                    key: 'cancel',
                    label: <span style={{ color: 'var(--mc-danger)' }}>Cancel session</span>,
                    onClick: () => setCancelOpen(true),
                  },
                ],
              }}
            >
              <button type="button" className="mc-nsc-more" aria-label="Session options">
                <MoreVertical size={16} />
              </button>
            </Dropdown>
          )}
        </div>
      )}

      <div className="mc-nsc-date">{date.format('MMMM Do, YYYY')}</div>
      <div className="mc-nsc-time">
        {date.format('h:mm A')}
        {booking.status === 'completed' && ' · Completed'}
        {booking.status === 'cancelled' && ' · Cancelled'}
      </div>
      <div className="mc-nsc-with">
        {booking.durationLabel} meeting with{' '}
        <span className="mc-nsc-name">{booking.studentName || 'your student'}</span>
      </div>

      {booking.status !== 'cancelled' && (
        <button type="button" className="mc-nsc-chat" onClick={openChat}>
          <MessageCircle size={15} /> Chat with mentee
        </button>
      )}

      <Modal
        title="Cancel this session?"
        open={cancelOpen}
        onCancel={() => setCancelOpen(false)}
        onOk={doCancel}
        okText="Cancel session"
        okButtonProps={{ danger: true }}
        cancelText="Keep it"
        confirmLoading={cancelling}
      >
        <p style={{ marginTop: 0, color: 'var(--mc-text-secondary)' }}>
          The student will be notified. Let them know why (optional):
        </p>
        <Input.TextArea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Something came up — let's reschedule."
          maxLength={300}
        />
      </Modal>
    </div>
  );
}
