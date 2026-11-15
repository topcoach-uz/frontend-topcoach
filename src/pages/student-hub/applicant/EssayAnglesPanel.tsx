import { useId, useState } from "react";
import { BookOpen, ChevronDown, GraduationCap, MessageSquareText, Pin, Sparkles, UserRound } from "lucide-react";
import {
  useGetEssayIdeasMutation,
  type EssayIdeaAngle,
  type EssayIdeasResponse,
} from "src/app/services/student-hub/essayManagementApi";
import { anglesErrorMessage } from "./essayAngles";

const SOURCE_ICONS = {
  major_match: Sparkles,
  profile: UserRound,
  college_list: GraduationCap,
  prompt: MessageSquareText,
} as const;

interface Props {
  essayId: string;
  result?: EssayIdeasResponse;
  onResult: (essayId: string, result: EssayIdeasResponse) => void;
  pinnedId?: string;
  onTogglePin: (angle: EssayIdeaAngle) => void;
}

function SourceChips({ sources }: { sources: EssayIdeaAngle["sources"] }) {
  return (
    <>
      {sources.map((s, i) => {
        const Icon = SOURCE_ICONS[s.kind] ?? BookOpen;
        return <span key={`${s.kind}-${i}`} className="essay-angles__chip"><Icon size={12} aria-hidden="true" /><span>{s.label}</span></span>;
      })}
    </>
  );
}

interface RowProps {
  angle: EssayIdeaAngle;
  open: boolean;
  pinned: boolean;
  onToggle: () => void;
  onTogglePin: () => void;
}

function AngleRow({ angle, open, pinned, onToggle, onTogglePin }: RowProps) {
  const uid = useId();
  const bodyId = `${uid}-body`;
  return (
    <li className={`essay-angles__row${open ? " is-open" : ""}`}>
      <button type="button" className="essay-angles__head" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        <span className="essay-angles__head-main">
          <span className="essay-angles__title">{angle.title}</span>
          <span className="essay-angles__tags">
            {pinned && <span className="essay-angles__chip essay-angles__chip--pinned"><Pin size={11} aria-hidden="true" /><span>Pinned</span></span>}
            <SourceChips sources={angle.sources.slice(0, 2)} />
          </span>
        </span>
        <ChevronDown size={16} className="essay-angles__chevron" aria-hidden="true" />
      </button>
      <div className="essay-angles__collapse" id={bodyId} role="region" aria-label={angle.title} {...(open ? {} : ({ inert: "" } as Record<string, string>))}>
        <div className="essay-angles__collapse-inner">
          <div className="essay-angles__body">
            <p className="essay-angles__why">{angle.why}</p>
            {angle.sources.length > 0 && (
              <div className="essay-angles__sources" aria-label="Built from"><SourceChips sources={angle.sources} /></div>
            )}
            {angle.questions.length > 0 && (
              <ol className="essay-angles__questions">
                {angle.questions.map((q) => <li key={q}>{q}</li>)}
              </ol>
            )}
            <button
              type="button"
              className={`essay-angles__use${pinned ? " is-pinned" : ""}`}
              aria-pressed={pinned}
              onClick={onTogglePin}
            >
              {pinned ? "Pinned ✓" : "Write with this angle"}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export function EssayAnglesPanel({ essayId, result, onResult, pinnedId, onTogglePin }: Props) {
  const [openId, setOpenId] = useState<string>();
  const [load, state] = useGetEssayIdeasMutation();
  const [error, setError] = useState<string>();
  const run = async (refresh: boolean) => {
    setError(undefined);
    if (refresh) setOpenId(undefined);
    try {
      onResult(essayId, await load({ essayId, refresh }).unwrap());
    } catch (e) {
      setError(anglesErrorMessage(e));
    }
  };
  const loading = state.isLoading;
  return (
    <section className="essay-angles" aria-label="Story angles">
      <p className="essay-angles__hint">Built from your profile, AI Major Match and College List. Ideas only — the writing stays yours.</p>
      {!result && !loading && (
        <button type="button" className="essay-angles__primary" onClick={() => void run(false)}>
          <Sparkles size={15} aria-hidden="true" />Find my angles
        </button>
      )}
      <div aria-live="polite" className="essay-angles__live">
        {loading && <span className="essay-angles__sr">Finding angles…</span>}
      </div>
      {loading && (
        <ul className="essay-angles__list" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="essay-angles__row essay-angles__row--skeleton">
              <span className="essay-angles__bar essay-angles__bar--title" />
              <span className="essay-angles__bar essay-angles__bar--short" />
            </li>
          ))}
        </ul>
      )}
      {error && <p className="essay-angles__notice" role="status">{error}</p>}
      {result && !loading && (
        <>
          <ul className="essay-angles__list">
            {result.angles.map((a) => (
              <AngleRow
                key={a.id}
                angle={a}
                open={(openId ?? result.angles[0]?.id) === a.id}
                pinned={pinnedId === a.id}
                onToggle={() => setOpenId((openId ?? result.angles[0]?.id) === a.id ? "" : a.id)}
                onTogglePin={() => onTogglePin(a)}
              />
            ))}
          </ul>
          <div className="essay-angles__footer">
            <button type="button" className="essay-angles__more" onClick={() => void run(true)}>More angles</button>
            {typeof result.remainingToday === "number" && <small className="essay-angles__left">{result.remainingToday} left today</small>}
          </div>
        </>
      )}
    </section>
  );
}
