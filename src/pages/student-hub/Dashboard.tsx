import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Avatar, Button, Badge, Spin, Alert, Tabs, message, Dropdown, Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../components/common/icons/FontAwesomeIcon';
import { 
  PROFILE_ICONS, 
  APPLICATION_ICONS, 
  ESSAY_ICONS, 
  STATUS_ICONS,
  ACTION_ICONS 
} from '../../constants/icons';
import { useStudentHub } from '../../hooks/useStudentHub';
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
import { useGetMeQuery } from '../../app/services/users';
import './Dashboard.scss';

const { TabPane } = Tabs;

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { dashboard, stats, profile, notifications, isLoading, hasError } = useStudentHub();
  const { data: userData } = useGetMeQuery();
  
  // Get user name from user data
  const userName = userData?.profile?.name || 'Student';
  
  // State for current time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Fetch the same data as Applications page
  const { data: applicationsResponse, isLoading: applicationsLoading } = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const { data: scholarshipsResponse, isLoading: scholarshipsLoading } = useGetScholarshipApplicationsQuery({ page: 1, limit: 100 });
  const { data: essaysResponse, isLoading: essaysLoading } = useGetStudentEssaysQuery({ page: 1, limit: 100 });
  const { data: documentsResponse, isLoading: documentsLoading } = useGetDocumentsQuery({ page: 1, limit: 100 });

  // Helper function to format dates like Applications page
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  // Use real data from API
  const dashboardData = {
    applicationsCount: stats?.totalApplications || 0,
    essaysCount: stats?.totalEssays || 0,
    tasksCount: stats?.totalTasks || 0,
    upcomingDeadlines: [],
    recentActivity: [],
    quickStats: {
      applicationsSubmitted: stats?.submittedApplications || 0,
      essaysInProgress: stats?.inProgressEssays || 0,
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
            <div className="stat-value">{documentsResponse?.data?.length || 0}</div>
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
              // Get data from the same sources as Applications page
              const applicationsData = applicationsResponse?.data || [];
              const scholarshipsData = scholarshipsResponse?.data || [];
              const essaysData = essaysResponse?.data || [];
              const documentsData = documentsResponse?.data || [];
              
              // Combine all recent activities
              const recentActivities = [
                // College Applications
                ...applicationsData.map((app: any) => ({ 
                  ...app, 
                  type: 'application',
                  activityType: t('studentHub.dashboard.collegeApplication'),
                  title: app?.universityName || t('studentHub.dashboard.unknownUniversity'),
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
                              <div className="activity-title">{item.title}</div>
                              <div className="activity-subtitle">{item.subtitle}</div>
                              <div className="activity-date">
                                {new Date(item.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="activity-status">
                            <Badge
                              status={getStatusColor(item.status) as any}
                              text={item.status?.replace('_', ' ').toUpperCase()}
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
              <Col xs={12} sm={8} md={6}>
                <Button
                  type="dashed"
                  block
                  icon={<FontAwesomeIcon icon={PROFILE_ICONS.DOCUMENTS} />}
                  className="quick-action-btn"
                  onClick={handleUploadDocument}
                >
                  {t('studentHub.dashboard.newDocument')}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8}>
          {/* Upcoming Deadlines */}
          <Card title={t('studentHub.dashboard.upcomingDeadlines')} className="deadlines-card">
            {(() => {
              // Get data from the same sources as Applications page
              const applicationsData = applicationsResponse?.data || [];
              const scholarshipsData = scholarshipsResponse?.data || [];
              
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
                          : (item?.universityName || t('studentHub.dashboard.unknownUniversity'))
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
                      text={item.type === 'scholarship' ? t('studentHub.applications.scholarship').toUpperCase() : t('studentHub.applications.university').toUpperCase()}
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
                      <div className="date-date">{currentTime.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</div>
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