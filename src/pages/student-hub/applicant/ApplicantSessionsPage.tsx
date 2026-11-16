import { useState } from "react";
import { Input, Modal, Rate, message } from "antd";
import { ArrowRight } from "lucide-react";
import { useGetMySessionsQuery, useRateSessionMutation } from "src/app/services/sessions";
import { useTypedSelector } from "src/app/store";
import { ApplicantPage, QueryState } from "./ApplicantPage";
import { safeMeetingLink } from "./applicantOverviewModel";
import {
  initials,
  isCancelled,
  mentorAvatar,
  mentorName,
  mentorTitle,
  pickSummaryFields,
  sessionDurationMinutes,
  splitSessions,
  studentReview,
  unwrapSessions,
  type StudentSessionRow,
} from "./studentSessionsModel";

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const formatWhen = (value: string, minutes?: number) => {
  const d = new Date(value);
  return [`${dateFmt.format(d)} · ${timeFmt.format(d)}`, minutes ? `${minutes} min` : null].filter(Boolean).join(" · ");
};

function Who({ s, userId, suffix }: { s: StudentSessionRow; userId?: string | null; suffix?: string }) {
  const title = mentorTitle(s, userId);
  const avatar = mentorAvatar(s, userId);
  return (
    <div className="applicant-sessions__who">
      <span className="applicant-sessions__avatar" aria-hidden>
        {avatar ? <img src={avatar} alt="" loading="lazy" /> : initials(title === "Mentor session" ? "" : title)}
      </span>
      <div className="applicant-sessions__meta">
        <h3>
          {title}
          {suffix && <span className="applicant-muted"> · {suffix}</span>}
        </h3>
        <time dateTime={s.date}>{formatWhen(s.date, sessionDurationMinutes(s))}</time>
      </div>
    </div>
  );
}

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
                <article key={s.id} className="applicant-sessions__row">
                  <Who s={s} userId={userId} />
                  {s.note && <p className="applicant-sessions__lines applicant-muted">Your note: {s.note}</p>}
                  {link && (
                    <a className="applicant-sessions__action applicant-button applicant-button--secondary" href={link} target="_blank" rel="noreferrer">
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
                <article key={s.id} className={`applicant-sessions__row${cancelled ? " is-cancelled" : ""}`}>
                  <Who s={s} userId={userId} suffix={cancelled ? "Cancelled" : undefined} />
                  {!cancelled && (
                    <div className="applicant-sessions__lines">
                      {summary ? (
                        <>
                          {summary.topicsCovered && <p><span className="applicant-muted">Topics:</span> {summary.topicsCovered}</p>}
                          {summary.homework && <p><span className="applicant-muted">Homework:</span> {summary.homework}</p>}
                        </>
                      ) : (
                        <p className="applicant-muted">No summary yet</p>
                      )}
                    </div>
                  )}
                  {!cancelled && (
                    <div className="applicant-sessions__rating">
                      {given ? (
                        <Rate disabled value={given} className="applicant-sessions__stars" aria-label={`Rated ${given} of 5`} />
                      ) : (
                        <button type="button" className="applicant-sessions__rate" onClick={() => setRating(s)}>
                          Rate
                          <span className="applicant-sr-only"> your session with {mentorName(s, userId)}</span>
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </QueryState>

      <Modal
        open={Boolean(rating)}
        title={rating ? `Rate your session with ${mentorName(rating, userId)}` : "Rate your session"}
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
