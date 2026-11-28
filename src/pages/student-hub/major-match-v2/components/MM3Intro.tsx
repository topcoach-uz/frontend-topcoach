import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, Lock, ArrowRight, Check, Clock, ListChecks, Sparkles } from "lucide-react";

import { MajorMatchUpsell } from "../../psychometric-assessment/components/MajorMatchUpsell";
import { MM3MotionVisual } from "./MM3MotionVisual";
import type { MajorMatchAccessStatus } from "../../../../app/services/student-hub/majorMatchApi";
import {
  MM3_PARTS,
  MM3_TOTAL_PARTS,
  MM3_TOTAL_QUESTIONS,
} from "../mm3-content";
import "../mm3-runner.scss";

/** The in-app first visit uses the motion intro; public and completed states
 * retain their existing assessment entry points. */

interface MM3IntroProps {
  readOnly?: boolean;
  targetDegree?: "bachelor" | "master" | null;
  /**
   * 'public' is the signed-out lead-magnet page, which shows majors ONLY —
   * universities sit behind signup. The in-app copy promises "the universities
   * to reach them", which that page does not deliver, so the headline swaps
   * rather than the component being forked.
   */
  variant?: "inApp" | "public";
  hasReport: boolean;
  access?: MajorMatchAccessStatus;
  hasDraft: boolean;
  /**
   * Per-part completion, index-aligned with `MM3_PARTS`. Derived from the
   * answers the localStorage draft restores — MM3 persists nothing partial
   * server-side, so this is same-device only.
   */
  partsCompleted?: boolean[];
  onStart: () => void;
  onViewResults: () => void;
  onChooseDirect?: () => void;
  onUnlock: () => void;
}

