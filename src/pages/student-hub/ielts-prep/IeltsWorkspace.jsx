import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
} from "react";
import { Logo } from "../../../components/logos";
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
  listeningKeys,
  writingPrompts,
  writingSamples,
  dictionary,
  homeAudio,
  restaurantAudio,
  answerKeys,
} from "./content.js";
import "./style.css";
import {
  generalPassages,
  GeneralReadingQuestions,
} from "./general-reading.jsx";
import { ExtraListeningQuestions } from "./listening-extra.jsx";
import { extraPassages, ExtraReadingQuestions } from "./reading-extra.jsx";
import { WritingFeedback, SpeakingFeedback } from "./feedback.jsx";

const WorkspaceContext = createContext(null);
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
  const { path, navigate, href, profile, storagePrefix, onStorageError } =
    useContext(WorkspaceContext);
  const [dark, setDark] = useStored("workspace:dark", false),
    [modal, setModal] = useState(null),
    [menu, setMenu] = useState(false),
    [toast, setToast] = useState("");
  const pagePath = path.split("?")[0];
  const r = route(path);
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
    <div className={`ielts-workspace${dark ? " dark" : ""}`}>
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
              onClick={() => go("/student-hub")}
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
                    <button onClick={() => go("/student-hub")}>
                      Back to main menu
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </header>
      {pagePath === "/" ? (
        <Home Link={Link} profile={profile} {...ctx} />
      ) : pagePath === "/ielts/practice/home" ||
        pagePath === "/ielts/practice/general-training" ? (
        <Catalog
          type={
            pagePath.endsWith("general-training")
              ? "general-training"
              : "academic"
          }
          Link={Link}
        />
      ) : pagePath === "/ielts/vocabulary" ? (
        <Vocabulary {...ctx} />
      ) : r ? (
        r.skill === "score" ? (
          <Scores r={r} Link={Link} />
        ) : (
          <Practice
            key={`${r.type}-${r.book}-${r.test}-${r.skill}`}
            r={r}
            {...ctx}
          />
        )
      ) : (
        <InfoPage path={pagePath} Link={Link} />
      )}
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
function Home({ Link, setToast, profile }) {
  const read = useRead();
  const last = profile ? read("workspace:last", null) : null;
  const [answer, setAnswer] = useState(""),
    [reveal, setReveal] = useState(false);
  return (
    <main className="home">
      <section className="home-card">
        <div className="home-sample">
          <h2 className="green-rule">
            <Link to="/ielts/practice/academic/19/2/listening/1">
              Inside Coleman's Guitar Experience
            </Link>
          </h2>
          <audio controls src={homeAudio} />
          <details open>
            <summary>Audioscript</summary>
            <div className="transcript">
              <p>
                <b>WOMAN:</b> <mark>Really?</mark> So, who runs the classes?
              </p>
              <p>
                <b>COLEMAN:</b> He's called a coordinator. His name's Gary
                Mathieson.
              </p>
              <p>
                <b>WOMAN:</b> Let me note that down. Gary, how do you spell his
                surname?
              </p>
              <p>
                <b>COLEMAN:</b> It's MATHIESON.
              </p>
            </div>
          </details>
          <div className="demo-answer">
            <b>Coordinator: Gary</b>
            <input
              aria-label="Coordinator surname"
              placeholder="1"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <IconButton
              label="Show correct answer"
              onClick={() => {
                setReveal(!reveal);
                setToast(
                  answer.toLowerCase() === "mathieson"
                    ? "Correct!"
                    : "Correct answer: Mathieson",
                );
              }}
            >
              <KeyRound size={14} />
            </IconButton>
            {reveal && <span>Mathieson</span>}
          </div>
        </div>
        <div>
          <h1>IELTS Practice Tests</h1>
          <div className="covers">
            {["21", "18", "og"].map((b) => (
              <Link key={b} to={`/ielts/practice/academic/${b}/1/listening/1`}>
                <img
                  src={`/ielts-assets/cover-${b}.jpg`}
                  alt={`IELTS Academic ${b === "og" ? "Official Guide" : b}`}
                />
              </Link>
            ))}
          </div>
          <div className="release">
            <Link to="/ielts/practice/academic/21/1/reading/1">
              ✨ IELTS 21 has been released.
            </Link>
            <Link to="/ielts/practice/general-training">General Training</Link>
          </div>
          <div className="last">
            <span>My Last Practice</span>
            {last && <Link to={last.path}>{last.title}</Link>}
          </div>
          <Link className="pill red" to="/ielts/practice/home">
            More Practice Tests <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <section className="home-card second">
        <div>
          <h1>Vocabulary in IELTS</h1>
          <h2>misfit</h2>
          <p>
            When one mentions pirates, an image springs to most people's minds
            of a crew of misfits, daredevils and adventurers in command of a
            tall sailing ship in the Caribbean Sea.
          </p>
          <Link
            className="small-link"
            to="/ielts/practice/academic/19/1/reading/2"
          >
            Academic 19 Test 1 Reading 2 ↗
          </Link>
          <h2>inadvertent</h2>
          <p>
            Moreover, people inadvertently have been sharing inaccurate
            information with one another for thousands of years.
          </p>
          <Link
            className="small-link"
            to="/ielts/practice/academic/19/1/reading/3"
          >
            Academic 19 Test 1 Reading 3 ↗
          </Link>
          <p>
            <Link className="pill" to="/ielts/vocabulary">
              My Starred Words <ArrowRight size={17} />
            </Link>
          </p>
        </div>
        <div className="home-sample">
          <h2 className="green-rule">
            <Link to="/ielts/practice/academic/18/4/reading/2">
              The Growth Mindset
            </Link>
          </h2>
          <p>
            <mark>
              A major focus of the growth mindset in schools is coaxing students
              away from seeing failure as an indication of their ability, and
              towards seeing it as a chance to improve that ability.
            </mark>{" "}
            <sup>15</sup> As educationalist Jeff Howard noted several decades
            ago: "Smart is not something that you just are, smart is something
            that you can get."
          </p>
          <h2 className="green-rule">
            <Link to="/ielts/practice/academic/19/2/reading/2">
              Athletes and Stress
            </Link>
          </h2>
          <p>
            Anxiety can increase heart rate and perspiration, cause heart
            palpitations, muscle tremors and shortness of breath, as well as
            headaches, nausea, stomach pain, weakness and a desire to escape in
            more extreme cases.
          </p>
        </div>
      </section>
      <footer>
        {["About", "Privacy", "Terms"].map((s) => (
          <Link key={s} to={`/${s.toLowerCase()}`}>
            {s}
          </Link>
        ))}
      </footer>
    </main>
  );
}
function Catalog({ type, Link }) {
  const years = {
    21: 2026,
    20: 2025,
    19: 2024,
    18: 2023,
    17: 2022,
    16: 2021,
    15: 2020,
    14: 2019,
    13: 2018,
    12: 2017,
    11: 2016,
    10: 2015,
    9: 2013,
    8: 2011,
    7: 2009,
    6: 2007,
    5: 2006,
    4: 2005,
    3: 2002,
    2: 2000,
    1: 1996,
    eg: 2014,
    og: 2014,
  };
  return (
    <main className="catalog">
      {(type === "academic"
        ? [...Array.from({ length: 21 }, (_, i) => 21 - i), "eg", "og"]
        : [...Array.from({ length: 8 }, (_, i) => 21 - i), 10]
      ).map((book) => (
        <section key={book}>
          <h2 className={+book >= 19 ? "recent" : ""}>
            IELTS {typeof book === "string" ? book.toUpperCase() : book}{" "}
            {type === "academic" ? "Academic" : "General Training"}{" "}
            {years[book] || ""}
            {book === 21 && <span> ✨</span>}
          </h2>
          <div className="test-cards">
            {Array.from(
              {
                length:
                  book === "og"
                    ? 8
                    : type === "general-training" && book === 10
                      ? 2
                      : 4,
              },
              (_, i) => i + 1,
            ).map((test) => (
              <article className="test-card" key={test}>
                <Link
                  className="test-heading"
                  to={testPath({ type, book, test }, "score")}
                >
                  Test {test}
                </Link>
                <div>
                  {(type === "general-training" ? ["reading"] : skills).map(
                    (skill) => (
                      <Link
                        key={skill}
                        to={testPath({ type, book, test }, skill)}
                      >
                        {cap(skill)}
                      </Link>
                    ),
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
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
        Practice content and feedback currently use representative samples.
        Writing and speaking bands are sample feedback, not an assessment.
      </p>
      <Link to="/ielts/practice/home">Browse practice tests</Link>
    </main>
  );
}
function ListeningAudio({ src = restaurantAudio }) {
  const [tips, setTips] = useState(false),
    [source, setSource] = useState(0);
  const [stamp] = useState(() => Date.now());
  const urls = [
    src,
    src + "?ts=" + stamp,
    src.replace("https://oss.jumpinto.com/", "https://www.jumpinto.com/"),
  ];
  return (
    <>
      <div className="audio-row">
        <audio controls src={urls[source]} />
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
  const { storagePrefix, onStorageError } = useContext(WorkspaceContext);
  const currentPassage =
    r.type === "general-training"
      ? generalPassages[r.part]
      : r.part === 1
        ? passage
        : extraPassages[r.part];
  const mock = new URLSearchParams(location.search).get("mode") === "mock";
  const [answers, setAnswers] = useStored(storageKey(r), {}),
    [revealed, setRevealed] = useState(false),
    [notesOn, setNotesOn] = useState(false),
    [dictionaryOn, setDictionaryOn] = useStored("workspace:dictionary", true),
    [guided, setGuided] = useState(false),
    [notes, setNotes] = useStored(`${storageKey(r)}:annotations:${r.part}`, {}),
    [highlights, setHighlights] = useStored(
      `${storageKey(r)}:highlights:${r.part}`,
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
  const imported = r.type === "academic" || r.skill === "reading";
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
                Object.entries(a).filter(([n]) => +n <= start || +n > end),
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
                  `${storageKey(r)}:${r.skill === "writing" ? "essay" : "transcript"}:${part}`,
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
          revealed
            ? isCorrect(answers[n], (answerKeys(r) || [])[n - 1] || "")
              ? "correct"
              : "incorrect"
            : ""
        }
      />
      {revealed && <small>{(answerKeys(r) || [])[n - 1]}</small>}
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
        guided && evidence.find(([phrase]) => sentence.includes(phrase));
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
            <Missing r={r} />
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
                {r.type === "general-training"
                  ? `Read the text below and answer Questions ${partRange(r)[0] + 1}–${partRange(r)[1]}.`
                  : `You should spend about 20 minutes on Questions ${partRange(r)[0] + 1}–${partRange(r)[1]}, which are based on Reading Passage ${r.part}.`}
              </p>
              <h1 className="center">{currentPassage.title}</h1>
              {currentPassage.subtitle && (
                <p className="subtitle">{currentPassage.subtitle}</p>
              )}
              <div onClick={onWord} onContextMenu={contextMenu}>
                {currentPassage.paragraphs.map((p, i) => (
                  <p key={i}>
                    {p.includes("\n") ? (
                      <>
                        <b className="section-letter">{p.split("\n")[0]}</b>
                        {paragraph(p.split("\n").slice(1).join("\n"), i)}
                      </>
                    ) : (
                      paragraph(p, i)
                    )}
                  </p>
                ))}
              </div>
              {r.type === "academic" && r.part === 1 && (
                <>
                  <h3>Glossary</h3>
                  <p>
                    * philanthropic: seeking to promote the welfare of others,
                    often by charitable funding
                  </p>
                </>
              )}
            </>
          ) : r.skill === "listening" ? (
            <>
              <h2>PART {r.part}</h2>
              {r.book === "20" && r.part === 1 ? (
                <>
                  <ListeningAudio />
                  <details>
                    <summary>Audioscript</summary>
                    <h1>Restaurant Recommendations for a Celebration</h1>
                    <p>
                      <b>WOMAN:</b> I've been meaning to ask you for some advice
                      about restaurants. I need to book somewhere to celebrate
                      my sister's 30th birthday.
                    </p>
                    <p>
                      <b>MAN:</b> The Junction? Yeah, I'd definitely recommend
                      that for a special occasion. It's on Greyson Street, only
                      about a 2 minute walk from the station.
                    </p>
                  </details>
                </>
              ) : (
                <>
                  <ListeningAudio
                    src={
                      r.book === "20" && r.part === 3
                        ? "https://oss.jumpinto.com/resource/exam/ielts/audio/a20/a20t1l3.mp3"
                        : homeAudio
                    }
                  />
                  <details>
                    <summary>Audioscript</summary>
                    <h1>Listening practice</h1>
                    <p>
                      <b>WOMAN:</b> So, who runs the classes?
                    </p>
                    <p>
                      <b>COLEMAN:</b> His name is Gary Mathieson.
                    </p>
                  </details>
                </>
              )}
            </>
          ) : r.skill === "writing" ? (
            <WritingPrompt r={r} />
          ) : (
            <SpeakingPrompt r={r} />
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
            r.type === "general-training" ? (
              <GeneralReadingQuestions
                part={r.part}
                input={input}
                answers={answers}
                update={update}
              />
            ) : r.part === 1 ? (
              <ReadingQuestions
                input={input}
                answers={answers}
                update={update}
                revealed={revealed}
              />
            ) : (
              <ExtraReadingQuestions
                part={r.part}
                input={input}
                answers={answers}
                update={update}
              />
            )
          ) : r.skill === "listening" ? (
            r.part !== 1 ? (
              <ExtraListeningQuestions
                part={r.part}
                input={input}
                answers={answers}
                update={update}
                updateGroup={updateGroup}
              />
            ) : r.book === "20" ? (
              <RestaurantQuestions input={input} />
            ) : (
              <SailingQuestions input={input} />
            )
          ) : r.skill === "writing" ? (
            <WritingEditor key={resetVersion} r={r} setToast={setToast} />
          ) : (
            <SpeakingEditor
              key={resetVersion}
              r={r}
              setToast={setToast}
              onComplete={() => setSpeakingCompleted(true)}
            />
          )}
        </section>
      </main>
      {mock && ["listening", "reading"].includes(r.skill) ? (
        <nav className="bottom-nav question-strip">
          {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={answers[n] ? "answered" : ""}
              onClick={() => {
                const part = partForQuestion(r, n);
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
                      length:
                        r.skill === "listening"
                          ? 4
                          : r.skill === "writing"
                            ? 2
                            : r.type === "general-training" &&
                                r.skill === "reading"
                              ? 5
                              : 3,
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
  const [show, setShow] = useState(false),
    keys = answerKeys(r);
  const [start, end] = partRange(r);
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
            {keys.slice(start, end).map((key, i) => {
              const n = start + i + 1;
              return (
                <tr
                  key={n}
                  className={
                    !answers[n]
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
                      {key.replaceAll("|", " | ")}
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
function WritingPrompt({ r }) {
  return (
    <>
      <h2>TASK {r.part}</h2>
      <p>
        You should spend about {r.part === 1 ? 20 : 40} minutes on this task.
      </p>
      {r.part === 2 && <p>Write about the following topic:</p>}
      <div className="writing-prompt">
        <p>{writingPrompts[r.part - 1]}</p>
        <p>
          {r.part === 1
            ? "Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
            : "To what extent do you agree or disagree with this statement?"}
        </p>
      </div>
      {r.part === 2 && (
        <p>
          Give reasons for your answer and include any relevant examples from
          your own knowledge or experience.
        </p>
      )}
      <p>Write at least {r.part === 1 ? 150 : 250} words.</p>
      {r.part === 1 && (
        <img
          className="writing-chart"
          src="/ielts-assets/writing-21-1.jpg"
          alt="Number of jobs in four sectors of the economy in the US, 1960–2020"
        />
      )}
      <details open className="sample-writing">
        <summary>Sample Writing Answer</summary>
        <h2 className="center">
          {r.part === 1
            ? "Number of Jobs in Four US Economic Sectors (1960-2020)"
            : "Building Tall Apartment Blocks to Provide Enough Homes in Large Cities"}
        </h2>
        {writingSamples[r.part - 1].split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </details>
    </>
  );
}
function WritingEditor({ r, setToast }) {
  const [essay, setEssay] = useStored(`${storageKey(r)}:essay:${r.part}`, ""),
    [versions, setVersions] = useStored(
      `${storageKey(r)}:versions:${r.part}`,
      [],
    ),
    [savedAt, setSavedAt] = useStored(
      `${storageKey(r)}:savedAt:${r.part}`,
      null,
    ),
    [review, setReview] = useState(
      new URLSearchParams(location.search).get("feedback") === "demo"
        ? { essay: writingSamples[r.part - 1] }
        : null,
    );
  useEffect(
    () =>
      setReview(
        new URLSearchParams(location.search).get("feedback") === "demo"
          ? { essay: writingSamples[r.part - 1] }
          : null,
      ),
    [r.part],
  );
  const count = wordCount(essay);
  function submit() {
    if (!count) {
      setToast("Please input your response.");
      return;
    }
    setVersions((v) => [{ text: essay, time: new Date().toISOString() }, ...v]);
    setReview({ essay });
    setToast("Showing sample feedback layout. No AI assessment was performed.");
  }
  return (
    <>
      {essay && savedAt && (
        <div className="autosaved">Autosaved @ {dateLabel(savedAt)}.</div>
      )}
      <div className="quota">0/2 writing feedbacks finished in 20 minutes.</div>
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
        <button className="pill green" onClick={submit}>
          Submit for Feedback
        </button>
      </div>
      <details open>
        <summary>Writing Feedback</summary>
        {review && <WritingFeedback essay={review.essay} />}
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
const speakingData = {
  1: {
    title: "Hairstyles",
    intro:
      "The examiner asks you about yourself, your home, work or studies and other familiar topics.",
    questions: [
      "Where do you go to get a haircut?",
      "Have you changed your hairstyle recently?",
      "Would you ever change the colour of your hair?",
      "Do you enjoy going to the hairdresser/barber?",
    ],
  },
  2: {
    title: "A time when you used information for tourists",
    intro:
      "You will have to talk about the topic for one to two minutes. You have one minute to think about what you are going to say. You can make some notes to help you if you wish.",
    questions: [
      "Describe a time when you used information for tourists, for example from a guidebook or online. You should say: where you got this information, what place this information was about, what information you got, and explain whether this information was very helpful for you.",
    ],
  },
  3: {
    title: "Different types of holidays & Tourist attractions",
    questions: [
      "What are the most popular kinds of holidays for people from your country to go on?",
      "Do you think most people prefer to have a holiday abroad rather than in their own country?",
      "Why do some people want to do absolutely nothing when they go away on holiday?",
      "What are the kinds of tourist attraction that visitors to your country like to see?",
      "Do you think tourist attractions such as museums should be free for local people to visit?",
      "What can make a tourist attraction disappointing for visitors?",
    ],
  },
};
const cities = {
  ...speakingData[1],
  title: "Cities",
  questions: [
    "How well do you know the capital city of your country?",
    "Do you think cities are exciting places to live?",
    "Why do some people dislike living in a city?",
    "If you could visit any city in the world, where would you go?",
  ],
};
const getSpeaking = (r) => (r.test === 2 ? cities : speakingData[r.part]);
function SpeakingPrompt({ r }) {
  let d = getSpeaking(r);
  return (
    <>
      <h2>PART {r.part}</h2>
      {d.intro && <p>{d.intro}</p>}
      <h2>
        {r.part === 1 ? "EXAMPLE" : r.part === 3 ? "Discussion topics:" : ""}
      </h2>
      <h1>{d.title}</h1>
      <p>
        {r.part === 1
          ? d.title
          : r.part === 2
            ? "Describe a time when you used information for tourists, for example from a guidebook or online."
            : "Different types of holidays"}
      </p>
      <ul>
        {d.questions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ul>
    </>
  );
}
function SpeakingEditor({ r, setToast, onComplete }) {
  const d = getSpeaking(r),
    [question, setQuestion] = useState(0),
    [played, setPlayed] = useState(false),
    [playing, setPlaying] = useState(false),
    [recording, setRecording] = useState(false),
    [transcript, setTranscript] = useStored(
      `${storageKey(r)}:transcript:${r.part}`,
      "",
    ),
    [live, setLive] = useState(false),
    [clips, setClips] = useState([]),
    [done, setDone] = useState(false);
  const recorder = useRef(null),
    stream = useRef(null),
    urls = useRef([]);
  useEffect(() => {
    setQuestion(0);
    setPlayed(false);
    setClips([]);
    setDone(false);
    return () => {
      speechSynthesis?.cancel();
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      urls.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [r.part]);
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
        const url = URL.createObjectURL(
          new Blob(chunks, { type: rec.mimeType }),
        );
        urls.current.push(url);
        setClips((c) => [...c, { question, url }]);
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
  if (new URLSearchParams(location.search).get("feedback") === "demo" || done)
    return (
      <>
        <div className="quota">0/3 speaking practices finished in 8 hours.</div>
        <div className="speaking-complete">
          <p>This is the end of part {r.part}.</p>
          <p>All questions are completed.</p>
        </div>
        <p className="retention-note">
          Note: Your speaking practice recordings can be played back for 7 days.
          After that, only the transcripts will be saved.
        </p>
        <SpeakingFeedback questions={d.questions} />
      </>
    );
  return (
    <>
      <div className="quota">0/3 speaking practices finished in 8 hours.</div>
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
        <IconButton
          label="Play examiner audio"
          disabled={playing || recording}
          onClick={() => {
            setPlaying(true);
            speak(d.questions[question], () => {
              setPlaying(false);
              setPlayed(true);
            });
          }}
        >
          {playing ? <Volume2 /> : <Play />}
        </IconButton>
        <span>
          0:
          {String(
            r.part === 2 ? 27 : r.part === 3 ? 4 : r.test === 2 ? 3 : 2,
          ).padStart(2, "0")}
        </span>
        <IconButton
          label={recording ? "Stop recording" : "Record answer"}
          disabled={!played || playing}
          onClick={record}
        >
          {recording ? <Square fill="#bc3036" /> : played ? <Mic /> : <Hand />}
        </IconButton>
        {played && <span>{r.part === 2 ? "2:00" : "0:45"}</span>}
        <p>
          {!played
            ? "Please play the examiner's audio first."
            : recording
              ? "Recording your answer…"
              : "Keep it up!"}
        </p>
      </div>
      <div className="current-question">{live && transcript}</div>
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
            disabled={question === 0 || recording}
            onClick={() => {
              setQuestion(question - 1);
              setPlayed(false);
            }}
          >
            Previous question
          </button>
          <button
            disabled={!clips.some((c) => c.question === question) || recording}
            onClick={() => {
              if (question < d.questions.length - 1) {
                setQuestion(question + 1);
                setPlayed(false);
              } else {
                setDone(true);
                onComplete?.();
                setToast(
                  "Showing sample feedback layout. No AI assessment was performed.",
                );
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
  const a = read(storageKey({ ...r, skill: "listening" }), {}),
    b = read(storageKey({ ...r, skill: "reading" }), {}),
    lk = answerKeys({ ...r, skill: "listening" }),
    rk = answerKeys({ ...r, skill: "reading" }),
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
            <strong>{value.toFixed(1)}</strong>
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
            keys = answerKeys({ ...r, skill });
          if (!keys)
            return (
              <section key={skill}>
                <Link className="pill" to={testPath(r, skill)}>
                  {cap(skill)} <ArrowRight size={16} />
                </Link>
                <p>No answer data available</p>
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
                          {key.replaceAll("|", " | ")}
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
