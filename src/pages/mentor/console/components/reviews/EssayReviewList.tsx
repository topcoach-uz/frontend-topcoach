import { useState } from 'react';
import { Alert, Button, Empty, Input, message, Segmented, Spin } from 'antd';
import { BookOpen, CheckCircle2, GraduationCap, Send } from 'lucide-react';
import './EssayReviewList.scss';
import {
  useGetMentorEssayReviewsQuery,
  useSendMentorEssayFeedbackMutation,
  useStartMentorEssayReviewMutation,
  type EssayReviewRequest,
} from 'src/app/services/student-hub/essayReviewApi';

export type EssayReviewListProps = {
  /** Only show requests from this student (user id). */
  studentUserId?: string;
  /** Compact layout for use inside a student workspace tab. */
  embedded?: boolean;
};

type Filter = 'Pending' | 'In review' | 'Completed';
const FILTERS: Filter[] = ['Pending', 'In review', 'Completed'];

const STATUS_LABEL: Record<string, { label: string; tone: 'pending' | 'progress' | 'done' }> = {
  pending: { label: 'Pending', tone: 'pending' },
  in_review: { label: 'In review', tone: 'progress' },
  feedback_ready: { label: 'Feedback sent', tone: 'done' },
};

function matchesFilter(request: EssayReviewRequest, filter: Filter) {
  return filter === 'Pending' ? request.status === 'pending'
    : filter === 'In review' ? request.status === 'in_review'
      : request.status === 'feedback_ready';
}

function initials(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    // The surrounding copy is English, so the date is too (not the browser locale).
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function EssayReviewList({ studentUserId, embedded = false }: EssayReviewListProps) {
  const { data: allRequests = [], isLoading, isError, refetch } = useGetMentorEssayReviewsQuery(undefined, { pollingInterval: 30000 });
  const requests = studentUserId ? allRequests.filter((request) => request.studentUserId === studentUserId) : allRequests;
  const [sendFeedback, sendState] = useSendMentorEssayFeedbackMutation();
  const [startReview, startState] = useStartMentorEssayReviewMutation();
  const [filter, setFilter] = useState<Filter>('Pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const visible = requests.filter((request) => matchesFilter(request, filter));
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

  const markInReview = async (request: EssayReviewRequest) => {
    try {
      await startReview(request.id).unwrap();
      setFilter('In review');
      message.success('Review started.');
    } catch {
      message.error('Could not start this review.');
    }
  };

  return (
    <div className="mc-essay-reviews">
      {!embedded && (
        <p className="mc-essay-reviews__lead">
          Review the saved version each student sent you. Feedback appears in their writing workspace.
        </p>
      )}
      <Segmented
        className="mc-essay-reviews__filter"
        value={filter}
        onChange={(value) => { setFilter(value as Filter); setSelectedId(null); }}
        options={FILTERS.map((value) => {
          const count = requests.filter((request) => matchesFilter(request, value)).length;
          return { value, label: count ? `${value} (${count})` : value };
        })}
      />
      {isLoading && <Spin />}
      {isError && <Alert type="error" showIcon message="Could not load essay reviews" action={<Button onClick={() => void refetch()}>Retry</Button>} />}
      {!isLoading && !isError && visible.length === 0 && <Empty description={`No ${filter.toLowerCase()} essay reviews.`} />}

      <div className="mc-essay-reviews__list">
        {visible.map((request) => {
          const open = selectedId === request.id || (filter === 'Completed' && request.status === 'feedback_ready');
          const status = STATUS_LABEL[request.status] ?? STATUS_LABEL.pending;
          const title = request.snapshotTitle || 'Untitled essay';
          return (
            <article
              key={request.id}
              className={`mc-essay-review${open ? ' is-open' : ''}`}
              aria-labelledby={`essay-review-title-${request.id}`}
            >
              <header className="mc-essay-review__head">
                <div className="mc-essay-review__heading">
                  {!studentUserId && (
                    <span className="mc-essay-review__student">
                      <span className="mc-essay-review__avatar" aria-hidden>{initials(request.studentName)}</span>
                      {request.studentName}
                    </span>
                  )}
                  <h3 id={`essay-review-title-${request.id}`}>{title}</h3>
                </div>
                <span className={`mc-essay-review__status mc-essay-review__status--${status.tone}`}>{status.label}</span>
              </header>

              <div className="mc-essay-review__meta">
                <span className={`mc-essay-target${request.universityName ? '' : ' mc-essay-target--none'}`}>
                  {request.universityName ? (
                    <>
                      <GraduationCap size={14} aria-hidden />
                      <span>
                        For <strong>{request.universityName}</strong>
                        {request.major ? ` · ${request.major}` : ''}
                      </span>
                    </>
                  ) : (
                    <span>Not linked to a university application</span>
                  )}
                </span>
                <span className="mc-essay-review__facts">
                  Version {request.snapshotVersion} · {request.snapshotWordCount} {request.snapshotWordCount === 1 ? 'word' : 'words'} · Sent {formatDate(request.createdAt)}
                </span>
              </div>

              {request.studentNote && (
                <blockquote className="mc-essay-review__note">
                  <span>Student note</span>
                  {request.studentNote}
                </blockquote>
              )}

              {!open ? (
                <div className="mc-essay-review__actions">
                  <Button
                    type="primary"
                    icon={<BookOpen size={15} aria-hidden />}
                    onClick={() => { setSelectedId(request.id); setFeedback(''); }}
                  >
                    Read saved version
                  </Button>
                  {request.status === 'pending' && (
                    <Button loading={startState.isLoading} onClick={() => void markInReview(request)}>
                      Mark in review
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {request.snapshotPrompt && (
                    <div className="mc-essay-review__prompt">
                      <span>Prompt</span>
                      <p>{request.snapshotPrompt}</p>
                    </div>
                  )}
                  {/* Scrolls on its own so a long essay never pushes the feedback box off-screen. */}
                  <div className="mc-essay-review__paper" tabIndex={0} aria-label={`Saved version of ${title}`}>
                    {request.snapshotContent?.trim() ? request.snapshotContent : <em>This saved version is empty.</em>}
                  </div>

                  {request.status === 'feedback_ready' ? (
                    <section className="mc-essay-review__sent">
                      <header><CheckCircle2 size={16} aria-hidden /> Feedback sent</header>
                      <p>{request.feedback}</p>
                    </section>
                  ) : (
                    <section className="mc-essay-review__composer">
                      <div className="mc-essay-review__composer-head">
                        <label htmlFor={`mentor-feedback-${request.id}`}>Your feedback</label>
                        {request.status === 'pending' && (
                          <Button size="small" loading={startState.isLoading} onClick={() => void markInReview(request)}>
                            Mark in review
                          </Button>
                        )}
                      </div>
                      <Input.TextArea
                        id={`mentor-feedback-${request.id}`}
                        autoSize={{ minRows: 6, maxRows: 16 }}
                        maxLength={10000}
                        showCount
                        value={feedback}
                        onChange={(event) => setFeedback(event.target.value)}
                        placeholder="Give specific, constructive comments on this saved version…"
                      />
                      <div className="mc-essay-review__composer-actions">
                        <Button onClick={() => setSelectedId(null)}>Close</Button>
                        <Button
                          type="primary"
                          icon={<Send size={15} aria-hidden />}
                          onClick={() => void submit()}
                          loading={sendState.isLoading}
                          disabled={!feedback.trim()}
                        >
                          Send feedback
                        </Button>
                      </div>
                    </section>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
