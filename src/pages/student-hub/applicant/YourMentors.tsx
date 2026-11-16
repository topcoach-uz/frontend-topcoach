import { useState } from "react";
import { Button, message } from "antd";
import { ArrowUpRight, CalendarClock, CheckSquare, GraduationCap, Languages, MessageCircle, Video } from "lucide-react";
import { useGetMenteeMentorsQuery, type StudentMentor } from "src/app/services/fullSupportApi";
import { useFindOrCreateConversationMutation } from "src/app/services/chat/chatApi";
import { useTypedSelector } from "src/app/store";
import ChatModal from "src/components/chat/ChatModal";
import { hostName } from "src/app/services/api/const";
import { programNames, roleNames } from "src/pages/student-hub/my-programs/programModel";
import type { ProgramKey } from "src/app/services/studentProgramsApi";
import { safeMeetingLink } from "./applicantOverviewModel";
import "./yourMentors.scss";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  eng: "English",
  ru: "Russian",
  rus: "Russian",
  uz: "Uzbek",
  uzb: "Uzbek",
  kk: "Kazakh",
  kaz: "Kazakh",
  de: "German",
  ger: "German",
  tr: "Turkish",
  tur: "Turkish",
  fr: "French",
  ko: "Korean",
  zh: "Chinese",
};

const photoSrc = (url: string | null) => (!url ? null : /^https?:\/\//.test(url) ? url : `${hostName}${url}`);
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "M";
const when = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" }).format(
    new Date(value),
  );

/** "Full Support · All areas", "Admissions · Extracurricular activities, Research". */
export function assignmentText(assignment: StudentMentor["assignments"][number]): string {
  const program = programNames[assignment.program as ProgramKey] ?? assignment.program;
  if (assignment.legacy) return `${program} · All areas`;
  const roles = assignment.roles.map((role) => roleNames[role] ?? role).filter((role) => role !== program);
  return roles.length ? `${program} · ${roles.join(", ")}` : program;
}

function MentorCard({ mentor, onMessage, messaging }: { mentor: StudentMentor; onMessage: () => void; messaging: boolean }) {
  const [photoBroken, setPhotoBroken] = useState(false);
  const src = photoBroken ? null : photoSrc(mentor.photoUrl);
  const link = mentor.nextLesson ? safeMeetingLink(mentor.nextLesson.meetingLink) : null;
  const background = [mentor.university, mentor.major].filter(Boolean).join(" · ");
  const languages = mentor.languages.map((code) => LANGUAGE_NAMES[code.toLowerCase()] ?? code);
  return (
    <article className="your-mentor">
      <div className="your-mentor__identity">
        {src ? (
          <img className="your-mentor__photo" src={src} alt="" onError={() => setPhotoBroken(true)} />
        ) : (
          <span className="your-mentor__photo your-mentor__photo--initials" aria-hidden>
            {initials(mentor.name)}
          </span>
        )}
        <div className="your-mentor__who">
          <span className="your-mentor__eyebrow">Your mentor</span>
          <h3>{mentor.name}</h3>
          {mentor.title && <p className="your-mentor__title">{mentor.title}</p>}
        </div>
        <Button className="your-mentor__message" icon={<MessageCircle size={15} aria-hidden />} loading={messaging} onClick={onMessage}>
          Message
        </Button>
      </div>

      <ul className="your-mentor__for" aria-label="Assigned to help you with">
        {mentor.assignments.map((assignment) => (
          <li key={`${assignment.program}-${assignment.roles.join()}`}>{assignmentText(assignment)}</li>
        ))}
      </ul>

      {(background || languages.length > 0) && (
        <div className="your-mentor__facts">
          {background && (
            <span>
              <GraduationCap size={14} aria-hidden /> {background}
            </span>
          )}
          {languages.length > 0 && (
            <span>
              <Languages size={14} aria-hidden /> {languages.join(", ")}
            </span>
          )}
        </div>
      )}
      {mentor.summary && <p className="your-mentor__summary">{mentor.summary}</p>}

      <div className="your-mentor__stats">
        <div className="your-mentor__stat your-mentor__stat--next">
          <CalendarClock size={16} aria-hidden />
          <div>
            <small>Next lesson</small>
            {mentor.nextLesson ? (
              <>
                <strong>{when(mentor.nextLesson.dateTime)}</strong>
                {mentor.nextLesson.description && <span>{mentor.nextLesson.description}</span>}
              </>
            ) : (
              <strong className="is-muted">Not scheduled yet</strong>
            )}
          </div>
          {link && (
            <a className="your-mentor__join" href={link} target="_blank" rel="noreferrer">
              <Video size={14} aria-hidden /> Join <ArrowUpRight size={13} aria-hidden />
            </a>
          )}
        </div>
        <div className="your-mentor__stat">
          <CheckSquare size={16} aria-hidden />
          <div>
            <small>Open tasks</small>
            <strong>{mentor.openTasks}</strong>
          </div>
        </div>
        <div className="your-mentor__stat">
          <GraduationCap size={16} aria-hidden />
          <div>
            <small>Lessons held</small>
            <strong>{mentor.lessonsHeld}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Who the student's mentors are, what they help with, and what's next with them. */
export default function YourMentors() {
  const query = useGetMenteeMentorsQuery(undefined, { refetchOnMountOrArgChange: true });
  const me = useTypedSelector((state) => state.auth.profile);
  const [findConversation] = useFindOrCreateConversationMutation();
  const [opening, setOpening] = useState<string | null>(null);
  const [conversation, setConversation] = useState<string | null>(null);
  const mentors = query.data?.data ?? [];

  if (query.isLoading || query.isError || mentors.length === 0) return null;

  const openChat = async (mentorId: string) => {
    if (!me?.id) return;
    setOpening(mentorId);
    try {
      const result = await findConversation({ mentorId, studentId: me.id }).unwrap();
      if (result.conversation?.id) setConversation(result.conversation.id);
    } catch {
      message.error("Could not open the chat. Please try again.");
    } finally {
      setOpening(null);
    }
  };

  return (
    <section className="your-mentors" aria-label={mentors.length === 1 ? "Your mentor" : "Your mentors"}>
      {mentors.map((mentor) => (
        <MentorCard key={mentor.id} mentor={mentor} messaging={opening === mentor.id} onMessage={() => void openChat(mentor.id)} />
      ))}
      {conversation && (
        <ChatModal
          conversationId={conversation}
          open
          onClose={() => setConversation(null)}
          openToGeneralConversation
          onConversationChange={setConversation}
        />
      )}
    </section>
  );
}
