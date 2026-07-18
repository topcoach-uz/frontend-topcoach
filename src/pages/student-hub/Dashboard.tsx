import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Avatar, Button, Badge, Alert, Tabs, message, Dropdown, Menu, Empty, Tooltip, Collapse, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import i18n from '../../lib/i18n';
import { useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../components/common/icons/FontAwesomeIcon';
import UnifiedIcon from '../../components/common/icons/UnifiedIcon';
import { 
  PROFILE_ICONS, 
  APPLICATION_ICONS, 
  ESSAY_ICONS, 
  STATUS_ICONS,
  ACTION_ICONS 
} from '../../constants/icons';
// Import merged Home page components
import BookingsCard from './components/BookingsCard';
import EventsCard from './components/EventsCard';
import JourneyStatusHeader from './components/JourneyStatusHeader';
import AISuggestionsCard, { type SuggestionItem } from './components/AISuggestionsCard';
import TelegramConnectionChecklist from './components/TelegramConnectionChecklist';
import AdmissionsProgramProgressCard from './components/AdmissionsProgramProgressCard';
import OrgMembershipCard from './components/OrgMembershipCard';
import { useStudentHub, useStudentProfile } from '../../hooks/useStudentHub';
import { 
  useGetCollegeApplicationsQuery, 
  useGetScholarshipApplicationsQuery
} from '../../app/services/student-hub/applicationTrackingApi';
import { 
  useGetStudentEssaysQuery 
} from '../../app/services/student-hub/essayManagementApi';
import { 
  useGetDocumentsQuery 
} from '../../app/services/student-hub/documentManagementApi';
import {
  useGetStudentJourneyCollegeApplicationsQuery,
  useGetStudentJourneyScholarshipApplicationsQuery,
  useGetStudentJourneyEssaysQuery,
  useGetStudentJourneyDocumentsQuery,
  useGetStudentJourneyDashboardQuery,
} from '../../app/services/student-hub/studentJourneyReadonlyApi';
import { useGetAllAssessmentsQuery } from '../../app/services/student-hub/psychometricApi';
import { useGetMeQuery } from '../../app/services/users';
import { useGetUniversityDetailQuery } from '../../app/services/universities';
import { getTranslation } from '../../lib/i18n/translationUtils';
import { PageSkeleton, InlineLoader } from '../../components/loading';
import { Clock, AlertCircle } from 'lucide-react';
import './Dashboard.scss';

// Props interface for Dashboard - supports both normal and read-only mode
export interface DashboardProps {
  // For read-only mode (counselor viewing student)
  readOnly?: boolean;
  studentId?: string;
  studentName?: string;
}

// Component to display university name - fetches from universityId if available
// IMPORTANT: Hook must be called unconditionally (Rules of Hooks)
const UniversityNameDisplay: React.FC<{ universityId?: string; universityName?: string }> = ({ universityId, universityName }) => {
  const { t } = useTranslation();
  const { data: university, isLoading } = useGetUniversityDetailQuery(universityId || '', { skip: !universityId });

  if (universityId && isLoading) {
    return <InlineLoader size="small" />;
  }
  if (universityId && university) {
    const displayName = getTranslation(university.name);
    return <>{displayName || universityName || t('studentHub.dashboard.unknownUniversity')}</>;
  }
  return <>{universityName || t('studentHub.dashboard.unknownUniversity')}</>;
};

const Dashboard: React.FC<DashboardProps> = ({ readOnly = false, studentId, studentName }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Pass studentId to hooks when in read-only mode to fetch correct student data
  const hookOptions = readOnly && studentId ? { studentId } : undefined;
  const { dashboard, stats, profile, notifications, isLoading, hasError } = useStudentHub(hookOptions);
  const { profile: studentProfile, recalculateCompletion } = useStudentProfile(hookOptions);
  
  // Determine if we're in read-only mode from props
  const isReadOnly = readOnly === true;
  
  // Get user data - only for current user (not in read-only mode)
  const { data: currentUserData } = useGetMeQuery(undefined, { skip: isReadOnly });

  const handleRecalculate = async () => {
    if (studentProfile?.id) {
      await recalculateCompletion();
    }
  };
  
  // Get user name - from props if in read-only mode, otherwise from current user
  const userName = isReadOnly 
    ? (studentName || t('studentHub.dashboard.student'))
    : (currentUserData?.profile?.name || t('studentHub.dashboard.student'));
  
  // State for current time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // ========== DATA FETCHING ==========
  // Use different APIs based on whether we're in read-only mode (counselor viewing student)
  // or normal mode (student viewing their own data)
  
  // Normal mode - fetch current user's data
  const { data: applicationsResponse, isLoading: applicationsLoading } = useGetCollegeApplicationsQuery(
    { page: 1, limit: 100 }, 
    { skip: isReadOnly }
  );
  const { data: scholarshipsResponse, isLoading: scholarshipsLoading } = useGetScholarshipApplicationsQuery(
    { page: 1, limit: 100 },
    { skip: isReadOnly }
  );
  const { data: essaysResponse, isLoading: essaysLoading } = useGetStudentEssaysQuery(
    { page: 1, limit: 100 },
    { skip: isReadOnly }
  );
  const { data: documentsResponse, isLoading: documentsLoading } = useGetDocumentsQuery(
    { page: 1, limit: 100 },
    { skip: isReadOnly }
  );

  // Read-only mode - fetch student's data via counselor API
  const { data: readOnlyApplicationsResponse, isLoading: readOnlyApplicationsLoading } = useGetStudentJourneyCollegeApplicationsQuery(
    studentId || '',
    { skip: !isReadOnly || !studentId }
  );
  const { data: readOnlyScholarshipsResponse, isLoading: readOnlyScholarshipsLoading } = useGetStudentJourneyScholarshipApplicationsQuery(
    studentId || '',
    { skip: !isReadOnly || !studentId }
  );
  const { data: readOnlyEssaysResponse, isLoading: readOnlyEssaysLoading } = useGetStudentJourneyEssaysQuery(
    studentId || '',
    { skip: !isReadOnly || !studentId }
  );
  const { data: readOnlyDocumentsResponse, isLoading: readOnlyDocumentsLoading } = useGetStudentJourneyDocumentsQuery(
    studentId || '',
    { skip: !isReadOnly || !studentId }
  );
  const { data: readOnlyDashboardResponse } = useGetStudentJourneyDashboardQuery(
    studentId || '',
    { skip: !isReadOnly || !studentId }
  );

  // Merge data based on mode
  const finalApplicationsData = isReadOnly ? readOnlyApplicationsResponse?.data : applicationsResponse?.data;
  const finalScholarshipsData = isReadOnly ? readOnlyScholarshipsResponse?.data : scholarshipsResponse?.data;
  const finalEssaysData = isReadOnly 
    ? (readOnlyEssaysResponse?.data as any)?.essays 
    : (essaysResponse?.data as any)?.essays;
  const finalDocumentsData = isReadOnly ? readOnlyDocumentsResponse?.data : documentsResponse?.data;
  const finalStats = isReadOnly ? readOnlyDashboardResponse?.data?.stats : null;

  // Helper function to format dates like Applications page
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return t('studentHub.applications.tbd') || 'TBD';
    const date = new Date(dateString);
    const localeMap: { [key: string]: string } = {
      en: 'en-US',
      ru: 'ru-RU',
      uz: 'uz-UZ',
      kk: 'ru-RU',
    };
    const lang = i18n.language || 'en';
    const mappedLocale = localeMap[lang] || 'en-US';
    return date.toLocaleDateString(mappedLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusText = (status: string) => {
    if (!status) return 'UNKNOWN';
    const statusKey = `studentHub.applications.status.${status}`;
    const translated = t(statusKey);
    // If translation key doesn't exist, fallback to formatted status
    if (translated === statusKey) {
      return status.replace('_', ' ').toUpperCase();
    }
    return translated.toUpperCase();
  };

  // Loading is handled by useStudentHub hook - no need for duplicate loading state

  // Show error state
  if (hasError) {
    return (
      <Alert
        message={t('studentHub.dashboard.error')}
        description={t('studentHub.dashboard.errorDescription')}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => window.location.reload()}>
            {t('studentHub.dashboard.retry')}
          </Button>
        }
      />
    );
  }

  // Use real data from API - in read-only mode, use the stats from the read-only API
  const effectiveStats = isReadOnly ? finalStats : stats;
  const dashboardData = {
    applicationsCount: effectiveStats?.totalApplications || finalApplicationsData?.length || 0,
    essaysCount: effectiveStats?.totalEssays || finalEssaysData?.length || 0,
    tasksCount: stats?.totalTasks || 0,
    upcomingDeadlines: [],
    recentActivity: [],
    quickStats: {
      applicationsSubmitted: effectiveStats?.submittedApplications || 0,
      essaysInProgress: effectiveStats?.inProgressEssays || 0,
      tasksOverdue: stats?.overdueTasks || 0,
    },
  };


  // Get psychometric assessments data
  const studentProfileId = studentProfile?.id || (currentUserData?.profile as { studentProfile?: { id?: string } } | undefined)?.studentProfile?.id;
  const { data: psychometricAssessments } = useGetAllAssessmentsQuery(
    studentProfileId || '',
    { skip: !studentProfileId || isReadOnly }
  );

  // Quick Add dropdown menu items
  const quickAddMenuItems = [
    {
      key: 'profile',
      label: t('studentHub.dashboard.completeProfile'),
      icon: <FontAwesomeIcon icon="user" style={{ color: '#8b0000' }} />,
      onClick: () => navigate('/student-hub/profile'),
    },
    {
      key: 'application',
      label: t('studentHub.dashboard.addApplication'),
      icon: <FontAwesomeIcon icon="building" style={{ color: '#8b0000' }} />,
      onClick: () => navigate('/student-hub/applications'),
    },
    {
      key: 'essay',
      label: t('studentHub.dashboard.startEssay'),
      icon: <FontAwesomeIcon icon="edit" style={{ color: '#8b0000' }} />,
      onClick: () => navigate('/student-hub/essays'),
    },
    {
      key: 'psychometric',
      label: 'Psychometric Test',
      icon: <FontAwesomeIcon icon="chart-line" style={{ color: '#8b0000' }} />,
      onClick: () => navigate('/student-hub/psychometric-assessment'),
    },
    {
      key: 'document',
      label: t('studentHub.dashboard.uploadDocument'),
      icon: <FontAwesomeIcon icon="file" style={{ color: '#8b0000' }} />,
      onClick: () => navigate('/student-hub/documents'),
    },
  ];

  const handleAcademicProfile = () => {
    navigate('/student-hub/profile?tab=academic');
  };

  const handleNewApplication = () => {
    navigate('/student-hub?section=others&target=college-lists&applicationFlow=new');
  };

  const handleStartEssay = () => {
    navigate('/student-hub/essays/new');
  };

  const handleUploadDocument = () => {
    navigate('/student-hub/documents/upload');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'essay':
        return ESSAY_ICONS.ESSAYS;
      case 'application':
        return APPLICATION_ICONS.APPLICATIONS;
      case 'task':
        return APPLICATION_ICONS.TASKS;
      case 'document':
        return 'file';
      case 'scholarship':
        return 'trophy';
      default:
        return STATUS_ICONS.INFO;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  // Calculate urgency for deadlines
  const getUrgencyLevel = (deadline: string | Date | null | undefined) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { level: 'overdue', icon: <AlertCircle size={16} color="#ff4d4f" />, color: '#ff4d4f' };
    if (daysUntil <= 7) return { level: 'urgent', icon: <AlertCircle size={16} color="#ff9800" />, color: '#ff9800' };
    if (daysUntil <= 30) return { level: 'soon', icon: <Clock size={16} color="#faad14" />, color: '#faad14' };
    return { level: 'normal', icon: <Clock size={16} color="#8b0000" />, color: '#8b0000' };
  };

  // Handle card click navigation
  const handleActivityClick = (item: any) => {
    if (item.type === 'application') {
      navigate(`/student-hub/applications?view=${item.id}`);
    } else if (item.type === 'scholarship') {
      navigate(`/student-hub/applications?tab=scholarships&view=${item.id}`);
    } else if (item.type === 'essay') {
      navigate(`/student-hub/essays?view=${item.id}`);
    } else if (item.type === 'document') {
      navigate(`/student-hub/documents?view=${item.id}`);
    } else if (item.type === 'psychometric') {
      navigate(`/student-hub/psychometric-assessment?view=${item.id}`);
    }
  };

  const handleDeadlineClick = (item: any) => {
    if (item.type === 'application') {
      navigate(`/student-hub/applications?view=${item.id}`);
    } else if (item.type === 'scholarship') {
      navigate(`/student-hub/applications?tab=scholarships&view=${item.id}`);
    }
  };

  // Calculate Journey Phase based on profile completion and applications
  const calculateJourneyPhase = (): 'discovery' | 'building' | 'applying' | 'finalizing' => {
    const profileCompletion = studentProfile?.completionPercentage || 0;
    const applicationsData = finalApplicationsData || [];
    const scholarshipsData = finalScholarshipsData || [];
    const hasApplications = applicationsData.length > 0 || scholarshipsData.length > 0;
    const hasSubmittedApplications = applicationsData.some((app: any) => 
      app?.status === 'submitted' || app?.status === 'accepted' || app?.status === 'under_review'
    ) || scholarshipsData.some((sch: any) => 
      sch?.status === 'submitted' || sch?.status === 'accepted' || sch?.status === 'under_review'
    );

    if (profileCompletion < 50) return 'discovery';
    if (!hasApplications) return 'building';
    if (hasSubmittedApplications) return 'finalizing';
    return 'applying';
  };

  const journeyPhase = calculateJourneyPhase();
  const journeyProgress = studentProfile?.completionPercentage || 0;

  // Calculate upcoming deadlines count (next 14 days)
  const upcomingDeadlinesCount = (() => {
    const allDeadlines = [
      ...(finalApplicationsData || []).filter((app: any) => app?.deadline).map((app: any) => app.deadline),
      ...(finalScholarshipsData || []).filter((sch: any) => sch?.applicationDeadline).map((sch: any) => sch.applicationDeadline),
    ];
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    return allDeadlines.filter((deadline: string) => {
      const deadlineDate = new Date(deadline);
      return deadlineDate >= now && deadlineDate <= in14Days;
    }).length;
  })();

  // AI-powered suggestions: multiple contextual next actions
  const calculateAISuggestions = (): SuggestionItem[] => {
    const out: SuggestionItem[] = [];
    const apps = finalApplicationsData || [];
    const now = new Date();

    const reqCompletion = (r: any): number => {
      if (!r || typeof r !== 'object') return 100;
      if (r.essays) {
        const e = r.essays;
        const req = e.required || 0;
        const done = e.completed || 0;
        if (req === 0) return 100;
        return Math.round((done / req) * 100);
      }
      if (r.recommendations) {
        const e = r.recommendations;
        const req = e.required || 0;
        const done = e.submitted || 0;
        if (req === 0) return 100;
        return Math.round((done / req) * 100);
      }
      return 50;
    };

    apps.forEach((app: any) => {
      const appId = app?.id || app?._id;
      const deadline = app?.deadline;
      const uniId = app?.universityId;
      const uniName = app?.universityName || app?.name;
      const completion = reqCompletion(app?.requirements);
      const hasMentor = !!app?.mentorId;
      const hasWhy = !!(app?.whyThisSchool || '').trim();

      if (deadline) {
        const d = new Date(deadline);
        const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days < 0) {
          out.push({
            id: `overdue-${appId}`,
            type: 'overdue',
            title: t('studentHub.dashboard.applicationOverdue', 'Application overdue'),
            description: t('studentHub.dashboard.applicationOverdueDesc', 'Submit or update your application. The deadline has passed.'),
            priority: 'high',
            actionLabel: t('studentHub.dashboard.openCollege', 'Open college'),
            actionPath: appId ? `/student-hub/applications/${appId}/edit` : '/student-hub/applications',
            applicationId: appId,
            universityId: uniId,
            universityName: uniName,
          });
          return;
        }
        if (days <= 7 && completion < 100) {
          out.push({
            id: `prioritize-${appId}`,
            type: 'application',
            title: 'Prioritize application',
            description: `${days} days left. Complete the checklist to stay on track.`,
            priority: 'high',
            actionLabel: 'Complete now',
            actionPath: appId ? `/student-hub/applications/${appId}/edit` : '/student-hub/applications',
            applicationId: appId,
            universityId: uniId,
            universityName: uniName,
          });
        }
      }

      const req = app?.requirements;
      const essays = req?.essays;
      const recs = req?.recommendations;
      if (essays && (essays.required || 0) > (essays.completed || 0)) {
        out.push({
          id: `essay-${appId}`,
          type: 'essay',
          title: 'Work on essays',
          description: hasWhy ? 'You listed goals for this school. Make progress on essays.' : 'Complete required essays for this application.',
          priority: 'medium',
          actionLabel: 'Open Essays Hub',
          actionPath: '/student-hub/essays',
          applicationId: appId,
          universityId: uniId,
          universityName: uniName,
        });
      }
      if (recs && (recs.required || 0) > (recs.submitted || 0)) {
        out.push({
          id: `rec-${appId}`,
          type: 'recommendation',
          title: 'Request recommendation',
          description: `Get recommendation letters: ${recs.submitted || 0} of ${recs.required} submitted.`,
          priority: 'medium',
          actionLabel: 'Open Documents',
          actionPath: '/student-hub/documents',
          applicationId: appId,
          universityId: uniId,
          universityName: uniName,
        });
      }
      if (!hasMentor) {
        out.push({
          id: `mentor-${appId}`,
          type: 'mentor',
          title: 'Assign mentor',
          description: 'Link a mentor to this application for guidance.',
          priority: 'low',
          actionLabel: 'Assign mentor',
          actionPath: '/student-hub/applications',
          applicationId: appId,
          universityId: uniId,
          universityName: uniName,
        });
      }
    });

    if ((psychometricAssessments?.length || 0) === 0) {
      out.push({
        id: 'psychometric',
        type: 'psychometric',
        title: 'Complete psychometric assessment',
        description: 'Unlock match scores and university fit insights.',
        priority: 'high',
        actionLabel: 'Start assessment',
        actionPath: '/student-hub/psychometric-assessment',
      });
    }
    if (journeyProgress < 80) {
      out.push({
        id: 'profile',
        type: 'profile',
        title: 'Complete your profile',
        description: 'Unlock personalized recommendations and journey insights.',
        priority: 'medium',
        actionLabel: 'Complete profile',
        actionPath: '/student-hub/profile',
      });
    }
    if (apps.length === 0 && (finalScholarshipsData || []).length === 0) {
      out.push({
        id: 'first-app',
        type: 'application',
        title: t('studentHub.dashboard.addFirstCollege', 'Add your first college to your list'),
        description: t('studentHub.dashboard.addFirstCollegeDesc', 'Start tracking universities and deadlines.'),
        priority: 'high',
        actionLabel: t('studentHub.applications.addApplication', 'Add to List'),
        actionPath: '/student-hub?section=others&target=college-lists&applicationFlow=new',
      });
    }

    return out.slice(0, 6);
  };

  const aiSuggestions = calculateAISuggestions();

  return (
    <div className="student-hub-dashboard student-hub-page">
      {/* Welcome Brief - Clean, Minimal */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="student-hub-page-title">
          {t('studentHub.dashboard.greeting', 'Hi, {{userName}}! 👋', { userName })}
        </h1>
        <p className="student-hub-page-subtitle" style={{ marginTop: 8 }}>
          {t('studentHub.dashboard.welcomeMessage') || 'Let\'s make progress on your college journey today.'}
        </p>
      </div>

      {/* TOP BAR: Minimal, Clean - Phase Badge, Progress, Quick Add */}
      <div className="dashboard-top-bar" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Phase Badge */}
          <div className="phase-badge-minimal" style={{ 
            backgroundColor: (() => {
              const phaseColors = {
                discovery: '#f59e0b',
                building: '#3b82f6',
                applying: '#8b0000',
                finalizing: '#22c55e',
              };
              return phaseColors[journeyPhase] || '#8b0000';
            })(),
            padding: '6px 14px',
            borderRadius: '20px',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <UnifiedIcon 
              name={(() => {
                const phaseIcons = {
                  discovery: 'search',
                  building: 'edit',
                  applying: 'university',
                  finalizing: 'check-circle',
                };
                return phaseIcons[journeyPhase] || 'university';
              })()} 
              size="sm" 
              color="white" 
            />
            <span>
              {(() => {
                const phaseLabels = {
                  discovery: t('studentHub.dashboard.phase.discovery') || 'Discovery',
                  building: t('studentHub.dashboard.phase.building') || 'Building',
                  applying: t('studentHub.dashboard.phase.applying') || 'Applying',
                  finalizing: t('studentHub.dashboard.phase.finalizing') || 'Finalizing',
                };
                return phaseLabels[journeyPhase] || 'Applying';
              })()}
            </span>
          </div>
          
          {/* Deadline Alert */}
          {upcomingDeadlinesCount > 0 && (
            <Badge count={upcomingDeadlinesCount} size="small" style={{ backgroundColor: '#ff4d4f' }}>
              <span style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                <UnifiedIcon name="clock" size="sm" color="error" />
                {upcomingDeadlinesCount} {upcomingDeadlinesCount === 1 
                  ? (t('studentHub.dashboard.deadline') || 'deadline') 
                  : (t('studentHub.dashboard.deadlines') || 'deadlines')
                }
              </span>
            </Badge>
          )}
        </div>
        
        {/* Quick Add Button */}
          <Dropdown menu={{ items: quickAddMenuItems }} trigger={['click']} placement="bottomRight">
            <Button 
              type="primary" 
            size="middle"
            icon={<UnifiedIcon name="plus" size="md" color="white" />}
            >
              {t('studentHub.dashboard.quickAdd')}
            </Button>
          </Dropdown>
        </div>

      {/* Org membership notice: only for students who belong to an organization */}
      <OrgMembershipCard skip={isReadOnly} />

      {/* Admissions Program Progress for enrolled students (top of dashboard) */}
      <AdmissionsProgramProgressCard skip={isReadOnly} />

      {/* Telegram connection checklist: mentees only, above AI suggestions; hidden when connected */}
      <TelegramConnectionChecklist skip={isReadOnly} />

      {/* AI-powered suggestions, top placement (replaces "Your next step") */}
      {aiSuggestions.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <AISuggestionsCard suggestions={aiSuggestions} />
        </div>
      )}

      {/* PRIORITY 1: Bookings (Left) + Events (Right) - Side by Side - Equal Height */}
      <Row gutter={[24, 24]} className="priority-1-row equal-height-cards" style={{ marginBottom: 24 }}>
        {/* Left: Upcoming Bookings */}
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <BookingsCard compact={false} maxItems={10} />
        </Col>

        {/* Right: Events & Camps */}
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <EventsCard compact={false} maxItems={10} />
        </Col>
      </Row>

      {/* PRIORITY 2: Deadlines + Recent Activity (temporarily hidden) */}
      {false && (
      <Row gutter={[24, 24]} className="priority-2-row equal-height-cards" style={{ marginBottom: 24 }}>
        {/* Left: Upcoming Deadlines */}
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card title={
            <span>
              <UnifiedIcon name="clock" size="md" color="primary" style={{ marginRight: 8 }} />
              {t('studentHub.dashboard.upcomingDeadlines')}
            </span>
          } className="deadlines-card">
                    {(() => {
              // Get data - use final merged data that handles both normal and read-only modes
              const applicationsData = finalApplicationsData || [];
              const scholarshipsData = finalScholarshipsData || [];
              
              // Show ALL items with ANY status (not just "applying")
              // Filter to next 14 days only
              const now = new Date();
              const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
              
              const upcomingDeadlines = [
                ...applicationsData
                  .filter((app: any) => {
                    if (!app?.deadline) return false;
                    const deadlineDate = new Date(app.deadline);
                    return deadlineDate >= now && deadlineDate <= in14Days;
                  })
                  .map((app: any) => ({ 
                    ...app, 
                    type: 'application',
                    deadlineDate: app?.deadline
                  })),
                ...scholarshipsData
                  .filter((scholarship: any) => {
                    if (!scholarship?.applicationDeadline) return false;
                    const deadlineDate = new Date(scholarship.applicationDeadline);
                    return deadlineDate >= now && deadlineDate <= in14Days;
                  })
                  .map((scholarship: any) => ({ 
                    ...scholarship, 
                    type: 'scholarship',
                    deadlineDate: scholarship?.applicationDeadline
                  }))
              ].sort((a: any, b: any) => {
                const dateA = new Date(a.deadlineDate);
                const dateB = new Date(b.deadlineDate);
                return dateA.getTime() - dateB.getTime();
              }).slice(0, 5);

              return upcomingDeadlines.length > 0 ? (
                <List
                  dataSource={upcomingDeadlines}
                  renderItem={(item: any) => {
                    const deadline = item.type === 'scholarship' ? item.applicationDeadline : item.deadline;
                    const urgency = getUrgencyLevel(deadline);
                    
                    return (
                      <List.Item 
                        className="deadline-item"
                        onClick={() => handleDeadlineClick(item)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="deadline-content">
                          <div className="deadline-title-section">
                            <div className="deadline-title">
                              {item.type === 'scholarship' 
                                ? (item?.scholarshipName || t('studentHub.dashboard.unknownScholarship'))
                                : <UniversityNameDisplay universityId={item?.universityId} universityName={item?.universityName} />
                              }
                            </div>
                            {/* Show major for applications */}
                            {item.type === 'application' && item?.major && (
                              <div className="deadline-major" style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                {item.major}
                  </div>
                )}
                            <div 
                              className="deadline-date"
                              style={{ 
                                color: urgency?.color || '#666',
                                fontWeight: urgency?.level === 'urgent' || urgency?.level === 'overdue' ? 600 : 400,
                                marginTop: 8
                              }}
                            >
                              <span style={{ marginRight: 4 }}>Deadline:</span>
                              {formatDate(deadline)}
                              {urgency && urgency.level === 'overdue' && (
                                <span style={{ marginLeft: 8, fontSize: 11, color: '#ff4d4f' }}>
                                  (Overdue)
                                </span>
                              )}
                              {urgency && urgency.level === 'urgent' && (
                                <span style={{ marginLeft: 8, fontSize: 11, color: '#ff9800' }}>
                                  (Urgent)
                                </span>
                              )}
                            </div>
                          </div>
              </div>
                        <Badge
                          color={item.type === 'scholarship' ? 'blue' : 'green'}
                          text={(() => {
                            const getCategoryText = (category: string) => {
                              if (!category) return 'UNKNOWN';
                              const categoryKey = `studentHub.applications.category.${category}`;
                              const translated = t(categoryKey);
                              if (translated === categoryKey) {
                                return category.toUpperCase();
                              }
                              return translated.toUpperCase();
                            };
                            return item.type === 'scholarship' ? getCategoryText('scholarship') : getCategoryText('university');
                          })()}
                        />
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <UnifiedIcon name="clock" size="xl" color="gray" />
                </div>
                  <p>{t('studentHub.dashboard.noUpcomingDeadlines')}</p>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate('/student-hub/applications')}
                  >
                    {t('studentHub.dashboard.addApplication')}
                  </Button>
                </div>
              );
            })()}
          </Card>
        </Col>

        {/* Right: Recent Activity */}
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card 
            title={
              <span>
                <UnifiedIcon name="activity" size="md" color="primary" style={{ marginRight: 8 }} />
                {t('studentHub.dashboard.recentActivity')}
              </span>
            }
            className="activity-card"
          >
            {(() => {
              // Get data - use final merged data that handles both normal and read-only modes
              const applicationsData = finalApplicationsData || [];
              const scholarshipsData = finalScholarshipsData || [];
              const essaysData = finalEssaysData || [];
              const documentsData = finalDocumentsData || [];
              const assessmentsData = psychometricAssessments || [];
              
              // High-level activity labels: "Application added", "Essay uploaded", etc.
              const recentActivities = [
                ...applicationsData.map((app: any) => ({
                  ...app,
                  type: 'application',
                  activityType: t('studentHub.dashboard.applicationAdded'),
                  title: null,
                  subtitle: `${app?.major || t('studentHub.applications.notSpecified')} • ${app?.applicationType || 'application'}`,
                  timestamp: app?.createdAt || app?.updatedAt,
                  status: app?.status || 'unknown',
                })),
                ...scholarshipsData.map((scholarship: any) => ({
                  ...scholarship,
                  type: 'scholarship',
                  activityType: t('studentHub.dashboard.scholarshipAdded'),
                  title: scholarship?.scholarshipName || t('studentHub.dashboard.unknownScholarship'),
                  subtitle: `${scholarship?.organization || t('studentHub.applications.unknownOrganization')}`,
                  timestamp: scholarship?.createdAt || scholarship?.updatedAt,
                  status: scholarship?.status || 'unknown',
                  showPriority: scholarship?.status === 'applying' || scholarship?.status === 'submitted' || scholarship?.status === 'under_review',
                })),
                ...essaysData.map((essay: any) => ({
                  ...essay,
                  type: 'essay',
                  activityType: t('studentHub.dashboard.essayUploaded'),
                  title: essay?.title || t('studentHub.dashboard.untitledEssay'),
                  subtitle: essay?.essayType || t('studentHub.profile.status.unknown'),
                  timestamp: essay?.createdAt || essay?.updatedAt,
                  status: essay?.status || 'unknown',
                })),
                ...documentsData.map((document: any) => ({
                  ...document,
                  type: 'document',
                  activityType: t('studentHub.dashboard.documentUploaded'),
                  title: document?.fileName || t('studentHub.dashboard.untitledDocument'),
                  subtitle: document?.documentType || t('studentHub.profile.status.unknown'),
                  timestamp: document?.createdAt || document?.updatedAt,
                  status: document?.isVerified ? 'verified' : 'pending',
                })),
                ...assessmentsData.map((assessment: any) => {
                  const completedAt = assessment?.assessmentMetadata?.completedAt ?? assessment?.completedAt;
                  const isCompleted = !!completedAt;
                  return {
                    ...assessment,
                    type: 'psychometric',
                    activityType: isCompleted ? t('studentHub.dashboard.psychometricTestCompleted', 'Psychometric test completed') : t('studentHub.dashboard.psychometricTestStarted', 'Psychometric test started'),
                    title: null,
                    subtitle: isCompleted ? formatDate(completedAt) : (t('studentHub.dashboard.inProgress') || 'In progress'),
                    timestamp: completedAt || assessment?.createdAt || assessment?.updatedAt,
                    status: isCompleted ? 'completed' : 'in_progress',
                  };
                }),
              ]
                .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 8);

              return recentActivities.length > 0 ? (
                <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4, paddingTop: 4, paddingBottom: 4 }} className="recent-activities-list">
                <List
                  dataSource={recentActivities}
                  renderItem={(item: any) => (
                    <List.Item className="activity-item">
                              <Card 
                                className="activity-summary-card" 
                                size="small"
                                hoverable
                                onClick={() => handleActivityClick(item)}
                                style={{ cursor: 'pointer' }}
                              >
                        <div className="activity-content">
                          <div className="activity-header">
                            <div className="activity-icon" aria-hidden>
                              <UnifiedIcon
                                name={
                                  item.type === 'application'
                                    ? 'admissions'
                                    : item.type === 'scholarship'
                                      ? 'award'
                                      : item.type === 'psychometric'
                                        ? 'major-match'
                                        : item.type === 'essay'
                                          ? 'essays'
                                          : item.type === 'document'
                                            ? 'documents'
                                            : 'file-text'
                                }
                                size="lg"
                                color="primary"
                              />
                            </div>
                            <div className="activity-info">
                              <div className="activity-title">{item.activityType}</div>
                              <div className="activity-subtitle">
                                {item.type === 'application' ? (
                                  <><UniversityNameDisplay universityId={item?.universityId} universityName={item?.universityName} />{item.subtitle ? ` • ${item.subtitle}` : ''}</>
                                ) : item.title ? (
                                  <>{item.title}{item.subtitle ? ` • ${item.subtitle}` : ''}</>
                                ) : (
                                  item.subtitle
                                )}
                              </div>
                                      {/* Only show priority for scholarships that were applied to */}
                                      {item.type === 'scholarship' && item.showPriority && item.priorityLevel && (
                                        <div className="activity-priority" style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                                          Priority: {item.priorityLevel}
                                        </div>
                                      )}
                              <div className="activity-date">
                                        {(() => {
                                          const localeMap: { [key: string]: string } = {
                                            en: 'en-US',
                                            ru: 'ru-RU',
                                            uz: 'uz-UZ',
                                            kk: 'ru-RU',
                                          };
                                          const lang = i18n.language || 'en';
                                          const mappedLocale = localeMap[lang] || 'en-US';
                                          return new Date(item.timestamp).toLocaleDateString(mappedLocale, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                          });
                                        })()}
                              </div>
                            </div>
                          </div>
                          <div className="activity-status">
                            <Badge
                                      status={(() => {
                                        switch (item.status) {
                                          case 'submitted':
                                          case 'under_review':
                                            return 'processing';
                                          case 'accepted':
                                          case 'completed':
                                            return 'success';
                                          case 'rejected':
                                            return 'error';
                                          case 'waitlisted':
                                            return 'warning';
                                          case 'in_progress':
                                          case 'applying':
                                            return 'default';
                                          default:
                                            return 'default';
                                        }
                                      })() as any}
                                      text={getStatusText(item.status)}
                            />
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <p>{t('studentHub.dashboard.noActivity')}</p>
                </div>
              );
            })()}
          </Card>
        </Col>
      </Row>
      )}
    </div>
  );
};

export default Dashboard;