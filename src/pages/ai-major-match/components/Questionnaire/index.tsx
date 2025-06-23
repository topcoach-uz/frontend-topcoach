import { useState } from 'react';
import { Progress } from 'antd';
import { CustomButton, CustomText } from 'src/components/common';
import styles from './questionnaire.module.scss';
import useColors from 'src/hooks/useColors';
import { AiAssessmentQuestion } from 'src/app/api/types';

interface QuestionnaireProps {
  questions: AiAssessmentQuestion[];
  answers: { [key: string]: number };
  setAnswers: (answers: { [key: string]: number }) => void;
  onSubmit: () => void;
}

const answerOptions = [
  { value: -2, label: 'Strongly Disagree' },
  { value: -1, label: 'Disagree' },
  { value: 0, label: 'Neutral' },
  { value: 1, label: 'Agree' },
  { value: 2, label: 'Strongly Agree' },
];

// Function to format category names for display
const formatCategoryName = (category: string): string => {
  switch (category) {
    case 'VALUES_LIFESTYLE':
      return 'Values & Lifestyle';
    case 'PERSONAL_TRAITS':
      return 'Personal Traits';
    case 'ACADEMIC_INTERESTS':
      return 'Academic Interests';
    case 'PROFESSIONAL_GOALS':
      return 'Professional Goals';
    default:
      return category.replace('_', ' ');
  }
};

export const Questionnaire = ({
  questions,
  answers,
  setAnswers,
  onSubmit,
}: QuestionnaireProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const colors = useColors();

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

  const handleAnswer = (questionId: string, answer: number) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / (questions?.length || 1)) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <Progress
            percent={progress}
            showInfo={false}
            strokeColor={colors.colorTextLight}
            trailColor="rgba(255,255,255,0.3)"
          />
          <CustomText
            fontSize={16}
            color={colors.colorTextLight}
            className={styles.questionCounter}
            centered
          >
            Question {currentQuestionIndex + 1} of {questions?.length}
          </CustomText>
        </div>
        <div className={styles.body}>
          <div className={styles.category}>{formatCategoryName(currentQuestion?.category || '')}</div>
          <div className={styles.questionText}>
            {currentQuestion?.question}
          </div>
          <div className={styles.answerOptions}>
            {answerOptions.map((option) => (
              <div
                key={option.value}
                className={`${styles.answerOption} ${
                  answers[currentQuestion?.id] === option.value
                    ? styles.selected
                    : ''
                }`}
                onClick={() =>
                  handleAnswer(currentQuestion?.id, option.value)
                }
              >
                <div className={styles.answerValue}>
                  {option.value > 0 ? `+${option.value}` : option.value}
                </div>
                <div className={styles.answerLabel}>{option.label}</div>
              </div>
            ))}
          </div>
          <div className={styles.navigation}>
            <CustomButton
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={styles.navButton}
            >
              Previous
            </CustomButton>
            {currentQuestionIndex === (questions?.length || 0) - 1 ? (
              <CustomButton
                type="primary"
                onClick={onSubmit}
                className={styles.navButton}
                disabled={answers[currentQuestion?.id] === undefined}
              >
                Submit
              </CustomButton>
            ) : (
              <CustomButton
                type="primary"
                onClick={handleNext}
                disabled={answers[currentQuestion?.id] === undefined}
                className={styles.navButton}
              >
                Next
              </CustomButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 