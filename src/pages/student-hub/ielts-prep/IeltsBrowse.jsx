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
import { testPath, route, skills } from "./model.js";
import "./browse.css";

const academicPath = "/ielts/practice/home";
const generalPath = "/ielts/practice/general-training";
const skillMeta = {
  listening: {
    label: "Listening",
    Icon: Headphones,
    description: "Tune your ear to conversations and lectures.",
  },
  reading: {
    label: "Reading",
    Icon: BookOpen,
    description: "Build comprehension, one passage at a time.",
  },
  writing: {
    label: "Writing",
    Icon: PenLine,
    description: "Develop clear, well-structured responses.",
  },
  speaking: {
    label: "Speaking",
    Icon: Mic,
    description: "Practice expressing your ideas with confidence.",
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
const booksFor = (type) =>
  type === "academic"
    ? [...Array.from({ length: 21 }, (_, i) => 21 - i), "eg", "og"]
    : [...Array.from({ length: 8 }, (_, i) => 21 - i), 10];
const testCount = (type, book) =>
  book === "og" ? 8 : type === "general-training" && book === 10 ? 2 : 4;

export default function IeltsBrowse({ pagePath, Link, profile, last }) {
  const myLearningPath = useMyLearningPath();
  const overview = pagePath === "/";
  const type = pagePath === generalPath ? "general-training" : "academic";
  const nav = [
    { to: "/", label: "Overview", Icon: House },
    { to: academicPath, label: "Academic", Icon: Library },
    { to: generalPath, label: "General Training", Icon: BookOpen },
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
              <span>Your learning space</span>
            </div>
          </div>
          <div className="ib-nav-label">IELTS PREPARATION</div>
          <nav aria-label="IELTS preparation">
            {nav.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={`ib-nav ${pagePath === to ? "is-active" : ""}`}
                aria-current={pagePath === to ? "page" : undefined}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="ib-sidebar-note">
            <BookOpen size={22} />
            <strong>A little practice, every day.</strong>
            <p>Choose a skill and work through a test at your own pace.</p>
            <Link to="/ielts/vocabulary">
              Explore vocabulary <ArrowRight size={14} />
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
            <Overview Link={Link} profile={profile} last={last} />
          ) : (
            <PracticeLibrary key={type} type={type} Link={Link} />
          )}
        </main>
      </div>
    </div>
  );
}
function Overview({ Link, profile, last }) {
  const validLast = last && route(last.path);
  return (
    <>
      <div className="ib-heading">
        <span className="ib-eyebrow">YOUR NEXT STEP</span>
        <h1>Your IELTS journey</h1>
        <p>
          Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}.
          Make room for a little progress today.
        </p>
      </div>
      <section className="ib-hero">
        <div>
          <span className="ib-eyebrow">
            {validLast ? "PICK UP WHERE YOU LEFT OFF" : "LET’S GET STARTED"}
          </span>
          <h2>
            {validLast
              ? "Keep your momentum."
              : "One practice closer to your goal."}
          </h2>
          <p>
            {validLast
              ? last.title
              : "Explore IELTS tests and build your confidence across all four skills."}
          </p>
          <Link className="ib-button" to={validLast ? last.path : academicPath}>
            {validLast ? "Continue practice" : "Find a practice test"}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="ib-hero-visual" aria-hidden="true">
          <BookOpen size={32} strokeWidth={1.6} />
          <span className="ib-visual-label">IELTS PREPARATION</span>
          <strong>Build your confidence.</strong>
          <span className="ib-visual-caption">A little practice, every day.</span>
          <div className="ib-visual-skills">
            {skills.map((skill) => {
              const { Icon, label } = skillMeta[skill];
              return <span key={skill}><Icon size={20} strokeWidth={1.6} />{label}</span>;
            })}
          </div>
        </div>
      </section>
      <section>
        <div className="ib-section-heading">
          <div>
            <h2>Choose your focus</h2>
            <p>Four skills. Your own pace.</p>
          </div>
        </div>
        <div className="ib-skills">
          {skills.map((skill) => {
            const { label, Icon, description } = skillMeta[skill];
            return (
              <Link
                key={skill}
                className="ib-skill-card"
                to={`${academicPath}?skill=${skill}`}
              >
                <span className="ib-icon">
                  <Icon size={22} />
                </span>
                <h3>{label}</h3>
                <p>{description}</p>
                <span className="ib-text-link">
                  Browse practices <ArrowRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <section>
        <div className="ib-section-heading">
          <div>
            <h2>Your practice library</h2>
            <p>Choose the IELTS format you’re preparing for.</p>
          </div>
        </div>
        <div className="ib-collections">
          <Link className="ib-collection" to={academicPath}>
            <span className="ib-icon">
              <Library size={23} />
            </span>
            <div>
              <h3>Academic</h3>
              <p>Listening, Reading, Writing and Speaking</p>
              <span>IELTS 1–21, Exam Essentials & Official Guide</span>
            </div>
            <ArrowRight size={22} />
          </Link>
          <Link className="ib-collection" to={generalPath}>
            <span className="ib-icon">
              <BookOpen size={23} />
            </span>
            <div>
              <h3>General Training</h3>
              <p>Explore the General Training reading collection.</p>
              <span>IELTS 14–21 & IELTS 10</span>
            </div>
            <ArrowRight size={22} />
          </Link>
        </div>
      </section>
    </>
  );
}
function PracticeLibrary({ type, Link }) {
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
  const books = booksFor(type),
    isAcademic = type === "academic";
  const selectedSkills = isAcademic
    ? skill === "all"
      ? skills
      : [skill]
    : ["reading"];
  const groups = books
    .map((book) => ({
      book,
      tests: Array.from(
        { length: testCount(type, book) },
        (_, i) => i + 1,
      ).filter((test) =>
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
        <span className="ib-eyebrow">PRACTICE LIBRARY</span>
        <h1>
          {isAcademic ? "Academic practice" : "General Training practice"}
        </h1>
        <p>
          {isAcademic
            ? "Find your next test. Choose a book, then focus on the skill you want to build."
            : "Build your reading confidence with General Training practice tests."}
        </p>
      </div>
      <div className="ib-filters">
        <label className="ib-search">
          <Search size={18} />
          <input
            aria-label="Search practice tests"
            placeholder="Search books or tests…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="ib-select">
          Book
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
            Skill
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
          {count} {count === 1 ? "test" : "tests"} available
          {skill !== "all" ? ` · ${skillMeta[skill].label}` : ""}
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
      {groups.map(({ book, tests }) => (
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
                {years[book]} collection · {testCount(type, book)} practice
                tests
              </p>
            </div>
            {book === 21 && <span className="ib-badge">Latest collection</span>}
          </div>
          <div className="ib-tests">
            {tests.map((test) => (
              <article className="ib-test" key={test}>
                <div className="ib-test-top">
                  <h3>Test {test}</h3>
                  <Link
                    to={testPath({ type, book, test }, "score")}
                    className="ib-review"
                  >
                    Results <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="ib-test-skills">
                  {selectedSkills.map((s) => {
                    const { Icon, label } = skillMeta[s];
                    return (
                      <Link key={s} to={testPath({ type, book, test }, s)}>
                        <span className="ib-mini-icon">
                          <Icon size={16} />
                        </span>
                        {label}
                        <ArrowRight size={14} />
                      </Link>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {!count && (
        <div className="ib-empty">
          <Search size={28} />
          <h2>No practices found</h2>
          <p>Try a different search or clear your filters.</p>
          <button
            className="ib-button"
            onClick={() => {
              setQuery("");
              setBookFilter("all");
              setSkill(isAcademic ? "all" : "reading");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
    </>
  );
}
