import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
} from "react";
import { Logo } from "../../../components/logos";
import { applicantLinks } from "src/lib/applicantWorkspace";
import {
  ArrowLeft,
  Sun,
  Moon,
  Mail,
  ArrowRight,
  KeyRound,
  ChevronDown,
  BookOpen,
  StickyNote,
  Lightbulb,
  Eraser,
  Play,
  Mic,
  Square,
  Volume2,
  Star,
  Timer,
  Send,
  X,
  Check,
  Pause,
  Ear,
  Hand,
} from "lucide-react";
import {
  route,
  testPath,
  skills,
  storageKey,
  partRange,
  partForQuestion,
  practicePartCount,
  pairAnswers,
  answerStats,
  hasAnswer,
  grade,
  band,
  isCorrect,
  wordCount,
} from "./model.js";
import {
  passage,
  readingStatements,
  readingKeys,
  writingPrompts,
  writingSamples,
  dictionary,
  answerKeys,
} from "./content.js";
import "./style.css";
import IeltsBrowse from "./IeltsBrowse";
import {
  generalPassages,
  GeneralReadingQuestions,
} from "./general-reading.jsx";
import { ImportedSpeakingPrompt, speakingQuestionText, speakingStorageKey } from "./ImportedSpeaking.jsx";
import { ImportedWritingPrompt } from "./ImportedWriting.jsx";
import { ImportedListeningQuestions } from "./ImportedListening.jsx";
import { listeningPart, listeningKeys, completeListeningKeys, listeningPartForQuestion, practiceRelease } from "./listening-library.js";
import { extraPassages, ExtraReadingQuestions } from "./reading-extra.jsx";

