import React, { useState, useEffect } from 'react';
import { Card, Button, Radio, Slider, Input, Progress, Typography, Space, message, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import {
  useSubmitAnswerMutation,
  useCompleteAssessmentMutation,
} from '../../../../app/services/student-hub/psychometricApi';
import type { AssessmentQuestion } from '../../../../app/services/student-hub/psychometricApi';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface AssessmentQuestionsProps {
  sessionId: string;
  studentProfileId: string;
  language: 'en' | 'uz' | 'ru';
  questions: any[];
  onComplete: (assessment: any) => void;
  onCancel: () => void;
}

export const AssessmentQuestions: React.FC<AssessmentQuestionsProps> = ({
  sessionId,
  studentProfileId,
  language,
  questions: initialQuestions,
  onComplete,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions] = useState<AssessmentQuestion[]>(initialQuestions || []);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitAnswer] = useSubmitAnswerMutation();
  const [completeAssessment, { isLoading: isCompleting }] = useCompleteAssessmentMutation();

  // Questions are passed as prop from parent component

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
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
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
      message.error(error?.data?.message || 'Failed to complete assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  // Allow navigation even if not answered - user can come back to answer later
  const isAnswered = currentQuestion && answers[currentQuestion?.id] !== undefined;
  const canNavigate = true; // Allow navigation regardless of answer status

  if (!currentQuestion) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <p>Loading questions...</p>
        </div>
      </Card>
    );
  }

  const getQuestionText = () => {
    if (language === 'en') return currentQuestion.questionText;
    return currentQuestion.translations?.[language] || currentQuestion.questionText;
  };

  const renderQuestionInput = () => {
    // Debug: Log question data to see structure
    console.log('Current question:', currentQuestion);
    console.log('Question data:', currentQuestion.questionData);
    
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

        if (!scale.labels || scale.labels.length === 0) {
          console.error('Likert scale labels are missing!', scale);
          return <Alert message="Error: Likert scale labels are missing" type="error" />;
        }

        return (
          <Radio.Group
            value={answers[currentQuestion.id]}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            style={{ width: '100%' }}
            size="large"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {scale.labels.map((label, index) => (
                <Radio key={index} value={index + scale.min} style={{ fontSize: 16, padding: '8px 0' }}>
                  {label}
                </Radio>
              ))}
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
      <Card className="question-card">
        <div className="question-header">
          <div className="question-progress">
            <Text type="secondary">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Text>
            <Progress percent={progress} showInfo={false} strokeColor="#8b0000" />
          </div>
        </div>

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
            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                type="primary"
                onClick={handleNext}
                disabled={!canNavigate}
                icon={<FontAwesomeIcon icon="arrow-right" />}
              >
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleComplete}
                loading={isCompleting}
                disabled={!isAnswered}
                icon={<FontAwesomeIcon icon="check" />}
              >
                Complete Assessment
              </Button>
            )}
            <Button onClick={onCancel} danger>
              Cancel
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

