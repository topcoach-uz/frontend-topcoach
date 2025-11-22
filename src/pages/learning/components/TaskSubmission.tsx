import React, { useState, useEffect } from 'react';
import { Card, Radio, Button, message, Space, Typography, Progress } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LeftOutlined, RightOutlined, ReloadOutlined } from '@ant-design/icons';
import { useGetTasksByLessonQuery, useSubmitTaskMutation, useGetTaskResultsQuery, useGetLessonTaskSubmissionsQuery, useRetakeTaskMutation } from 'src/app/services/courses';
import type { CourseTaskDto, TaskResultDto } from 'src/app/services/courses';
import './TaskSubmission.scss';

const { Title, Text, Paragraph } = Typography;

interface TaskSubmissionProps {
  lessonId: string;
  onTaskComplete?: () => void;
  onAllTasksCorrectlyCompleted?: () => void;
  onTasksScoreUpdate?: (correctCount: number, totalCount: number, percentage: number) => void;
}

const TaskSubmission: React.FC<TaskSubmissionProps> = ({ 
  lessonId, 
  onTaskComplete, 
  onAllTasksCorrectlyCompleted,
  onTasksScoreUpdate 
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedTasks, setSubmittedTasks] = useState<Set<string>>(new Set());
  const [taskResults, setTaskResults] = useState<Record<string, TaskResultDto>>({});
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  // Load existing submissions and mark tasks as completed
  useEffect(() => {
    if (existingSubmissions && tasks) {
      const submittedTaskIds = new Set(existingSubmissions.map((sub: any) => sub.taskId));
      setSubmittedTasks(submittedTaskIds);
      
      // Load results for already submitted tasks
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
      
      // Check if all tasks are already submitted
      if (submittedTaskIds.size === tasks.length) {
        setAllTasksSubmitted(true);
        setReviewMode(true);
      }
    }
  }, [existingSubmissions, tasks]);

  // Calculate score and notify parent
  useEffect(() => {
    if (tasks && tasks.length > 0 && allTasksSubmitted) {
      const correctCount = tasks.filter((task) => {
        const result = taskResults[task.id];
        return result && result.isCorrect;
      }).length;
      
      const totalCount = tasks.length;
      const percentage = Math.round((correctCount / totalCount) * 100);
      
      if (onTasksScoreUpdate) {
        onTasksScoreUpdate(correctCount, totalCount, percentage);
      }
      
      // Check if at least 80% are correct
      if (percentage >= 80 && onAllTasksCorrectlyCompleted) {
        onAllTasksCorrectlyCompleted();
      }
    }
  }, [taskResults, tasks, allTasksSubmitted, onTasksScoreUpdate, onAllTasksCorrectlyCompleted]);

  const handleAnswerSelect = (taskId: string, answerIndex: number) => {
    if (submittedTasks.has(taskId) || reviewMode) {
      return; // Don't allow changing answer after submission or in review mode
    }
    setSelectedAnswers((prev) => ({
      ...prev,
      [taskId]: answerIndex,
    }));
  };

  const handleSubmitTask = async (task: CourseTaskDto) => {
    if (selectedAnswers[task.id] === undefined) {
      message.warning('Please select an answer before submitting');
      return;
    }

    // Validate taskId is a valid UUID
    if (!task.id || typeof task.id !== 'string') {
      message.error('Invalid task ID. Please refresh the page and try again.');
      console.error('Invalid task ID:', task.id, 'Task:', task);
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(task.id)) {
      message.error('Invalid task ID format. Please refresh the page and try again.');
      console.error('Task ID is not a valid UUID:', task.id, 'Task:', task);
      return;
    }

    try {
      const selectedIndex = selectedAnswers[task.id];
      
      if (typeof selectedIndex !== 'number' || selectedIndex < 0) {
        message.error('Invalid answer selection. Please select an answer and try again.');
        console.error('Invalid selectedAnswerIndex:', selectedIndex, 'Task:', task);
        return;
      }

      const result = await submitTask({
        taskId: task.id,
        selectedAnswerIndex: selectedIndex,
      }).unwrap();

      setSubmittedTasks((prev) => new Set(prev).add(task.id));
      setTaskResults((prev) => ({
        ...prev,
        [task.id]: result,
      }));

      // Show simple feedback
      if (result.isCorrect) {
        message.success('Correct!');
      } else {
        message.error('Incorrect');
      }

      // Check if all tasks are now submitted
      if (tasks && tasks.length > 0) {
        const allCompleted = tasks.every((t) => submittedTasks.has(t.id) || t.id === task.id);
        if (allCompleted) {
          setAllTasksSubmitted(true);
          setReviewMode(true);
          if (onTaskComplete) {
            onTaskComplete();
          }
        } else {
          // Auto-advance to next question after a short delay
          setTimeout(() => {
            if (currentTaskIndex < tasks.length - 1) {
              handleNext();
            }
          }, 1000);
        }
      }
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to submit task');
    }
  };

  const handleRetryAll = async () => {
    if (!tasks || tasks.length === 0) return;

    try {
      // Retake all tasks
      const retakePromises = tasks.map((task) => retakeTask(task.id).unwrap());
      await Promise.all(retakePromises);

      // Reset all state
      setSubmittedTasks(new Set());
      setTaskResults({});
      setSelectedAnswers({});
      setAllTasksSubmitted(false);
      setReviewMode(false);
      setCurrentTaskIndex(0);
      
      message.success('All questions reset. You can start over.');
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to retake tasks');
    }
  };

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentTaskIndex(currentTaskIndex - 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleNext = () => {
    if (tasks && currentTaskIndex < tasks.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentTaskIndex(currentTaskIndex + 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  if (isLoading) {
    return (
      <div className="task-submission-loading">
        <p>Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-submission-error">
        <p>Failed to load tasks</p>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return null;
  }

  const currentTask = tasks[currentTaskIndex];
  
  if (currentTask && (!currentTask.id || typeof currentTask.id !== 'string')) {
    console.error('Invalid task structure:', currentTask);
    return (
      <div className="task-submission-error">
        <p>Invalid task data. Please refresh the page.</p>
      </div>
    );
  }

  const isSubmitted = submittedTasks.has(currentTask.id);
  const result = taskResults[currentTask.id];
  const selectedAnswer = selectedAnswers[currentTask.id];
  
  // Calculate statistics
  const correctCount = tasks.filter((task) => {
    const taskResult = taskResults[task.id];
    return taskResult && taskResult.isCorrect;
  }).length;
  
  const incorrectCount = tasks.length - correctCount;
  const percentage = tasks.length > 0 ? Math.round((correctCount / tasks.length) * 100) : 0;
  const canCompleteLesson = percentage >= 80;

  return (
    <div className="task-submission-container">
      <div className="tasks-header">
        <Title level={3} className="tasks-section-title">
          Practice Questions
        </Title>
        {!allTasksSubmitted ? (
          <Text type="secondary" className="tasks-section-description">
            Answer all questions. You'll see your results at the end.
          </Text>
        ) : (
          <div className="tasks-summary">
            <div className="summary-stats">
              <div className="stat-item correct">
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                <Text strong style={{ color: '#52c41a', marginLeft: 8 }}>
                  {correctCount} Correct
                </Text>
              </div>
              <div className="stat-item incorrect">
                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
                <Text strong style={{ color: '#ff4d4f', marginLeft: 8 }}>
                  {incorrectCount} Incorrect
                </Text>
              </div>
            </div>
            <Progress 
              percent={percentage} 
              strokeColor={canCompleteLesson ? '#52c41a' : '#ff4d4f'}
              style={{ marginTop: 16 }}
              format={(percent) => `${Math.round(percent || 0)}%`}
            />
            {canCompleteLesson ? (
              <Text type="success" style={{ display: 'block', marginTop: 12, fontSize: '14px' }}>
                <CheckCircleOutlined /> Great job! You can now complete this lesson.
              </Text>
            ) : (
              <Text type="warning" style={{ display: 'block', marginTop: 12, fontSize: '14px' }}>
                You need at least 80% correct to complete this lesson. Review your answers and retry.
              </Text>
            )}
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={handleRetryAll}
              loading={isRetaking}
              size="large"
              style={{ marginTop: 16 }}
            >
              Retry All Questions
            </Button>
          </div>
        )}
        <div className="tasks-progress">
          <Text type="secondary">
            {reviewMode ? 'Review Mode' : 'Question'} {currentTaskIndex + 1} of {tasks.length}
          </Text>
        </div>
      </div>

      <div className="task-navigation-container">
        <div className={`task-card-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
          <Card
            key={currentTask.id}
            className={`task-card ${reviewMode && result ? (result.isCorrect ? 'task-correct' : 'task-incorrect') : ''}`}
            title={
              <Space>
                <span>Question {currentTaskIndex + 1}</span>
                {reviewMode && result && (
                  <>
                    {result.isCorrect ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    )}
                  </>
                )}
              </Space>
            }
          >
            <Paragraph strong className="task-question">
              {currentTask.question}
            </Paragraph>

            <Radio.Group
              value={selectedAnswer}
              onChange={(e) => handleAnswerSelect(currentTask.id, e.target.value)}
              disabled={isSubmitted || reviewMode}
              className="task-options"
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {currentTask.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswer === optionIndex;
                  const isCorrect = optionIndex === currentTask.correctAnswerIndex;
                  const showReviewDetails = reviewMode && result;

                  let optionClass = 'task-option';
                  if (showReviewDetails) {
                    if (isCorrect) {
                      optionClass += ' option-correct';
                    } else if (isSelected && !isCorrect) {
                      optionClass += ' option-incorrect';
                    }
                  }

                  return (
                    <Radio key={optionIndex} value={optionIndex} className={optionClass}>
                      <span className="option-label">
                        {String.fromCharCode(65 + optionIndex)}. {option.text}
                      </span>
                      {showReviewDetails && isCorrect && (
                        <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                      )}
                      {showReviewDetails && isSelected && !isCorrect && (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
                      )}
                      {showReviewDetails && isSelected && (
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                          (Your answer)
                        </Text>
                      )}
                    </Radio>
                  );
                })}
              </Space>
            </Radio.Group>

            {reviewMode && result?.explanation && (
              <div className="task-explanation">
                <Text strong>Explanation: </Text>
                <Text>{result.explanation}</Text>
              </div>
            )}

            {!reviewMode && !isSubmitted && (
              <div className="task-actions">
                <Button
                  type="primary"
                  onClick={() => handleSubmitTask(currentTask)}
                  disabled={selectedAnswer === undefined}
                  loading={isSubmitting}
                  size="large"
                >
                  Submit Answer
                </Button>
              </div>
            )}

            {!reviewMode && isSubmitted && (
              <div className="task-feedback">
                {result?.isCorrect ? (
                  <Text type="success" style={{ fontSize: '16px' }}>
                    <CheckCircleOutlined /> Correct!
                  </Text>
                ) : (
                  <Text type="danger" style={{ fontSize: '16px' }}>
                    <CloseCircleOutlined /> Incorrect
                  </Text>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="task-navigation">
          <Button
            icon={<LeftOutlined />}
            onClick={handlePrevious}
            disabled={currentTaskIndex === 0}
            className="nav-button"
          >
            Previous
          </Button>
          <div className="task-counter">
            <Text style={{ fontSize: '18px', color: '#1f2937' }}>
              {currentTaskIndex + 1} / {tasks.length}
            </Text>
          </div>
          <Button
            icon={<RightOutlined />}
            onClick={handleNext}
            disabled={currentTaskIndex === tasks.length - 1}
            className="nav-button"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskSubmission;
