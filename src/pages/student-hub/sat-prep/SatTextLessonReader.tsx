import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import type { CourseLessonDto } from "src/app/services/courses";
import { RunnerModal } from "src/components/sat-prep/RunnerModal";
import SatHtml from "src/components/sat-prep/SatHtml";
import "./sat-text-lesson.scss";

export default function SatTextLessonReader({
  lesson,
  onClose,
}: {
  lesson: CourseLessonDto | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const practiceUrl = lesson?.textPracticeUrl?.startsWith(
    "/student-hub/sat-prep/practice?",
  )
    ? lesson.textPracticeUrl
    : undefined;
  return (
    <RunnerModal
      open={!!lesson}
      onClose={onClose}
      title={lesson?.title ?? "Text lesson"}
      eyebrow="SAT Library · Text lesson"
      size="lg"
      footer={
        <>
          <button className="rm-btn rm-btn--ghost" onClick={onClose}>
            Back to Library
          </button>
          {practiceUrl && (
            <button
              className="rm-btn rm-btn--primary"
              onClick={() => navigate(practiceUrl)}
            >
              Practice this skill <ArrowRight size={15} />
            </button>
          )}
        </>
      }
    >
      {lesson && (
        <div className="sat-text-lesson">
          <p className="sat-text-lesson__objective">
            <BookOpen size={16} />
            {lesson.description}
          </p>
          {lesson.isDraft && (
            <p className="sat-text-lesson__draft">
              Draft lesson · Educator review pending
            </p>
          )}
          {lesson.textContentHtml ? (
            <SatHtml
              html={lesson.textContentHtml}
              className="sat-text-lesson__body"
            />
          ) : (
            <p>This lesson has no text content yet.</p>
          )}
          {!!lesson.textReferences?.length && (
            <details className="sat-text-lesson__references">
              <summary>Further reading</summary>
              <ul>
                {lesson.textReferences
                  .filter((r) => r.url.startsWith("https://"))
                  .map((r, i) => (
                    <li key={r.url}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        {r.provider} · Reference {i + 1}{" "}
                        <ExternalLink size={12} />
                      </a>
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </RunnerModal>
  );
}
