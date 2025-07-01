import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import {
  useGetAiAssessmentQuestionsQuery,
  useStartAiAssessmentMutation,
  useSubmitAiAssessmentMutation,
} from 'src/app/services/api/ai-assessment';
import { useGetSubscriptionUsageQuery } from 'src/app/services/api';
import { AiAssessmentResult } from 'src/app/api/types';

export const useAiMajorMatch = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useTypedSelector((state) => state.auth);
  const [step, setStep] = useState('intro'); // intro, assessment, results
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AiAssessmentResult | null>(null);

  // Get subscription usage to check quota
  const { data: subscriptionUsage, isLoading: isLoadingUsage, refetch: refetchUsage } = useGetSubscriptionUsageQuery(undefined, {
    skip: !isAuthenticated,
  });

  const aiMajorMatchUsage = subscriptionUsage?.usage?.find((u: any) => u.feature === 'aiMajorMatchLimit');
  // If no usage record, treat as 0 used and use plan limit (default 1 for Free)
  const planLimit = aiMajorMatchUsage?.limit ?? 1;
  const used = aiMajorMatchUsage?.used ?? 0;
  const canUseAiMajorMatch = !!isAuthenticated && used < planLimit;

  // Debug log to help diagnose quota logic
  console.log('AI Major Match Usage:', { used, planLimit, canUseAiMajorMatch, aiMajorMatchUsage, subscriptionUsage });

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

    // Check if user has quota left
    if (!canUseAiMajorMatch) {
      console.error('AI Major Match quota exceeded');
      return;
    }

    try {
      await startAssessment();
      await refetchUsage(); // Refetch usage after starting assessment
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
      await refetchUsage(); // Refetch usage after submitting assessment
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
      isLoadingQuestions || isStartingAssessment || isSubmittingAssessment || isLoadingUsage,
    error: questionsError || startAssessmentError || submitAssessmentError,
    handleStart,
    handleSubmit,
    canUseAiMajorMatch,
    aiMajorMatchUsage,
  };
};