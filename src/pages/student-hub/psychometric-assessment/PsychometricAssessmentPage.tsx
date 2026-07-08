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
  useGetMajorMatchAccessStatusQuery,
} from '../../../app/services/student-hub/psychometricApi';
import { AssessmentStart } from './components/AssessmentStart';
import { AssessmentQuestions } from './components/AssessmentQuestions';
import { AssessmentResults } from './components/AssessmentResults';
import { useCommunityAccessGate } from '../../../lib/communityAccess';
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
  const [isRecoveringSession, setIsRecoveringSession] = useState(false);

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
  const {
    data: activeSession,
    isFetching: activeSessionFetching,
    refetch: refetchActiveSession,
  } = useCheckActiveSessionQuery(
    studentProfile?.id || '',
    { skip: !studentProfile?.id || readOnly }
  );
  const { data: majorMatchAccessStatus } = useGetMajorMatchAccessStatusQuery(studentProfile?.id || '', {
    skip: !studentProfile?.id || readOnly,
  });
  // Funnel-aware Community destination, used to convert a locked "Retake" into
  // an upsell rather than a blocked action.
  const communityGate = useCommunityAccessGate();
  const requiresEnrollment = !readOnly && !!majorMatchAccessStatus?.requiresCommunityEnrollment;

  // Check URL params for navigation
  useEffect(() => {
    const step = searchParams.get('step') as AssessmentStep;
    if (step && ['start', 'questions', 'results'].includes(step)) {
      setCurrentStep(step);
    }
    const sessionIdFromUrl = searchParams.get('sessionId');
    if (sessionIdFromUrl) {
      setSessionId(sessionIdFromUrl);
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

  // Recovery path: if user lands on step=questions without in-memory session data (e.g. refresh),
  // try to resume the active session; otherwise redirect to start with a clear message.
  useEffect(() => {
    if (readOnly || !studentProfile?.id || currentStep !== 'questions' || isRecoveringSession) return;
    if (sessionId && questions.length > 0) return;
    // Wait for the active-session check to settle before deciding whether a
    // resumable session exists — on a refresh `activeSession` is undefined
    // while the query is in flight, which previously bounced users with a
    // saved session back to start with "No active assessment session found".
    if (activeSessionFetching) return;

    const recoverSession = async () => {
      try {
        setIsRecoveringSession(true);

        if (!activeSession?.hasActiveSession) {
          message.warning('No active assessment session found. Please start a new assessment.');
          setCurrentStep('start');
          setSessionId(null);
          setQuestions([]);
          // Nothing to resume — return to the AI Major Match section inside the
          // hub (with sidebar) rather than the chrome-less standalone landing.
          navigate('/student-hub?section=ai-major-match');
          return;
        }

        const response = await startAssessment({
          studentProfileId: studentProfile.id,
          language,
          includeAptitude: Boolean(activeSession.includeAptitude),
        }).unwrap();

        setSessionId(response.sessionId);
        setQuestions(response.questions || []);
        setCurrentStep('questions');
        navigate(`/student-hub/psychometric-assessment?step=questions&sessionId=${response.sessionId}`);
      } catch (error: any) {
        console.error('Assessment session recovery error:', error);
        message.error(error?.data?.message || 'Unable to restore your assessment session.');
        setCurrentStep('start');
        setSessionId(null);
        setQuestions([]);
        navigate('/student-hub?section=ai-major-match');
      } finally {
        setIsRecoveringSession(false);
      }
    };

    void recoverSession();
  }, [
    readOnly,
    studentProfile?.id,
    currentStep,
    isRecoveringSession,
    sessionId,
    questions.length,
    activeSessionFetching,
    activeSession?.hasActiveSession,
    activeSession?.includeAptitude,
    startAssessment,
    language,
    navigate,
  ]);

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

    if (majorMatchAccessStatus && !majorMatchAccessStatus.canStart) {
      message.info(majorMatchAccessStatus.promptMessage || 'Join Community to continue AI Major Match.');
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

      // Guard against an empty question set (e.g. backend question bank not
      // ready). Don't navigate into the questions step with nothing to show —
      // that produced the "No questions available" dead end. Keep the user on
      // start with a clear, retryable message instead.
      if (!response.questions || response.questions.length === 0) {
        message.error({
          content: 'Assessment questions are not ready yet. Please try again in a moment.',
          duration: 5,
        });
        return;
      }

      setSessionId(response.sessionId);
      setQuestions(response.questions);

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

  // Where to land after leaving the focused (chrome-less) assessment view.
  // The full-screen, no-sidebar surface is only meant for actively taking the
  // test; once the student exits they're browsing again, so return them to the
  // AI Major Match section *inside* the My Journey hub (with sidebar). The
  // counselor/read-only view isn't mounted in the hub, so keep its own route.
  const exitDestination = readOnly
    ? '/student-hub/psychometric-assessment?step=start'
    : '/student-hub?section=ai-major-match';

  // Save and exit - keeps session alive for resuming later
  const handleSaveAndExit = () => {
    message.success('Progress saved! You can continue later.');
    setCurrentStep('start');
    setSessionId(null);
    setQuestions([]);
    navigate(exitDestination);
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
    navigate(exitDestination);
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
      {/* Header is now baked into the AssessmentStart editorial hero on
          the start step, and AssessmentResults provides its own context
          on results. Counselor (read-only) view keeps the legacy header
          so the static "Psychometric Assessment" subtitle still renders
          even when there's no `Start Assessment` CTA. */}
      {currentStep === 'start' && readOnly && (
        <div style={{ marginBottom: 24 }}>
          <h1 className="student-hub-page-title">{t('studentHub.psychometric.title', 'Psychometric Assessment')}</h1>
          <p className="student-hub-page-subtitle" style={{ marginTop: 8 }}>
            {t('studentHub.psychometric.counselorSubtitle', "View the student's assessment results and major recommendations.")}
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
            majorMatchAccessStatus={majorMatchAccessStatus}
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

        {currentStep === 'questions' && (!sessionId || questions.length === 0) && (
          <Card>
            {isRecoveringSession || activeSessionFetching ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
                <p style={{ marginTop: 12, marginBottom: 0 }}>Restoring your assessment session...</p>
              </div>
            ) : (
              <Alert
                type="warning"
                showIcon
                message="Assessment session missing"
                description="We couldn't find active question data. Please return to Start and launch or resume your assessment."
                action={
                  <Button size="small" onClick={() => navigate(exitDestination)}>
                    Go to Start
                  </Button>
                }
              />
            )}
          </Card>
        )}

        {currentStep === 'results' && assessmentId && (
          <AssessmentResults
            assessmentId={assessmentId}
            studentProfileId={studentProfile.id}
            assessment={selectedAssessment || latestAssessment}
            recommendations={recommendations}
            onRetake={requiresEnrollment ? () => navigate(communityGate.destination) : handleAbandon}
            retakeLocked={requiresEnrollment}
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
