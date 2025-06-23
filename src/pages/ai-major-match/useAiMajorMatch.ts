import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import {
  useGetAiAssessmentQuestionsQuery,
  useStartAiAssessmentMutation,
  useSubmitAiAssessmentMutation,
} from 'src/app/services/api/ai-assessment';
import { AiAssessmentResult } from 'src/app/api/types';

export const useAiMajorMatch = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const [step, setStep] = useState('intro'); // intro, assessment, results
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AiAssessmentResult | null>(null);

  const {
    data: questions,
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useGetAiAssessmentQuestionsQuery(undefined, {
    skip: step !== 'assessment',
  });

  const [
    startAssessment,
    {
      data: session,
      isLoading: isStartingAssessment,
      error: startAssessmentError,
    },
  ] = useStartAiAssessmentMutation();

  const [
    submitAssessment,
    {
      isLoading: isSubmittingAssessment,
      error: submitAssessmentError,
    },
  ] = useSubmitAiAssessmentMutation();

  useEffect(() => {
    if (session) {
      setSessionId(session.id);
    }
  }, [session]);

  const handleStart = async () => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
      return;
    }

    try {
      await startAssessment();
      setStep('assessment');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      const answersArray = Object.entries(answers).map(
        ([questionId, answer]) => ({ questionId, answer })
      );

      const result = await submitAssessment({ answers: answersArray }).unwrap();
      setAssessmentResults(result);
      setStep('results');
    } catch (error) {
      console.error(error);
    }
  };

  return {
    step,
    setStep,
    questions,
    answers,
    setAnswers,
    results: assessmentResults,
    isLoading:
      isLoadingQuestions || isStartingAssessment || isSubmittingAssessment,
    error: questionsError || startAssessmentError || submitAssessmentError,
    handleStart,
    handleSubmit,
  };
};