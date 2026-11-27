import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useMyLearningPath } from "../applicant/useMyLearningPath";
import { Breadcrumb } from "../applicant/Breadcrumb";
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Mic,
  PenLine,
  House,
  Library,
  Search,
  ChevronRight,
} from "lucide-react";
import { testPath, route, skills, booksFor, testCount } from "./model.js";
import { testProgress, unfinishedPractices, STATE_LABEL } from "./progress.js";
import { availableLibrary } from "./catalog.js";
import "./browse.css";

const academicPath = "/ielts/practice/home";
const generalPath = "/ielts/practice/general-training";
const skillMeta = {
  listening: {
    label: "Listening",
    Icon: Headphones,
    description: "4 parts · 40 questions · audio",
  },
  reading: {
    label: "Reading",
    Icon: BookOpen,
    description: "3 passages · 40 questions",
  },
  writing: {
    label: "Writing",
    Icon: PenLine,
    description: "2 tasks · 60 minutes",
  },
  speaking: {
    label: "Speaking",
    Icon: Mic,
    description: "3 parts · record your answers",
  },
};
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
const bookLabel = (book) =>
  book === "og"
    ? "Official Guide"
    : book === "eg"
      ? "Exam Essentials"
      : `IELTS ${book}`;
export default function IeltsBrowse({ pagePath, Link, profile, last, progress, catalog }) {
  const myLearningPath = useMyLearningPath();
  const overview = pagePath === "/";
  const type = pagePath === generalPath ? "general-training" : "academic";
  const nav = [
    { to: "/", label: "Overview", Icon: House },
    { to: academicPath, label: "Academic", hint: "For university study", Icon: Library },
    { to: generalPath, label: "General Training", hint: "For work or migration", Icon: BookOpen },
  ];
  return (
    <div className="ib-layout">
      <div className="ib-workspace">
        <aside className="ib-sidebar">
          <div className="ib-profile">
            <span className="ib-avatar">
              {profile?.name?.slice(0, 1).toUpperCase() || "S"}
            </span>
            <div>
              <strong>{profile?.name || "Student"}</strong>
            </div>
          </div>
          <div className="ib-nav-label">IELTS prep</div>
          <nav aria-label="IELTS prep">
            {nav.map(({ to, label, hint, Icon }) => (
              <Link
                key={to}
                to={to}
                className={`ib-nav ${pagePath === to ? "is-active" : ""}`}
                aria-current={pagePath === to ? "page" : undefined}
              >
                <Icon size={18} />
                <span className="ib-nav-text">
                  {label}
                  {hint && <small>{hint}</small>}
                </span>
              </Link>
            ))}
          </nav>
          <div className="ib-sidebar-note">
            <Link to="/ielts/vocabulary">
              Vocabulary <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
        <main className="ib-main">
          <Breadcrumb>
            <RouterLink to={myLearningPath}>My learning</RouterLink>
            <span>/</span>
            {overview ? (
              "IELTS prep"
            ) : (
              <>
                <Link to="/">IELTS prep</Link>
                <span>/</span>
                {type === "academic" ? "Academic" : "General Training"}
              </>
            )}
          </Breadcrumb>
          {overview ? (
            <Overview Link={Link} last={last} progress={progress} />
          ) : (
            <PracticeLibrary key={type} type={type} Link={Link} progress={progress} catalog={catalog} />
          )}
        </main>
      </div>
    </div>
  );
}
const skillName = (skill) => skillMeta[skill]?.label || skill;
const readableTitle = (r) =>
  `${bookLabel(r.book)}${r.type === "general-training" ? " General Training" : ""} · Test ${r.test} · ${skillName(r.skill)}`;
