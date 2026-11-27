import { SessionRecording } from "src/components/session-recording/SessionRecording";
import { useState } from "react";
import { Button, Input, Modal, Rate, message } from "antd";
import { ArrowUpRight, MessageCircle, MessageSquare, Star } from "lucide-react";
import { useGetMySessionsQuery, useRateSessionMutation } from "src/app/services/sessions";
import { useGetMenteeSessionsQuery, type SessionLogDto } from "src/app/services/fullSupportApi";
import { useFindOrCreateConversationMutation } from "src/app/services/chat/chatApi";
import { lessonMinutes, lessonOutcome } from "src/pages/mentor/console/fullSupportLessons";
import { useTypedSelector } from "src/app/store";
import ChatModal from "src/components/chat/ChatModal";
import { GoogleMeetingSvg } from "src/assets/svg";
import { ApplicantPage, QueryState } from "./ApplicantPage";
import YourMentors from "./YourMentors";
import { safeMeetingLink } from "./applicantOverviewModel";
import {
  initials,
  isCancelled,
  mentorAvatar,
  mentorName,
  mentorTitle,
  pickSummaryFields,
  LESSON_OUTCOME_LABELS,
  sessionDurationMinutes,
  splitLessons,
  splitSessions,
  studentReview,
  unwrapSessions,
  type StudentSessionRow,
} from "./studentSessionsModel";
import "./studentSessionCards.scss";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TZ = "Asia/Tashkent";
const fmt = (value: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...options }).format(value);
const dayKey = (value: Date) => fmt(value, { year: "numeric", month: "2-digit", day: "2-digit" });

type Pill = { label: string; tone: "accent" | "warning" | "info" | "success" | "danger" | "neutral" };

/** One card shape for 1:1 bookings and mentor-scheduled lessons. */
type CardModel = {
  key: string;
  start: Date;
  minutes: number;
  mentor: string;
  mentorId: string | null;
  avatar: string | null;
  kind: string;
  topic: string | null;
  link: string | null;
  pill: Pill;
  tone: "live" | "muted" | "plain";
  note?: string | null;
  notes?: { label: string; text: string }[];
  booking?: StudentSessionRow;
};

function upcomingPill(start: Date): Pill {
  const now = new Date();
  if (dayKey(start) === dayKey(now)) return { label: "Today", tone: "accent" };
  if (start.getTime() - now.getTime() < WEEK_MS) return { label: "This week", tone: "warning" };
  return { label: "Upcoming", tone: "info" };
}

function fromBooking(s: StudentSessionRow, upcoming: boolean, viewerId?: string | null): CardModel {
  const start = new Date(s.date);
  const cancelled = isCancelled(s);
  const summary = pickSummaryFields(s);
  return {
    key: `booking-${s.id}`,
    start,
    minutes: sessionDurationMinutes(s),
    mentor: mentorTitle(s, viewerId),
    mentorId: s.mentor?.id ?? null,
    avatar: mentorAvatar(s, viewerId),
    kind: "1:1 session",
    topic: null,
    link: upcoming ? safeMeetingLink(s.calendarInfo?.meetingLink) : null,
    pill: upcoming ? upcomingPill(start) : cancelled ? { label: "Cancelled", tone: "neutral" } : { label: "Completed", tone: "success" },
    tone: upcoming ? "live" : cancelled ? "muted" : "plain",
    note: s.note,
    notes: summary
      ? [
          ...(summary.topicsCovered ? [{ label: "Topics covered", text: summary.topicsCovered }] : []),
          ...(summary.homework ? [{ label: "Homework", text: summary.homework }] : []),
        ]
      : undefined,
    booking: s,
  };
}

