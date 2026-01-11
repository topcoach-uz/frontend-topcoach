import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Radio, Input, Progress, Typography, Space, message, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import {
  useSubmitAnswerMutation,
  useCompleteAssessmentMutation,
  useGetSessionProgressQuery,
} from '../../../../app/services/student-hub/psychometricApi';
import type { AssessmentQuestion } from '../../../../app/services/student-hub/psychometricApi';
import { AssessmentProgress } from './AssessmentProgress';

const { Title, Text } = Typography;
const { TextArea } = Input;

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
  const [questions] = useState<AssessmentQuestion[]>(initialQuestions || []);
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
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <p>Loading your progress...</p>
        </div>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const isAnswered = currentQuestion && answers[currentQuestion?.id] !== undefined;
  const answeredCount = Object.keys(answers).length;
  const allQuestionsAnswered = answeredCount === totalQuestions;

  if (!currentQuestion) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Alert 
            message="No questions available" 
            description="Please try starting a new assessment."
            type="warning" 
          />
          <Button onClick={onAbandon} style={{ marginTop: 16 }}>
            Go Back
          </Button>
        </div>
      </Card>
    );
  }

  const getQuestionText = () => {
    if (language === 'en') return currentQuestion.questionText;
    return currentQuestion.translations?.[language] || currentQuestion.questionText;
  };

  const renderQuestionInput = () => {
    if (!currentQuestion.questionData) {
      console.error('Question data is missing!');
      return <Alert message="Error: Question data is missing" type="error" />;
    }

    const questionType = currentQuestion.questionData?.type;

    if (!questionType) {
      console.error('Question type is missing!', currentQuestion);
      return <Alert message="Error: Question type is missing" type="error" />;
    }

    switch (questionType) {
      case 'likert':
        const scale = currentQuestion.questionData.scale;
        if (!scale) {
          console.error('Likert scale is missing!', currentQuestion.questionData);
          return <Alert message="Error: Likert scale configuration is missing" type="error" />;
        }

        // Default labels if missing (reversed order: Strongly Agree -> Strongly Disagree)
        const defaultLabels = ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'];
        const labels = scale.labels && scale.labels.length > 0 
          ? [...scale.labels].reverse() // Reverse the labels array
          : defaultLabels.slice(0, scale.max - scale.min + 1);

        return (
          <Radio.Group
            value={answers[currentQuestion.id]}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            style={{ width: '100%' }}
            size="large"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {labels.map((label, index) => {
                // Map reversed labels to values: first label (Strongly Agree) gets highest value (scale.max)
                const value = scale.max - index;
                return (
                  <Radio key={index} value={value} style={{ fontSize: 16, padding: '8px 0' }}>
                    {label}
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>
        );

      case 'multiple-choice':
        if (!currentQuestion.questionData.options || currentQuestion.questionData.options.length === 0) {
          console.error('Multiple choice options are missing!', currentQuestion.questionData);
          return <Alert message="Error: Multiple choice options are missing" type="error" />;
        }

        return (
          <Radio.Group
            value={answers[currentQuestion.id]}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            style={{ width: '100%' }}
            size="large"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {currentQuestion.questionData.options.map((option, index) => (
                <Radio key={index} value={option} style={{ fontSize: 16, padding: '8px 0' }}>
                  {option}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case 'forced-choice':
        if (!currentQuestion.questionData.options || currentQuestion.questionData.options.length === 0) {
          console.error('Forced choice options are missing!', currentQuestion.questionData);
          return <Alert message="Error: Forced choice options are missing" type="error" />;
        }

        return (
          <Radio.Group
            value={answers[currentQuestion.id]}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            style={{ width: '100%' }}
            size="large"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {currentQuestion.questionData.options.map((option, index) => (
                <Radio key={index} value={option} style={{ fontSize: 16, padding: '12px 0', minHeight: '48px' }}>
                  {option}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case 'open-ended':
        return (
          <TextArea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            rows={4}
            placeholder="Type your answer here..."
            maxLength={currentQuestion.questionData.maxLength || 500}
            showCount
            size="large"
          />
        );

      default:
        console.error('Unknown question type:', questionType);
        return <Alert message={`Error: Unknown question type: ${questionType}`} type="error" />;
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
        onSaveAndExit={onSaveAndExit}
        onAbandon={onAbandon}
      />

      <Card className="question-card">
        <div className="question-content">
          <Title level={4} style={{ marginBottom: 24 }}>
            {getQuestionText()}
          </Title>

          <div className="question-input" style={{ marginBottom: 32 }}>
            {renderQuestionInput()}
          </div>
        </div>

        <div className="question-actions">
          <Space>
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              icon={<FontAwesomeIcon icon="arrow-left" />}
            >
              Previous
            </Button>
            {currentQuestionIndex < questions.length - 1 || !allQuestionsAnswered ? (
              <Button
                type="primary"
                onClick={handleNext}
                icon={<FontAwesomeIcon icon={currentQuestionIndex === questions.length - 1 ? "search" : "arrow-right"} />}
              >
                {currentQuestionIndex === questions.length - 1 ? 'Find Unanswered' : 'Next'}
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleComplete}
                loading={isCompleting || isSubmitting}
                disabled={!allQuestionsAnswered}
                icon={<FontAwesomeIcon icon="check" />}
              >
                Complete Assessment
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};