const WorkspaceContext = createContext(null);
function usePracticeAssessment(r, release = "", enabled = true, standaloneKey = "") {
  const { assessmentApi } = useContext(WorkspaceContext);
  const api = useRef(assessmentApi);
  api.current = assessmentApi;
  const practiceKey = `${standaloneKey || `${storageKey(r)}${release ? `:library:${release}` : ""}`}:${r.part}`;
  const [submissions, setSubmissions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false),
    request = useRef(null),
    generation = useRef(0);
  const errorText = (e) =>
    typeof e?.data?.message === "string"
      ? e.data.message
      : "Could not finish this request. Your local work is still here. Please retry.";
  useEffect(() => {
    const current = ++generation.current;
    setSubmissions([]);
    setError("");
    setBusy(false);
    running.current = false;
    request.current = null;
    if (enabled && api.current)
      api.current
        .list(practiceKey)
        .then((rows) => {
          if (generation.current === current && Array.isArray(rows))
            setSubmissions(rows);
        })
        .catch((e) => {
          if (generation.current === current) setError(errorText(e));
        });
    return () => {
      generation.current++;
    };
  }, [practiceKey, enabled]);
  const refresh = async () => {
    const current = generation.current;
    try {
      const rows = await api.current.list(practiceKey);
      if (generation.current === current) {
        setSubmissions(rows);
        setError("");
      }
    } catch (e) {
      if (generation.current === current) setError(errorText(e));
    }
  };
  const run = async ({ text, prompt, clips = [] }) => {
    if (running.current) return false;
    if (!enabled || !api.current) {
      setError("Assessment is unavailable in this preview.");
      return false;
    }
    const current = generation.current;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const fingerprint = JSON.stringify({
        text,
        prompt,
        clips: clips.map((c) => c.url),
      });
      if (request.current?.fingerprint !== fingerprint)
        request.current = { fingerprint, requestId: crypto.randomUUID() };
      const row = await api.current.create({
        requestId: request.current.requestId,
        practiceKey,
        skill: r.skill,
        text,
        prompt,
      });
      if (row.state !== "assessed") {
        for (const clip of clips)
          await api.current.upload(row.id, clip.question, clip.blob);
      }
      const result = await api.current.assess(row.id);
      if (generation.current === current) {
        setSubmissions(await api.current.list(practiceKey));
        if (result.state !== "assessed")
          setError(
            result.error ||
              "Assessment did not finish. Your submission is saved. Retry below.",
          );
      }
      return result.state === "assessed";
    } catch (e) {
      if (generation.current === current) {
        setError(errorText(e));
        await api.current
          .list(practiceKey)
          .then(setSubmissions)
          .catch(() => {});
      }
      return false;
    } finally {
      if (generation.current === current) {
        running.current = false;
        setBusy(false);
      }
    }
  };
  const retry = async (id) => {
    if (running.current || !api.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    const current = generation.current;
    try {
      const result = await api.current.assess(id);
      if (generation.current === current) {
        await refresh();
        if (result.state !== "assessed")
          setError(result.error || "Please check again shortly.");
      }
    } catch (e) {
      if (generation.current === current) setError(errorText(e));
    } finally {
      if (generation.current === current) {
        running.current = false;
        setBusy(false);
      }
    }
  };
  return { submissions, busy, error, run, retry, refresh };
}
function SavedRecording({ recording }) {
  const { assessmentApi } = useContext(WorkspaceContext);
  const [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const ownedUrl = useRef("");
  useEffect(
    () => () => {
      if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
    },
    [],
  );
  const expired = new Date(recording.expiresAt).getTime() <= Date.now();
  return (
    <div>
      <p>
        Question {recording.question + 1} ·{" "}
        {expired
          ? "Recording expired"
          : `Available until ${dateLabel(recording.expiresAt)}`}
      </p>
      {!expired && !url && (
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const blob = await assessmentApi.audio(recording.id);
              ownedUrl.current = URL.createObjectURL(blob);
              setUrl(ownedUrl.current);
            } catch {
              setError("Recording unavailable. It may have expired.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Loading…" : "Play saved recording"}
        </button>
      )}
      {url && (
        <>
          <audio controls src={url} />
          <a href={url} download={`ielts-question-${recording.question + 1}`}>
            Download recording
          </a>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
function PracticeFeedback({ assessment, onRestore }) {
  return (
    <section aria-label="Saved practice feedback">
      <p>
        Automated practice guidance. This is not an official IELTS result.
        Speaking guidance covers transcript vocabulary, grammar and relevance;
        it does not score pronunciation or delivery.
      </p>
      {assessment.error && (
        <p role="alert">
          {assessment.error}{" "}
          <button disabled={assessment.busy} onClick={assessment.refresh}>
            Refresh saved submissions
          </button>
        </p>
      )}
      {assessment.submissions.map((submission, index) => (
        <details key={submission.id} open={index === 0}>
          <summary>
            Submission · {dateLabel(submission.createdAt)} · {submission.state}
          </summary>
          {onRestore && (
            <button
              disabled={assessment.busy}
              onClick={() => onRestore(submission.text)}
            >
              Restore saved response
            </button>
          )}
          {submission.feedback && (
            <div>
              {submission.feedback.estimatedBand != null && (
                <p>
                  Estimated writing band: {submission.feedback.estimatedBand}
                </p>
              )}
              <p>{submission.feedback.summary}</p>
              {["strengths", "improvements", "suggestions"].map((key) => (
                <div key={key}>
                  <h3>{key[0].toUpperCase() + key.slice(1)}</h3>
                  <ul>
                    {submission.feedback[key].map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {["saved", "failed"].includes(submission.state) && (
            <button
              disabled={assessment.busy}
              onClick={() => assessment.retry(submission.id)}
            >
              Retry assessment
            </button>
          )}
          {submission.state === "processing" && (
            <button disabled={assessment.busy} onClick={assessment.refresh}>
              Check assessment status
            </button>
          )}
          {submission.recordings?.map((recording) => (
            <SavedRecording key={recording.id} recording={recording} />
          ))}
        </details>
      ))}
      {assessment.busy && (
        <p role="status">Saving and assessing your practice…</p>
      )}
    </section>
  );
}
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
function useRead() {
  const { storagePrefix } = useContext(WorkspaceContext);
  return (key, fallback) => read(storagePrefix + key, fallback);
}
function useStored(key, fallback) {
  const { storagePrefix, onStorageError } = useContext(WorkspaceContext);
  key = storagePrefix + key;
  const [value, setValue] = useState(() => read(key, fallback));
  useEffect(() => setValue(read(key, fallback)), [key]);
  const save = (v) => {
    setValue((old) => {
      const next = typeof v === "function" ? v(old) : v;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        onStorageError?.();
      }
      return next;
    });
  };
  return [value, save];
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
function dateLabel(value) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tashkent",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(value))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function IconButton({ label, children, ...props }) {
  return (
    <button className="icon" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
export default function IeltsWorkspace(props) {
  return (
    <WorkspaceContext.Provider value={props}>
      <App key={props.storagePrefix} />
    </WorkspaceContext.Provider>
  );
}
function App() {
  const { path, navigate, href, profile, storagePrefix, onStorageError, listeningLibrary, readingLibrary, writingLibrary, speakingLibrary } =
    useContext(WorkspaceContext);
  const [dark, setDark] = useStored("workspace:dark", false),
    [modal, setModal] = useState(null),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState("");
  const pagePath = path.split("?")[0];
  const r = route(path);
  const browsing = ["/", "/ielts/practice/home", "/ielts/practice/general-training"].includes(pagePath);
  const readBrowse = useRead();
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!modal || !dialogRef.current) return;
    const node = dialogRef.current,
      previous = document.activeElement;
    const focusTarget =
      node.querySelector(".drawer-scores") || node.querySelector("button");
    focusTarget?.focus();
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const fields = Array.from(
        node.querySelectorAll("button,a[href],input,textarea,select"),
      ).filter((el) => !el.disabled && el.getClientRects().length);
      if (!fields.length) return;
      const first = fields[0],
        last = fields.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", trap);
    return () => {
      node.removeEventListener("keydown", trap);
      previous?.focus?.();
    };
  }, [modal]);
  function go(p) {
    navigate(p);
    setMenu(false);
    setModal(null);
    window.scrollTo(0, 0);
  }
  useEffect(() => {
    if (profile && r && r.skill !== "score")
      try {
        localStorage.setItem(
          storagePrefix + "workspace:last",
          JSON.stringify({
            path,
            title: `${cap(r.type)} ${r.book} Test ${r.test} ${cap(r.skill)} ${r.part}`,
          }),
        );
      } catch {
        onStorageError?.();
      }
    document.title = r
      ? `${cap(r.skill)} – IELTS Practice | TopCoach`
      : "IELTS Practice | TopCoach";
  }, [path, profile]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") {
        setModal(null);
        setMenu(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const ctx = { go, setToast, setModal };
  const Link = ({ to, children, ...props }) => (
    <a
      href={href(to)}
      {...props}
      onClick={(e) => {
        if (
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey &&
          e.button === 0
        ) {
          e.preventDefault();
          go(to);
        }
      }}
    >
      {children}
    </a>
  );
  return (
    <div className={`ielts-workspace${browsing ? " ielts-browse" : dark ? " dark" : ""}`}>
      {browsing ? <IeltsBrowse pagePath={pagePath} Link={Link} profile={profile} last={readBrowse("workspace:last", null)} /> : <>
      <header>
        <div className="brand">
          <Link to="/student-hub" aria-label="Back to TopCoach">
            <Logo width={100} height={36} color={dark ? "white" : "black"} />
          </Link>
          <Link to="/ielts/practice/home">IELTS Practice</Link>
        </div>
        {r && r.skill !== "score" && r.skill !== "speaking" && (
          <Clock r={r} setModal={setModal} go={go} />
        )}
        {pagePath !== "/login" && (
          <div className="header-actions">
            <IconButton
              label={`Current theme: ${dark ? "Dark" : "Light"} Mode, click to switch`}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Moon /> : <Sun />}
            </IconButton>
            <IconButton
              label="Vocabulary"
              onClick={() => go("/ielts/vocabulary")}
            >
              <BookOpen />
            </IconButton>
            <IconButton
              label="Back to main menu"
              onClick={() => go(applicantLinks.learning)}
            >
              <ArrowLeft />
            </IconButton>
            {profile ? (
              <div className="profile-wrap">
                <button
                  className="avatar"
                  aria-label={profile.name}
                  onClick={() => setMenu(!menu)}
                >
                  {profile.name.slice(0, 1).toUpperCase()}
                </button>
                {menu && (
                  <div className="menu">
                    <b>{profile.name}</b>
                    <small>{profile.email}</small>
                    <button onClick={() => go("/settings/account")}>
                      Account Settings
                    </button>
                    <button onClick={() => go(applicantLinks.learning)}>
                      Back to main menu
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </header>
      {pagePath === "/ielts/vocabulary" ? (
        <Vocabulary {...ctx} />
      ) : r ? (
        r.skill === "score" ? (
          <Scores r={r} Link={Link} />
        ) : (
          <Practice
            key={`${r.type}-${r.book}-${r.test}-${r.skill}-${["listening", "reading", "writing", "speaking"].includes(r.skill) ? (r.skill === "speaking" ? speakingLibrary : r.skill === "writing" ? writingLibrary : r.skill === "reading" ? readingLibrary : listeningLibrary)?.data?.release || "loading" : ""}-${r.skill === "speaking" ? speakingLibrary?.data?.topic?.id || "loading" : ""}`}
            r={r}
            {...ctx}
          />
        )
      ) : (
        <InfoPage path={pagePath} Link={Link} />
      )}
      </>}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {modal && (
        <div className="scrim" onClick={() => setModal(null)}>
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof modal === "string" ? cap(modal) : modal.title}
            className={`dialog ${modal.kind === "answers" ? "answer-drawer" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton label="Close dialog" onClick={() => setModal(null)}>
              <X />
            </IconButton>
            {modal.kind === "answers" ? (
              <AnswerDrawer
                r={modal.r}
                answers={modal.answers}
                go={go}
                close={() => setModal(null)}
              />
            ) : (
              <>
                <h2>{modal.title}</h2>
                <p>{modal.body}</p>
                {modal.action && (
                  <button
                    className="solid"
                    onClick={() => {
                      modal.action();
                      setModal(null);
                    }}
                  >
                    {modal.actionLabel || "Confirm"}
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function Clock({ r, setModal, go }) {
  const mock = new URLSearchParams(location.search).get("mode") === "mock";
  const key = `workspace:clock:${r.type}:${r.book}:${r.test}:${r.skill}`;
  const [clock, setClock] = useStored(key, null),
    [open, setOpen] = useState(false),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = clock?.deadline
    ? Math.max(0, Math.ceil((clock.deadline - now) / 1000))
    : clock?.remaining || 0;
  useEffect(() => {
    if (clock?.deadline && remaining === 0) {
      setClock(null);
      setModal({
        title: "Time is up",
        body: "Your answers have been saved. You can review your scores or keep practising.",
      });
    }
  }, [remaining]);
  const start = (minutes, mode = "part") => {
    setClock({
      deadline: Date.now() + minutes * 60000,
      mode,
    });
    setOpen(false);
    if (mode === "full") go(testPath(r, r.skill, r.part) + "?mode=mock");
  };
  return (
    <div className="clock">
      <button onClick={() => setOpen(!open)} aria-label="Switch timer mode">
        {clock ? (
          <>
            <Timer size={15} />
            {String(Math.floor(remaining / 60)).padStart(2, "0")} :{" "}
            {String(remaining % 60).padStart(2, "0")}
          </>
        ) : (
          "Mock Test"
        )}
        <ChevronDown size={12} />
      </button>
      {mock && (
        <IconButton
          label="Submit Test"
          onClick={() =>
            setModal({
              title: "Submit Test?",
              body: "Finish this test and review your answers?",
              actionLabel: "Submit Test",
              action: () => go(testPath(r, "score")),
            })
          }
        >
          <Send size={17} />
        </IconButton>
      )}
      {open && (
        <div className="menu">
          <button
            onClick={() => start(r.skill === "listening" ? 30 : 60, "full")}
          >
            Full Section Timer (Mock Test)
          </button>
          <button
            onClick={() =>
              start(
                r.skill === "listening"
                  ? 7.25
                  : r.skill === "writing" && r.part === 2
                    ? 40
                    : 20,
              )
            }
          >
            Single Part Timer
          </button>
          {clock && (
            <>
              <button
                onClick={() => {
                  setClock(
                    clock.deadline
                      ? { remaining, mode: clock.mode }
                      : { ...clock, deadline: Date.now() + remaining * 1000 },
                  );
                  setOpen(false);
                }}
              >
                {clock.deadline ? "Pause" : "Resume"} timer
              </button>
              <button
                onClick={() => {
                  setClock(null);
                  setOpen(false);
                }}
              >
                Stop timer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
function Vocabulary({ setToast }) {
  const [query, setQuery] = useState(""),
    [word, setWord] = useState(""),
    [stars, setStars] = useStored("workspace:stars", []);
  const d = dictionary[word.toLowerCase()];
  return (
    <main className="vocabulary">
      <section>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            setWord(query.trim());
          }}
        >
          <input
            placeholder="IELTS Dictionary"
            aria-label="IELTS Dictionary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="solid">Search</button>
        </form>
        {word && (
          <>
            <div className="tab-title">Definition &amp; Examples</div>
            <h3>Definition of '{word}' in Dictionary</h3>
            {d ? (
              <>
                <div className="word-title">
                  <h1>{word}</h1>
                  <IconButton
                    label={stars.includes(word) ? "Unstar word" : "Star word"}
                    onClick={() =>
                      setStars(
                        stars.includes(word)
                          ? stars.filter((w) => w !== word)
                          : [...stars, word],
                      )
                    }
                  >
                    <Star fill={stars.includes(word) ? "#e5b844" : "none"} />
                  </IconButton>
                  <IconButton
                    label="Pronounce word"
                    onClick={() => speak(word)}
                  >
                    <Volume2 />
                  </IconButton>
                </div>
                <i>{d.kind}</i>
                <p>{d.definition}</p>
                <ul>
                  <li>{d.example}</li>
                </ul>
              </>
            ) : (
              <p className="empty">No matches found.</p>
            )}
          </>
        )}
      </section>
      <section>
        <div className="tab-title">My Starred</div>
        {stars.length ? (
          stars.map((w) => (
            <article className="starred" key={w}>
              <button
                onClick={() => {
                  setWord(w);
                  setQuery(w);
                }}
              >
                <b>{w}</b>
                <p>{dictionary[w]?.definition}</p>
              </button>
              <IconButton
                label={`Remove ${w}`}
                onClick={() => setStars(stars.filter((x) => x !== w))}
              >
                <Star fill="#e5b844" />
              </IconButton>
            </article>
          ))
        ) : (
          <div className="empty">No starred words yet</div>
        )}
      </section>
    </main>
  );
}
function speak(text, onend) {
  if (!window.speechSynthesis) {
    onend?.();
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-GB";
  u.onend = onend;
  u.onerror = onend;
  speechSynthesis.speak(u);
}
function InfoPage({ path, Link }) {
  return (
    <main className="settings">
      <h1>{path === "/about" ? "About IELTS Practice" : "Page not found"}</h1>
      <p>
        {path === "/about"
          ? "Practise Academic and General Training IELTS with reading, listening, writing, speaking, vocabulary and answer review."
          : "This practice page could not be found."}
      </p>
      <p>
        Practice content uses representative samples. Submitted writing and
        speaking receive automated guidance on your own response.
      </p>
      <Link to="/ielts/practice/home">Browse practice tests</Link>
    </main>
  );
}
function ListeningAudio({ src }) {
  const [tips, setTips] = useState(false),
    [source, setSource] = useState(0);
  const [stamp] = useState(() => Date.now());
  const urls = [
    src,
    src + "&retry=" + stamp,
    src + "&retry=" + (stamp + 1),
  ];
  return (
    <>
      <div className="audio-row">
        <audio controls preload="metadata" src={urls[source]} />
        <IconButton label="Audio source tips" onClick={() => setTips(!tips)}>
          <Ear />
        </IconButton>
      </div>
      {tips && (
        <div className="audio-tips">
          If audio won't play, click below to switch sources:
          <button onClick={() => setSource(1)}>
            Backup Audio Source 1 {source === 1 && <Check size={13} />}
          </button>
          <button onClick={() => setSource(2)}>
            Backup Audio Source 2 {source === 2 && <Check size={13} />}
          </button>
        </div>
      )}
    </>
  );
}
function Practice({ r, go, setModal, setToast }) {
  const { storagePrefix, onStorageError, listeningLibrary, readingLibrary, writingLibrary, speakingLibrary } = useContext(WorkspaceContext);
  const library = r.skill === "speaking" ? speakingLibrary : r.skill === "writing" ? writingLibrary : r.skill === "reading" ? readingLibrary : listeningLibrary;
  const listening = listeningPart(listeningLibrary?.data, r.part);
  const reading = listeningPart(readingLibrary?.data, r.part);
  const writing = listeningPart(writingLibrary?.data, r.part);
  const currentPart = r.skill === "reading" ? reading : listening;
  const currentKeys = ["listening", "reading"].includes(r.skill) ? listeningKeys(library?.data) : answerKeys(r);
  const practiceKey = r.skill === "speaking" && speakingLibrary?.data ? speakingStorageKey(speakingLibrary.data) : ["listening", "reading", "writing"].includes(r.skill) ? `${storageKey(r)}:library:${practiceRelease(library?.data)}` : storageKey(r);
  const mock = new URLSearchParams(location.search).get("mode") === "mock";
  const [answers, setAnswers] = useStored(practiceKey, {}),
    [revealed, setRevealed] = useState(false),
    [notesOn, setNotesOn] = useState(false),
    [dictionaryOn, setDictionaryOn] = useStored("workspace:dictionary", true),
    [guided, setGuided] = useState(false),
    [notes, setNotes] = useStored(`${practiceKey}:annotations:${r.part}`, {}),
    [highlights, setHighlights] = useStored(
      `${practiceKey}:highlights:${r.part}`,
      [],
    ),
    [word, setWord] = useState(""),
    [anchor, setAnchor] = useState({ left: 40, top: 340 }),
    [context, setContext] = useState(null),
    [noteEditor, setNoteEditor] = useState(null),
    [noteDraft, setNoteDraft] = useState(""),
    [clearOpen, setClearOpen] = useState(false),
    [speakingCompleted, setSpeakingCompleted] = useState(false),
    [resetVersion, setResetVersion] = useState(0);
  useEffect(() => {
    setRevealed(false);
    setWord("");
    setSpeakingCompleted(false);
  }, [r.part]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") {
        setWord("");
        setContext(null);
        setNoteEditor(null);
        setClearOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const imported = r.skill === "speaking" ? !!speakingLibrary?.data?.topic : r.skill === "writing" ? !!(writing?.chart || writing?.prompt) : r.skill === "reading" ? !!reading : r.skill === "listening" ? !!listening : r.type === "academic";
  function update(n, v) {
    setAnswers((a) => ({ ...a, [n]: v }));
  }
  function updateGroup(start, selected) {
    const pair = pairAnswers(selected, start);
    setAnswers((a) => ({ ...a, ...pair }));
  }
  const clear = (scope = "part") =>
    setModal({
      title: "Clear answers?",
      body:
        scope === "all"
          ? "Clear answers for all parts?"
          : "Clear answers for this part?",
      actionLabel: "Clear answers",
      action: () => {
        const [start, end] = partRange(r);
        setAnswers((a) =>
          scope === "all"
            ? {}
            : Object.fromEntries(
                Object.entries(a).filter(([n]) => ["listening", "reading"].includes(r.skill) ? !currentPart?.questionNumbers.includes(+n) : +n <= start || +n > end),
              ),
        );
        if (["writing", "speaking"].includes(r.skill)) {
          const parts =
            scope === "all"
              ? Array.from(
                  { length: r.skill === "writing" ? 2 : 3 },
                  (_, i) => i + 1,
                )
              : [r.part];
          for (const part of parts)
            try {
              localStorage.removeItem(
                storagePrefix +
                  `${practiceKey}:${r.skill === "writing" ? "essay" : "transcript"}:${part}`,
              );
            } catch {
              onStorageError?.();
            }
        }
        setSpeakingCompleted(false);
        setResetVersion((v) => v + 1);
        setRevealed(false);
        setClearOpen(false);
      },
    });
  const input = (n) => (
    <span className="answer-inline">
      <span>{n}</span>
      <input
        id={`answer-${n}`}
        aria-label={`Answer ${n}`}
        value={answers[n] || ""}
        onChange={(e) => update(n, e.target.value)}
        className={
          revealed && currentKeys?.[n - 1]
            ? isCorrect(answers[n], currentKeys[n - 1])
              ? "correct"
              : "incorrect"
            : ""
        }
      />
      {revealed && <small>{currentKeys?.[n - 1] || "Key not available"}</small>}
    </span>
  );
  const tools = (
    <div className="tools">
      <IconButton
        label={`Toggle note mode (${notesOn ? "ON" : "OFF"})`}
        onClick={() => setNotesOn(!notesOn)}
      >
        <StickyNote />
      </IconButton>
      {r.skill === "reading" && (
        <IconButton
          label={`Toggle dictionary mode (${dictionaryOn ? "ON" : "OFF"})`}
          onClick={() => setDictionaryOn(!dictionaryOn)}
        >
          <BookOpen />
        </IconButton>
      )}
      <IconButton
        label={`Toggle guided mode (${guided ? "ON" : "OFF"})`}
        onClick={() => setGuided(!guided)}
      >
        <Lightbulb fill={guided ? "#dcebc9" : "none"} />
      </IconButton>
    </div>
  );
  const onWord = (e) => {
    if (dictionaryOn && e.target.dataset.word) {
      const box = e.target.getBoundingClientRect();
      setAnchor({
        left: Math.max(16, Math.min(box.left - 160, window.innerWidth - 436)),
        top: Math.min(box.bottom + 14, window.innerHeight - 300),
      });
      setWord(e.target.dataset.word.replace(/[^a-z]/gi, "").toLowerCase());
    }
  };
  const wordTokens = (p, prefix) =>
    p.split(/(\s+)/).map((w, i) =>
      /^\s+$/.test(w) ? (
        w
      ) : (
        <span
          key={i}
          data-word={w}
          data-word-key={`${prefix}-${i}`}
          className={`dictionary-word ${highlights.includes(`${prefix}-${i}`) ? "highlighted" : ""} ${notes[`${prefix}-${i}`] ? "has-note" : ""}`}
        >
          {w}
        </span>
      ),
    );
  const evidence = [
    ["mining and transport", [1]],
    ["Growing up in Wales", [8]],
    ["Their education", [2]],
    ["wrote detailed notes", [3]],
    ["journals show", [4]],
    ["Monet paintings depicting Venice", [5]],
    ["canteen serving soldiers", [6]],
    ["friendships with artists", [7]],
    ["advice of Hugh Blaker", [10]],
    ["hardship following the war", [12]],
    ["routinely ignored", [13]],
  ];
  const paragraph = (p, index) =>
    p.split(/(?<=[.!?])\s+(?=[A-Z])/).map((sentence, j) => {
      const match =
        guided && r.skill !== "reading" && evidence.find(([phrase]) => sentence.includes(phrase));
      return (
        <span className={match ? "evidence" : ""} key={j}>
          {wordTokens(sentence, `${index}-${j}`)}
          {match &&
            match[1].map((n) => (
              <sup
                key={n}
                onClick={() => document.getElementById(`answer-${n}`)?.focus()}
              >
                {n}
              </sup>
            ))}{" "}
        </span>
      );
    });
  function contextMenu(e) {
    const key = e.target.dataset.wordKey;
    if (!key) return;
    e.preventDefault();
    setWord("");
    setContext({
      key,
      text: window.getSelection()?.toString().trim() || e.target.dataset.word,
      left: Math.min(e.clientX, window.innerWidth - 220),
      top: Math.min(e.clientY, window.innerHeight - 220),
    });
  }
  function saveNote() {
    if (!noteDraft.trim()) return;
    setNotes((n) => ({ ...n, [noteEditor.key]: noteDraft }));
    setNoteEditor(null);
  }
  return (
    <>
      <main
        className={`practice skill-${r.skill} ${mock ? "mock-practice" : ""} ${mock && r.skill === "listening" ? "mock-listening" : ""}`}
      >
        <section className="pane left">
          {r.skill !== "writing" && r.skill !== "speaking" && tools}
          {!imported ? (
            ["listening", "reading", "writing", "speaking"].includes(r.skill) ? <div className="empty" role="status"><p>{library?.loading ? `Loading ${r.skill} practice…` : `${cap(r.skill)} content has not been imported for this test or part.`}</p>{library?.error && <button onClick={() => library.retry()}>Retry loading</button>}</div> : <Missing r={r} />
          ) : r.skill === "reading" ? (
            <>
              <h2>
                PASSAGE {r.part}{" "}
                {r.type === "general-training" && (
                  <small>
                    (Section {r.part <= 2 ? 1 : r.part <= 4 ? 2 : 3})
                  </small>
                )}
              </h2>
              <p className="muted passage-instruction">
                You should spend about 20 minutes on Questions {reading.questionNumbers[0]}–{reading.questionNumbers.at(-1)}, which are based on Reading Passage {r.part}.
              </p>
              <h1 className="center">{reading.article.title}</h1>
              {reading.article.subtitles.map((text, i) => <p className="subtitle" key={i}>{text}</p>)}
              <div onClick={onWord} onContextMenu={contextMenu}>
                {reading.article.blocks.map((block, i) => block.type === "heading" ? <h3 className="section-letter" key={i}>{block.text}</h3> : block.type === "image" ? (
                  block.image ? <img key={i} src={block.image} alt="Passage illustration" style={{ maxWidth: "100%", height: "auto" }} /> : <p className="hint" key={i}>Passage illustration is not available in the imported data.</p>
                ) : <p key={i}>{paragraph(block.text, i)}</p>)}
              </div>
              {reading.article.footer.map((text, i) => <p className="muted" key={i}>{text}</p>)}
              {!!reading.article.glossary.length && <><h3>Glossary</h3>{reading.article.glossary.map((text, i) => <p key={i}>{text}</p>)}</>}
            </>
          ) : r.skill === "listening" ? (
            <>
              <h2>PART {r.part}</h2>
              {listening.audio ? <ListeningAudio key={listening.audio} src={listening.audio} /> : <p className="hint">Audio is not available for this part.</p>}
              <details>
                <summary>Audioscript</summary>
                <h1>{listening.title || `Listening Part ${r.part}`}</h1>
                {listening.script.length ? listening.script.map((line, index) => <p key={index}>{line.speaker && <b>{line.speaker}: </b>}{line.text}</p>) : <p>Audioscript is not available for this part.</p>}
              </details>
            </>
          ) : r.skill === "writing" ? (
            <ImportedWritingPrompt task={writing} part={r.part} book={r.book} test={r.test} />
          ) : (
            <ImportedSpeakingPrompt library={speakingLibrary.data} onSelect={id => go(testPath(r, "speaking", r.part) + `?topic=${encodeURIComponent(id)}${mock ? "&mode=mock" : ""}`)} />
          )}
        </section>
        <section className="pane right">
          <div className="clear">
            <IconButton
              label={
                r.skill === "speaking" &&
                !speakingCompleted &&
                new URLSearchParams(location.search).get("feedback") !== "demo"
                  ? "Complete all questions first"
                  : "Clear answers"
              }
              disabled={
                r.skill === "speaking" &&
                !speakingCompleted &&
                new URLSearchParams(location.search).get("feedback") !== "demo"
              }
              onClick={() => setClearOpen(!clearOpen)}
            >
              <Eraser size={16} />
              {r.skill !== "speaking" && <ChevronDown size={12} />}
            </IconButton>
            {clearOpen && (
              <div className="menu clear-menu" role="menu">
                <button role="menuitem" onClick={() => clear("part")}>
                  Clear This Part
                </button>
                <button role="menuitem" onClick={() => clear("all")}>
                  Clear All Parts
                </button>
              </div>
            )}
          </div>
          {!imported ? (
            <div className="empty">No answer data available</div>
          ) : r.skill === "reading" ? (
            <ImportedListeningQuestions part={reading} input={input} answers={answers} update={update} setAnswers={setAnswers} revealed={revealed} keys={currentKeys || []} />
          ) : r.skill === "listening" ? (
            <ImportedListeningQuestions part={listening} input={input} answers={answers} update={update} setAnswers={setAnswers} revealed={revealed} keys={currentKeys || []} />
          ) : r.skill === "writing" ? (
            <WritingEditor key={`${r.part}-${resetVersion}`} r={r} setToast={setToast} task={writing} release={practiceRelease(writingLibrary?.data)} draftKey={practiceKey} />
          ) : (
            <SpeakingEditor
              key={`${speakingLibrary?.data?.topic.id}-${r.part}-${resetVersion}`}
              library={speakingLibrary?.data}
              draftKey={practiceKey}
              r={r}
              setToast={setToast}
              onComplete={() => setSpeakingCompleted(true)}
            />
          )}
        </section>
      </main>
      {mock && ["listening", "reading"].includes(r.skill) ? (
        <nav className="bottom-nav question-strip">
          {(library?.data?.parts.flatMap(p => p.questionNumbers) || []).map((n) => (
            <button
              key={n}
              className={answers[n] ? "answered" : ""}
              onClick={() => {
                const part = listeningPartForQuestion(library?.data, n);
                if (part !== r.part)
                  go(testPath(r, r.skill, part) + "?mode=mock");
                else document.getElementById(`answer-${n}`)?.focus();
              }}
            >
              {n}
            </button>
          ))}
        </nav>
      ) : (
        <nav className="bottom-nav">
          {(() => {
            const index = skills.indexOf(r.skill),
              before =
                r.type === "general-training"
                  ? "score"
                  : index === 0
                    ? "score"
                    : skills[index - 1],
              after =
                r.type === "general-training"
                  ? "score"
                  : index === 3
                    ? "score"
                    : skills[index + 1];
            return (
              <>
                <button onClick={() => go(testPath(r, before))}>
                  {before === "score" ? "Scores" : cap(before)}
                </button>
                <div className="parts">
                  {Array.from(
                    {
                      length: practicePartCount(r),
                    },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      className={r.part === p ? "active" : ""}
                      onClick={() =>
                        r.part === p &&
                        ["listening", "reading"].includes(r.skill)
                          ? setModal({
                              kind: "answers",
                              title: "Answer Keys",
                              r,
                              answers,
                            })
                          : go(testPath(r, r.skill, p))
                      }
                      aria-label={
                        r.part === p &&
                        ["listening", "reading"].includes(r.skill)
                          ? "Check answers"
                          : `Part ${p}`
                      }
                    >
                      {r.part === p &&
                      ["listening", "reading"].includes(r.skill) ? (
                        <KeyRound size={16} />
                      ) : (
                        p
                      )}
                    </button>
                  ))}
                </div>
                <button onClick={() => go(testPath(r, after))}>
                  {after === "score" ? "Scores" : cap(after)}
                </button>
              </>
            );
          })()}
        </nav>
      )}
      {word && (
        <div className="word-popup" role="dialog" style={anchor}>
          <div className="popup-quote">"{word}"</div>
          <IconButton label="Close dictionary" onClick={() => setWord("")}>
            <X size={16} />
          </IconButton>
          <WordCard word={word} />
        </div>
      )}
      {context && (
        <div
          role="menu"
          className="annotation-menu"
          style={{ left: context.left, top: context.top }}
        >
          <button
            onClick={() => {
              setHighlights((h) =>
                h.includes(context.key) ? h : [...h, context.key],
              );
              setContext(null);
            }}
          >
            Highlight
          </button>
          <button
            onClick={() => {
              setHighlights((h) => h.filter((k) => k !== context.key));
              setNotes((n) => {
                const next = { ...n };
                delete next[context.key];
                return next;
              });
              setContext(null);
            }}
          >
            Clear
          </button>
          <button
            onClick={() => {
              setNoteEditor(context);
              setNoteDraft(notes[context.key] || "");
              setContext(null);
            }}
          >
            Notes
          </button>
        </div>
      )}
      {noteEditor && (
        <div
          className="note-popup"
          style={{
            left: Math.max(
              16,
              Math.min(noteEditor.left, window.innerWidth - 436),
            ),
            top: Math.min(noteEditor.top, window.innerHeight - 230),
          }}
        >
          <div className="popup-quote">
            "{noteEditor.text}"
            <IconButton
              label="Discard & Close"
              onClick={() => setNoteEditor(null)}
            >
              <X size={14} />
            </IconButton>
          </div>
          <textarea
            autoFocus
            placeholder="Write your note..."
            aria-label="Write your note..."
            maxLength={500}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value.slice(0, 500))}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") saveNote();
              if (e.key === "Escape") setNoteEditor(null);
            }}
          />
          <div className="note-count">{noteDraft.length}/500</div>
          <div className="note-footer">
            <button
              className="solid"
              disabled={!noteDraft.trim()}
              onClick={saveNote}
            >
              Save
            </button>
            <small>⌘+Enter</small>
          </div>
        </div>
      )}
    </>
  );
}
function AnswerDrawer({ r, answers, go, close }) {
  const { listeningLibrary, readingLibrary } = useContext(WorkspaceContext);
  const [show, setShow] = useState(false),
    keys = listeningKeys((r.skill === "reading" ? readingLibrary : listeningLibrary)?.data);
  const [start, end] = partRange(r);
  const questionNumbers = listeningPart((r.skill === "reading" ? readingLibrary : listeningLibrary)?.data, r.part)?.questionNumbers || [];
  return (
    <>
      <h2>Answer Keys</h2>
      <p className="muted">Review completed answers</p>
      <button
        className="solid drawer-scores"
        onClick={() => {
          close();
          go(testPath(r, "score"));
        }}
      >
        Band Scores <ArrowRight size={16} />
      </button>
      <label className="toggle">
        <input
          role="switch"
          type="checkbox"
          checked={show}
          onChange={(e) => setShow(e.target.checked)}
        />
        Show answers for unanswered
      </label>
      {keys ? (
        <table className="review-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>My Answer</th>
              <th>Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            {questionNumbers.map((n) => {
              const key = keys[n - 1] || "";
              return (
                <tr
                  key={n}
                  className={
                    !answers[n] || !key
                      ? "unanswered"
                      : isCorrect(answers[n], key)
                        ? "correct-row"
                        : "incorrect-row"
                  }
                >
                  <td>{n}</td>
                  <td>{answers[n] || "-"}</td>
                  <td>
                    <span
                      className={
                        !hasAnswer(answers[n]) && !show ? "blurred" : ""
                      }
                    >
                      {key ? key.replaceAll("|", " | ") : "Key not available"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>Answer keys not imported for this test.</p>
      )}
      <button className="drawer-close" onClick={close}>
        Close
      </button>
    </>
  );
}
function Missing({ r }) {
  return (
    <div className="missing">
      <h2>
        {r.skill === "writing" ? "TASK" : "PART"} {r.part}
      </h2>
      <p className="muted">No answer data available</p>
    </div>
  );
}
function WordCard({ word }) {
  const [stars, setStars] = useStored("workspace:stars", []);
  const d = dictionary[word];
  return (
    <>
      <div className="word-title">
        <h2>{word}</h2>
        <IconButton
          label="Star word"
          onClick={() =>
            setStars(
              stars.includes(word)
                ? stars.filter((w) => w !== word)
                : [...stars, word],
            )
          }
        >
          <Star fill={stars.includes(word) ? "#e5b844" : "none"} />
        </IconButton>
      </div>
      {d ? (
        <>
          <p>{d.definition}</p>
        </>
      ) : (
        <p>No definition found.</p>
      )}
    </>
  );
}
function ReadingQuestions({ input, answers, update, revealed }) {
  return (
    <>
      <b>Questions 1–7</b>
      <p>Complete the notes below.</p>
      <p>
        Choose <b>ONE WORD ONLY</b> from the passage for each answer.
      </p>
      <p>Write your answers in boxes 1–7 on your answer sheet.</p>
      <div className="question-box">
        <h2 className="center">Gwendoline and Margaret Davies</h2>
        <b>Family and early life</b>
        <ul>
          <li>
            their grandfather's wealth came from {input(1)} and transportation
            businesses
          </li>
          <li>their upbringing gave them a sense of social responsibility</li>
          <li>
            their {input(2)} was designed to give them an interest in activities
            such as collecting art
          </li>
          <li>their governess took them on trips to art galleries</li>
          <li>
            they took lengthy {input(3)} about the things they saw in art
            galleries
          </li>
        </ul>
        <b>The sisters as art collectors</b>
        <ul>
          <li>
            their {input(4)} showed they liked Old Master paintings, but they
            were expensive to buy
          </li>
          <li>their early purchases were safe, popular paintings</li>
          <li>
            the first Impressionist paintings they bought showed places in{" "}
            {input(5)}
          </li>
        </ul>
        <b>Impact of First World War</b>
        <ul>
          <li>they helped bring artists from Belgium to Wales</li>
          <li>they worked in a {input(6)} for soldiers in France</li>
        </ul>
        <b>Opinions about the sisters as art collectors</b>
        <ul>
          <li>
            were not considered typical collectors – they lived in isolation in
            the countryside and did not have any {input(7)} who were artists
          </li>
        </ul>
      </div>
      <p>
        <b>Questions 8–13</b>
      </p>
      <p>
        Do the following statements agree with the information given in Reading
        Passage 1?
      </p>
      <p>
        <b>TRUE</b> if the statement agrees with the information
        <br />
        <b>FALSE</b> if the statement contradicts the information
        <br />
        <b>NOT GIVEN</b> if there is no information on this
      </p>
      {readingStatements.map((s, i) => (
        <fieldset key={i}>
          <legend>
            <b>{i + 8}</b> {s}
          </legend>
          {["TRUE", "FALSE", "NOT GIVEN"].map((v) => (
            <label key={v}>
              <input
                type="radio"
                name={`q${i + 8}`}
                checked={answers[i + 8] === v}
                onChange={() => update(i + 8, v)}
              />
              {v}
            </label>
          ))}
          {revealed && (
            <small className="solution">
              Correct answer: {readingKeys[i + 7]}
            </small>
          )}
        </fieldset>
      ))}
    </>
  );
}
function SailingQuestions({ input }) {
  return (
    <>
      <b>Questions 1–6</b>
      <p>Complete the table below.</p>
      <p>
        Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.
      </p>
      <h1 className="center">Oyster Bay Sailing Club Courses</h1>
      <table className="exam-table">
        <thead>
          <tr>
            {[
              "Name of course",
              "What you learn",
              "Cost",
              "Other information",
            ].map((s) => (
              <th key={s}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Taster day</td>
            <td>introduction to sailing</td>
            <td>£120 if booking one place</td>
            <td>small groups (max {input(1)} people)</td>
          </tr>
          <tr>
            <td>Level 1</td>
            <td>
              <ul>
                <li>
                  basic theory e.g. understanding the {input(2)} and tides
                </li>
                <li>basic sailing skills including {input(3)} information</li>
              </ul>
            </td>
            <td>
              <ul>
                <li>£200</li>
                <li>{input(4)} available for club members</li>
                <li>all inclusive (plus a useful {input(5)})</li>
              </ul>
            </td>
            <td>a {input(6)} at the end of the course for all participants</td>
          </tr>
        </tbody>
      </table>
      <p>
        <b>Questions 7–10</b>
      </p>
      <p>Complete the notes below.</p>
      <p>
        Write <b>ONE WORD ONLY</b> for each answer.
      </p>
      <div className="question-box inset">
        <b>General information</b>
        <ul>
          <li>Participants must be able to swim.</li>
          <li>
            Bring suitable clothing, a {input(7)} and toiletries (e.g. shampoo).
          </li>
          <li>There is a {input(8)} at the club.</li>
          <li>Online training {input(9)} are recommended.</li>
          <li>{input(10)} are available for course participants.</li>
        </ul>
      </div>
    </>
  );
}
function RestaurantQuestions({ input }) {
  return (
    <>
      <b>Questions 1–10</b>
      <p>Complete the table below.</p>
      <p>
        Write <b>ONE WORD AND/OR A NUMBER</b> for each answer.
      </p>
      <table className="exam-table">
        <thead>
          <tr>
            {[
              "Name of restaurant",
              "Location",
              "Reason for recommendation",
              "Other comments",
            ].map((s) => (
              <th key={s}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>The Junction</td>
            <td>Greyson Street, near the station</td>
            <td>Good for people who are especially keen on {input(1)}</td>
            <td>
              <ul>
                <li>Quite expensive</li>
                <li>The {input(2)} is a good place for a drink</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td>Paloma</td>
            <td>In Bow Street next to the cinema</td>
            <td>{input(3)} food, good for sharing</td>
            <td>
              <ul>
                <li>Staff are very friendly</li>
                <li>Need to pay £50 deposit</li>
                <li>A limited selection of {input(4)} food on the menu</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td>The {input(5)}</td>
            <td>At the top of a {input(6)}</td>
            <td>
              <ul>
                <li>A famous chef</li>
                <li>All the {input(7)} are very good</li>
                <li>Only uses {input(8)} ingredients</li>
              </ul>
            </td>
            <td>
              <ul>
                <li>Set lunch costs £{input(9)} per person</li>
                <li>Portions probably of {input(10)} size</li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
function WritingEditor({ r, setToast, task, release, draftKey }) {
  const canAssess = !!(task?.prompt && task?.assessmentAvailable);
  const assessment = usePracticeAssessment(r, release, canAssess);
  const [essay, setEssay] = useStored(`${draftKey}:essay:${r.part}`, ""),
    [versions, setVersions] = useStored(
      `${draftKey}:versions:${r.part}`,
      [],
    ),
    [savedAt, setSavedAt] = useStored(
      `${draftKey}:savedAt:${r.part}`,
      null,
    );
  const count = wordCount(essay);
  async function submit() {
    if (!canAssess) { setToast("Feedback is unavailable until the full task prompt is imported."); return; }
    if (!count) {
      setToast("Please input your response.");
      return;
    }
    setVersions((v) => [{ text: essay, time: new Date().toISOString() }, ...v]);
    const success = await assessment.run({ text: essay, prompt: task.assessmentPrompt || task.prompt });
    if (success) setToast('Your practice feedback is ready.');
  }
  return (
    <>
      {essay && savedAt && (
        <div className="autosaved">Autosaved @ {dateLabel(savedAt)}.</div>
      )}
      <p>{canAssess ? "Your response is saved to your account when submitted. Text is sent to OpenAI for automated feedback." : task?.prompt && r.part === 1 ? "Drafts are saved in this browser. Automated feedback for chart tasks is not available yet." : "Drafts are saved in this browser. Automated feedback is unavailable until the full task prompt is imported."}</p>
      <textarea
        className="essay"
        placeholder="Please input"
        aria-label="Please input"
        value={essay}
        onChange={(e) => {
          setEssay(e.target.value);
          setSavedAt(new Date().toISOString());
        }}
      />
      <div className="editor-footer">
        <span>Words: {count}</span>
        <button className="pill green" disabled={!canAssess || assessment.busy || !count} onClick={submit}>
          Submit for Feedback
        </button>
      </div>
      <details open>
        <summary>Writing Feedback</summary>
        <PracticeFeedback assessment={assessment} onRestore={value => { setEssay(value); setSavedAt(new Date().toISOString()); }} />
      </details>
      {versions.length > 0 &&
        new URLSearchParams(location.search).has("dev") && (
          <details>
            <summary>Saved versions ({versions.length})</summary>
            {versions.map((v, i) => (
              <button
                className="version"
                key={v.time}
                onClick={() => setEssay(v.text)}
              >
                Version {versions.length - i} · {dateLabel(v.time)} ·{" "}
                {wordCount(v.text)} words
              </button>
            ))}
          </details>
        )}
    </>
  );
}
function SpeakingEditor({ r, setToast, onComplete, library, draftKey }) {
  const assessment = usePracticeAssessment(r, library.release, true, draftKey);
  const d = { questions: library.topic.questions.map(speakingQuestionText) },
    [question, setQuestion] = useState(0),
    [played, setPlayed] = useState(false),
    [playing, setPlaying] = useState(false),
    [recording, setRecording] = useState(false),
    [transcript, setTranscript] = useStored(
      `${draftKey}:transcript:${r.part}`,
      "",
    ),
    [live, setLive] = useState(false),
    [clips, setClips] = useState([]),
    [done, setDone] = useState(false);
  const recorder = useRef(null),
    stream = useRef(null),
    urls = useRef([]),
    examinerAudio = useRef(null);
  const [audioError, setAudioError] = useState(false), [duration, setDuration] = useState(0);
  const questionAudio = library.topic.questions[question]?.audio;
  const instructionAudio = !questionAudio && !!library.topic.introAudio;
  const audioSrc = questionAudio || library.topic.introAudio;
  useEffect(() => {
    const audio = examinerAudio.current;
    setPlayed(false); setPlaying(false); setAudioError(false); setDuration(0);
    return () => { audio?.pause(); };
  }, [audioSrc, question]);
  useEffect(() => {
    setQuestion(0);
    setPlayed(false);
    setClips([]);
    setDone(false);
    return () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      urls.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [r.type, r.book, r.test, r.part]);
  async function record() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      let chunks = [];
      const rec = new MediaRecorder(stream.current);
      recorder.current = rec;
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType });
        const url = URL.createObjectURL(blob);
        urls.current.push(url);
        setClips((c) => [...c, { question, url, blob }]);
        stream.current.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      setRecording(true);
    } catch (e) {
      setToast(
        "Microphone unavailable. Allow microphone access to record your answer.",
      );
    }
  }
  if (done)
    return (
      <>
        <div className="speaking-complete">
          <p>This is the end of part {r.part}.</p>
          <p>All questions are completed.</p>
        </div>
        <p className="retention-note">
          Submitted recordings are private and available for seven days. Your
          saved transcript and feedback remain in your account.
        </p>
        <PracticeFeedback assessment={assessment} />
      </>
    );
  return (
    <>
      <p>Finish practice to save recordings privately and send audio to OpenAI for transcription and automated feedback. Unsubmitted recordings are lost when you leave this part.</p>
      <PracticeFeedback assessment={assessment} />
      <div className="live">
        <button
          className="blue-chip"
          aria-pressed={live}
          onClick={() => setLive(!live)}
        >
          ◉ Live Transcript
        </button>
      </div>
      <div className="speaking-controls">
        {audioSrc && <audio key={`${library.topic.id}-${question}`} ref={examinerAudio} src={audioSrc} preload="metadata" onLoadedMetadata={e => setDuration(e.currentTarget.duration)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setPlayed(true); }} onError={() => { setPlaying(false); setAudioError(true); }} />}
        <IconButton
          label={playing ? "Pause examiner audio" : instructionAudio ? "Play examiner instructions" : "Play examiner audio"}
          disabled={!audioSrc || recording || assessment.busy}
          onClick={async () => {
            if (playing) { examinerAudio.current?.pause(); return; }
            setAudioError(false);
            try { await examinerAudio.current?.play(); } catch { setPlaying(false); setAudioError(true); }
          }}
        >
          {playing ? <Volume2 /> : <Play />}
        </IconButton>
        <span>{Number.isFinite(duration) ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}` : "0:00"}</span>
        <IconButton
          label={recording ? "Stop recording" : "Record answer"}
          disabled={(!played && !!questionAudio && !audioError) || playing || assessment.busy}
          onClick={record}
        >
          {recording ? <Square fill="#bc3036" /> : played || !questionAudio || audioError ? <Mic /> : <Hand />}
        </IconButton>
        {played && <span>{r.part === 2 ? "2:00" : "0:45"}</span>}
        <p>
          {recording ? "Recording your answer…" : instructionAudio && !audioError ? "Examiner instructions audio is available. Read the cue-card topic below before recording." : !audioSrc || audioError
            ? "Examiner audio is unavailable. Read the prompt and record your answer."
            : !played ? "Please play the examiner's audio first." : "Keep it up!"}
        </p>
      </div>
      <div className="current-question">{d.questions[question]}</div>
      {live && (
        <div className="live-transcript" aria-live="polite">
          {transcript}
        </div>
      )}
      <div className="recordings">
        {clips.map((c, i) => (
          <div key={c.url}>
            <p>Question {c.question + 1}</p>
            <audio controls src={c.url} />
            <a
              href={c.url}
              download={`speaking-part-${r.part}-question-${c.question + 1}.webm`}
            >
              Download recording
            </a>
          </div>
        ))}
      </div>
      {clips.length > 0 && (
        <div className="speaking-next">
          <button
            disabled={question === 0 || recording || assessment.busy}
            onClick={() => {
              setQuestion(question - 1);
              setPlayed(false);
            }}
          >
            Previous question
          </button>
          <button
            disabled={!clips.some((c) => c.question === question) || recording || assessment.busy}
            onClick={async () => {
              if (question < d.questions.length - 1) {
                setQuestion(question + 1);
                setPlayed(false);
              } else {
                const selected = d.questions.map((_, question) => [...clips].reverse().find(clip => clip.question === question)).filter(Boolean);
                if (selected.length !== d.questions.length) { setToast('Record an answer for every question first.'); return; }
                const success = await assessment.run({ text: transcript, prompt: d.questions.join('\n'), clips: selected });
                if (success) { setDone(true); onComplete?.(); setToast('Your practice feedback is ready.'); }
              }
            }}
          >
            {question === d.questions.length - 1
              ? "Finish practice"
              : "Next question"}
          </button>
        </div>
      )}
    </>
  );
}
function Scores({ r, Link }) {
  const read = useRead();
  const { listeningLibrary, readingLibrary } = useContext(WorkspaceContext);
  const a = read(`${storageKey({ ...r, skill: "listening" })}:library:${practiceRelease(listeningLibrary?.data)}`, {}),
    b = read(`${storageKey({ ...r, skill: "reading" })}:library:${practiceRelease(readingLibrary?.data)}`, {}),
    lk = completeListeningKeys(listeningLibrary?.data),
    rk = completeListeningKeys(readingLibrary?.data, 3),
    valid = !!(lk || rk),
    l = lk ? band(grade(a, lk)) : 0,
    rd = rk ? band(grade(b, rk)) : 0;
  const [show, setShow] = useState({ listening: false, reading: false });
  const stats = {
    Listening: answerStats(a, lk || []),
    Reading: answerStats(b, rk || []),
  };
  return (
    <main className="scores">
      <h2>
        {r.type === "academic" ? "Academic" : "General Training"} {r.book} Test{" "}
        {r.test}
      </h2>
      <div className="score-grid">
        {[
          ["Listening", l],
          ["Overall", 0],
          ["Reading", rd],
          ["Writing", 0],
          ["Speaking", 0],
        ].map(([label, value]) => (
          <article className={label === "Overall" ? "overall" : ""} key={label}>
            <h3>{label}</h3>
            <strong>{(label === "Listening" && !lk || label === "Reading" && !rk) ? "—" : value.toFixed(1)}</strong>
            {(label === "Listening" || label === "Reading") && (
              <small>
                ✓ {stats[label].correct}
                <br />⊗ {stats[label].incorrect}
                <br />⊖ {stats[label].unanswered}
              </small>
            )}
          </article>
        ))}
      </div>
      {!valid && (
        <p className="hint">
          Answer keys for this test have not been imported. No score can be
          calculated.
        </p>
      )}
      {valid &&
        ["listening", "reading"].map((skill) => {
          let data = skill === "listening" ? a : b,
            keys = skill === "listening" ? lk : rk;
          if (!keys)
            return (
              <section key={skill}>
                <Link className="pill" to={testPath(r, skill)}>
                  {cap(skill)} <ArrowRight size={16} />
                </Link>
                <p>{skill === "listening" ? "A band score requires all 40 answer keys. Review available keys within each part." : "No answer data available"}</p>
              </section>
            );
          return (
            <section key={skill}>
              <Link className="pill" to={testPath(r, skill)}>
                {cap(skill)} <ArrowRight size={16} />
              </Link>
              <label className="toggle">
                <input
                  role="switch"
                  type="checkbox"
                  checked={show[skill]}
                  onChange={(e) =>
                    setShow({ ...show, [skill]: e.target.checked })
                  }
                />
                Show answers for unanswered
              </label>
              <table className="review-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>My Answer</th>
                    <th>Correct Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key, i) => (
                    <tr
                      key={i}
                      className={
                        !data[i + 1]
                          ? "unanswered"
                          : isCorrect(data[i + 1], key)
                            ? "correct-row"
                            : "incorrect-row"
                      }
                    >
                      <td>{i + 1}</td>
                      <td>{data[i + 1] || "-"}</td>
                      <td>
                        <span
                          className={
                            !hasAnswer(data[i + 1]) && !show[skill]
                              ? "blurred"
                              : ""
                          }
                        >
                          {key ? key.replaceAll("|", " | ") : "Key not available"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      {["writing", "speaking"].map((skill) => (
        <section key={skill}>
          <Link className="pill" to={testPath(r, skill)}>
            {cap(skill)} <ArrowRight size={16} />
          </Link>
          {Array.from(
            { length: skill === "writing" ? 2 : 3 },
            (_, i) => i + 1,
          ).map((part) => (
            <h3 key={part}>
              <Link to={testPath(r, skill, part)}>
                {cap(skill)} Task {part} Band Score: 0.0
              </Link>
            </h3>
          ))}
        </section>
      ))}
      <nav className="bottom-nav">
        <Link
          to={testPath(
            r,
            r.type === "general-training" ? "reading" : "speaking",
          )}
        >
          {r.type === "general-training" ? "Reading" : "Speaking"}
        </Link>
        <button
          className="solid"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Back to Top
        </button>
        <Link
          to={testPath(
            r,
            r.type === "general-training" ? "reading" : "listening",
          )}
        >
          {r.type === "general-training" ? "Reading" : "Listening"}
        </Link>
      </nav>
    </main>
  );
}
