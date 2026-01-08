import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Avatar, Button, Badge, Spin, Alert, Tabs, message, Dropdown, Menu, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import i18n from '../../lib/i18n';
import { useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../components/common/icons/FontAwesomeIcon';
import { 
  PROFILE_ICONS, 
  APPLICATION_ICONS, 
  ESSAY_ICONS, 
  STATUS_ICONS,
  ACTION_ICONS 
} from '../../constants/icons';
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
import { useGetMeQuery } from '../../app/services/users';
import { useGetUniversityDetailQuery } from '../../app/services/universities';
import { getTranslation } from '../../lib/i18n/translationUtils';
import './Dashboard.scss';

// Props interface for Dashboard - supports both normal and read-only mode
export interface DashboardProps {
  // For read-only mode (counselor viewing student)
  readOnly?: boolean;
  studentId?: string;
  studentName?: string;
}

// Component to display university name - fetches from universityId if available
const UniversityNameDisplay: React.FC<{ universityId?: string; universityName?: string }> = ({ universityId, universityName }) => {
  const { t } = useTranslation();
  
  if (universityId) {
    const { data: university, isLoading } = useGetUniversityDetailQuery(universityId, { skip: !universityId });
    
    if (isLoading) {
      return <span>Loading...</span>;
    }
    
    if (university) {
      const displayName = getTranslation(university.name);
      return <>{displayName || universityName || t('studentHub.dashboard.unknownUniversity')}</>;
    }
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
    navigate('/student-hub/applications/new');
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

  return (
    <div className="student-hub-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="welcome-title">
            {t('studentHub.dashboard.welcomeBack')}, {userName}!
          </h1>
          <p className="welcome-subtitle">
            {t('studentHub.dashboard.welcomeMessage')}
          </p>
        </div>
        <div className="header-actions">
          <Dropdown menu={{ items: quickAddMenuItems }} trigger={['click']} placement="bottomRight">
            <Button 
              type="primary" 
              size="large" 
              icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />}
            >
              {t('studentHub.dashboard.quickAdd')}
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Profile Completion Card - Compact Version */}
      {studentProfile && (
        <Card 
          className="profile-completion-card"
          size="small"
          style={{ 
            marginBottom: 16,
            background: studentProfile.completionPercentage === 100 
              ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
              : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: studentProfile.completionPercentage === 100 ? '2px solid #10b981' : '2px solid #f59e0b'
          }}
        >
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} md={14}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%' }}>
                {studentProfile.completionPercentage < 100 && (
                  <div style={{ fontSize: 13, color: '#666' }}>
                    <span style={{ fontWeight: 500 }}>{t('studentHub.dashboard.missing')}</span>
                    {(() => {
                      const missingFields: string[] = [];
                      
                      // Check required Personal Profile fields (matches backend calculation)
                      if (!studentProfile.personalProfile?.country) {
                        missingFields.push(t('studentHub.profile.country'));
                      }
                      if (!studentProfile.personalProfile?.city) {
                        missingFields.push(t('studentHub.profile.city'));
                      }
                      if (!studentProfile.personalProfile?.intendedMajors?.length) {
                        missingFields.push(t('studentHub.profile.intendedMajor').replace(' *', ''));
                      }
                      if (!studentProfile.personalProfile?.personalInterests?.length) {
                        missingFields.push(t('studentHub.profile.personalInterests').replace(' *', ''));
                      }
                      if (!studentProfile.personalProfile?.careerGoals?.length) {
                        missingFields.push(t('studentHub.profile.careerGoals').replace(' *', ''));
                      }
                      if (!studentProfile.personalProfile?.demographics?.languages?.length) {
                        missingFields.push(t('studentHub.profile.languagesSpoken').replace(' *', ''));
                      }
                      
                      // Check Academic Profile required fields (matches backend - ALL 5 fields required)
                      if (studentProfile.academicProfile) {
                        const academic = studentProfile.academicProfile;
                        const missingAcademic: string[] = [];
                        if (!academic.graduationYear) missingAcademic.push('Graduation Year');
                        if (!academic.curriculum) missingAcademic.push('Curriculum');
                        if (!(academic.gpa && Object.keys(academic.gpa).length > 0)) missingAcademic.push('GPA');
                        if (!(academic.testScores && Object.keys(academic.testScores).length > 0)) missingAcademic.push('Test Scores');
                        if (!(academic.englishProficiency && Object.keys(academic.englishProficiency).length > 0)) missingAcademic.push('English Proficiency');
                        
                        if (missingAcademic.length > 0) {
                          missingFields.push(`Academic: ${missingAcademic.join(', ')}`);
                        }
                      } else {
                        missingFields.push('Academic Profile');
                      }
                      
                      // Check Activities Profile
                      if (!studentProfile.activitiesProfile || 
                          (!studentProfile.activitiesProfile.extracurricularActivities?.length)) {
                        missingFields.push('Activities & Achievements');
                      }
                      
                      return missingFields.length > 0 ? missingFields.join(', ') : 'All required fields completed';
                    })()}
                  </div>
                )}
              </div>
            </Col>
            <Col xs={24} md={10}>
              <div className="profile-completion-actions">
                {studentProfile.completionPercentage === 100 ? (
                  <div className="profile-complete-celebration">
                    <div className="celebration-header">
                      <span className="celebration-emoji">🎉</span>
                      <span className="celebration-text">Profile Complete!</span>
                    </div>
                    <div className="progress-container success">
                      <Progress 
                        percent={100} 
                        strokeColor="#10b981"
                        status="success"
                        format={() => '100%'}
                        strokeWidth={10}
                        showInfo={true}
                      />
                    </div>
                    <div className="button-group">
                      <Button
                        type="default"
                        size="middle"
                        onClick={() => navigate('/student-hub/profile?tab=personal')}
                        icon={<FontAwesomeIcon icon="user" />}
                        className="view-profile-btn"
                      >
                        View Profile
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        onClick={handleRecalculate}
                        className="refresh-button"
                        title="Recalculate completion percentage"
                        icon={<FontAwesomeIcon icon="sync" />}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="progress-container">
                      <Progress 
                        percent={studentProfile.completionPercentage} 
                        strokeColor="#f59e0b"
                        status="active"
                        format={(percent) => `${percent}%`}
                        strokeWidth={8}
                        showInfo={true}
                      />
                    </div>
                    <div className="button-group">
                      <Button
                        type="primary"
                        size="middle"
                        onClick={() => navigate('/student-hub/profile?tab=personal')}
                        icon={<FontAwesomeIcon icon="user" />}
                      >
                        Complete Profile
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        onClick={handleRecalculate}
                        className="refresh-button"
                        title="Recalculate completion percentage"
                        icon={<FontAwesomeIcon icon="sync" />}
                      >
                        Refresh
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Quick Stats */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card">
            <div className="stat-header">
              <FontAwesomeIcon icon={APPLICATION_ICONS.APPLICATIONS} style={{ color: '#8b0000' }} />
              <span className="stat-title">{t('studentHub.dashboard.applications')}</span>
            </div>
            <div className="stat-value">{dashboardData.applicationsCount}</div>
            <div className="stat-detail">
              <span className="stat-label">{dashboardData.quickStats.applicationsSubmitted} {t('studentHub.dashboard.submitted')}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card">
            <div className="stat-header">
              <FontAwesomeIcon icon={ESSAY_ICONS.ESSAYS} style={{ color: '#8b0000' }} />
              <span className="stat-title">{t('studentHub.dashboard.essays')}</span>
            </div>
            <div className="stat-value">{dashboardData.essaysCount}</div>
            <div className="stat-detail">
              <span className="stat-label">{dashboardData.quickStats.essaysInProgress} {t('studentHub.dashboard.inProgress')}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="stat-card">
            <div className="stat-header">
              <FontAwesomeIcon icon="file" style={{ color: '#8b0000' }} />
              <span className="stat-title">{t('studentHub.dashboard.documents')}</span>
            </div>
            <div className="stat-value">{finalDocumentsData?.length || 0}</div>
          </Card>
        </Col>
        {/* Tasks card commented out as requested */}
        {/* <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <div className="stat-header">
              <FontAwesomeIcon icon={APPLICATION_ICONS.TASKS} />
              <span className="stat-title">Tasks</span>
            </div>
            <div className="stat-value">{dashboardData.tasksCount}</div>
            <div className="stat-detail">
              <Badge count={dashboardData.quickStats.tasksOverdue} size="small" offset={[10, 0]}>
                <span className="stat-label">{dashboardData.quickStats.tasksOverdue} overdue</span>
              </Badge>
            </div>
          </Card>
        </Col> */}
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]} className="main-content-row">
        {/* Left Column */}
        <Col xs={24} lg={16}>
          {/* Recent Activity */}
          <Card title={t('studentHub.dashboard.recentActivity')} className="activity-card">
            {(() => {
              // Get data - use final merged data that handles both normal and read-only modes
              const applicationsData = finalApplicationsData || [];
              const scholarshipsData = finalScholarshipsData || [];
              const essaysData = finalEssaysData || [];
              const documentsData = finalDocumentsData || [];
              
              // Combine all recent activities
              const recentActivities = [
                // College Applications
                ...applicationsData.map((app: any) => ({ 
                  ...app, 
                  type: 'application',
                  activityType: t('studentHub.dashboard.collegeApplication'),
                  title: null, // Will be rendered with UniversityNameDisplay component
                  subtitle: `${t('studentHub.dashboard.major')}: ${app?.major || t('studentHub.applications.notSpecified')}`,
                  timestamp: app?.createdAt || app?.updatedAt,
                  status: app?.status || 'unknown'
                })),
                // Scholarships
                ...scholarshipsData.map((scholarship: any) => ({ 
                  ...scholarship, 
                  type: 'scholarship',
                  activityType: t('studentHub.dashboard.scholarship'),
                  title: scholarship?.scholarshipName || t('studentHub.dashboard.unknownScholarship'),
                  subtitle: `${t('studentHub.dashboard.organization')}: ${scholarship?.organization || t('studentHub.applications.unknownOrganization')}`,
                  timestamp: scholarship?.createdAt || scholarship?.updatedAt,
                  status: scholarship?.status || 'unknown'
                })),
                // Essays
                ...essaysData.map((essay: any) => ({ 
                  ...essay, 
                  type: 'essay',
                  activityType: t('studentHub.dashboard.essay'),
                  title: essay?.title || t('studentHub.dashboard.untitledEssay'),
                  subtitle: `${t('studentHub.dashboard.type')}: ${essay?.essayType || t('studentHub.profile.status.unknown')}`,
                  timestamp: essay?.createdAt || essay?.updatedAt,
                  status: essay?.status || 'unknown'
                })),
                // Documents
                ...documentsData.map((document: any) => ({ 
                  ...document, 
                  type: 'document',
                  activityType: t('studentHub.dashboard.document'),
                  title: document?.fileName || t('studentHub.dashboard.untitledDocument'),
                  subtitle: `${t('studentHub.dashboard.type')}: ${document?.documentType || t('studentHub.profile.status.unknown')}`,
                  timestamp: document?.createdAt || document?.updatedAt,
                  status: document?.isVerified ? 'verified' : 'pending'
                }))
              ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

              return recentActivities.length > 0 ? (
                <List
                  dataSource={recentActivities}
                  renderItem={(item: any) => (
                    <List.Item className="activity-item">
                      <Card className="activity-summary-card" size="small">
                        <div className="activity-content">
                          <div className="activity-header">
                            <div className="activity-icon">
                              <FontAwesomeIcon 
                                icon={
                                  item.type === 'application' ? 'university' :
                                  item.type === 'scholarship' ? 'graduation-cap' :
                                  'file-text'
                                } 
                                className="activity-icon-svg"
                                style={{ color: '#8b0000' }}
                              />
                            </div>
                            <div className="activity-info">
                              <div className="activity-title">
                                {item.type === 'application' 
                                  ? <UniversityNameDisplay universityId={item?.universityId} universityName={item?.universityName} />
                                  : item.title
                                }
                              </div>
                              <div className="activity-subtitle">{item.subtitle}</div>
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
                                    return 'processing';
                                  case 'accepted':
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
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <p>{t('studentHub.dashboard.noActivity')}</p>
                </div>
              );
            })()}
          </Card>

          {/* Quick Actions */}
          <Card title={t('studentHub.dashboard.quickActions')} className="actions-card">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6}>
                <Button
                  type="dashed"
                  block
                  icon={<FontAwesomeIcon icon={PROFILE_ICONS.ACADEMIC} />}
                  className="quick-action-btn"
                  onClick={handleAcademicProfile}
                >
                  {t('studentHub.dashboard.academicProfile')}
                </Button>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Button
                  type="dashed"
                  block
                  icon={<FontAwesomeIcon icon={APPLICATION_ICONS.APPLICATIONS} />}
                  className="quick-action-btn"
                  onClick={handleNewApplication}
                >
                  {t('studentHub.dashboard.newApplication')}
                </Button>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Button
                  type="dashed"
                  block
                  icon={<FontAwesomeIcon icon={ESSAY_ICONS.ESSAYS} />}
                  className="quick-action-btn"
                  onClick={handleStartEssay}
                >
                  {t('studentHub.dashboard.newEssay')}
                </Button>
              </Col>
              {/* <Col xs={12} sm={8} md={6}>
                <Button
                  type="dashed"
                  block
                  icon={<FontAwesomeIcon icon={PROFILE_ICONS.DOCUMENTS} />}
                  className="quick-action-btn"
                  onClick={handleUploadDocument}
                >
                  {t('studentHub.dashboard.newDocument')}
                </Button>
              </Col> */}
              {/* <Col xs={12} sm={8} md={6}>
                <Button
                  type="dashed"
                  block
                  icon={<FontAwesomeIcon icon="chart-line" />}
                  className="quick-action-btn"
                  onClick={() => navigate('/student-hub/psychometric-assessment')}
                >
                  Major Match
                </Button>
              </Col> */}
            </Row>
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8}>
          {/* Upcoming Deadlines */}
          <Card title={t('studentHub.dashboard.upcomingDeadlines')} className="deadlines-card">
            {(() => {
              // Get data - use final merged data that handles both normal and read-only modes
              const applicationsData = finalApplicationsData || [];
              const scholarshipsData = finalScholarshipsData || [];
              
              // Filter and combine upcoming deadlines
              const upcomingDeadlines = [
                ...applicationsData
                  .filter((app: any) => app?.status === 'under_review' || app?.status === 'applying')
                  .map((app: any) => ({ ...app, type: 'application' })),
                ...scholarshipsData
                  .filter((scholarship: any) => scholarship?.status === 'researching' || scholarship?.status === 'applying' || scholarship?.status === 'eligible')
                  .map((scholarship: any) => ({ ...scholarship, type: 'scholarship' }))
              ].sort((a: any, b: any) => {
                const dateA = new Date(a.type === 'scholarship' ? a.applicationDeadline : a.deadline);
                const dateB = new Date(b.type === 'scholarship' ? b.applicationDeadline : b.deadline);
                return dateA.getTime() - dateB.getTime();
              }).slice(0, 5);

              return upcomingDeadlines.length > 0 ? (
                <List
                  dataSource={upcomingDeadlines}
                renderItem={(item: any) => (
                  <List.Item className="deadline-item">
                      <div className="deadline-content">
                      <div className="deadline-title">
                        {item.type === 'scholarship' 
                          ? (item?.scholarshipName || t('studentHub.dashboard.unknownScholarship'))
                          : <UniversityNameDisplay universityId={item?.universityId} universityName={item?.universityName} />
                        }
                      </div>
                      <div className="deadline-date">
                        {item.type === 'scholarship' 
                          ? formatDate(item?.applicationDeadline)
                          : formatDate(item?.deadline)
                        }
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
                )}
              />
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <div className="dynamic-date-icon">
                      <div className="date-time">{currentTime.toLocaleTimeString('en-US', { 
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}</div>
                      <div className="date-date">{(() => {
                        const localeMap: { [key: string]: string } = {
                          en: 'en-US',
                          ru: 'ru-RU',
                          uz: 'uz-UZ',
                          kk: 'ru-RU',
                        };
                        const lang = i18n.language || 'en';
                        const mappedLocale = localeMap[lang] || 'en-US';
                        return currentTime.toLocaleDateString(mappedLocale, { 
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                      })()}</div>
                    </div>
                  </div>
                  <p>{t('studentHub.dashboard.noUpcomingDeadlines')}</p>
                </div>
              );
            })()}
          </Card>

        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;