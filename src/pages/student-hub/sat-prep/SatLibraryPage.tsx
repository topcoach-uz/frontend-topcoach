/**
 * "My Library" — review-focused content the student saved during tests:
 *   • Vocabulary (words tagged from R&W passages)
 *   • Marked questions (Mark-for-Review, persisted per CB questionId)
 *
 * Both are backend-backed (sat_vocabulary, sat_marked_questions tables).
 * Future tabs can slot in next to these without restructuring the page.
 */

import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetCourseStructureQuery,
  useGetUserProgressQuery,
  useGetEnrollmentStatusQuery,
  type CourseLessonDto,
  useUpdateLessonProgressMutation,
} from "src/app/services/courses";
import "./sat-platform.scss";
import { message } from "antd";
import {
  ArrowRight,
  BookmarkCheck,
  BookOpen,
  Calculator,
  Flag,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useSatSkillCountsQuery } from "src/app/services/sat-prep";
import SatHtml from "src/components/sat-prep/SatHtml";
import {
  ConfirmDialog,
  RunnerModal,
} from "src/components/sat-prep/RunnerModal";
import {
  useClearVocabularyMutation,
  useGetMarkedQuestionsQuery,
  useGetVocabularyQuery,
  useRemoveVocabularyMutation,
  useUnmarkQuestionMutation,
  type MarkedQuestion,
} from "src/app/services/sat-prep/library";
import "src/components/sat-prep/sat-prep-shell.scss";
import "./sat-library.scss";
import "./sat-secondary-pages.scss";
import SatTextLessonReader from "./SatTextLessonReader";

