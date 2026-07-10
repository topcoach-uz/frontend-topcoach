import { useState } from 'react';
import { Button, message } from 'antd';
import { MessageCircle } from 'lucide-react';
import ChatModal from 'src/components/chat/ChatModal';
import { useFindOrCreateConversationMutation } from 'src/app/services/chat/chatApi';

type Variant = 'solid' | 'ghost';

/**
 * "Chat with mentee" — restores the affordance the old editorial session card
 * carried. Resolves (or creates) the mentor↔student conversation lazily on
 * first click, then opens the shared ChatModal to the general conversation
 * (no per-session thread picker — mirrors StudentWorkspace's Message tab).
 *
 * Used from both the featured next-session card and the session rows on the
 * mentor Schedule, so the resolve + modal wiring lives here once.
 */
export default function SessionChatButton({
  mentorId,
  studentId,
  studentName,
  variant = 'ghost',
  block = false,
  compact = false,
}: {
  mentorId: string;
  studentId: string | null | undefined;
  studentName?: string | null;
  variant?: Variant;
  block?: boolean;
  /** Short "Chat" label for tight layouts (grid cards). */
  compact?: boolean;
}) {
  const [findOrCreate, { isLoading }] = useFindOrCreateConversationMutation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (!studentId) return null;

  const label = compact
    ? 'Chat'
    : studentName
      ? `Chat with ${studentName.split(' ')[0]}`
      : 'Chat with mentee';

  const handleClick = async () => {
    // Reuse the resolved conversation on subsequent opens.
    if (conversationId) {
      setOpen(true);
      return;
    }
    try {
      const res = await findOrCreate({ mentorId, studentId }).unwrap();
      const id = res?.conversation?.id ?? null;
      if (!id) {
        message.error('Could not open the conversation.');
        return;
      }
      setConversationId(id);
      setOpen(true);
    } catch {
      message.error('Could not open the conversation.');
    }
  };

  return (
    <>
      <Button
        size="small"
        loading={isLoading}
        onClick={handleClick}
        icon={<MessageCircle size={14} />}
        block={block}
        className={`mc-sched-chat-btn mc-sched-chat-btn--${variant}`}
      >
        {label}
      </Button>
      {conversationId && (
        <ChatModal
          conversationId={conversationId}
          open={open}
          onClose={() => setOpen(false)}
          openToGeneralConversation
          onConversationChange={(id) => setConversationId(id)}
        />
      )}
    </>
  );
}