function fromLesson(l: SessionLogDto, upcoming: boolean): CardModel {
  const start = new Date(l.dateTime);
  const outcome = lessonOutcome(l);
  const pill: Pill = upcoming
    ? upcomingPill(start)
    : outcome === "held"
      ? { label: "Completed", tone: "success" }
      : outcome === "cancelled"
        ? { label: "Cancelled", tone: "neutral" }
        : outcome === "scheduled"
          ? { label: "Awaiting record", tone: "warning" }
          : { label: LESSON_OUTCOME_LABELS[outcome], tone: "danger" };
  return {
    key: `lesson-${l.id}`,
    start,
    minutes: lessonMinutes(l.duration),
    mentor: l.mentorName || "Mentor session",
    mentorId: l.mentorUserId ?? null,
    avatar: null,
    kind: "Full Support",
    topic: l.description?.trim() || null,
    link: upcoming ? safeMeetingLink(l.meetingLink) : null,
    pill,
    tone: upcoming ? "live" : outcome === "held" ? "plain" : "muted",
    notes: !upcoming && outcome === "held" && l.sharedNotes?.trim() ? [{ label: "Lesson notes", text: l.sharedNotes.trim() }] : undefined,
  };
}

function SessionCard({
  card,
  upcoming,
  onChat,
  chatting,
  rating,
}: {
  card: CardModel;
  upcoming: boolean;
  onChat?: () => void;
  chatting?: boolean;
  rating?: React.ReactNode;
}) {
  const end = new Date(card.start.getTime() + card.minutes * 60_000);
  const time = (value: Date) => fmt(value, { hour: "numeric", minute: "2-digit", hour12: true });
  return (
    <article className={`st-scard st-scard--${card.tone}`}>
      <div className="st-scard-top">
        <div className="st-scard-date" aria-hidden>
          <span className="st-scard-day">{fmt(card.start, { day: "numeric" })}</span>
          <span className="st-scard-month">{fmt(card.start, { month: "short" })}</span>
        </div>
        <span className={`st-pill st-pill--${card.pill.tone}`}>{card.pill.label}</span>
      </div>

      <div className="st-scard-who">
        <span className="st-scard-avatar" aria-hidden>
          {card.avatar ? <img src={card.avatar} alt="" loading="lazy" /> : initials(card.mentor === "Mentor session" ? "" : card.mentor)}
        </span>
        <h3 className="st-scard-name">{card.mentor}</h3>
      </div>
      <time className="st-scard-when" dateTime={card.start.toISOString()}>
        {fmt(card.start, { weekday: "short" })} · {time(card.start)} – {time(end)} · {card.minutes} min
      </time>
      <SessionRecording source={card.booking ? "platform" : "full-support"} sessionId={card.booking?.id || card.key.replace(/^lesson-/, "")} />
      <div className="st-scard-meta">
        {card.kind}
        {card.topic ? ` · ${card.topic}` : ""}
      </div>

      {card.note ? (
        <div className="st-scard-note">
          <MessageSquare size={12} aria-hidden />
          <span>
            <b>Your note:</b> {card.note}
          </span>
        </div>
      ) : null}

      {card.notes?.length ? (
        <div className="st-scard-summary">
          {card.notes.map((item) => (
            <p key={item.label}>
              <b>{item.label}:</b> {item.text}
            </p>
          ))}
        </div>
      ) : !upcoming && card.tone === "plain" ? (
        <div className="st-scard-summary is-empty">Your mentor hasn’t added notes yet.</div>
      ) : null}

      {upcoming && card.link ? (
        <a className="st-scard-meet" href={card.link} target="_blank" rel="noreferrer">
          <GoogleMeetingSvg />
          <span className="st-scard-meet-link">
            Join Google Meet <ArrowUpRight size={13} aria-hidden />
          </span>
          <span className="st-scard-live-dot" aria-hidden />
          <span className="applicant-sr-only"> (opens in a new tab)</span>
        </a>
      ) : upcoming ? (
        <div className="st-scard-meta st-scard-meta--hint">Your mentor will add the meeting link.</div>
      ) : null}

      {(onChat || rating) && (
        <div className="st-scard-actions">
          {rating}
          {onChat && (
            <Button size="small" icon={<MessageCircle size={13} aria-hidden />} loading={chatting} onClick={onChat}>
              Chat
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

export default function ApplicantSessionsPage() {
  const me = useTypedSelector((s) => s.auth.profile);
  const userId = me?.id;
  const query = useGetMySessionsQuery(undefined, { refetchOnMountOrArgChange: true });
  const [rateSession, rateState] = useRateSessionMutation();
  const [rating, setRating] = useState<StudentSessionRow | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  // Fallback if the response does not expose reviewers: hide the button once rated here.
  const [ratedNow, setRatedNow] = useState<Record<string, number>>({});
  const [findConversation] = useFindOrCreateConversationMutation();
  const [chatFor, setChatFor] = useState<string | null>(null);
  const [conversation, setConversation] = useState<string | null>(null);

  // Lessons a mentor scheduled (Full Support / programs) live in a separate
  // list from 1:1 bookings; show both.
  const lessonsQuery = useGetMenteeSessionsQuery(undefined, { refetchOnMountOrArgChange: true, pollingInterval: 60000 });
  const { upcoming, past } = splitSessions(unwrapSessions(query.data));
  const lessons = splitLessons(lessonsQuery.data?.data.sessions ?? []);
  const upcomingCards = [...upcoming.map((s) => fromBooking(s, true, userId)), ...lessons.upcoming.map((l) => fromLesson(l, true))].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const pastCards = [...past.map((s) => fromBooking(s, false, userId)), ...lessons.past.map((l) => fromLesson(l, false))].sort(
    (a, b) => b.start.getTime() - a.start.getTime(),
  );

  const openChat = async (card: CardModel) => {
    if (!userId || !card.mentorId) return;
    setChatFor(card.key);
    try {
      const result = await findConversation({ mentorId: card.mentorId, studentId: userId }).unwrap();
      if (result.conversation?.id) setConversation(result.conversation.id);
    } catch {
      message.error("Could not open the chat. Please try again.");
    } finally {
      setChatFor(null);
    }
  };

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

  const ratingControl = (card: CardModel) => {
    const s = card.booking;
    if (!s || isCancelled(s)) return null;
    const given = studentReview(s, userId)?.rating ?? ratedNow[s.id];
    return given ? (
      <span className="st-scard-rated">
        <Star size={13} aria-hidden /> You rated {given}/5
      </span>
    ) : (
      <Button size="small" type="primary" onClick={() => setRating(s)}>
        Rate your mentor
      </Button>
    );
  };

  const grid = (cards: CardModel[], isUpcoming: boolean) => (
    <div className="st-sched-grid">
      {cards.map((card) => (
        <SessionCard
          key={card.key}
          card={card}
          upcoming={isUpcoming}
          onChat={card.mentorId && card.tone !== "muted" ? () => void openChat(card) : undefined}
          chatting={chatFor === card.key}
          rating={isUpcoming ? undefined : ratingControl(card)}
        />
      ))}
    </div>
  );

  return (
    <ApplicantPage title="My sessions" subtitle="Your lessons and 1:1 sessions with mentors.">
      <QueryState loading={query.isLoading || lessonsQuery.isLoading} error={query.isError} retry={query.refetch}>
        <YourMentors />
        <section className="st-sessions" aria-labelledby="sessions-upcoming">
          <h2 id="sessions-upcoming">
            Upcoming <span className="st-count">{upcomingCards.length}</span>
          </h2>
          {upcomingCards.length === 0 ? (
            <p className="st-empty">No upcoming sessions. When your mentor schedules a lesson, it appears here.</p>
          ) : (
            grid(upcomingCards, true)
          )}
        </section>

        <section className="st-sessions" aria-labelledby="sessions-past">
          <h2 id="sessions-past">
            Past <span className="st-count">{pastCards.length}</span>
          </h2>
          {pastCards.length === 0 ? <p className="st-empty">Your completed sessions will appear here.</p> : grid(pastCards, false)}
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
      {conversation && (
        <ChatModal
          conversationId={conversation}
          open
          onClose={() => setConversation(null)}
          openToGeneralConversation
          onConversationChange={setConversation}
        />
      )}
    </ApplicantPage>
  );
}
