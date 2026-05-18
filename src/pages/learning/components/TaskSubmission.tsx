import React, { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { RefreshCw } from 'lucide-react';
import {
  useGetTasksByLessonQuery,
  useSubmitTaskMutation,
  useGetLessonTaskSubmissionsQuery,
  useRetakeTaskMutation,
} from 'src/app/services/courses';
import type { CourseTaskDto, TaskResultDto } from 'src/app/services/courses';
import './TaskSubmission.scss';

/**
 * Editorial-style practice-question runner.
 *
 * Flow: the student picks an answer per question, walks back and forth
 * via Prev/Next buttons (or ← / → arrow keys), then hits a single
 * "Submit quiz" button. If they try to submit with unanswered
 * questions, a confirmation modal offers "Resume" (jumps to the first
 * unanswered) or "Submit anyway" (scores blanks as wrong). On submit
 * the answers fan out in parallel to the per-task endpoint, then the
 * UI flips to review mode with correct/wrong markers, explanations,
 * and a retry. ≥80% unlocks lesson completion.
 *
 * The backend submit endpoint upserts, so partial-then-full re-submits
 * just bump attemptNumber on the prior rows.
 */

interface TaskSubmissionProps {
  lessonId: string;
  onTaskComplete?: () => void;
  onAllTasksCorrectlyCompleted?: () => void;
  onTasksScoreUpdate?: (correctCount: number, totalCount: number, percentage: number) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const TaskSubmission: React.FC<TaskSubmissionProps> = ({
  lessonId,
  onTaskComplete,
  onAllTasksCorrectlyCompleted,
  onTasksScoreUpdate,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [taskResults, setTaskResults] = useState<Record<string, TaskResultDto>>({});
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [partialConfirmOpen, setPartialConfirmOpen] = useState(false);

  const { data: tasks, isLoading, error } = useGetTasksByLessonQuery(lessonId, {
    skip: !lessonId,
  });
  const { data: existingSubmissions } = useGetLessonTaskSubmissionsQuery(lessonId, {
    skip: !lessonId,
  });
  const [submitTask] = useSubmitTaskMutation();
  const [retakeTask, { isLoading: isRetaking }] = useRetakeTaskMutation();

  // Hydrate from server-side submissions. If every task already has a
  // submission, we land straight in review mode. If only some do (legacy
  // per-question submissions from the old flow), we just pre-fill those
  // answer picks so the user can finish and submit the rest in one shot.
  useEffect(() => {
    if (!existingSubmissions || !tasks) return;

    const picks: Record<string, number> = {};
    const results: Record<string, TaskResultDto> = {};
    existingSubmissions.forEach((sub: any) => {
      const task = tasks.find((t: CourseTaskDto) => t.id === sub.taskId);
      picks[sub.taskId] = sub.submittedAnswerIndex ?? 0;
      results[sub.taskId] = {
        submission: {
          id: sub.id || '',
          taskId: sub.taskId,
          userId: sub.userId || '',
          selectedAnswerIndex: sub.submittedAnswerIndex || 0,
          isCorrect: sub.isCorrect,
          score: sub.isCorrect ? 1 : 0,
          attemptNumber: 1,
          submittedAt: sub.submittedAt || new Date().toISOString(),
        },
        isCorrect: sub.isCorrect,
        score: sub.isCorrect ? 1 : 0,
        correctAnswerIndex: task?.correctAnswerIndex || 0,
        explanation: task?.explanation || '',
      };
    });

    setSelectedAnswers(picks);

    if (existingSubmissions.length > 0 && existingSubmissions.length === tasks.length) {
      setTaskResults(results);
      setReviewMode(true);
    } else {
      setTaskResults({});
      setReviewMode(false);
    }
  }, [existingSubmissions, tasks]);

  // Propagate score upward (unchanged contract).
  useEffect(() => {
    if (!tasks || tasks.length === 0 || !reviewMode) return;
    const correctCount = tasks.filter((task) => {
      const r = taskResults[task.id];
      return !!(r && r.isCorrect);
    }).length;
    const totalCount = tasks.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    if (onTasksScoreUpdate) onTasksScoreUpdate(correctCount, totalCount, percentage);
    if (percentage >= 80 && onAllTasksCorrectlyCompleted) onAllTasksCorrectlyCompleted();
  }, [taskResults, tasks, reviewMode, onTasksScoreUpdate, onAllTasksCorrectlyCompleted]);

  // ← / → arrow-key navigation. Skip when focus is inside a form field
  // or when a modal is open so we don't steal keys from typing/dialogs.
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (partialConfirmOpen) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (e.key === 'ArrowLeft') {
        setCurrentTaskIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentTaskIndex((i) => Math.min(tasks.length - 1, i + 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tasks, partialConfirmOpen]);

  if (isLoading) {
    return (
      <section className="ts-shell">
        <p className="ts-shell__loading">Loading questions…</p>
      </section>
    );
  }

  if (error || !tasks || tasks.length === 0) {
    return null;
  }

  const currentTask = tasks[currentTaskIndex];
  if (!currentTask?.id) return null;

  const result = taskResults[currentTask.id];
  const selectedAnswer = selectedAnswers[currentTask.id];

  const answeredCount = tasks.filter((t) => selectedAnswers[t.id] !== undefined).length;
  const allAnswered = answeredCount === tasks.length;
  const unansweredCount = tasks.length - answeredCount;

  const correctCount = tasks.filter((t) => taskResults[t.id]?.isCorrect).length;
  const incorrectCount = tasks.filter((t) => {
    const r = taskResults[t.id];
    return r && !r.isCorrect;
  }).length;
  const percentage = tasks.length > 0 ? Math.round((correctCount / tasks.length) * 100) : 0;
  const canCompleteLesson = percentage >= 80;

  const onPickAnswer = (taskId: string, idx: number) => {
    if (reviewMode) return;
    setSelectedAnswers((prev) => ({ ...prev, [taskId]: idx }));
  };

  const runSubmit = async () => {
    setIsSubmittingAll(true);
    try {
      // Only submit tasks that actually have a pick. Unanswered ones
      // stay unsubmitted; in review mode they render with the correct
      // answer revealed but no user-answer tag.
      const answered = tasks.filter((t) => selectedAnswers[t.id] !== undefined);
      const responses = await Promise.all(
        answered.map((task) =>
          submitTask({
            taskId: task.id,
            selectedAnswerIndex: selectedAnswers[task.id],
          }).unwrap(),
        ),
      );
      const results: Record<string, TaskResultDto> = {};
      answered.forEach((task, i) => {
        results[task.id] = responses[i];
      });
      setTaskResults(results);
      setReviewMode(true);
      setCurrentTaskIndex(0);
      onTaskComplete?.();
    } catch (err: any) {
      message.error(err?.data?.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const onSubmitClick = () => {
    if (allAnswered) {
      runSubmit();
      return;
    }
    setPartialConfirmOpen(true);
  };

  const handleResume = () => {
    setPartialConfirmOpen(false);
    const nextIdx = tasks.findIndex((t) => selectedAnswers[t.id] === undefined);
    if (nextIdx >= 0) setCurrentTaskIndex(nextIdx);
  };

  const handleSubmitAnyway = () => {
    setPartialConfirmOpen(false);
    runSubmit();
  };

  const onRetryAll = async () => {
    try {
      await Promise.all(tasks.map((t) => retakeTask(t.id).unwrap()));
      setTaskResults({});
      setSelectedAnswers({});
      setReviewMode(false);
      setCurrentTaskIndex(0);
      message.success('Questions reset.');
    } catch (err: any) {
      message.error(err?.data?.message || 'Failed to reset questions.');
    }
  };

  const goPrev = () => setCurrentTaskIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setCurrentTaskIndex((i) => Math.min(tasks.length - 1, i + 1));

  return (
    <section className="ts-shell">
      {/* Header — eyebrow + progress rule */}
      <header className="ts-header">
        <div className="ts-header__eyebrow">Practice</div>
        <h2 className="ts-header__title">
          {reviewMode ? 'Review' : 'Question'} {currentTaskIndex + 1} of {tasks.length}
        </h2>
        <div className="ts-progress-rule">
          <span style={{ width: `${((currentTaskIndex + 1) / tasks.length) * 100}%` }} />
        </div>
        {reviewMode && (
          <div className="ts-header__summary">
            <span>
              <strong>{correctCount}</strong> correct
              <span className="ts-header__dot" aria-hidden> · </span>
              <strong>{incorrectCount}</strong> incorrect
              <span className="ts-header__dot" aria-hidden> · </span>
              <strong>{percentage}%</strong>
            </span>
          </div>
        )}
      </header>

      {/* Question body */}
      <article className="ts-question">
        <p className="ts-question__text">{currentTask.question}</p>

        <ol className="ts-options">
          {currentTask.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === currentTask.correctAnswerIndex;
            const isUserAnswer = result?.submission.selectedAnswerIndex === idx;
            const showReveal = reviewMode && !!result;

            let stateClass = '';
            if (showReveal) {
              if (isCorrect) stateClass = 'ts-option--correct';
              else if (isUserAnswer && !isCorrect) stateClass = 'ts-option--wrong';
            } else if (isSelected) {
              stateClass = 'ts-option--picked';
            }

            return (
              <li key={idx} className={`ts-option ${stateClass}`}>
                <button
                  type="button"
                  className="ts-option__btn"
                  onClick={() => onPickAnswer(currentTask.id, idx)}
                  disabled={reviewMode}
                >
                  <span className="ts-option__letter">{LETTERS[idx] ?? '?'}</span>
                  <span className="ts-option__text">{option.text}</span>
                  {showReveal && isCorrect && <span className="ts-option__tag">correct</span>}
                  {showReveal && isUserAnswer && !isCorrect && (
                    <span className="ts-option__tag ts-option__tag--wrong">your answer</span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        {reviewMode && result?.explanation && (
          <aside className="ts-explanation">
            <span className="ts-explanation__label">Explanation</span>
            <p>{result.explanation}</p>
          </aside>
        )}

        {/* Submit lives on every question while taking the quiz. The
            partial-answer warning modal handles incomplete state, so
            the button itself stays clickable. */}
        {!reviewMode && (
          <div className="ts-actions">
            <button
              type="button"
              className="ts-btn-primary"
              onClick={onSubmitClick}
              disabled={isSubmittingAll}
            >
              {isSubmittingAll ? 'Submitting…' : 'Submit quiz →'}
            </button>
          </div>
        )}
      </article>

      {/* Footer — score footnote + retry (review mode only) */}
      {reviewMode && (
        <div className="ts-footnote">
          {canCompleteLesson ? (
            <span>
              <em>Great work — you cleared the 80% threshold.</em> You can complete this lesson.
            </span>
          ) : (
            <span>
              <em>You need 80% correct to complete this lesson.</em>{' '}
              You scored <strong>{percentage}%</strong>.
            </span>
          )}
          <button
            type="button"
            className="ts-link-btn"
            onClick={onRetryAll}
            disabled={isRetaking}
          >
            <RefreshCw size={13} /> {isRetaking ? 'Resetting…' : 'Retry questions'}
          </button>
        </div>
      )}

      <nav className="ts-nav" aria-label="Question navigation">
        <button
          type="button"
          className="ts-nav__btn"
          onClick={goPrev}
          disabled={currentTaskIndex === 0}
        >
          ← Previous
        </button>
        <span className="ts-nav__counter">
          {reviewMode
            ? `${currentTaskIndex + 1} / ${tasks.length}`
            : `${answeredCount}/${tasks.length} answered`}
        </span>
        <button
          type="button"
          className="ts-nav__btn ts-nav__btn--right"
          onClick={goNext}
          disabled={currentTaskIndex === tasks.length - 1}
        >
          Next →
        </button>
      </nav>

      <Modal
        open={partialConfirmOpen}
        onCancel={handleResume}
        onOk={handleSubmitAnyway}
        title="Submit quiz?"
        okText="Submit anyway"
        cancelText="Resume"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <p>
          You haven't answered all questions. You still have{' '}
          <strong>
            {unansweredCount} {unansweredCount === 1 ? 'question' : 'questions'}
          </strong>{' '}
          left.
        </p>
        <p style={{ marginTop: 8, opacity: 0.75 }}>
          <em>Resume</em> jumps to your first unanswered question.{' '}
          <em>Submit anyway</em> scores blanks as incorrect.
        </p>
      </Modal>
    </section>
  );
};

export default TaskSubmission;
