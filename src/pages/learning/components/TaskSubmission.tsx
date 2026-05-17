import React, { useEffect, useState } from 'react';
import { message } from 'antd';
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
 * The previous implementation rendered each question as a card with
 * tinted backgrounds and Slack-style success/error chrome. This version
 * treats each question as a typographic page: numbered Q.NN heading,
 * serif body, lettered options with thin rules for state.
 *
 * Functional contract is unchanged — submit / retake / 80% threshold
 * behavior is preserved; only chrome was rewritten.
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
  const [submittedTasks, setSubmittedTasks] = useState<Set<string>>(new Set());
  const [taskResults, setTaskResults] = useState<Record<string, TaskResultDto>>({});
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [allTasksSubmitted, setAllTasksSubmitted] = useState(false);

  const { data: tasks, isLoading, error } = useGetTasksByLessonQuery(lessonId, {
    skip: !lessonId,
  });
  const { data: existingSubmissions } = useGetLessonTaskSubmissionsQuery(lessonId, {
    skip: !lessonId,
  });
  const [submitTask, { isLoading: isSubmitting }] = useSubmitTaskMutation();
  const [retakeTask, { isLoading: isRetaking }] = useRetakeTaskMutation();

  // Hydrate from server submissions
  useEffect(() => {
    if (!existingSubmissions || !tasks) return;
    const submittedTaskIds = new Set(existingSubmissions.map((sub: any) => sub.taskId));
    setSubmittedTasks(submittedTaskIds);

    const results: Record<string, TaskResultDto> = {};
    existingSubmissions.forEach((sub: any) => {
      const task = tasks.find((t: CourseTaskDto) => t.id === sub.taskId);
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
    setTaskResults(results);

    if (existingSubmissions.length > 0 && submittedTaskIds.size === tasks.length) {
      setAllTasksSubmitted(true);
      setReviewMode(true);
    } else {
      setAllTasksSubmitted(false);
      setReviewMode(false);
    }
  }, [existingSubmissions, tasks]);

  // Propagate score upward (unchanged contract)
  useEffect(() => {
    if (!tasks || tasks.length === 0 || !allTasksSubmitted) return;
    const correctCount = tasks.filter((task) => {
      const result = taskResults[task.id];
      return !!(result && result.isCorrect);
    }).length;
    const totalCount = tasks.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    if (onTasksScoreUpdate) onTasksScoreUpdate(correctCount, totalCount, percentage);
    if (percentage >= 80 && onAllTasksCorrectlyCompleted) onAllTasksCorrectlyCompleted();
  }, [taskResults, tasks, allTasksSubmitted, onTasksScoreUpdate, onAllTasksCorrectlyCompleted]);

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

  const isSubmitted = submittedTasks.has(currentTask.id);
  const result = taskResults[currentTask.id];
  const selectedAnswer = selectedAnswers[currentTask.id];

  const correctCount = tasks.filter((t) => taskResults[t.id]?.isCorrect).length;
  const incorrectCount = tasks.filter((t) => {
    const r = taskResults[t.id];
    return r && !r.isCorrect;
  }).length;
  const percentage = tasks.length > 0 ? Math.round((correctCount / tasks.length) * 100) : 0;
  const canCompleteLesson = percentage >= 80;

  const onPickAnswer = (taskId: string, idx: number) => {
    if (submittedTasks.has(taskId) || reviewMode) return;
    setSelectedAnswers((prev) => ({ ...prev, [taskId]: idx }));
  };

  const onSubmit = async () => {
    if (selectedAnswers[currentTask.id] === undefined) {
      message.warning('Choose an answer first.');
      return;
    }
    try {
      const result = await submitTask({
        taskId: currentTask.id,
        selectedAnswerIndex: selectedAnswers[currentTask.id],
      }).unwrap();
      setSubmittedTasks((prev) => new Set(prev).add(currentTask.id));
      setTaskResults((prev) => ({ ...prev, [currentTask.id]: result }));

      const allCompleted = tasks.every((t) => submittedTasks.has(t.id) || t.id === currentTask.id);
      if (allCompleted) {
        setAllTasksSubmitted(true);
        setReviewMode(true);
        onTaskComplete?.();
      } else {
        setTimeout(() => {
          if (currentTaskIndex < tasks.length - 1) setCurrentTaskIndex((i) => i + 1);
        }, 700);
      }
    } catch (err: any) {
      message.error(err?.data?.message || 'Failed to submit answer.');
    }
  };

  const onRetryAll = async () => {
    try {
      await Promise.all(tasks.map((t) => retakeTask(t.id).unwrap()));
      setSubmittedTasks(new Set());
      setTaskResults({});
      setSelectedAnswers({});
      setAllTasksSubmitted(false);
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
        {allTasksSubmitted && (
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
                  disabled={isSubmitted || reviewMode}
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

        {!reviewMode && !isSubmitted && (
          <div className="ts-actions">
            <button
              type="button"
              className="ts-btn-primary"
              onClick={onSubmit}
              disabled={selectedAnswer === undefined || isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Submit answer →'}
            </button>
          </div>
        )}
      </article>

      {/* Footer — score footnote + nav */}
      {allTasksSubmitted && (
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
          {currentTaskIndex + 1} / {tasks.length}
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
    </section>
  );
};

export default TaskSubmission;