export const MM3Intro: React.FC<MM3IntroProps> = ({
  readOnly = false,
  targetDegree,
  variant = "inApp",
  hasReport,
  access,
  hasDraft,
  partsCompleted,
  onStart,
  onViewResults,
  onChooseDirect,
  onUnlock,
}) => {
  const { t } = useTranslation();
  const isMasters = targetDegree === "master";

  const requiresEnrollment =
    !readOnly &&
    !!access &&
    !access.canStart &&
    access.requiresCommunityEnrollment;

  /* Progress across the three parts. `doneCount === MM3_TOTAL_PARTS` means
     every question is answered but nothing has been submitted yet — the
     student still has to run the analysis, hence "See My Match". */
  const partDone = partsCompleted ?? [];
  const doneCount = partDone.filter(Boolean).length;
  const inProgress = doneCount > 0 && doneCount < MM3_TOTAL_PARTS;
  /* Minutes left = the parts still outstanding, so the number shrinks as
     they go rather than quoting one fixed figure at every stage. */
  const minutesLeft = MM3_PARTS.reduce(
    (sum, part, i) => (partDone[i] ? sum : sum + part.estMinutes),
    0,
  );

  if (readOnly) {
    if (!hasReport) {
      return (
        <div className="mm2__state">
          <p className="mm2__state-text">
            {t(
              "studentHub.psychometric.counselorEmpty",
              "This student hasn't completed the AI Major Match assessment yet.",
            )}
          </p>
        </div>
      );
    }
    return (
      <div className="mm2__intro">
        <button
          type="button"
          className="mm2__btn mm2__btn--primary"
          onClick={onViewResults}
        >
          <Eye size={15} />
          {t("majorMatch.intro.viewResultsCta", "View your results")}
        </button>
      </div>
    );
  }

  if (variant === "inApp" && !hasReport) {
    const actionLabel = requiresEnrollment
      ? t("studentHub.psychometric.unlockUnlimited", "Unlock unlimited matches")
      : doneCount === MM3_TOTAL_PARTS
        ? t("majorMatch3.intro.seeMatchCta", "See My Match")
        : inProgress
          ? t(
              "majorMatch3.intro.continueCta",
              "Continue — {{done}}/{{total}} done",
              {
                done: doneCount,
                total: MM3_TOTAL_PARTS,
              },
            )
          : t("majorMatch3.intro.startCta", "Start My Match");

    return (
      <div className="mm3-motion-intro">
        <section
          className="mm3-motion-intro__hero"
          aria-labelledby="mm3-motion-title"
        >
          <div className="mm3-motion-intro__copy">
            <span className="mm3-motion-intro__eyebrow">
              <Sparkles size={14} aria-hidden />
              {t("majorMatch3.intro.eyebrow", "AI MAJOR MATCH")}
            </span>
            <h1 className="mm3-motion-intro__title" id="mm3-motion-title">
              {t("majorMatch3.intro.title", "Find your best-fit majors.")}
            </h1>
            <p className="mm3-motion-intro__subtitle">
              {t(
                "majorMatch3.intro.motionSubtitle",
                "Thirty answers turn a world of possibilities into a direction that feels like yours.",
              )}
            </p>
            <div className="mm3-motion-intro__action">
              <button
                type="button"
                className="mm3-motion-intro__button"
                onClick={requiresEnrollment ? onUnlock : onStart}
              >
                <span>{actionLabel}</span>
                <ArrowRight size={18} aria-hidden />
              </button>
              <p className="mm3-motion-intro__scope">
                <span><Clock size={14} aria-hidden />{t("majorMatch3.intro.estimatedTime", "10 minutes")}</span>
                <span><ListChecks size={14} aria-hidden />{t("majorMatch3.intro.questionCount", "{{total}} questions", {
                  total: MM3_TOTAL_QUESTIONS,
                })}</span>
              </p>
            </div>
          </div>
          <MM3MotionVisual />
        </section>

        {onChooseDirect && (
          <div className="mm3-motion-intro__bottom">
            <button
              type="button"
              className="mm3-motion-intro__direct"
              onClick={onChooseDirect}
            >
              {t(
                "majorMatch3.intro.chooseDirect",
                "I already know what I want to study",
              )}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        )}
        {hasDraft && (
          <p className="mm3-motion-intro__notice">
            {t(
              "majorMatch.intro.draftRestoredNotice",
              "We restored your in-progress answers from last time.",
            )}
          </p>
        )}
        {inProgress && !requiresEnrollment && (
          <p className="mm3-motion-intro__notice">
            {t(
              "majorMatch3.intro.reminder",
              "No rush — pick up right where you stopped, in about {{minutes}} minutes.",
              { minutes: minutesLeft },
            )}
          </p>
        )}
        {requiresEnrollment && (
          <MajorMatchUpsell
            message={access?.promptMessage}
            onUnlock={onUnlock}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mm2__intro">
      <div className="mm3-intro__hero">
        <div className="mm3-intro__hero-copy">
          <div className="mm2__eyebrow">
            {hasReport
              ? t("majorMatch3.intro.completedEyebrow", "ASSESSMENT COMPLETED")
              : t("majorMatch3.intro.eyebrow", "AI MAJOR MATCH")}
          </div>
          <h1 className="mm2__title">
            {hasReport
              ? t("majorMatch3.intro.completedTitle", "Your results are ready")
              : variant === "public"
                ? t(
                    "majorMatch3.intro.publicTitle",
                    "Which major actually fits you?",
                  )
                : t("majorMatch3.intro.title", "Find your best-fit majors.")}
          </h1>
          <p className="mm2__subtitle">
            {hasReport
              ? t(
                  "majorMatch3.intro.completedSubtitle",
                  "Review your matches and roadmap. You can revisit your results without retaking the assessment.",
                )
              : variant === "public"
                ? t(
                    "majorMatch3.intro.publicSubtitle",
                    "Answer {{total}} questions about your academics, interests and preferences. You get your best-fit majors free. No account needed to start.",
                    { total: MM3_TOTAL_QUESTIONS },
                  )
                : t(
                    "majorMatch3.intro.subtitle",
                    "Get a personalized starting point for majors and universities, based on your background, interests and goals.",
                  )}
          </p>

          <div className="mm2__stats">
            <div className="mm2__stat">
              <div className="mm2__stat-value">
                {t("majorMatch3.intro.estimatedTime", "10 minutes")}
              </div>
            </div>
            <div className="mm2__stat">
              <div className="mm2__stat-value">
                {t("majorMatch3.intro.questionCount", "{{total}} questions", {
                  total: MM3_TOTAL_QUESTIONS,
                })}
              </div>
            </div>
            <div className="mm2__stat">
              <div className="mm2__stat-value">
                {t("majorMatch3.intro.partCount", "{{total}} parts", {
                  total: MM3_TOTAL_PARTS,
                })}
              </div>
            </div>
          </div>
        </div>
        {!hasReport && variant === "inApp" && (
          <aside
            className="mm3-intro__preview"
            aria-label={t("majorMatch3.intro.previewLabel", "Example report")}
          >
            <span className="mm3-intro__preview-eyebrow">
              {t("majorMatch3.intro.previewLabel", "EXAMPLE REPORT")}
            </span>
            <h2>{t("majorMatch3.intro.previewTitle", "Why a major fits")}</h2>
            <p className="mm3-intro__preview-subtitle">
              {t("majorMatch3.intro.previewSubtitle", "Based on your answers")}
            </p>
            {(["interests", "skills", "workStyle", "goals"] as const).map(
              (signal) => (
                <div className="mm3-intro__preview-row" key={signal}>
                  <span>
                    {t(
                      `majorMatch3.intro.signal.${signal}`,
                      {
                        interests: "Interests",
                        skills: "Skills",
                        workStyle: "Work style",
                        goals: "Goals",
                      }[signal],
                    )}
                  </span>
                  <span className="mm3-intro__preview-track" aria-hidden="true">
                    <span
                      className={`mm3-intro__preview-fill mm3-intro__preview-fill--${signal}`}
                    />
                  </span>
                </div>
              ),
            )}
            <p className="mm3-intro__preview-insight">
              {t(
                "majorMatch3.intro.previewInsight",
                "Strong interest can reveal a skill to build.",
              )}
            </p>
          </aside>
        )}
      </div>

      {hasReport && (
        <div className="mm3-intro__results-first">
          <button
            type="button"
            className="mm2__btn mm2__btn--primary"
            onClick={onViewResults}
          >
            <Eye size={15} />
            {t("majorMatch.intro.viewResultsCta", "View your results")}
          </button>
        </div>
      )}

      <div className="mm3-intro__parts">
        {MM3_PARTS.map((part, i) => {
          const done = !!partDone[i];
          return (
            <div
              key={part.slug}
              className={`mm3-intro__part-card${done ? " mm3-intro__part-card--done" : ""}`}
            >
              <span className="mm3-intro__part-roman">
                {part.roman} ·{" "}
                {isMasters && part.slug === "academic"
                  ? t(
                      "majorMatch3.part.academic.masterLabel",
                      "Graduate profile",
                    )
                  : t(`majorMatch3.part.${part.slug}.label`)}
              </span>
              <h3 className="mm3-intro__part-title">
                {isMasters && part.slug === "academic"
                  ? t(
                      "majorMatch3.part.academic.masterTitle",
                      "Your academic foundation",
                    )
                  : t(`majorMatch3.part.${part.slug}.title`)}
              </h3>
              <p className="mm3-intro__part-desc">
                {isMasters && part.slug === "academic"
                  ? t(
                      "majorMatch3.part.academic.masterDesc",
                      "Your degree background, coursework, tests, achievements, and experience.",
                    )
                  : t(`majorMatch3.part.${part.slug}.desc`)}
              </p>
              {done ? (
                <span className="mm3-intro__part-done">
                  <Check size={13} />
                  {t("majorMatch3.intro.partCompleted", "Completed")}
                </span>
              ) : (
                <span className="mm3-intro__part-count">
                  {t(
                    "majorMatch3.intro.partMeta",
                    "{{count}} questions · ~{{minutes}} min",
                    {
                      count: part.questionIds.length,
                      minutes: part.estMinutes,
                    },
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {hasReport && (
        <div className="mm2__notice">
          {t(
            "majorMatch3.intro.completedNotice",
            "You've already completed this assessment.",
          )}
        </div>
      )}
      {!hasReport && hasDraft && (
        <div className="mm2__notice">
          {t(
            "majorMatch.intro.draftRestoredNotice",
            "We restored your in-progress answers from last time.",
          )}
        </div>
      )}

      <div className="mm2__cta-row">
        {requiresEnrollment ? (
          <button
            type="button"
            className="mm2__btn mm2__btn--secondary"
            onClick={onUnlock}
          >
            <Lock size={14} />
            {t(
              "studentHub.psychometric.unlockUnlimited",
              "Unlock unlimited matches",
            )}
          </button>
        ) : (
          (!hasReport || (access?.canStart ?? true)) && (
            <button
              type="button"
              className={
                hasReport
                  ? "mm2__btn mm2__btn--secondary"
                  : "mm2__btn mm2__btn--primary"
              }
              onClick={onStart}
            >
              {hasReport
                ? hasDraft
                  ? t(
                      "majorMatch3.intro.continueRetakeCta",
                      "Continue your retake",
                    )
                  : t("majorMatch3.intro.retakeCta", "Retake the assessment")
                : doneCount === MM3_TOTAL_PARTS
                  ? t("majorMatch3.intro.seeMatchCta", "See My Match")
                  : inProgress
                    ? t(
                        "majorMatch3.intro.continueCta",
                        "Continue — {{done}}/{{total}} done",
                        {
                          done: doneCount,
                          total: MM3_TOTAL_PARTS,
                        },
                      )
                    : t("majorMatch3.intro.startCta", "Start My Match")}
              <ArrowRight size={15} />
            </button>
          )
        )}
      </div>

      {!hasReport && onChooseDirect && (
        <button
          type="button"
          className="mm3-intro__direct"
          onClick={onChooseDirect}
        >
          {t(
            "majorMatch3.intro.chooseDirect",
            "I already know what I want to study",
          )}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}

      {inProgress && !hasReport && !requiresEnrollment && (
        <p className="mm3-intro__reminder">
          {t(
            "majorMatch3.intro.reminder",
            "No rush — pick up right where you stopped, in about {{minutes}} minutes.",
            { minutes: minutesLeft },
          )}
        </p>
      )}

      {requiresEnrollment && (
        <MajorMatchUpsell message={access?.promptMessage} onUnlock={onUnlock} />
      )}
    </div>
  );
};
