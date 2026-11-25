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
import { useStudentProfile } from "src/hooks/useStudentHub";
import { useGetAdmissionsProfileQuery } from "src/app/services/admissionsProfileApi";
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
  // The SAT the student reported in their Academic profile (official score).
  const { profile } = useStudentProfile();
  // Onboarding stores the SAT on the admissions profile instead; students who
  // only filled that in used to see no score here at all.
  const { data: admissions } = useGetAdmissionsProfileQuery();
  const reported = profileSatScore(
    profile?.academicProfile?.testScores?.sat,
    admissions?.satScore,
  );
  // Headline: latest mock estimate; until both mocks exist, the profile score.
  const headline = score.total ?? reported?.total ?? null;
  const fromProfile = score.total == null && reported?.total != null;
  const target = goal?.targetScore ?? null;
  const scale = journeyScale({
    current: headline,
    baseline: baselineTotal(data?.mockSessions ?? []) ?? reported?.total ?? null,
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
  const hasMocks =
    typeof score.math === "object" || typeof score.reading === "object";
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
          {score.total != null ? <span>Latest section mock estimates</span> : fromProfile ? <span>From your Academic profile</span> : null}
        </div>
        <div className="sat-platform__score-line">
          {headline != null ? (
            <div>
              <strong>{headline}</strong>
              <span>{fromProfile ? "Your SAT score · from your profile" : "Latest combined estimate"}</span>
              {!fromProfile && reported?.total != null && (
                <small className="sat-platform__profile-score">Official SAT in your profile: {reported.total}</small>
              )}
            </div>
          ) : (
            <div />
          )}
          <SatTargetScore score={headline} />
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
        {headline != null && (
          <div className="sat-platform__journey-meta">
            <span>
              {fromProfile
                ? [
                    reported?.math != null ? `Math ${reported.math}` : null,
                    reported?.readingWriting != null ? `Reading & Writing ${reported.readingWriting}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "From your Academic profile"
                : "Based on your latest Math and Reading & Writing mocks"}
            </span>
            {target != null && (
              <span>
                {scale.toGo
                  ? `${scale.toGo} points to go · ${scale.min} → ${target}`
                  : "Target reached"}
              </span>
            )}
          </div>
        )}
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
              : "Practise today to start a streak"}
          </strong>
          {streak.count > 0 && (
            <span>
              {streak.atRisk
                ? "Practise today to keep it going"
                : streak.doneToday
                  ? "You practised today"
                  : "One practice session today"}
            </span>
          )}
        </div>
        {streak.count > 0 && (
          <span
            className={`sat-streak__goal${streak.doneToday ? " is-done" : ""}`}
          >
            {streak.doneToday ? "Done today" : "Not done yet"}
          </span>
        )}
      </section>
      <section className="sat-platform__plan">
        <header>
          <h2>Your next steps</h2>
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
                  : "Math or Reading & Writing"}
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
                  ? "Check your reasoning and read the explanation."
                  : "Flag questions during practice."}
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
      {(skills.length > 0 || hasMocks) && (
        <section className="sat-platform__performance">
          {skills.length > 0 && (
            <div>
              <header>
                <h2>Where to focus next</h2>
                <Link to={`${BASE}/review`}>
                  All progress <ArrowRight size={14} />
                </Link>
              </header>
              {skills.slice(0, 3).map((skill) => (
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
              ))}
            </div>
          )}
          {hasMocks && (
            <div className="sat-platform__breakdown">
              <header>
                <h2>Your section mocks</h2>
                {score.total != null && (
                  <span className="sat-platform__combined">
                    {score.total}
                    <small> combined</small>
                  </span>
                )}
              </header>
              <div className="sat-platform__sections">
                {[
                  ["Math", score.math],
                  ["Reading & Writing", score.reading],
                ].map(([label, session]) => {
                  const s = typeof session === "object" ? session : undefined;
                  if (!s) return null;
                  return (
                    <div key={String(label)}>
                      <span>{String(label)}</span>
                      <strong>
                        {s.estimatedScore ?? "—"}
                        <small> / 800</small>
                      </strong>
                      {(() => {
                        const official = label === "Math" ? reported?.math : reported?.readingWriting;
                        return official != null ? <em className="sat-platform__profile-section">Profile: {official}</em> : null;
                      })()}
                      <p>
                        {new Date(s.completedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Link className="sat-platform__text-link" to={`${BASE}/review`}>
                View your practice history <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
export default SatDashboardPage;

/** Valid SAT numbers from the profile (sections 200–800, total 400–1600). */
function profileSatScore(
  sat?: { math?: number | string; readingWriting?: number | string; total?: number | string },
  onboardingTotal?: number | string | null,
) {
  // Form inputs can persist numbers as strings ("1450"), so coerce first.
  const inRange = (value: unknown, min: number, max: number) => {
    const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
    return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max ? n : undefined;
  };
  const math = inRange(sat?.math, 200, 800);
  const readingWriting = inRange(sat?.readingWriting, 200, 800);
  const total =
    inRange(sat?.total, 400, 1600) ??
    (math != null && readingWriting != null ? math + readingWriting : undefined) ??
    inRange(onboardingTotal, 400, 1600);
  return math == null && readingWriting == null && total == null ? null : { math, readingWriting, total };
}
