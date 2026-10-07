import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useGetSatProgressQuery } from "src/app/services/sat-prep/local-progress";
import { useGetMarkedQuestionsQuery } from "src/app/services/sat-prep/library";
import { scoreBreakdown, weakestSkills } from "./sat-overview-model";
import "./sat-platform.scss";
import "./sat-secondary-pages.scss";

export default function SatReviewPage() {
  const { data, isLoading, isError, refetch } = useGetSatProgressQuery();
  const { data: marked = [] } = useGetMarkedQuestionsQuery();
  const [section, setSection] = useState<"all" | "math" | "reading-writing">(
    "all",
  );
  const scores = scoreBreakdown(data?.mockSessions ?? []);
  const sessions = (data?.recentSessions ?? []).filter(
    (s) => section === "all" || s.section === section,
  );
  const skills = weakestSkills(data?.masteryRows ?? []).filter(
    (s) => section === "all" || s.section === section,
  );
  const firstScore = (key: "math" | "reading-writing") =>
    (data?.mockSessions ?? [])
      .filter(
        (s) =>
          s.section === key &&
          s.estimatedScore != null &&
          s.estimatedScore >= 200 &&
          s.estimatedScore <= 800,
      )
      .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))[0];
  return (
    <div className="sat-review">
      <header className="sat-secondary-heading">
        <div>
          <div className="sat-eyebrow">Your practice record</div>
          <h1>Review & analytics</h1>
          <p>
            Check your section scores, revisit saved questions, and choose what
            to practise next.
          </p>
        </div>
        <Link className="sat-review__back" to="/student-hub/sat-prep">
          ← Back to Overview
        </Link>
      </header>
      {isLoading ? (
        <p role="status">Loading your progress…</p>
      ) : isError ? (
        <div className="sat-secondary-notice" role="alert">
          We couldn’t load your progress.{" "}
          <button className="sat-action" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="sat-review__columns">
            <section className="sat-review__telemetry">
              <header>
                <h2>Score breakdown</h2>
                <span>Latest section mocks</span>
              </header>
              <div className="sat-review__scores">
                {(["math", "reading-writing"] as const).map((key) => {
                  const latest = key === "math" ? scores.math : scores.reading;
                  const first = firstScore(key);
                  const delta =
                    latest?.estimatedScore != null &&
                    first?.estimatedScore != null
                      ? latest.estimatedScore - first.estimatedScore
                      : null;
                  return (
                    <div key={key}>
                      <p>{key === "math" ? "Math" : "Reading & Writing"}</p>
                      <strong>
                        {latest?.estimatedScore ?? "—"}
                        <small>/ 800</small>
                      </strong>
                      <p
                        className={
                          delta != null && delta > 0 ? "sat-review__change" : ""
                        }
                      >
                        {!latest
                          ? "No completed mock yet"
                          : first?.id === latest.id
                            ? "First recorded mock"
                            : delta === 0
                              ? "Unchanged from first mock"
                              : `${delta! > 0 ? "+" : ""}${delta} points since first mock`}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="sat-review__session-heading">
                <h3>Latest section accuracy</h3>
                <span>Correct answers</span>
              </div>
              {[scores.math, scores.reading]
                .filter((s) => s != null)
                .map((s) => (
                  <div className="sat-review__accuracy" key={s!.id}>
                    <div>
                      <strong>
                        {s!.section === "math" ? "Math" : "Reading & Writing"}
                      </strong>
                      <span>
                        {s!.correctQ} / {s!.totalQ} correct
                      </span>
                    </div>
                    <div
                      className="sat-review__accuracy-track"
                      role="img"
                      aria-label={`${s!.correctQ} of ${s!.totalQ} answers correct`}
                    >
                      <i
                        style={{
                          width: `${s!.totalQ ? Math.min(100, Math.max(0, (s!.correctQ / s!.totalQ) * 100)) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              {!scores.math && !scores.reading && (
                <p className="sat-review__empty">
                  Complete a section mock to see your score and accuracy.
                </p>
              )}
              <p className="sat-review__caption">
                Estimated scores from completed section mocks.
              </p>
            </section>
            <aside className="sat-review__saved">
              <span className="sat-eyebrow">Saved for review</span>
              <h2>
                {marked.length}
                <small> question{marked.length === 1 ? "" : "s"}</small>
              </h2>
              <p>
                {marked.length
                  ? "Revisit the questions you flagged and read their explanations."
                  : "Flag a question during practice to revisit it here."}
              </p>
              <Link
                className="sat-action"
                to="/student-hub/sat-prep/library?tab=marked"
              >
                Review saved questions{" "}
                <span>
                  <ArrowRight size={14} />
                </span>
              </Link>
            </aside>
          </div>
          <div className="sat-secondary-filters" aria-label="Progress section">
            {(["all", "math", "reading-writing"] as const).map((s) => (
              <button
                key={s}
                aria-pressed={section === s}
                onClick={() => setSection(s)}
              >
                {s === "all"
                  ? "All sections"
                  : s === "math"
                    ? "Math"
                    : "Reading & Writing"}
              </button>
            ))}
          </div>
          <div className="sat-review__columns sat-review__detail-columns">
            <section>
              <h2 className="sat-review__section-title">Recent sessions</h2>
              {sessions.map((s) => (
                <div className="sat-review__record" key={s.id}>
                  <div>
                    <strong>{s.title}</strong>
                    <p>
                      {new Date(s.completedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {Math.round(s.durationSec / 60)} min · {s.correctQ}/
                      {s.totalQ} correct
                    </p>
                  </div>
                  <strong>
                    {s.estimatedScore != null
                      ? `${s.estimatedScore} / 800`
                      : `${s.totalQ ? Math.round((s.correctQ / s.totalQ) * 100) : 0}%`}
                  </strong>
                </div>
              ))}
              {!sessions.length && (
                <p className="sat-review__empty">
                  Your completed sessions will appear here.
                </p>
              )}
            </section>
            <section>
              <h2 className="sat-review__section-title">Skill accuracy</h2>
              {skills.map((s) => (
                <div
                  className="sat-review__skill"
                  key={`${s.section}-${s.skill}`}
                >
                  <div>
                    <strong>{s.skill}</strong>
                    <span>{s.pct}%</span>
                  </div>
                  <p>
                    {s.domain} · {s.correct} of {s.attempts} correct
                  </p>
                  <div className="sat-platform__bar">
                    <i
                      style={{ width: `${Math.min(100, Math.max(0, s.pct))}%` }}
                    />
                  </div>
                </div>
              ))}
              {!skills.length && (
                <p className="sat-review__empty">
                  Complete a practice set to see your skill accuracy.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
