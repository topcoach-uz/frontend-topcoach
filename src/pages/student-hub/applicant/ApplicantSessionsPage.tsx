import { useState } from "react";
import { Input, Modal, Rate, message } from "antd";
import { ArrowRight } from "lucide-react";
import { useGetMySessionsQuery, useRateSessionMutation } from "src/app/services/sessions";
import { useTypedSelector } from "src/app/store";
import { ApplicantPage, QueryState } from "./ApplicantPage";
import { safeMeetingLink } from "./applicantOverviewModel";
import {
  isCancelled,
  mentorName,
  pickSummaryFields,
  sessionDurationMinutes,
  splitSessions,
  studentReview,
  unwrapSessions,
  type StudentSessionRow,
} from "./studentSessionsModel";

const formatWhen = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function ApplicantSessionsPage() {
  const userId = useTypedSelector((s) => s.auth.profile?.id);
  const query = useGetMySessionsQuery(undefined, { refetchOnMountOrArgChange: true });
  const [rateSession, rateState] = useRateSessionMutation();
  const [rating, setRating] = useState<StudentSessionRow | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  // Fallback if the response does not expose reviewers: hide the button once rated here.
  const [ratedNow, setRatedNow] = useState<Record<string, number>>({});

  const sessions = unwrapSessions(query.data);
  const { upcoming, past } = splitSessions(sessions);

  const close = () => {
    setRating(null);
    setStars(0);
    setComment("");
  };
  const submit = async () => {
    if (!rating || stars < 1) return;
    try {
      await rateSession({ id: rating.id, rating: stars, comment: comment.trim() }).unwrap();
      setRatedNow((s) => ({ ...s, [rating.id]: stars }));
      message.success("Thanks for your feedback");
      close();
    } catch (error) {
      const text = String((error as { data?: { message?: string } })?.data?.message ?? "");
      if (/already rated/i.test(text)) {
        setRatedNow((s) => ({ ...s, [rating.id]: stars }));
        message.info("You've already rated this session.");
        close();
      } else {
        message.error(text || "We couldn't save your rating. Please try again.");
      }
    }
  };

  return (
    <ApplicantPage title="My sessions" subtitle="Your 1:1 sessions with mentors.">
      <QueryState loading={query.isLoading} error={query.isError} retry={query.refetch}>
        <section className="applicant-panel applicant-sessions" aria-labelledby="sessions-upcoming">
          <h2 id="sessions-upcoming">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="applicant-muted">No upcoming sessions.</p>
          ) : (
            upcoming.map((s) => {
              const link = safeMeetingLink(s.calendarInfo?.meetingLink);
              return (
                <article key={s.id} className="applicant-sessions__card">
                  <h3>Session with {mentorName(s)}</h3>
                  <time dateTime={s.date}>{formatWhen(s.date)}</time>
                  <small className="applicant-muted">{sessionDurationMinutes(s)} min</small>
                  {s.note && <p className="applicant-muted">Your note: {s.note}</p>}
                  {link && (
                    <a className="applicant-button applicant-button--secondary" href={link} target="_blank" rel="noreferrer">
                      Join session
                      <span className="applicant-sr-only"> (opens in a new tab)</span>
                      <ArrowRight size={16} aria-hidden />
                    </a>
                  )}
                </article>
              );
            })
          )}
        </section>

        <section className="applicant-panel applicant-sessions" aria-labelledby="sessions-past">
          <h2 id="sessions-past">Past</h2>
          {past.length === 0 ? (
            <p className="applicant-muted">Your completed sessions will appear here.</p>
          ) : (
            past.map((s) => {
              const cancelled = isCancelled(s);
              const review = studentReview(s, userId);
              const given = review?.rating ?? ratedNow[s.id];
              const summary = pickSummaryFields(s);
              return (
                <article key={s.id} className={`applicant-sessions__card${cancelled ? " is-cancelled" : ""}`}>
                  <h3>
                    Session with {mentorName(s)}
                    {cancelled && <span className="applicant-muted"> · Cancelled</span>}
                  </h3>
                  <time dateTime={s.date}>{formatWhen(s.date)}</time>
                  {!cancelled && (
                    <div className="applicant-sessions__summary">
                      <strong>Session summary</strong>
                      {summary ? (
                        <>
                          {summary.topicsCovered && (
                            <p><span className="applicant-muted">Topics covered:</span> {summary.topicsCovered}</p>
                          )}
                          {summary.homework && (
                            <p><span className="applicant-muted">Homework:</span> {summary.homework}</p>
                          )}
                        </>
                      ) : (
                        <p className="applicant-muted">Your mentor hasn't added a summary yet.</p>
                      )}
                    </div>
                  )}
                  {!cancelled &&
                    (given ? (
                      <p className="applicant-muted">You rated {given}/5</p>
                    ) : (
                      <button
                        type="button"
                        className="applicant-button applicant-button--secondary"
                        onClick={() => setRating(s)}
                      >
                        Rate your mentor
                      </button>
                    ))}
                </article>
              );
            })
          )}
        </section>
      </QueryState>

      <Modal
        open={Boolean(rating)}
        title={rating ? `Rate your session with ${mentorName(rating)}` : "Rate your session"}
        okText="Submit rating"
        okButtonProps={{ disabled: stars < 1 }}
        confirmLoading={rateState.isLoading}
        onOk={submit}
        onCancel={close}
        destroyOnClose
      >
        <Rate value={stars} onChange={setStars} aria-label="Rating out of 5" />
        <Input.TextArea
          style={{ marginTop: 16 }}
          rows={3}
          maxLength={500}
          placeholder="Anything you'd like to share? (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Modal>
    </ApplicantPage>
  );
}
