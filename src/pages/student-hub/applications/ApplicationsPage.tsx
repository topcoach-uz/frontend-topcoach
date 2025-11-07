import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Row, Col, Statistic, Progress, List, Badge, Space, Tag, message, Modal, Descriptions, Divider, Spin, Avatar } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { APPLICATION_ICONS, STATUS_ICONS, ACTION_ICONS } from '../../../constants/icons';
import { useStudentHub } from '../../../hooks/useStudentHub';
import { 
  useGetCollegeApplicationsQuery,
  useGetApplicationTasksQuery,
  useGetScholarshipApplicationsQuery,
  useDeleteCollegeApplicationMutation,
  useDeleteScholarshipApplicationMutation
} from '../../../app/services/student-hub/applicationTrackingApi';
import { useGetUniversityDetailQuery } from 'src/app/services/universities';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import NewApplicationPage from './NewApplicationPage';
import NewTaskPage from './NewTaskPage';
import NewScholarshipPage from './NewScholarshipPage';
import './ApplicationsPage.scss';

const { TabPane } = Tabs;

// Component to display university info card
const UniversityInfoCard: React.FC<{ universityId: string }> = ({ universityId }) => {
  const { data: university, isLoading } = useGetUniversityDetailQuery(universityId);

  if (isLoading) {
    return <Spin size="small" />;
  }

  if (!university) {
    return null;
  }

  const universityImage = university.media?.[0]?.url || '/img/some-university.png';
  const universityName = getTranslation(university.name) || 'Unknown University';
  const ranking = university.rankings?.[0]?.rank ? `#${university.rankings[0].rank}` : null;
  const location = getTranslation(university.location?.address) || '';

  return (
    <div className="university-info-card">
      <Avatar
        src={universityImage}
        size={64}
        shape="square"
        style={{ borderRadius: '8px' }}
      />
      <div className="university-info-content">
        <div className="university-info-name">{universityName}</div>
        {ranking && <div className="university-info-ranking">{ranking}</div>}
        {location && <div className="university-info-location">{location}</div>}
      </div>
    </div>
  );
};

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
      return <>{displayName || universityName || t('studentHub.applications.unknownUniversity')}</>;
    }
  }
  
  return <>{universityName || t('studentHub.applications.unknownUniversity')}</>;
};

const ApplicationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<any>(null);
  const { dashboard, isLoading, hasError } = useStudentHub();
  
  // Fetch applications, tasks, and scholarships data - MUST be called before any early returns
  const { data: applicationsResponse, isLoading: applicationsLoading, refetch: refetchApplications } = useGetCollegeApplicationsQuery({ page: 1, limit: 100 });
  const { data: tasksResponse, isLoading: tasksLoading, refetch: refetchTasks } = useGetApplicationTasksQuery({ page: 1, limit: 100 });
  const { data: scholarshipsResponse, isLoading: scholarshipsLoading, refetch: refetchScholarships } = useGetScholarshipApplicationsQuery({ page: 1, limit: 100 });
  const [deleteCollegeApplication, { isLoading: deleteLoading }] = useDeleteCollegeApplicationMutation();
  const [deleteScholarshipApplication, { isLoading: deleteScholarshipLoading }] = useDeleteScholarshipApplicationMutation();

  // Handle URL parameters for tab navigation - MUST be called before any early returns
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'applications', 'scholarships'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Refetch all data when returning from creation pages - MUST be called before any early returns
  useEffect(() => {
    if (location.pathname === '/student-hub/applications') {
      refetchApplications();
      refetchTasks();
      refetchScholarships();
    }
  }, [location.pathname, refetchApplications, refetchTasks, refetchScholarships]);

  // Show loading state only in main content area
  if (isLoading) {
    return (
      <div className="applications-loading-content">
        <div className="loading-spinner-container">
          <Spin size="large" />
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="applications-error">
        <div className="error-content">
          <h3>Error Loading Applications</h3>
          <p>There was an error loading your applications data. Please try again.</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  // Handle different routes
  if (location.pathname === '/student-hub/applications/new') {
    return <NewApplicationPage />;
  }
  
  if (location.pathname === '/student-hub/applications/tasks/new') {
    return <NewTaskPage />;
  }
  
  if (location.pathname === '/student-hub/applications/scholarships/new') {
    return <NewScholarshipPage />;
  }


  // Handle tab changes
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // Use real data from API with defensive programming
  const applicationsData = {
    overview: {
      totalApplications: dashboard?.stats?.totalApplications || 0,
      submitted: dashboard?.stats?.submittedApplications || 0,
      inProgress: dashboard?.stats?.inProgressApplications || 0,
      accepted: dashboard?.stats?.acceptedApplications || 0,
      rejected: 0, // Not available in current API
      waitlisted: 0, // Not available in current API
    },
    applications: applicationsResponse?.data || [],
    tasks: tasksResponse?.data || [],
    scholarships: scholarshipsResponse?.data || [],
  };

  console.log('ApplicationsPage - Dashboard data:', dashboard);
  console.log('ApplicationsPage - Stats:', dashboard?.stats);
  console.log('ApplicationsPage - Applications data:', applicationsData);

  // Button click handlers
  const handleNewApplication = () => {
    navigate('/student-hub/applications/new');
  };


  const handleDeleteApplication = (application: any) => {
    setApplicationToDelete(application);
    setDeleteModalVisible(true);
  };

  const confirmDeleteApplication = async () => {
    if (!applicationToDelete) return;
    
    try {
      if (applicationToDelete.type === 'scholarship') {
        console.log('🎯 Frontend: Deleting scholarship with ID:', applicationToDelete.id);
        console.log('🎯 Frontend: About to call deleteScholarshipApplication API');
        const result = await deleteScholarshipApplication(applicationToDelete.id).unwrap();
        console.log('🎯 Frontend: Delete API call successful:', result);
        message.success(t('studentHub.applications.deleteScholarshipSuccess'));
        refetchScholarships();
      } else {
        console.log('Deleting application with ID:', applicationToDelete.id);
        await deleteCollegeApplication(applicationToDelete.id).unwrap();
        message.success(t('studentHub.applications.deleteSuccess'));
        refetchApplications();
      }
      setDeleteModalVisible(false);
      setApplicationToDelete(null);
    } catch (error) {
      console.error('🎯 Frontend: Error deleting:', error);
      console.error('🎯 Frontend: Error details:', JSON.stringify(error, null, 2));
      message.error(t('studentHub.applications.deleteError'));
    }
  };

  const cancelDeleteApplication = () => {
    setDeleteModalVisible(false);
    setApplicationToDelete(null);
  };

  const handleDeleteScholarship = (scholarshipId: string) => {
    console.log('Deleting scholarship with ID:', scholarshipId);
    setApplicationToDelete({ id: scholarshipId, type: 'scholarship' });
    setDeleteModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'processing';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'waitlisted':
        return 'warning';
      case 'in_progress':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: number | string) => {
    const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
    if (priorityNum >= 8) return 'red';
    if (priorityNum >= 5) return 'orange';
    return 'green';
  };

  const getPriorityText = (priority: number | string) => {
    const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
    if (priorityNum >= 8) return t('studentHub.applications.priority.high');
    if (priorityNum >= 5) return t('studentHub.applications.priority.medium');
    return t('studentHub.applications.priority.low');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('studentHub.applications.tbd');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reach':
        return 'red';
      case 'target':
        return 'blue';
      case 'safety':
        return 'green';
      default:
        return 'default';
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <div className="tab-label">
          <FontAwesomeIcon icon={APPLICATION_ICONS.APPLICATIONS} />
          <span>{t('studentHub.applications.overview')}</span>
        </div>
      ),
      children: (
        <div className="overview-content">
          <Row gutter={[24, 24]} className="stats-row">
            <Col xs={12} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title={t('studentHub.applications.totalApplications')}
                  value={applicationsData.overview.totalApplications}
                  prefix={<FontAwesomeIcon icon={APPLICATION_ICONS.APPLICATIONS} />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title={t('studentHub.applications.submitted')}
                  value={applicationsData.overview.submitted}
                  valueStyle={{ color: '#3b82f6' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title={t('studentHub.applications.inProgress')}
                  value={applicationsData.overview.inProgress}
                  valueStyle={{ color: '#f59e0b' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="stat-card">
                <Statistic
                  title={t('studentHub.applications.accepted')}
                  value={applicationsData.overview.accepted}
                  valueStyle={{ color: '#22c55e' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title={t('studentHub.applications.recentActivities')} className="applications-card">
                <List
                  dataSource={[
                    ...applicationsData.applications.map((app: any) => ({ ...app, type: 'application' })),
                    ...applicationsData.scholarships.map((scholarship: any) => ({ ...scholarship, type: 'scholarship' }))
                  ].sort((a: any, b: any) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime()).slice(0, 5)}
                  renderItem={(item: any) => (
                    <List.Item className="application-item">
                      <Card className="application-summary-card">
                        <div className="application-summary-content">
                          <div className="application-details">
                            <ul className="detail-list">
                              <li>
                                <FontAwesomeIcon icon={item.type === 'scholarship' ? 'graduation-cap' : 'university'} className="detail-icon" />
                                <strong>{item.type === 'scholarship' ? `${t('studentHub.applications.scholarship')}:` : `${t('studentHub.applications.university')}:`}</strong>
                                <span className="detail-value">
                                  {item.type === 'scholarship' 
                                    ? (item?.scholarshipName || t('studentHub.applications.unknownScholarship'))
                                    : <UniversityNameDisplay universityId={item?.universityId} universityName={item?.universityName} />
                                  }
                                </span>
                              </li>
                              <li>
                                <FontAwesomeIcon icon="calendar" className="detail-icon" />
                                <strong>{t('studentHub.applications.deadline')}:</strong>
                                <span className="detail-value">{formatDate(item.type === 'scholarship' ? item?.applicationDeadline : item?.deadline)}</span>
                              </li>
                              <li>
                                <FontAwesomeIcon icon="star" className="detail-icon" />
                                <strong>{t('studentHub.applications.priorityLevel')}:</strong>
                                <span className="detail-value">{item.type === 'scholarship' ? t('studentHub.applications.priority.na') : `${getPriorityText(item?.priority)} (${item?.priority}/10)`}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title={t('studentHub.applications.upcomingDeadlines')} className="deadlines-card">
                <List
                  dataSource={[
                    ...applicationsData.applications
                      .filter((app: any) => app?.status === 'under_review' || app?.status === 'applying')
                      .map((app: any) => ({ ...app, type: 'application' })),
                    ...applicationsData.scholarships
                      .filter((scholarship: any) => scholarship?.status === 'researching' || scholarship?.status === 'applying' || scholarship?.status === 'eligible')
                      .map((scholarship: any) => ({ ...scholarship, type: 'scholarship' }))
                  ].sort((a: any, b: any) => {
                    const dateA = new Date(a.type === 'scholarship' ? a.applicationDeadline : a.deadline);
                    const dateB = new Date(b.type === 'scholarship' ? b.applicationDeadline : b.deadline);
                    return dateA.getTime() - dateB.getTime();
                  }).slice(0, 5)}
                  renderItem={(item: any) => (
                    <List.Item className="deadline-item">
                      <div className="deadline-content">
                        <div className="deadline-title">
                          {item.type === 'scholarship' 
                            ? (item?.scholarshipName || t('studentHub.applications.unknownScholarship'))
                            : <UniversityNameDisplay universityId={item?.universityId} universityName={item?.universityName} />
                          }
                        </div>
                        <div className="deadline-date">
                          {item.type === 'scholarship' 
                            ? (item?.applicationDeadline ? new Date(item.applicationDeadline).toLocaleDateString() : t('studentHub.applications.tbd'))
                            : (item?.deadline ? new Date(item.deadline).toLocaleDateString() : t('studentHub.applications.tbd'))
                          }
                        </div>
                      </div>
                      <Tag color={item.type === 'scholarship' ? 'blue' : getCategoryColor(item?.category)}>
                        {item.type === 'scholarship' ? t('studentHub.applications.scholarship').toUpperCase() : t('studentHub.applications.university').toUpperCase()}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'applications',
      label: (
        <div className="tab-label">
          <FontAwesomeIcon icon={APPLICATION_ICONS.APPLICATIONS} />
          <span>{t('studentHub.applications.addApplications')}</span>
        </div>
      ),
      children: (
        <div className="applications-content">
          <div className="applications-header">
            <h3>{t('studentHub.applications.collegeApplications')}</h3>
            <Button
              type="primary"
              icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />}
              size="large"
              onClick={handleNewApplication}
            >
              {t('studentHub.applications.addApplication')}
            </Button>
          </div>
          <List
            dataSource={applicationsData.applications}
            renderItem={(application: any) => {
              // Fetch university details if universityId is available
              const UniversityCard = application.universityId ? (
                <UniversityInfoCard universityId={application.universityId} />
              ) : null;

              return (
                <List.Item className="application-detail-item">
                  <Card className="application-card">
                    <div className="application-card-content">
                      {/* University Section - Clickable */}
                      {application.universityId && (
                        <div 
                          className="university-section"
                          onClick={() => navigate(`/universities/${application.universityId}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          {UniversityCard}
                        </div>
                      )}

                      <div className="application-header">
                        <div className="application-header-left">
                          <div 
                            className="university-name"
                            onClick={application.universityId ? () => navigate(`/universities/${application.universityId}`) : undefined}
                            style={application.universityId ? { cursor: 'pointer', color: '#8b0000', textDecoration: 'underline' } : {}}
                          >
                            <UniversityNameDisplay universityId={application.universityId} universityName={application.universityName} />
                          </div>
                          {application.major && (
                            <div className="application-major">
                              <FontAwesomeIcon icon="graduation-cap" className="detail-icon" />
                              <span>{application.major}</span>
                            </div>
                          )}
                        </div>
                        <div className="application-header-right">
                          <Tag 
                            color={application.status === 'accepted' ? 'green' : application.status === 'rejected' ? 'red' : application.status === 'applying' ? 'blue' : 'orange'}
                            className="status-tag"
                          >
                            {application.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                          </Tag>
                        </div>
                      </div>

                      <div className="application-details-grid">
                        <div className="detail-item">
                          <FontAwesomeIcon icon="file-alt" className="detail-icon" />
                          <span className="detail-label">{t('studentHub.applications.applicationType')}</span>
                          <span className="detail-value">{application.applicationType?.replace('-', ' ').toUpperCase() || 'UNKNOWN'}</span>
                        </div>
                        <div className="detail-item">
                          <FontAwesomeIcon icon="calendar" className="detail-icon" />
                          <span className="detail-label">{t('studentHub.applications.deadline')}</span>
                          <span className="detail-value">{formatDate(application.deadline)}</span>
                        </div>
                        <div className="detail-item">
                          <FontAwesomeIcon icon="star" className="detail-icon" />
                          <span className="detail-label">{t('studentHub.applications.priorityLevel')}</span>
                          <span className="detail-value">
                            <Tag color={application.priority >= 7 ? 'red' : application.priority >= 4 ? 'orange' : 'default'}>
                              {getPriorityText(application.priority)} ({application.priority}/10)
                            </Tag>
                          </span>
                        </div>
                      </div>

                      {application.notes && (
                        <div className="application-notes-compact">
                          <FontAwesomeIcon icon="sticky-note" className="notes-icon" />
                          <div className="notes-content-compact">{application.notes}</div>
                        </div>
                      )}

                      <div className="application-actions-compact">
                        <Button 
                          size="small"
                          danger
                          icon={<FontAwesomeIcon icon="trash" />}
                          onClick={() => handleDeleteApplication(application)}
                        >
                          {t('studentHub.applications.delete')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              );
            }}
          />
        </div>
      ),
    },
    {
      key: 'scholarships',
      label: (
        <div className="tab-label">
          <FontAwesomeIcon icon={APPLICATION_ICONS.SCHOLARSHIPS} />
          <span>{t('studentHub.applications.addScholarships')}</span>
        </div>
      ),
      children: (
        <div className="scholarships-content">
          <div className="scholarships-header">
            <h3>{t('studentHub.applications.scholarshipApplications')}</h3>
            <Button
              type="primary"
              icon={<FontAwesomeIcon icon={ACTION_ICONS.ADD} />}
              size="large"
              onClick={() => navigate('/student-hub/applications/scholarships/new')}
            >
              {t('studentHub.applications.addScholarship')}
            </Button>
          </div>
          <List
            dataSource={applicationsData.scholarships}
            renderItem={(scholarship: any) => {
              console.log('Rendering scholarship:', scholarship);
              return (
              <List.Item className="scholarship-item">
                <Card className="scholarship-card">
                  <div className="scholarship-card-content">
                    <div className="scholarship-header">
                      <div className="scholarship-name">
                        {scholarship?.scholarshipName || t('studentHub.applications.unknownScholarship')}
                        <span className="scholarship-amount-inline">${scholarship?.amount?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="scholarship-status">{scholarship?.status?.toUpperCase() || 'UNKNOWN'}</div>
                    </div>

                    <div className="scholarship-details">
                      <ul className="detail-list">
                        <li>
                          <FontAwesomeIcon icon="building" className="detail-icon" />
                          <strong>{t('studentHub.applications.organization')}:</strong>
                          <span>{scholarship?.organization || t('studentHub.applications.unknownOrganization')}</span>
                        </li>
                        <li>
                          <FontAwesomeIcon icon="calendar" className="detail-icon" />
                          <strong>{t('studentHub.applications.deadline')}:</strong>
                          <span>{formatDate(scholarship?.applicationDeadline)}</span>
                        </li>
                        <li>
                          <FontAwesomeIcon icon="file-alt" className="detail-icon" />
                          <strong>{t('studentHub.applications.requirements')}:</strong>
                          <span>
                            {scholarship?.requirements ? 
                              Object.entries(scholarship.requirements)
                                .filter(([_, req]: [string, any]) => req?.required)
                                .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                                .join(', ') || t('studentHub.applications.noneSpecified')
                              : t('studentHub.applications.noneSpecified')
                            }
                          </span>
                        </li>
                        <li>
                          <FontAwesomeIcon icon="info-circle" className="detail-icon" />
                          <strong>{t('studentHub.applications.status')}:</strong>
                          <span>{scholarship?.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}</span>
                        </li>
                      </ul>
                    </div>

                    
                    {scholarship?.notes && (
                      <div className="scholarship-notes">
                        <div className="notes-label">NOTES</div>
                        <div className="notes-content">{scholarship.notes}</div>
                      </div>
                    )}
                    
                    <div className="scholarship-actions">
                      <Button
                        size="small"
                        onClick={() => handleDeleteScholarship(scholarship.id)}
                        style={{ 
                          backgroundColor: '#8b0000', 
                          borderColor: '#8b0000', 
                          color: 'white' 
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#660000';
                          e.currentTarget.style.borderColor = '#660000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#8b0000';
                          e.currentTarget.style.borderColor = '#8b0000';
                        }}
                        >
                          {t('studentHub.applications.delete')}
                        </Button>
                    </div>
                  </div>
                </Card>
              </List.Item>
              );
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="applications-page">
      <div className="page-header">
        <h1 className="page-title">{t('studentHub.applications.title')}</h1>
        <p className="page-subtitle">{t('studentHub.applications.subtitle')}</p>
      </div>

      <Card className="applications-main-card">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          className="applications-tabs"
        />
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        title={t('studentHub.applications.deleteApplication')}
        open={deleteModalVisible}
        onOk={confirmDeleteApplication}
        onCancel={cancelDeleteApplication}
        confirmLoading={deleteLoading}
        okText={t('studentHub.applications.delete')}
        cancelText={t('common.cancel')}
        okButtonProps={{ 
          style: { 
            backgroundColor: '#8b0000', 
            borderColor: '#8b0000',
            color: 'white'
          }
        }}
      >
        <p>{applicationToDelete?.type === 'scholarship' ? t('studentHub.applications.deleteConfirmScholarship') : t('studentHub.applications.deleteConfirm')}</p>
        {applicationToDelete && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
            <strong>{applicationToDelete.universityName || applicationToDelete.scholarshipName}</strong>
            <br />
            <small>{t('studentHub.applications.category')}: {applicationToDelete.category?.toUpperCase()}</small>
            <br />
            <small>{t('studentHub.applications.status')}: {applicationToDelete.status?.replace('_', ' ').toUpperCase()}</small>
          </div>
        )}
        <p style={{ marginTop: 16, color: '#8b0000' }}>
          <FontAwesomeIcon icon="exclamation-triangle" style={{ marginRight: 8, color: '#8b0000' }} />
          {t('studentHub.applications.deleteWarning')}
        </p>
      </Modal>
    </div>
  );
};

export default ApplicationsPage;