// Illustrative equations from the approved design, not course-progress data.
const LESSON_EXAMPLES: Record<string, string> = {
  "linear equations in one variable": "3x + 5 = 20",
  "linear equations": "3x + 5 = 20",
  "slope and intercept": "y = 2x + 1",
  "linear equations in two variables": "ax + by = c",
  "two variables": "ax + by = c",
  "systems of linear equations": "x + y = 12",
  "systems of equations": "x + y = 12",
  "linear inequalities": "2x + 3 > 11",
};
type Tab = "lessons" | "practice" | "vocabulary" | "marked";
const SatLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (
    ["lessons", "practice", "vocabulary", "marked"].includes(
      params.get("tab") ?? "",
    )
      ? params.get("tab")
      : "lessons"
  ) as Tab;
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [recordOpen] = useUpdateLessonProgressMutation();
  const [topic, setTopic] = useState<string | null>(null);
  const [bankDomain, setBankDomain] = useState<string | null>(null);
  const [recentOnly, setRecentOnly] = useState(false);
  const [subtopic, setSubtopic] = useState("all");
  const [search, setSearch] = useState("");
  const [textLesson, setTextLesson] = useState<CourseLessonDto | null>(null);
  const {
    data: enrollment,
    isLoading: enrollmentLoading,
    isError: enrollmentError,
    refetch: refetchEnrollment,
  } = useGetEnrollmentStatusQuery("sat", { skip: tab !== "lessons" });
  const canLoadLessons =
    enrollment?.isEnrolled === true && enrollment.canAccessLearning === true;
  const skipLessons = tab !== "lessons" || !canLoadLessons;
  const {
    data: modules = [],
    isLoading,
    isError,
    refetch,
  } = useGetCourseStructureQuery("sat", { skip: skipLessons });
  const {
    data: bankSkills = [],
    isLoading: skillsLoading,
    isError: skillsError,
    refetch: refetchSkills,
  } = useSatSkillCountsQuery();
  const { data: progress } = useGetUserProgressQuery("sat", {
    skip: skipLessons,
  });
  const { data: vocab = [] } = useGetVocabularyQuery();
  const { data: marked = [] } = useGetMarkedQuestionsQuery();
  const lessons = modules
    .filter((m) => m.isActive)
    .flatMap((m) =>
      [
        ...m.lessons,
        ...m.submodules.filter((s) => s.isActive).flatMap((s) => s.lessons),
      ]
        .filter((l) => l.isActive)
        .map((l) => ({
          ...l,
          topic: m.id,
          topicTitle:
            m.submodules.find((s) => s.id === l.submoduleId)?.title ?? m.title,
        })),
    );
  const activeTopic =
    topic ??
    modules.find((m) => lessons.some((l) => l.topic === m.id))?.id ??
    "all";
  const selected = modules.find((m) => m.id === activeTopic);
  const subtopics = selected?.submodules.filter((s) => s.isActive) ?? [];
  const visible = lessons.filter(
    (l) =>
      (activeTopic === "all" || l.topic === activeTopic) &&
      (subtopic === "all" || l.submoduleId === subtopic) &&
      (!recentOnly ||
        progress?.progress.some(
          (p) => p.lessonId === l.id && p.lastWatchedAt,
        )) &&
      `${l.title} ${l.description ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const bankDomains = useMemo(() => {
    const grouped = new Map<
      string,
      { key: string; section: string; domain: string; count: number }
    >();
    bankSkills.forEach((s) => {
      const key = `${s.section}/${s.domain}`;
      const existing = grouped.get(key);
      if (existing) existing.count += s.count;
      else
        grouped.set(key, {
          key,
          section: s.section,
          domain: s.domain,
          count: s.count,
        });
    });
    return Array.from(grouped.values());
  }, [bankSkills]);
  const practiceDomainTitle =
    bankDomains.find((d) => d.key === bankDomain)?.domain ??
    selected?.title ??
    "All topics";
  const practiceTopics = useMemo(() => {
    const grouped = new Map<
      string,
      { section: string; domain: string; skill: string; count: number }
    >();
    bankSkills.forEach((s) => {
      const key = `${s.section}/${s.domain}/${s.skill}`;
      const existing = grouped.get(key);
      if (existing) existing.count += s.count;
      else
        grouped.set(key, {
          section: s.section,
          domain: s.domain,
          skill: s.skill,
          count: s.count,
        });
    });
    return Array.from(grouped.values()).filter(
      (s) =>
        s.count > 0 &&
        (bankDomain
          ? `${s.section}/${s.domain}` === bankDomain
          : activeTopic === "all" ||
            s.domain.toLowerCase() === selected?.title.toLowerCase()) &&
        `${s.skill} ${s.domain}`.toLowerCase().includes(search.toLowerCase()),
    );
  }, [bankSkills, bankDomain, activeTopic, selected?.title, search]);
  const openLesson = (lesson: CourseLessonDto) => {
    if (lesson.lessonType === "text") {
      setTextLesson(lesson);
      void recordOpen({ lessonId: lesson.id, courseName: "sat", data: {} })
        .unwrap()
        .catch(() => {
          message.error(
            "The lesson is open, but reading history could not be saved.",
          );
        });
      return;
    }
    const id = lesson.id;
    localStorage.setItem("topcoach-selected-lesson-sat", id);
    localStorage.setItem(
      "topcoach-last-viewed-lesson-sat",
      JSON.stringify({ id, ts: Date.now() }),
    );
    navigate("/learning?course=sat");
  };
  return (
    <div className="sat-catalog">
      <aside>
        <div className="sat-catalog__quick">
          <button
            onClick={() => {
              setTopic("all");
              setBankDomain(null);
              setSubtopic("all");
              setRecentOnly(false);
              setParams({ tab: tab === "practice" ? "practice" : "lessons" });
            }}
          >
            All resources{" "}
            <span>
              {tab === "practice"
                ? bankSkills.reduce((n, s) => n + s.count, 0)
                : lessons.length}
            </span>
          </button>
          <button
            onClick={() => {
              setTopic("all");
              setSubtopic("all");
              setRecentOnly(true);
              setParams({ tab: "lessons" });
            }}
          >
            Recently opened
          </button>
          <button onClick={() => setParams({ tab: "marked" })}>
            Saved questions <span>{marked.length}</span>
          </button>
        </div>
        <button
          className="sat-catalog__subjects-toggle"
          aria-expanded={subjectsOpen}
          aria-controls="sat-library-subjects"
          onClick={() => setSubjectsOpen((v) => !v)}
        >
          <span>
            Subjects ·{" "}
            {tab === "practice"
              ? practiceDomainTitle
              : (selected?.title ?? "All resources")}
          </span>
          <span aria-hidden="true">{subjectsOpen ? "−" : "+"}</span>
        </button>
        <div
          id="sat-library-subjects"
          className={`sat-catalog__subjects-list ${subjectsOpen ? "sat-catalog__subjects-list--open" : ""}`}
        >
          <div className="sat-catalog__label">My library</div>
          {tab === "practice" &&
            bankDomains.map((d) => (
              <button
                key={d.key}
                className={`sat-catalog__topic ${practiceDomainTitle === d.domain ? "sat-catalog__topic--active" : ""}`}
                onClick={() => {
                  setBankDomain(d.key);
                  setSubjectsOpen(false);
                }}
              >
                <i
                  style={{
                    background: d.section === "math" ? "#8b0000" : "#929aa4",
                  }}
                />
                <span>{d.domain}</span>
                <span>{d.count}</span>
              </button>
            ))}
          {tab !== "practice" &&
            modules
              .filter((m) => m.isActive)
              .map((m, index) => (
                <React.Fragment key={m.id}>
                  <button
                    className={`sat-catalog__topic ${activeTopic === m.id ? "sat-catalog__topic--active" : ""}`}
                    onClick={() => {
                      setSubjectsOpen(false);
                      setTopic(m.id);
                      setSubtopic("all");
                      setRecentOnly(false);
                      setParams({ tab: "lessons" });
                    }}
                  >
                    <i
                      style={{
                        background: index === 0 ? "#8b0000" : "#aa9297",
                      }}
                    />
                    <span>{m.title}</span>
                    <span>
                      {lessons.filter((l) => l.topic === m.id).length}
                    </span>
                  </button>
                  {activeTopic === m.id &&
                    m.submodules.some((s) => s.isActive) && (
                      <div className="sat-catalog__subtopics">
                        {m.submodules
                          .filter((s) => s.isActive)
                          .map((t) => (
                            <button
                              key={t.id}
                              aria-pressed={subtopic === t.id}
                              onClick={() => {
                                setSubtopic(t.id);
                                setParams({ tab: "lessons" });
                              }}
                            >
                              {t.title}
                              <span>
                                {
                                  lessons.filter((l) => l.submoduleId === t.id)
                                    .length
                                }
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                </React.Fragment>
              ))}
        </div>
      </aside>
      <main>
        <div className="sat-catalog__crumb">
          My Library /{" "}
          {tab === "practice"
            ? practiceDomainTitle
            : (selected?.title ?? "All lessons")}
        </div>
        <h1>
          {tab === "marked"
            ? "Saved questions"
            : tab === "vocabulary"
              ? "Your vocabulary"
              : tab === "practice"
                ? practiceDomainTitle
                : (selected?.title ?? "Your SAT library")}
        </h1>
        <p className="sat-catalog__description">
          {tab === "lessons"
            ? (selected?.description ??
              "Explore your SAT course lessons. Revisit an explanation, then put it into practice.")
            : tab === "marked"
              ? "Questions you flagged during practice, with their explanations."
              : tab === "vocabulary"
                ? "Words you saved from Reading & Writing passages."
                : "Choose a topic-based set or a timed mock."}
        </p>
        <div className="sat-catalog__tools">
          <nav aria-label="Library content">
            {(
              [
                ["lessons", "Lessons", lessons.length],
                ["practice", "Practice sets", null],
                ["marked", "Saved", marked.length],
                ["vocabulary", "Vocabulary", vocab.length],
              ] as const
            ).map(([id, label, count]) => (
              <button
                key={id}
                aria-pressed={tab === id}
                onClick={() => setParams({ tab: id })}
              >
                <span className="sat-catalog__tab-label">{label}</span>
                {count != null && (
                  <span className="sat-catalog__tab-count">{count}</span>
                )}
              </button>
            ))}
          </nav>
          {(tab === "lessons" || tab === "practice") && (
            <input
              aria-label="Search collection"
              placeholder="Search collection"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>
        {tab === "lessons" && !isLoading && !isError && (
          <>
            <div className="sat-catalog__tags">
              <span>Topics</span>
              <div>
                <button
                  aria-pressed={subtopic === "all"}
                  onClick={() => setSubtopic("all")}
                >
                  All topics{" "}
                  <small>
                    {
                      lessons.filter(
                        (l) => activeTopic === "all" || l.topic === activeTopic,
                      ).length
                    }
                  </small>
                </button>
                {subtopics.map((t) => (
                  <button
                    key={t.id}
                    aria-pressed={subtopic === t.id}
                    onClick={() => {
                      setSubtopic(t.id);
                      setParams({ tab: "lessons" });
                    }}
                  >
                    {t.title}{" "}
                    <small>
                      {lessons.filter((l) => l.submoduleId === t.id).length}
                    </small>
                  </button>
                ))}
              </div>
            </div>
            <div className="sat-catalog__collection">
              <h2>{recentOnly ? "Recently opened" : "Lessons"}</h2>
              <span>
                {visible.length} {visible.length === 1 ? "item" : "items"}
              </span>
            </div>
          </>
        )}
        {tab === "lessons" ? (
          isLoading || enrollmentLoading ? (
            <p className="sat-catalog__empty" role="status">
              Loading lessons…
            </p>
          ) : enrollmentError ? (
            <div className="sat-catalog__empty" role="alert">
              We couldn’t check your lesson access.{" "}
              <button
                className="sat-action"
                onClick={() => refetchEnrollment()}
              >
                Try again
              </button>
            </div>
          ) : !canLoadLessons ? (
            <div className="sat-catalog__empty">
              <h2>
                {enrollment?.isEnrolled
                  ? "SAT lesson access is pending"
                  : "SAT lessons require course enrollment"}
              </h2>
              <p>
                {enrollment?.isEnrolled
                  ? "Your lessons will be available when your enrollment is approved."
                  : "You can still use practice sets and review your saved questions."}
              </p>
              <button
                className="sat-action"
                onClick={() => setParams({ tab: "practice" })}
              >
                Browse practice sets <ArrowRight size={14} />
              </button>
            </div>
          ) : isError ? (
            <div className="sat-catalog__empty">
              We couldn’t load your course lessons.{" "}
              <button className="sat-action" onClick={() => refetch()}>
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className="sat-catalog__grid">
                {visible.map((l) => (
                  <button
                    className="sat-catalog__card"
                    key={l.id}
                    onClick={() => openLesson(l)}
                  >
                    <div className="sat-catalog__card-top">
                      <span>
                        LESSON{" "}
                        {String(
                          lessons.findIndex((item) => item.id === l.id) + 1,
                        ).padStart(2, "0")}
                      </span>
                      <span>{l.topicTitle}</span>
                    </div>
                    <h2>{l.title}</h2>
                    <p>
                      {(
                        l.description ??
                        "Open this lesson to explore the topic."
                      ).replace(/<[^>]*>/g, "")}
                    </p>
                    {LESSON_EXAMPLES[l.title.trim().toLowerCase()] && (
                      <div
                        className="sat-catalog__formula"
                        aria-label="Illustrative equation"
                      >
                        {LESSON_EXAMPLES[l.title.trim().toLowerCase()]}
                      </div>
                    )}
                    <footer>
                      <span>
                        {l.lessonType === "text"
                          ? "Text lesson"
                          : l.duration
                            ? `${l.duration} min`
                            : "Lesson"}
                      </span>
                      <span>
                        {progress?.progress.find((p) => p.lessonId === l.id)
                          ?.isCompleted
                          ? "Completed"
                          : l.lessonType === "text"
                            ? "Read lesson"
                            : "Open lesson"}{" "}
                        →
                      </span>
                    </footer>
                  </button>
                ))}
              </div>
              {!visible.length && (
                <p className="sat-catalog__empty">
                  {search
                    ? "No lessons match your search."
                    : "No lessons available in this collection yet."}
                </p>
              )}
            </>
          )
        ) : tab === "marked" ? (
          <MarkedTab />
        ) : tab === "vocabulary" ? (
          <VocabularyTab />
        ) : skillsLoading ? (
          <p className="sat-catalog__empty" role="status">
            Loading practice topics…
          </p>
        ) : skillsError ? (
          <div className="sat-catalog__empty">
            Couldn’t load practice topics.{" "}
            <button className="sat-action" onClick={() => refetchSkills()}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="sat-catalog__collection">
              <h2>Practice sets</h2>
              <span>
                {practiceTopics.length}{" "}
                {practiceTopics.length === 1 ? "topic" : "topics"}
              </span>
            </div>
            <div className="sat-catalog__grid">
              {practiceTopics.map((t, index) => (
                <button
                  key={`${t.section}/${t.domain}/${t.skill}`}
                  className="sat-catalog__card"
                  onClick={() =>
                    navigate(
                      `/student-hub/sat-prep/practice?${new URLSearchParams({ section: t.section, domain: t.domain, skill: t.skill, count: "10" })}`,
                    )
                  }
                >
                  <div className="sat-catalog__card-top">
                    <span>PRACTICE {String(index + 1).padStart(2, "0")}</span>
                    <span>{t.domain}</span>
                  </div>
                  <h2>{t.skill}</h2>
                  <p>
                    {t.section === "math" ? "Math" : "Reading & Writing"} ·
                    Choose your difficulty before starting.
                  </p>
                  <footer>
                    <span>Up to {Math.min(10, t.count)} questions</span>
                    <span>Build set →</span>
                  </footer>
                </button>
              ))}
            </div>
            {!practiceTopics.length && (
              <p className="sat-catalog__empty">
                No matching practice topics. Try another collection or clear
                your search.
              </p>
            )}
            <div className="sat-catalog__more-practice">
              <button
                className="sat-action"
                onClick={() => navigate("/student-hub/sat-prep/test-packs")}
              >
                Browse test packs <ArrowRight size={14} />
              </button>
              <button
                className="sat-action"
                onClick={() => navigate("/student-hub/sat-prep/mock-tests")}
              >
                Timed mock tests <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}
      </main>
      <SatTextLessonReader
        lesson={textLesson}
        onClose={() => setTextLesson(null)}
      />
    </div>
  );
};

// ─── Vocabulary ───────────────────────────────────────────────────────
const VocabularyTab: React.FC = () => {
  const { data: words = [] } = useGetVocabularyQuery();
  const [removeWord] = useRemoveVocabularyMutation();
  const [clearAll] = useClearVocabularyMutation();
  const [search, setSearch] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return words;
    return words.filter((w) => w.word.toLowerCase().includes(q));
  }, [words, search]);

  const onRemove = async (id: string, word: string) => {
    try {
      await removeWord(id).unwrap();
      message.success(`Removed "${word}"`);
    } catch {
      message.error("Could not remove word.");
    }
  };

  const onClear = async () => {
    setConfirmClear(false);
    try {
      const r = await clearAll().unwrap();
      message.success(`Removed ${r.removed} word${r.removed === 1 ? "" : "s"}`);
    } catch {
      message.error("Could not clear vocabulary.");
    }
  };

  if (!words.length) {
    return (
      <div className="sat-card sat-library__empty">
        <div className="sat-library__empty-glyph">
          <BookmarkCheck size={20} />
        </div>
        <div className="sat-library__empty-title">No vocabulary saved yet</div>
        <div className="sat-library__empty-desc">
          During a Reading &amp; Writing test, click{" "}
          <strong>Add vocabulary</strong> at the bottom of the runner to save
          unfamiliar words. They'll show up here so you can review them later.
        </div>
      </div>
    );
  }

  return (
    <div className="sat-card sat-library__panel">
      <div className="sat-library__panel-toolbar">
        <div className="sat-library__search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search words…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="sat-library__search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <span className="sat-library__panel-count">
          {filtered.length} of {words.length}
        </span>
        <button
          className="sat-btn sat-btn--ghost sat-library__clear-btn"
          onClick={() => setConfirmClear(true)}
        >
          <Trash2 size={13} /> Clear all
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="sat-library__no-results">
          No words match "{search}".
        </div>
      ) : (
        <ul className="sat-library__vocab">
          {filtered.map((w) => (
            <li key={w.id} className="sat-library__vocab-row">
              <span className="sat-library__vocab-word">{w.word}</span>
              <span className="sat-library__vocab-date">
                {fmtRelative(w.createdAt)}
              </span>
              <button
                className="sat-library__vocab-remove"
                onClick={() => onRemove(w.id, w.word)}
                aria-label={`Remove ${w.word}`}
                title="Remove"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmClear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={onClear}
        title="Clear all vocabulary?"
        description={`This will remove all ${words.length} word${words.length === 1 ? "" : "s"} from your library. This cannot be undone.`}
        confirmLabel="Clear all"
        cancelLabel="Keep them"
        destructive
      />
    </div>
  );
};

// ─── Marked questions ────────────────────────────────────────────────
const MarkedTab: React.FC = () => {
  const navigate = useNavigate();
  const { data: marks = [] } = useGetMarkedQuestionsQuery();
  const [unmark] = useUnmarkQuestionMutation();
  const [open, setOpen] = useState<MarkedQuestion | null>(null);

  const onUnmark = async (questionId: string) => {
    try {
      await unmark(questionId).unwrap();
      message.success("Unmarked.");
    } catch {
      message.error("Could not unmark.");
    }
  };

  if (!marks.length) {
    return (
      <div className="sat-card sat-library__empty">
        <div className="sat-library__empty-glyph">
          <Flag size={20} />
        </div>
        <div className="sat-library__empty-title">No marked questions yet</div>
        <div className="sat-library__empty-desc">
          Tap the <strong>Mark for Review</strong> bookmark on any question
          while taking a test, and it will appear here so you can revisit it
          later.
        </div>
        <button
          className="sat-btn sat-btn--ghost"
          onClick={() => navigate("/student-hub/sat-prep/practice")}
        >
          Browse practice <ArrowRight size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="sat-card sat-library__panel">
      <div className="sat-library__panel-toolbar">
        <span className="sat-library__panel-count">
          {marks.length} marked question{marks.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="sat-library__marked">
        {marks.map((m) => {
          const q = m.question;
          const isMath = q?.section === "math";
          return (
            <li key={m.id} className="sat-library__marked-row">
              <div
                className={`sat-library__marked-icon sat-library__marked-icon--${isMath ? "math" : "rw"}`}
              >
                {isMath ? <Calculator size={15} /> : <BookOpen size={15} />}
              </div>
              <div className="sat-library__marked-body">
                <div className="sat-library__marked-eyebrow">
                  {q
                    ? `${q.domain} · ${capitalize(q.difficulty)}`
                    : "Question removed"}
                </div>
                <div className="sat-library__marked-stem">
                  {q ? (
                    <SatHtml html={truncateHtml(q.stemHtml, 220)} />
                  ) : (
                    <span>Question is no longer in the bank.</span>
                  )}
                </div>
                <div className="sat-library__marked-meta">
                  Marked {fmtRelative(m.createdAt)}
                  {q?.skill && <> · {q.skill}</>}
                </div>
              </div>
              <div className="sat-library__marked-actions">
                {q && (
                  <button
                    className="sat-btn sat-btn--ghost"
                    onClick={() => setOpen(m)}
                  >
                    Review
                  </button>
                )}
                <button
                  className="sat-library__marked-unmark"
                  onClick={() => onUnmark(m.questionId)}
                  title="Unmark"
                  aria-label="Unmark"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Review modal — full question + rationale */}
      <RunnerModal
        open={!!open}
        onClose={() => setOpen(null)}
        eyebrow={
          open?.question
            ? `${open.question.section === "math" ? "Math" : "Reading & Writing"} · ${capitalize(open.question.difficulty)}`
            : "Marked question"
        }
        title={open?.question?.skill ?? "Question review"}
        size="lg"
        footer={
          <>
            {open && (
              <button
                className="rm-btn rm-btn--ghost"
                onClick={() => {
                  onUnmark(open.questionId);
                  setOpen(null);
                }}
              >
                <X size={13} /> Unmark
              </button>
            )}
            <button
              className="rm-btn rm-btn--primary"
              onClick={() => setOpen(null)}
            >
              Done
            </button>
          </>
        }
      >
        {open?.question ? (
          <div className="sat-library__review">
            {open.question.passageHtml && (
              <SatHtml
                html={open.question.passageHtml}
                className="sat-library__review-passage"
              />
            )}
            <SatHtml
              html={open.question.stemHtml}
              className="sat-library__review-stem"
            />
            {open.question.choices && (
              <ul className="sat-library__review-choices">
                {open.question.choices.map((c) => {
                  const correct = open.question?.correctAnswer === c.label;
                  return (
                    <li
                      key={c.label}
                      className={`sat-library__review-choice ${correct ? "sat-library__review-choice--correct" : ""}`}
                    >
                      <span className="sat-library__review-letter">
                        {c.label}
                      </span>
                      <SatHtml html={c.text} />
                    </li>
                  );
                })}
              </ul>
            )}
            {open.question.rationaleHtml && (
              <details className="sat-library__review-rationale" open>
                <summary>Show rationale</summary>
                <SatHtml html={open.question.rationaleHtml} />
              </details>
            )}
          </div>
        ) : null}
      </RunnerModal>
    </div>
  );
};

// ─── helpers ──────────────────────────────────────────────────────────
const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const fmtRelative = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const min = Math.floor((Date.now() - t) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const truncateHtml = (html: string, max: number): string => {
  if (!html) return "";
  // Strip tags for the truncation budget so we don't snip mid-tag; the
  // returned string is still rendered as HTML by SatHtml.
  const txt = html.replace(/<[^>]+>/g, "").trim();
  if (txt.length <= max) return html;
  // Cheap approximation — find a sentence end near the budget.
  const cutAt = txt.lastIndexOf(" ", max);
  return `${txt.slice(0, cutAt > max - 60 ? cutAt : max)}…`;
};

export default SatLibraryPage;
