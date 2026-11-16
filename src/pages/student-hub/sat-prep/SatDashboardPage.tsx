import SatTargetScore from './SatTargetScore';
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Flame, RotateCcw, Timer } from "lucide-react";
import { message } from "antd";
import { useLazyFilterSatQuestionsQuery } from "src/app/services/sat-prep";
import { useGetSatProgressQuery } from "src/app/services/sat-prep/local-progress";
import { useGetMarkedQuestionsQuery } from "src/app/services/sat-prep/library";
import { useGetSatStudyGoalQuery } from "src/app/services/sat-prep/study-goal";
import {
  baselineTotal,
  continueAction,
  journeyScale,
  scoreBreakdown,
  streakState,
  weakestSkills,
} from "./sat-overview-model";
import { answeredCount, findResumableRun } from "./satRunState";
import "./sat-platform.scss";

const BASE = "/student-hub/sat-prep";
const SatDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetSatProgressQuery();
  const { data: marked = [] } = useGetMarkedQuestionsQuery();
  const [getQuestions, { isFetching }] = useLazyFilterSatQuestionsQuery();
  const { data: goal } = useGetSatStudyGoalQuery();
  const [resumable] = React.useState(() => findResumableRun());
  const score = scoreBreakdown(data?.mockSessions ?? []);
  const target = goal?.targetScore ?? null;
  const scale = journeyScale({
    current: score.total,
    baseline: baselineTotal(data?.mockSessions ?? []),
    target,
  });
  const streak = streakState({
    count: data?.streak.count ?? 0,
    lastPracticeDate: data?.streak.lastPracticeDate ?? null,
    sessions: [
      ...(data?.recentSessions ?? []),
      ...(data?.mockSessions ?? []),
      ...(data?.packSessions ?? []),
    ],
  });
  const skills = weakestSkills(data?.masteryRows ?? []);
  const focus = skills[0];
  const next = continueAction({
    resume: resumable
      ? { answered: answeredCount(resumable.run), total: resumable.total }
      : null,
    hasScore: score.total != null,
    mockCount: data?.mockSessions.length ?? 0,
    focusSkill: focus?.skill ?? null,
  });
  const runContinue = () => {
    if (next.kind === "resume") navigate(`${BASE}/runner`);
    else if (next.kind === "practice") void startPractice();
    else navigate(`${BASE}/mock-tests`);
  };
  const startPractice = async () => {
    if (!focus) {
      navigate(`${BASE}/practice`);
      return;
    }
    try {
      const result = await getQuestions({
        section: focus.section,
        skill: focus.skill,
        limit: 10,
        order: "random",
      }).unwrap();
      if (!result.items.length) {
        message.info(
          "No questions available for this skill. Choose another topic.",
        );
        navigate(`${BASE}/practice`);
        return;
      }
      sessionStorage.setItem("sat-mock-test", JSON.stringify(result.items));
      sessionStorage.setItem(
        "sat-mock-test-meta",
        JSON.stringify({
          title: `${focus.skill} practice`,
          section: focus.section,
          mode: "practice",
        }),
      );
      navigate(`${BASE}/runner`);
    } catch {
      message.error("Could not start practice. Please try again.");
    }
  };
  if (isLoading)
    return (
      <div className="sat-platform sat-platform__empty" role="status">
        Loading your SAT progress…
      </div>
    );
  if (isError)
    return (
      <div className="sat-platform sat-platform__empty">
        <h1>Your SAT overview</h1>
        <p>We couldn’t load your progress.</p>
        <button className="sat-action" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  return (
    <div className="sat-platform">
      {resumable && (
        <div className="sat-platform__resume" role="status">
          <div>
            <strong>Resume your test</strong>
            <span>
              {resumable.title} · {answeredCount(resumable.run)} of{" "}
              {resumable.total} answered
            </span>
          </div>
          <button className="sat-action" onClick={() => navigate(`${BASE}/runner`)}>
            Resume
            <span>
              <ArrowRight size={15} />
            </span>
          </button>
        </div>
      )}
      <section className="sat-platform__hero">
        <div className="sat-platform__journey-top">
          <h1 className="sat-platform__eyebrow">SAT score journey</h1>
          <span>Latest section mock estimates</span>
        </div>
        <div className="sat-platform__score-line">
          <div>
            <strong>{score.total ?? "—"}</strong>
            <span>Latest combined estimate</span>
          </div>
          <SatTargetScore score={score.total} />
        </div>
        <div className="sat-platform__score-track" aria-hidden="true">
          <i style={{ width: `${scale.pct}%` }} />
          {target != null && scale.markerPct != null && (
            <b
              className="sat-platform__score-marker"
              style={{ left: `${scale.markerPct}%` }}
            />
          )}
        </div>
        <div className="sat-platform__journey-meta">
          <span>
            {score.total
              ? "Based on your latest Math and Reading & Writing mocks"
              : "Complete both section mocks to establish your baseline"}
          </span>
          {target != null && score.total != null ? (
            <span>
              {scale.toGo
                ? `${scale.toGo} points to go · ${scale.min} → ${target}`
                : "Target reached"}
            </span>
          ) : (
            <span>Score scale: 400–1600</span>
          )}
        </div>
        <div className="sat-platform__hero-action">
          <button
            className="sat-action sat-action--primary"
            disabled={isFetching}
            onClick={runContinue}
          >
            {isFetching ? "Preparing practice…" : `Continue: ${next.label}`}
            <span>
              <ArrowRight size={16} />
            </span>
          </button>
          <p>{next.detail}</p>
        </div>
      </section>
      <section
        className={`sat-streak${streak.atRisk ? " sat-streak--risk" : ""}`}
        aria-label="Study streak"
      >
        <Flame size={22} aria-hidden="true" />
        <div>
          <strong>
            {streak.count
              ? `${streak.count}-day streak`
              : "Start a study streak"}
          </strong>
          <span>
            {streak.atRisk
              ? `Practise today to keep your ${streak.count}-day streak`
              : streak.doneToday
                ? "Daily goal done: you practised today"
                : "Daily goal: one practice session today"}
          </span>
        </div>
        <span
          className={`sat-streak__goal${streak.doneToday ? " is-done" : ""}`}
        >
          {streak.doneToday ? "Done today" : "Not done yet"}
        </span>
      </section>
      <section className="sat-platform__plan">
        <header>
          <div>
            <h2>Today’s score-building plan</h2>
            <p>
              {focus
                ? "Practice your focus skill, review saved questions, then test under timing."
                : "A clear starting point for your next session."}
            </p>
          </div>
          <span>Your next steps</span>
        </header>
        <div className="sat-platform__tasks">
          <div className="sat-platform__task sat-platform__task--active">
            <span className="sat-platform__step">01</span>
            <div>
              <h3>
                {focus
                  ? `Recover points from ${focus.skill}`
                  : "Choose a practice topic"}
              </h3>
              <p>
                {focus
                  ? `${focus.pct}% accuracy · ${focus.attempts} tracked answers`
                  : "Math or Reading & Writing · Choose your difficulty"}
              </p>
            </div>
            <button
              className="sat-action"
              disabled={isFetching}
              onClick={startPractice}
            >
              Practice
              <span>
                <ArrowRight size={15} />
              </span>
            </button>
          </div>
          <div className="sat-platform__task">
            <span className="sat-platform__step">02</span>
            <div>
              <h3>
                {marked.length
                  ? `Review ${marked.length} saved question${marked.length === 1 ? "" : "s"}`
                  : "Revisit your saved questions"}
              </h3>
              <p>
                {marked.length
                  ? "Open the question, check your reasoning, read the explanation."
                  : "Flag questions during practice to keep them here."}
              </p>
            </div>
            <Link className="sat-action" to={`${BASE}/library?tab=marked`}>
              Review
              <span>
                <RotateCcw size={15} />
              </span>
            </Link>
          </div>
          <div className="sat-platform__task">
            <span className="sat-platform__step">03</span>
            <div>
              <h3>Practise under SAT timing</h3>
              <p>Choose Math or Reading & Writing</p>
            </div>
            <Link className="sat-action" to={`${BASE}/mock-tests`}>
              Choose mock
              <span>
                <Timer size={15} />
              </span>
            </Link>
          </div>
        </div>
      </section>
      {focus && (
        <div className="sat-platform__selection">
          <span>Selected for practice</span>
          <strong>{focus.skill}</strong>
          <span>
            {focus.pct}% accuracy ·{" "}
            {Math.max(0, focus.attempts - focus.correct)} incorrect answers
            tracked
          </span>
        </div>
      )}
      <section className="sat-platform__performance">
        <div>
          <header>
            <h2>Where to focus next</h2>
            <Link to={`${BASE}/review`}>
              All progress <ArrowRight size={14} />
            </Link>
          </header>
          {skills.length ? (
            skills.slice(0, 3).map((skill) => (
              <div
                className="sat-platform__skill"
                key={`${skill.section}-${skill.skill}`}
              >
                <div>
                  <strong>{skill.skill}</strong>
                  <span>{skill.pct}%</span>
                </div>
                <p>
                  {skill.domain} · {skill.attempts} answers
                </p>
                <div className="sat-platform__bar">
                  <i
                    style={{
                      width: `${Math.min(100, Math.max(0, skill.pct))}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="sat-platform__empty">
              <BookOpen size={22} />
              <p>Your skill breakdown appears after your first practice.</p>
            </div>
          )}
        </div>
        <div className="sat-platform__breakdown">
          <header>
            <h2>Your section mocks</h2>
            <span className="sat-platform__combined">
              {score.total ?? "—"}
              <small> combined</small>
            </span>
          </header>
          <div className="sat-platform__sections">
            {[
              ["Math", score.math],
              ["Reading & Writing", score.reading],
            ].map(([label, session]) => {
              const s = typeof session === "object" ? session : undefined;
              return (
                <div key={String(label)}>
                  <span>{String(label)}</span>
                  <strong>
                    {s?.estimatedScore ?? "—"}
                    <small> / 800</small>
                  </strong>
                  <p>
                    {s
                      ? new Date(s.completedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "No completed mock yet"}
                  </p>
                </div>
              );
            })}
          </div>
          <Link className="sat-platform__text-link" to={`${BASE}/review`}>
            View your practice history <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
};
export default SatDashboardPage;
