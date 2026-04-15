import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Spin, Alert, message } from 'antd';
import { useTranslation } from 'react-i18next';
import Spinner from '../../../components/loading/Spinner';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import {
  useStartAssessmentMutation,
  useGetLatestAssessmentQuery,
  useGetAssessmentByIdQuery,
  useGetRecommendationsQuery,
  useCancelSessionMutation,
  useCheckActiveSessionQuery,
} from '../../../app/services/student-hub/psychometricApi';
import { AssessmentStart } from './components/AssessmentStart';
import { AssessmentQuestions } from './components/AssessmentQuestions';
import { AssessmentResults } from './components/AssessmentResults';
import './PsychometricAssessmentPage.scss';

export interface PsychometricAssessmentPageProps {
  readOnly?: boolean;
  studentId?: string;
}

type AssessmentStep = 'start' | 'questions' | 'results';

const PsychometricAssessmentPage: React.FC<PsychometricAssessmentPageProps> = ({
  readOnly = false,
  studentId,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get student profile
  const hookOptions = readOnly && studentId ? { studentId } : undefined;
  const { profile: studentProfile, isLoading: profileLoading } = useStudentProfile(hookOptions);

  // State
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('start');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [language, setLanguage] = useState<'en' | 'uz' | 'ru'>('en');
  const [includeAptitude, setIncludeAptitude] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, any>>({});
  const [isResuming, setIsResuming] = useState(false);
  const [isGeneratingResults, setIsGeneratingResults] = useState(false);

  // API hooks
  const [startAssessment, { isLoading: startingAssessment }] = useStartAssessmentMutation();
  const [cancelSession] = useCancelSessionMutation();
  const { data: latestAssessment, isLoading: assessmentLoading } = useGetLatestAssessmentQuery(
    studentProfile?.id || '',
    { skip: !studentProfile?.id || (currentStep !== 'results' || !!assessmentId) }
  );
  const { data: selectedAssessment, isLoading: selectedAssessmentLoading } = useGetAssessmentByIdQuery(
    assessmentId || '',
    { skip: !assessmentId || currentStep !== 'results' }
  );
  const { data: recommendations, isLoading: recommendationsLoading } = useGetRecommendationsQuery(
    studentProfile?.id || '',
    { skip: !studentProfile?.id || currentStep !== 'results' }
  );
  // Check for active (saved) session
  const { data: activeSession, refetch: refetchActiveSession } = useCheckActiveSessionQuery(
    studentProfile?.id || '',
    { skip: !studentProfile?.id || currentStep !== 'start' }
  );

  // Check URL params for navigation
  useEffect(() => {
    const step = searchParams.get('step') as AssessmentStep;
    if (step && ['start', 'questions', 'results'].includes(step)) {
      setCurrentStep(step);
    }
  }, [searchParams]);

  // Load latest assessment if exists
  useEffect(() => {
    if (studentProfile?.id && latestAssessment) {
      setAssessmentId(latestAssessment.id);
    }
  }, [studentProfile?.id, latestAssessment]);

  // Reset isGeneratingResults when data is loaded (results are ready)
  useEffect(() => {
    if ((selectedAssessment || latestAssessment) && recommendations && !(assessmentLoading || selectedAssessmentLoading || recommendationsLoading)) {
      setIsGeneratingResults(false);
    }
  }, [selectedAssessment, latestAssessment, recommendations, assessmentLoading, selectedAssessmentLoading, recommendationsLoading]);

  const handleStartAssessment = async (lang: 'en' | 'uz' | 'ru', aptitude: boolean) => {
    // Prevent starting assessment in read-only mode
    if (readOnly) {
      message.warning('Assessment cannot be started in read-only mode');
      return;
    }
    
    if (!studentProfile?.id) {
      message.error('Student profile not found');
      return;
    }

    try {
      setLanguage(lang);
      setIncludeAptitude(aptitude);
      
      const response = await startAssessment({
        studentProfileId: studentProfile.id,
        language: lang,
        includeAptitude: aptitude,
      }).unwrap();

      setSessionId(response.sessionId);
      setQuestions(response.questions || []);
      
      // Only show resuming message if there are meaningful answers (more than 1)
      if (response.resumedFrom && response.resumedFrom.answeredCount > 1) {
        setIsResuming(true);
        message.info(`Resuming your previous session (${response.resumedFrom.answeredCount}/${response.resumedFrom.totalCount} questions answered)`);
      } else {
        setIsResuming(false);
      }
      
      setCurrentStep('questions');
      navigate(`/student-hub/psychometric-assessment?step=questions&sessionId=${response.sessionId}`);
      
      // Scroll to top when assessment starts
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Assessment start error:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to start assessment';
      message.error({
        content: errorMessage,
        duration: 5,
      });
      
      // If 404, suggest backend restart
      if (error?.status === 404 || error?.status === 'FETCH_ERROR') {
        message.warning({
          content: 'The assessment endpoint may not be available. Please ensure the backend server is running and has been restarted.',
          duration: 8,
        });
      }
    }
  };

  const handleAssessmentComplete = (assessment: any) => {
    setAssessmentId(assessment.id);
    setSessionId(null);
    setIsGeneratingResults(true); // Mark that we're generating results for the first time
    setCurrentStep('results');
    navigate('/student-hub/psychometric-assessment?step=results');
    
    message.success('Assessment completed successfully!');
  };

  // Save and exit - keeps session alive for resuming later
  const handleSaveAndExit = () => {
    message.success('Progress saved! You can continue later.');
    setCurrentStep('start');
    setSessionId(null);
    setQuestions([]);
    navigate('/student-hub/psychometric-assessment?step=start');
    // Refetch active session so the Start/Resume button updates
    setTimeout(() => refetchActiveSession(), 100);
  };

  // Abandon - permanently cancels the session
  const handleAbandon = async () => {
    // Cancel the session on the backend if we have one
    if (sessionId && studentProfile?.id) {
      try {
        await cancelSession({
          sessionId,
          studentProfileId: studentProfile.id,
        }).unwrap();
      } catch (error) {
        console.error('Error cancelling session:', error);
        // Continue anyway - the session will expire
      }
    }
    
    setCurrentStep('start');
    setSessionId(null);
    setAssessmentId(null);
    setQuestions([]);
    setSavedAnswers({});
    setIsResuming(false);
    navigate('/student-hub/psychometric-assessment?step=start');
    // Refetch active session so the Start/Resume button updates
    setTimeout(() => refetchActiveSession(), 100);
  };

  const handleViewResults = (assessmentId?: string) => {
    const idToUse = assessmentId || latestAssessment?.id;
    if (idToUse) {
      setAssessmentId(idToUse);
      setIsGeneratingResults(false); // Mark that we're viewing existing results
      setCurrentStep('results');
      navigate('/student-hub/psychometric-assessment?step=results');
    }
  };

  if (profileLoading) {
    return (
      <div className="psychometric-assessment-loading">
        <Spinner size="large" tip="Loading..." />
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <Alert
        message="Profile Required"
        description="Please complete your profile before taking the assessment."
        type="warning"
        action={
          <Button onClick={() => navigate('/student-hub/profile')}>
            Go to Profile
          </Button>
        }
      />
    );
  }

  return (
    <div className="psychometric-assessment-page student-hub-page">
      {/* Header - only show on start step, NOT on results */}
      {currentStep === 'start' && (
        <div style={{ marginBottom: 24 }}>
          <h1 className="student-hub-page-title">{t('studentHub.psychometric.title', 'Psychometric Assessment')}</h1>
          <p className="student-hub-page-subtitle" style={{ marginTop: 8 }}>
            {readOnly ? t('studentHub.psychometric.counselorSubtitle', 'View the student\'s assessment results and major recommendations.') : t('studentHub.psychometric.subtitle', 'Comprehensive assessment of interests, personality, values, and aptitudes to discover your ideal major and career path.')}
          </p>
        </div>
      )}

      <div className="assessment-content">
        {currentStep === 'start' && (
          <AssessmentStart
            studentProfile={studentProfile}
            onStart={handleStartAssessment}
            hasExistingAssessment={!!latestAssessment}
            onViewExisting={handleViewResults}
            isLoading={startingAssessment}
            readOnly={readOnly}
            activeSession={activeSession}
          />
        )}

        {currentStep === 'questions' && sessionId && (
          <AssessmentQuestions
            sessionId={sessionId}
            studentProfileId={studentProfile.id}
            language={language}
            questions={questions}
            includeAptitude={includeAptitude}
            onComplete={handleAssessmentComplete}
            onSaveAndExit={handleSaveAndExit}
            onAbandon={handleAbandon}
          />
        )}

        {currentStep === 'results' && assessmentId && (
          <AssessmentResults
            assessmentId={assessmentId}
            studentProfileId={studentProfile.id}
            assessment={selectedAssessment || latestAssessment}
            recommendations={recommendations}
            onRetake={handleAbandon}
            onTakeAptitude={handleStartAssessment.bind(null, language, true)}
            isLoading={assessmentLoading || selectedAssessmentLoading || recommendationsLoading}
            isGeneratingResults={isGeneratingResults}
          />
        )}
      </div>
    </div>
  );
};

export default PsychometricAssessmentPage;
