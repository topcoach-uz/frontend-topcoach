import React, { useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Search } from 'lucide-react';
import {
  useSubmitAnswerMutation,
  useCompleteAssessmentMutation,
  useGetSessionProgressQuery,
} from '../../../../app/services/student-hub/psychometricApi';
import type { AssessmentQuestion } from '../../../../app/services/student-hub/psychometricApi';
import { AssessmentProgress } from './AssessmentProgress';
import './AssessmentQuestions.scss';

interface AssessmentQuestionsProps {
  sessionId: string;
  studentProfileId: string;
  language: 'en' | 'uz' | 'ru';
  questions: any[];
  includeAptitude?: boolean;
  onComplete: (assessment: any) => void;
  onSaveAndExit: () => void;
  onAbandon: () => void;
}

export const AssessmentQuestions: React.FC<AssessmentQuestionsProps> = ({
  sessionId,
  studentProfileId,
  language,
  questions: initialQuestions,
  includeAptitude = false,
  onComplete,
  onSaveAndExit,
  onAbandon,
}) => {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Derive from props rather than snapshotting once via useState — a stale
  // snapshot (e.g. mounting before questions arrive) used to strand the user
  // on "No questions available" even after the real list loaded.
  const questions = useMemo<AssessmentQuestion[]>(
    () => initialQuestions || [],
    [initialQuestions],
  );
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [submitAnswer] = useSubmitAnswerMutation();
  const [completeAssessment, { isLoading: isCompleting }] = useCompleteAssessmentMutation();
  
  // Fetch session progress to restore answers on resume
  const { data: sessionProgress, isLoading: progressLoading } = useGetSessionProgressQuery(
    sessionId,
    { skip: !sessionId }
  );

  // Load saved answers from backend when session progress is loaded
  useEffect(() => {
    if (sessionProgress && !isInitialized) {
      const restoredAnswers: Record<string, any> = {};
      sessionProgress.responses.forEach((r) => {
        restoredAnswers[r.questionId] = r.answer;
      });
      setAnswers(restoredAnswers);
      
      // Find the first unanswered question
      if (sessionProgress.responses.length > 0) {
        const answeredIds = new Set(sessionProgress.responses.map(r => r.questionId));
        const firstUnansweredIndex = questions.findIndex(q => !answeredIds.has(q.id));
        if (firstUnansweredIndex >= 0) {
          setCurrentQuestionIndex(firstUnansweredIndex);
        } else {
          // All answered, go to last question
          setCurrentQuestionIndex(questions.length - 1);
        }
      }
      
      setIsInitialized(true);
    }
  }, [sessionProgress, questions, isInitialized]);

  const currentQuestion = questions[currentQuestionIndex];
  // Get selectable options for keyboard shortcuts (must be before any early returns - hooks rules)
  const currentOptions = useMemo(() => {
    if (!currentQuestion?.questionData) return [];
    const qType = currentQuestion.questionData.type;
    if (qType === 'open-ended') return [];
    if (qType === 'likert') {
      const scale = currentQuestion.questionData.scale;
      if (!scale) return [];
      const defaultLabels = ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'];
      const labels = scale.labels?.length
        ? [...scale.labels].reverse()
        : defaultLabels.slice(0, scale.max - scale.min + 1);
      return labels.map((_: string, index: number) => scale.max - index);
    }
    if (qType === 'multiple-choice' || qType === 'forced-choice') {
      return currentQuestion.questionData?.options || [];
    }
    return [];
  }, [currentQuestion]);

  // Keyboard shortcuts: F1, F2, ... (must be before early returns - hooks rules)
  useEffect(() => {
    if (currentOptions.length === 0 || !currentQuestion) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const match = e.key.match(/^F(\d+)$/);
      if (!match) return;
      const index = parseInt(match[1], 10) - 1;
      if (index >= 0 && index < currentOptions.length) {
        e.preventDefault();
        handleAnswerChange(currentQuestion.id, currentOptions[index]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion?.id, currentOptions]);

  const handleAnswerChange = async (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Submit answer to backend
    try {
      await submitAnswer({
        sessionId,
        questionId,
        answer: value,
      }).unwrap();
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      // Check if session expired
      if (error?.status === 400 || error?.status === 404) {
        message.error('Session expired or not found. Please start a new assessment.');
        onAbandon();
      }
    }
  };

  const handleNext = () => {
    // Check if we're on the last question
    if (currentQuestionIndex === questions.length - 1) {
      // Find first unanswered question
      const firstUnansweredIndex = questions.findIndex(q => answers[q.id] === undefined);
      if (firstUnansweredIndex >= 0) {
        // Navigate to first unanswered question
        setCurrentQuestionIndex(firstUnansweredIndex);
        message.warning('Please answer all questions before completing the assessment.');
      }
    } else {
      // Normal next navigation
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const assessment = await completeAssessment({
        sessionId,
        studentProfileId,
      }).unwrap();

      onComplete(assessment);
    } catch (error: any) {
      console.error('Error completing assessment:', error);
      const errorMessage = error?.data?.message || 'Failed to complete assessment';
      message.error(errorMessage);
      
      // Check if session expired
      if (error?.status === 400 || error?.status === 404) {
        message.warning('Session may have expired. Please start a new assessment.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while fetching progress
  if (progressLoading || !isInitialized) {
    return (
      <div className="majormatch-quiz">
        <div className="majormatch-quiz__state">
          <span className="majormatch-quiz__spinner" />
          <p className="majormatch-quiz__state-desc">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const isAnswered = currentQuestion && answers[currentQuestion?.id] !== undefined;
  const answeredCount = Object.keys(answers).length;
  const allQuestionsAnswered = answeredCount === totalQuestions;

  if (!currentQuestion) {
    return (
      <div className="majormatch-quiz">
        <div className="majormatch-quiz__state">
          <p className="majormatch-quiz__state-title">No questions available</p>
          <p className="majormatch-quiz__state-desc">
            Please try starting a new assessment.
          </p>
          <button type="button" className="majormatch-quiz__btn" onClick={onAbandon}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getQuestionText = () => {
    if (language === 'en') return currentQuestion.questionText;
    return currentQuestion.translations?.[language] || currentQuestion.questionText;
  };

  // Editorial selectable option row (replaces antd Radio) for likert /
  // multiple-choice / forced-choice. Keeps role="radio" + aria-checked
  // and the F1–Fn keyboard ordering (index drives the shortcut label).
  const renderOptionRow = (label: string, value: any, index: number) => {
    const selected = answers[currentQuestion.id] === value;
    return (
      <div
        key={index}
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        className={`majormatch-quiz__option ${selected ? 'is-selected' : ''}`}
        onClick={() => handleAnswerChange(currentQuestion.id, value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAnswerChange(currentQuestion.id, value);
          }
        }}
      >
        <span className="majormatch-quiz__option-dot" aria-hidden="true" />
        <span className="majormatch-quiz__option-label">{label}</span>
        <span className="majormatch-quiz__option-key" aria-hidden="true">
          F{index + 1}
        </span>
      </div>
    );
  };

  const renderQuestionInput = () => {
    if (!currentQuestion.questionData) {
      console.error('Question data is missing!');
      return <div className="majormatch-quiz__error">Error: Question data is missing</div>;
    }

    const questionType = currentQuestion.questionData?.type;

    if (!questionType) {
      console.error('Question type is missing!', currentQuestion);
      return <div className="majormatch-quiz__error">Error: Question type is missing</div>;
    }

    switch (questionType) {
      case 'likert': {
        const scale = currentQuestion.questionData.scale;
        if (!scale) {
          console.error('Likert scale is missing!', currentQuestion.questionData);
          return (
            <div className="majormatch-quiz__error">
              Error: Likert scale configuration is missing
            </div>
          );
        }

        // Default labels if missing (reversed order: Strongly Agree -> Strongly Disagree)
        const defaultLabels = ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'];
        const labels = scale.labels && scale.labels.length > 0
          ? [...scale.labels].reverse() // Reverse the labels array
          : defaultLabels.slice(0, scale.max - scale.min + 1);

        return (
          <div
            className="majormatch-quiz__options"
            role="radiogroup"
            aria-label="Answer options"
          >
            {labels.map((label, index) =>
              // Map reversed labels to values: first label (Strongly Agree) gets highest value (scale.max)
              renderOptionRow(label, scale.max - index, index),
            )}
          </div>
        );
      }

      case 'multiple-choice':
        if (!currentQuestion.questionData.options || currentQuestion.questionData.options.length === 0) {
          console.error('Multiple choice options are missing!', currentQuestion.questionData);
          return (
            <div className="majormatch-quiz__error">
              Error: Multiple choice options are missing
            </div>
          );
        }

        return (
          <div
            className="majormatch-quiz__options"
            role="radiogroup"
            aria-label="Answer options"
          >
            {currentQuestion.questionData.options.map((option, index) =>
              renderOptionRow(option, option, index),
            )}
          </div>
        );

      case 'forced-choice':
        if (!currentQuestion.questionData.options || currentQuestion.questionData.options.length === 0) {
          console.error('Forced choice options are missing!', currentQuestion.questionData);
          return (
            <div className="majormatch-quiz__error">
              Error: Forced choice options are missing
            </div>
          );
        }

        return (
          <div
            className="majormatch-quiz__options"
            role="radiogroup"
            aria-label="Answer options"
          >
            {currentQuestion.questionData.options.map((option, index) =>
              renderOptionRow(option, option, index),
            )}
          </div>
        );

      case 'open-ended': {
        const maxLength = currentQuestion.questionData.maxLength || 500;
        const openValue = answers[currentQuestion.id] || '';
        return (
          <div className="majormatch-quiz__textarea-wrap">
            <textarea
              className="majormatch-quiz__textarea"
              value={openValue}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              rows={4}
              placeholder="Type your answer here..."
              maxLength={maxLength}
            />
            <div className="majormatch-quiz__char-count">
              {openValue.length} / {maxLength}
            </div>
          </div>
        );
      }

      default:
        console.error('Unknown question type:', questionType);
        return (
          <div className="majormatch-quiz__error">
            Error: Unknown question type: {questionType}
          </div>
        );
    }
  };

  return (
    <div className="assessment-questions">
      {/* Enhanced Progress Indicator with Exit options */}
      <AssessmentProgress
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        currentQuestionType={currentQuestion?.questionType || 'riasec'}
        includeAptitude={includeAptitude}
        language={language}
        questions={questions} // Pass actual questions for dynamic progress calculation
        onSave={async () => {
          // Answers are auto-saved on each change, this just confirms to the user
          // Optionally trigger a sync or verify with backend here
          await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for UX
        }}
        onSaveAndExit={onSaveAndExit}
        onAbandon={onAbandon}
      />

      <div className="majormatch-quiz">
        <div className="majormatch-quiz__card">
          <h2 className="majormatch-quiz__question">{getQuestionText()}</h2>

          <div className="majormatch-quiz__input">
            {renderQuestionInput()}
            {currentOptions.length > 0 && (
              <span className="majormatch-quiz__tip">
                Tip: Press F1–F{currentOptions.length} to select an answer
              </span>
            )}
          </div>

          <div className="majormatch-quiz__actions">
            <button
              type="button"
              className="majormatch-quiz__btn"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft size={15} />
              Previous
            </button>
            {currentQuestionIndex < questions.length - 1 || !allQuestionsAnswered ? (
              <button
                type="button"
                className="majormatch-quiz__btn majormatch-quiz__btn--primary"
                onClick={handleNext}
              >
                {currentQuestionIndex === questions.length - 1 ? (
                  <Search size={15} />
                ) : (
                  <ArrowRight size={15} />
                )}
                {currentQuestionIndex === questions.length - 1 ? 'Find Unanswered' : 'Next'}
              </button>
            ) : (
              <button
                type="button"
                className="majormatch-quiz__btn majormatch-quiz__btn--primary"
                onClick={handleComplete}
                disabled={!allQuestionsAnswered || isCompleting || isSubmitting}
              >
                {isCompleting || isSubmitting ? (
                  <span className="majormatch-quiz__spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />
                ) : (
                  <Check size={15} />
                )}
                Complete Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
