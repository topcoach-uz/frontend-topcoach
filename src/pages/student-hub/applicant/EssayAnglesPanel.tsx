import { useState } from "react";
import { message } from "antd";
import { BookOpen, GraduationCap, MessageSquareText, Sparkles, UserRound } from "lucide-react";
import {
  useGetEssayIdeasMutation,
  type EssayIdeaAngle,
  type EssayIdeasResponse,
} from "src/app/services/student-hub/essayManagementApi";
import { angleClipboardText, anglesErrorMessage } from "./essayAngles";

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
}

function AngleCard({ angle }: { angle: EssayIdeaAngle }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(angleClipboardText(angle));
      message.success("Angle copied");
    } catch {
      message.error("Could not copy. Select the text instead.");
    }
  };
  return (
    <li className="essay-angles__card">
      <h4 className="essay-angles__title">{angle.title}</h4>
      <p className="essay-angles__why">{angle.why}</p>
      {angle.sources.length > 0 && (
        <ul className="essay-angles__sources" aria-label="Built from">
          {angle.sources.map((s, i) => {
            const Icon = SOURCE_ICONS[s.kind] ?? BookOpen;
            return <li key={`${s.kind}-${i}`} className="essay-angles__chip"><Icon size={12} aria-hidden="true" />{s.label}</li>;
          })}
        </ul>
      )}
      {angle.questions.length > 0 && (
        <ol className="essay-angles__questions">
          {angle.questions.map((q) => <li key={q}>{q}</li>)}
        </ol>
      )}
      <button type="button" className="essay-angles__use" onClick={() => void copy()}>Use this angle</button>
    </li>
  );
}

export function EssayAnglesPanel({ essayId, result, onResult }: Props) {
  const [load, state] = useGetEssayIdeasMutation();
  const [error, setError] = useState<string>();
  const run = async (refresh: boolean) => {
    setError(undefined);
    try {
      onResult(essayId, await load({ essayId, refresh }).unwrap());
    } catch (e) {
      setError(anglesErrorMessage(e));
    }
  };
  const loading = state.isLoading;
  return (
    <section className="essay-angles" aria-label="Story angles">
      <h3 className="essay-angles__heading">Story angles from your application</h3>
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
          {[0, 1, 2].map((i) => (
            <li key={i} className="essay-angles__card essay-angles__card--skeleton">
              <span className="essay-angles__bar essay-angles__bar--title" />
              <span className="essay-angles__bar" />
              <span className="essay-angles__bar essay-angles__bar--short" />
            </li>
          ))}
        </ul>
      )}
      {error && <p className="essay-angles__notice" role="status">{error}</p>}
      {result && !loading && (
        <>
          <ul className="essay-angles__list">
            {result.angles.map((a) => <AngleCard key={a.id} angle={a} />)}
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