function Overview({ Link, last, progress }) {
  const unfinished = progress
    ? unfinishedPractices(progress.entries, progress.markers, progress.recent, 3)
    : [];
  const lastRoute = last && last.path ? route(last.path) : null;
  const validLast = !!lastRoute;
  // No stored format setting exists; only a last-opened General Training
  // test sends the Reading tile to the General Training library.
  const readingPath =
    lastRoute?.type === "general-training" ? generalPath : academicPath;
  return (
    <>
      <div className="ib-heading">
        <h1>IELTS prep</h1>
        <p>{validLast ? "Pick up where you left off." : "Choose a skill to start."}</p>
      </div>
      <section className="ib-next" aria-label="Your next step">
        <div>
          <h2>
            {validLast
              ? `Continue: ${readableTitle(lastRoute)}`
              : "Start with a Reading test"}
          </h2>
        </div>
        <Link
          className="ib-button"
          to={validLast ? last.path : `${academicPath}?skill=reading`}
        >
          {validLast ? "Continue" : "Start Reading test"}
          <ArrowRight size={17} />
        </Link>
      </section>
      {unfinished.length > 0 && (
        <section aria-labelledby="ib-unfinished-title">
          <h2 id="ib-unfinished-title" className="ib-section-title">
            Unfinished
          </h2>
          <ul className="ib-unfinished">
            {unfinished.map((item) => (
              <li key={item.path}>
                <span>{item.label}</span>
                <Link className="ib-button" to={item.path}>
                  Continue
                  <ArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-label="Choose a skill">
        <div className="ib-tiles">
          {skills.map((skill) => {
            const { label, Icon, description } = skillMeta[skill];
            return (
              <Link
                key={skill}
                className="ib-tile"
                to={
                  skill === "reading"
                    ? readingPath === generalPath
                      ? generalPath
                      : `${academicPath}?skill=reading`
                    : `${academicPath}?skill=${skill}`
                }
              >
                <span className="ib-tile-icon">
                  <Icon size={20} />
                </span>
                <h3>{label}</h3>
                <p>{description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
function PracticeLibrary({ type, Link, progress, catalog }) {
  const [query, setQuery] = useState("");
  const [bookFilter, setBookFilter] = useState("all");
  const initialSkill = new URLSearchParams(window.location.search).get("skill");
  const [skill, setSkill] = useState(
    type === "general-training"
      ? "reading"
      : skills.includes(initialSkill)
        ? initialSkill
        : "all",
  );
  const isAcademic = type === "academic";
  // `catalog` is undefined while loading or on error: show the full static list.
  const library = availableLibrary(
    type,
    booksFor(type),
    testCount,
    catalog,
    isAcademic ? skills : ["reading"],
  );
  const books = library.map((g) => g.book);
  const selectedSkills = isAcademic
    ? skill === "all"
      ? skills
      : [skill]
    : ["reading"];
  const groups = library
    .map(({ book, tests: available }) => ({
      book,
      total: available.length,
      tests: available.filter(
        ({ test, skills: have }) =>
          (skill === "all" || !isAcademic || have.includes(skill)) &&
          `${bookLabel(book)} ${isAcademic ? "Academic" : "General Training"} ${years[book]} Test ${test}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    }))
    .filter(
      ({ book, tests }) =>
        (bookFilter === "all" || String(book) === bookFilter) && tests.length,
    );
  const count = groups.reduce((n, g) => n + g.tests.length, 0);
  return (
    <>
      <div className="ib-heading">
        <h1>
          {isAcademic ? "Academic tests" : "General Training tests"}
        </h1>
        <p>
          {isAcademic
            ? "Find your next test. Choose a book, then focus on the skill you want to build."
            : "Reading tests only for now."}
        </p>
      </div>
      <div className="ib-seg" role="group" aria-label="IELTS format">
        <Link
          to={`${academicPath}${skill !== "all" ? `?skill=${skill}` : ""}`}
          className={isAcademic ? "is-active" : ""}
          aria-current={isAcademic ? "page" : undefined}
        >
          Academic
        </Link>
        <Link
          to={generalPath}
          className={!isAcademic ? "is-active" : ""}
          aria-current={!isAcademic ? "page" : undefined}
        >
          General Training
        </Link>
      </div>
      <p className="ib-format-hint">
        {isAcademic ? "Academic is for university study." : "General Training is for work or migration."}
      </p>
      <div className="ib-filters">
        <label className="ib-search">
          <Search size={18} />
          <input
            aria-label="Search tests"
            placeholder="Search books or tests…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="ib-select">
          <span className="ib-sr-only">Book</span>
          <select
            value={bookFilter}
            onChange={(e) => setBookFilter(e.target.value)}
          >
            {<option value="all">All books</option>}
            {books.map((book) => (
              <option key={book} value={book}>
                {bookLabel(book)}
              </option>
            ))}
          </select>
        </label>
        {isAcademic && (
          <label className="ib-select">
            <span className="ib-sr-only">Skill</span>
            <select value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="all">All skills</option>
              {skills.map((s) => (
                <option key={s} value={s}>
                  {skillMeta[s].label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="ib-results">
        <span aria-live="polite">
          {count} {skill !== "all" || !isAcademic ? `${skillMeta[isAcademic ? skill : "reading"].label} ` : ""}
          {count === 1 ? "test" : "tests"}
        </span>
        {(query || bookFilter !== "all" || (isAcademic && skill !== "all")) && (
          <button
            onClick={() => {
              setQuery("");
              setBookFilter("all");
              setSkill(isAcademic ? "all" : "reading");
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {groups.map(({ book, tests, total }) => (
        <section className="ib-book" key={book}>
          <div className="ib-book-heading">
            <span className="ib-book-icon">
              <BookOpen size={21} />
            </span>
            <div>
              <h2>
                {bookLabel(book)}{" "}
                <span>{isAcademic ? "Academic" : "General Training"}</span>
              </h2>
              <p>
                {years[book]} · {total} {total === 1 ? "test" : "tests"}
              </p>
            </div>
            {book === books[0] && <span className="ib-badge">Newest</span>}
          </div>
          <div className="ib-tests">
            {tests.map(({ test, skills: have }) => (
              <TestCard
                key={test}
                {...{ type, book, test, Link, progress, isAcademic }}
                availableSkills={have}
                selectedSkills={selectedSkills.filter((s) => have.includes(s))}
              />
            ))}
          </div>
        </section>
      ))}
      {!count && (
        <div className="ib-empty">
          <Search size={28} />
          <h2>No tests found</h2>
          <p>Try a different search or clear your filters.</p>
          <button
            className="ib-button"
            onClick={() => {
              setQuery("");
              setBookFilter("all");
              setSkill(isAcademic ? "all" : "reading");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
function TestCard({ type, book, test, Link, progress, selectedSkills, availableSkills }) {
  const trackable = availableSkills;
  const summary = progress
    ? testProgress(
        progress.entries,
        progress.markers,
        { type, book: String(book), test },
        trackable,
      )
    : null;
  return (
              <article className="ib-test">
                <div className="ib-test-top">
                  <h3>Test {test}</h3>
                  <Link
                    to={testPath({ type, book, test }, "score")}
                    className="ib-review"
                  >
                    Score &amp; answers <ChevronRight size={14} />
                  </Link>
                </div>
                {summary && (
                  <p className="ib-test-progress">
                    {summary.done} of {summary.total}{" "}
                    {summary.total === 1 ? "skill" : "skills"} done
                  </p>
                )}
                <div className="ib-test-skills">
                  {selectedSkills.map((s) => {
                    const { Icon, label } = skillMeta[s];
                    return (
                      <Link key={s} to={testPath({ type, book, test }, s)}>
                        <span className="ib-mini-icon">
                          <Icon size={16} />
                        </span>
                        {label}
                        {summary && (
                          <span className={`ib-state ib-state-${summary.skills[s].state}`}>
                            {STATE_LABEL[summary.skills[s].state]}
                          </span>
                        )}
                        <ArrowRight size={14} />
                      </Link>
                    );
                  })}
                </div>
              </article>
  );
}
