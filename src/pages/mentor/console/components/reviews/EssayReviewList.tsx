import { useState } from 'react';
import { Alert, Button, Card, Empty, Input, message, Segmented, Spin, Typography } from 'antd';
import {
  useGetMentorEssayReviewsQuery,
  useSendMentorEssayFeedbackMutation,
  useStartMentorEssayReviewMutation,
  type EssayReviewRequest,
} from 'src/app/services/student-hub/essayReviewApi';

const { Text, Paragraph } = Typography;

export type EssayReviewListProps = {
  /** Only show requests from this student (user id). */
  studentUserId?: string;
  /** Compact layout for use inside a student workspace tab. */
  embedded?: boolean;
};

export function EssayReviewList({ studentUserId, embedded = false }: EssayReviewListProps) {
  const { data: allRequests = [], isLoading, isError, refetch } = useGetMentorEssayReviewsQuery(undefined, { pollingInterval: 30000 });
  const requests = studentUserId ? allRequests.filter((request) => request.studentUserId === studentUserId) : allRequests;
  const [sendFeedback, sendState] = useSendMentorEssayFeedbackMutation();
  const [startReview, startState] = useStartMentorEssayReviewMutation();
  const [filter, setFilter] = useState<'Pending' | 'In review' | 'Completed'>('Pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const visible = requests.filter((request) =>
    filter === 'Pending' ? request.status === 'pending'
      : filter === 'In review' ? request.status === 'in_review'
        : request.status === 'feedback_ready',
  );
  const selected: EssayReviewRequest | undefined = requests.find((request) => request.id === selectedId);

  const submit = async () => {
    if (!selected || !feedback.trim()) return;
    try {
      await sendFeedback({ requestId: selected.id, feedback: feedback.trim() }).unwrap();
      message.success('Feedback sent to the student.');
      setSelectedId(null);
      setFeedback('');
    } catch {
      message.error('Could not send feedback. Your text remains here.');
    }
  };

  return (
    <div>
      {!embedded && <Paragraph type="secondary">Review the saved version each student sent you. Feedback appears in their writing workspace.</Paragraph>}
      <Segmented
        value={filter}
        onChange={(value) => { setFilter(value as typeof filter); setSelectedId(null); }}
        options={['Pending', 'In review', 'Completed']}
        style={{ marginBottom: 24 }}
      />
      {isLoading && <Spin />}
      {isError && <Alert type="error" showIcon message="Could not load essay reviews" action={<Button onClick={() => void refetch()}>Retry</Button>} />}
      {!isLoading && !isError && visible.length === 0 && <Empty description={`No ${filter.toLowerCase()} essay reviews.`} />}
      <div style={{ display: 'grid', gap: 16 }}>
        {visible.map((request) => (
          <Card key={request.id} title={request.snapshotTitle} extra={studentUserId ? undefined : <Text type="secondary">{request.studentName}</Text>}>
            <Paragraph type="secondary">
              Version {request.snapshotVersion} · {request.snapshotWordCount} words · Sent {new Date(request.createdAt).toLocaleDateString()}
            </Paragraph>
            {request.studentNote && <Paragraph><strong>Student note:</strong> {request.studentNote}</Paragraph>}
            {selectedId === request.id || (filter === 'Completed' && request.status === 'feedback_ready') ? <>
              {request.snapshotPrompt && <Paragraph><strong>Prompt:</strong> {request.snapshotPrompt}</Paragraph>}
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, background: '#faf8f7', padding: 24, borderRadius: 12, marginBottom: 20 }}>
                {request.snapshotContent}
              </div>
              {request.status === 'feedback_ready' ? (
                <Alert type="success" message="Feedback sent" description={<span style={{ whiteSpace: 'pre-wrap' }}>{request.feedback}</span>} />
              ) : <>
                {request.status === 'pending' && <Button style={{ marginBottom: 16 }} loading={startState.isLoading} onClick={async () => {
                  try { await startReview(request.id).unwrap(); setFilter('In review'); message.success('Review started.'); }
                  catch { message.error('Could not start this review.'); }
                }}>Mark in review</Button>}
                <label htmlFor={`mentor-feedback-${request.id}`}><strong>Your feedback</strong></label>
                <Input.TextArea
                  id={`mentor-feedback-${request.id}`}
                  rows={8}
                  maxLength={10000}
                  showCount
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="Give specific, constructive comments on this saved version…"
                  style={{ marginTop: 8, marginBottom: 32 }}
                />
                <Button type="primary" onClick={() => void submit()} loading={sendState.isLoading} disabled={!feedback.trim()}>
                  Send feedback
                </Button>
                <Button style={{ marginLeft: 8 }} onClick={() => setSelectedId(null)}>Close</Button>
              </>}
            </> : <Button onClick={() => { setSelectedId(request.id); setFeedback(''); }}>Read saved version</Button>}
          </Card>
        ))}
      </div>
    </div>
  );
}
