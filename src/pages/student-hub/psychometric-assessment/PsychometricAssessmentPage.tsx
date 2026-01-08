import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Spin, Alert, Steps, Typography, message, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import {
  useStartAssessmentMutation,
  useGetLatestAssessmentQuery,
  useGetRecommendationsQuery,
} from '../../../app/services/student-hub/psychometricApi';
import { AssessmentStart } from './components/AssessmentStart';
import { AssessmentQuestions } from './components/AssessmentQuestions';
import { AssessmentResults } from './components/AssessmentResults';
import './PsychometricAssessmentPage.scss';

const { Title, Paragraph } = Typography;

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

  // API hooks
  const [startAssessment, { isLoading: startingAssessment }] = useStartAssessmentMutation();
  const { data: latestAssessment, isLoading: assessmentLoading } = useGetLatestAssessmentQuery(
    studentProfile?.id || '',
    { skip: !studentProfile?.id || currentStep !== 'results' }
  );
  const { data: recommendations, isLoading: recommendationsLoading } = useGetRecommendationsQuery(
    studentProfile?.id || '',
    { skip: !studentProfile?.id || currentStep !== 'results' }
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

  const handleStartAssessment = async (lang: 'en' | 'uz' | 'ru', aptitude: boolean) => {
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
      setQuestions(response.questions);
      setCurrentStep('questions');
      navigate(`/student-hub/psychometric-assessment?step=questions&sessionId=${response.sessionId}`);
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
    setCurrentStep('results');
    navigate('/student-hub/psychometric-assessment?step=results');
    message.success('Assessment completed successfully!');
  };

  const handleBackToStart = () => {
    setCurrentStep('start');
    setSessionId(null);
    setAssessmentId(null);
    navigate('/student-hub/psychometric-assessment?step=start');
  };

  const handleViewResults = () => {
    if (latestAssessment) {
      setAssessmentId(latestAssessment.id);
      setCurrentStep('results');
      navigate('/student-hub/psychometric-assessment?step=results');
    }
  };

  if (profileLoading) {
    return (
      <div className="psychometric-assessment-loading">
        <Spin size="large" />
        <p>Loading...</p>
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

  const stepItems = [
    {
      title: 'Start',
      description: 'Begin Assessment',
    },
    {
      title: 'Questions',
      description: 'Answer Questions',
    },
    {
      title: 'Results',
      description: 'View Results',
    },
  ];

  const currentStepIndex = currentStep === 'start' ? 0 : currentStep === 'questions' ? 1 : 2;

  return (
    <div className="psychometric-assessment-page">
      {/* Header - only show on start step */}
      {currentStep === 'start' && (
        <Card className="assessment-header-card">
          <div className="assessment-header">
            <div className="header-content">
              <Title level={2}>Psychometric Assessment</Title>
              <Paragraph>
                Discover your ideal major and career path through a comprehensive assessment of your interests, 
                personality, values, and aptitudes.
              </Paragraph>
            </div>
          </div>
        </Card>
      )}

      {/* Progress Steps - show on all steps */}
      {currentStep !== 'start' && (
        <Card className="assessment-steps-card">
          <Steps
            current={currentStepIndex}
            items={stepItems}
            size="default"
            labelPlacement="vertical"
          />
        </Card>
      )}

      <div className="assessment-content">
        {currentStep === 'start' && (
          <AssessmentStart
            studentProfile={studentProfile}
            onStart={handleStartAssessment}
            hasExistingAssessment={!!latestAssessment}
            onViewExisting={handleViewResults}
            isLoading={startingAssessment}
          />
        )}

        {currentStep === 'questions' && sessionId && (
          <AssessmentQuestions
            sessionId={sessionId}
            studentProfileId={studentProfile.id}
            language={language}
            questions={questions}
            onComplete={handleAssessmentComplete}
            onCancel={handleBackToStart}
          />
        )}

        {currentStep === 'results' && assessmentId && (
          <AssessmentResults
            assessmentId={assessmentId}
            studentProfileId={studentProfile.id}
            assessment={latestAssessment}
            recommendations={recommendations}
            onRetake={handleBackToStart}
            isLoading={assessmentLoading || recommendationsLoading}
          />
        )}
      </div>
    </div>
  );
};

export default PsychometricAssessmentPage;

