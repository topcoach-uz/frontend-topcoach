import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Statistic, List, Badge, Space, Tag, message, Modal, Avatar, Spin, Select, Alert, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import i18n from '../../../lib/i18n';
import { useNavigate, useLocation } from 'react-router-dom';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { useStudentHub } from '../../../hooks/useStudentHub';
import {
  useGetCollegeApplicationsQuery,
  useGetScholarshipApplicationsQuery,
  useDeleteCollegeApplicationMutation,
  useDeleteScholarshipApplicationMutation,
  useUpdateCollegeApplicationMutation,
} from '../../../app/services/student-hub/applicationTrackingApi';
import {
  useGetStudentJourneyCollegeApplicationsQuery,
  useGetStudentJourneyScholarshipApplicationsQuery,
} from '../../../app/services/student-hub/studentJourneyReadonlyApi';
import { useGetUniversityDetailQuery } from 'src/app/services/universities';
import { getTranslation } from 'src/lib/i18n/translationUtils';
import { PageSkeleton } from '../../../components/loading';
import { useGetAllAssessmentsQuery, useGetRecommendationsQuery } from '../../../app/services/student-hub/psychometricApi';
import { useGetMeQuery } from '../../../app/services/users';
import NewApplicationPage from './NewApplicationPage';
import NewScholarshipPage from './NewScholarshipPage';
import RequirementsChecklist from './components/RequirementsChecklist';
import MentorAssignment from './components/MentorAssignment';
import GlobalActivityTimeline from './components/GlobalActivityTimeline';
import './ApplicationsPage.scss';

// Props interface for ApplicationsPage - supports both normal and read-only mode
export interface ApplicationsPageProps {
  readOnly?: boolean;
  studentId?: string;
}

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
// IMPORTANT: Hook must be called unconditionally (Rules of Hooks)
const UniversityNameDisplay: React.FC<{ universityId?: string; universityName?: string }> = ({ universityId, universityName }) => {
  const { t } = useTranslation();
  const { data: university, isLoading } = useGetUniversityDetailQuery(universityId || '', { skip: !universityId });

  if (universityId && isLoading) return <span>Loading...</span>;
  if (universityId && university) {
    const displayName = getTranslation(university.name);
    return <>{displayName || universityName || t('studentHub.applications.unknownUniversity')}</>;
  }

  // Fallback: if no universityName provided, show unknown
  const displayName = universityName?.trim();
  if (!displayName || displayName === 'undefined' || displayName === 'null') {
    return <span style={{ color: '#999', fontStyle: 'italic' }}>{t('studentHub.applications.unknownUniversity')}</span>;
  }
  
  return <>{displayName}</>;
};

const ApplicationsPage: React.FC<ApplicationsPageProps> = ({ readOnly = false, studentId }) => {
  const { t } = useTranslation();
  const isReadOnly = readOnly === true;
  const navigate = useNavigate();
  const location = useLocation();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // 'all', 'application', 'scholarship'
  const [sortBy, setSortBy] = useState<string>('deadline'); // 'deadline' = soonest, 'deadline-furthest' = furthest
  const [applicationsTab, setApplicationsTab] = useState<'applications' | 'timeline'>('applications');
  const { dashboard, isLoading, hasError } = useStudentHub();
  
  // Get psychometric data for match scores
  const { data: currentUserData } = useGetMeQuery(undefined, { skip: isReadOnly });
  const studentProfileId = (currentUserData?.profile as any)?.studentProfile?.id;
  const { data: psychometricAssessments } = useGetAllAssessmentsQuery(
    studentProfileId || '',
    { skip: !studentProfileId || isReadOnly }
  );
  const { data: recommendations } = useGetRecommendationsQuery(
    studentProfileId || '',
    { skip: !studentProfileId || isReadOnly || !psychometricAssessments?.length }
  );
  
  // Fetch applications, tasks, and scholarships data - MUST be called before any early returns
  // Normal mode - fetch current user's data
  const { data: applicationsResponse, isLoading: applicationsLoading, refetch: refetchApplications } = useGetCollegeApplicationsQuery(
    { page: 1, limit: 100 },
    { skip: isReadOnly }
  );
  const { data: scholarshipsResponse, isLoading: scholarshipsLoading, refetch: refetchScholarships } = useGetScholarshipApplicationsQuery(
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
  
  // Merge data based on mode
  const finalApplicationsData = isReadOnly ? readOnlyApplicationsResponse?.data : applicationsResponse?.data;
  const finalScholarshipsData = isReadOnly ? readOnlyScholarshipsResponse?.data : scholarshipsResponse?.data;
  
  const [deleteCollegeApplication, { isLoading: deleteLoading }] = useDeleteCollegeApplicationMutation();
  const [deleteScholarshipApplication, { isLoading: deleteScholarshipLoading }] = useDeleteScholarshipApplicationMutation();
  const [updateCollegeApplication] = useUpdateCollegeApplicationMutation();

  // Refetch data when returning from creation pages
  useEffect(() => {
    if (location.pathname === '/student-hub/applications') {
      refetchApplications();
      refetchScholarships();
    }
  }, [location.pathname, refetchApplications, refetchScholarships]);

  // Show loading state with unified skeleton
  if (isLoading) {
    return (
      <div className="applications-loading-content">
        <PageSkeleton 
          rows={5} 
          showTitle={true}
          showAvatar={false}
        />
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="applications-error">
        <div className="error-content">
          <h3>{t('studentHub.applications.errorLoading', 'Error Loading College Lists')}</h3>
          <p>There was an error loading your applications data. Please try again.</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  // Handle creation and edit routes
  if (location.pathname === '/student-hub/applications/new') {
    return <NewApplicationPage />;
  }
  if (location.pathname === '/student-hub/applications/scholarships/new') {
    return <NewScholarshipPage />;
  }
  if (location.pathname.match(/^\/student-hub\/applications\/[^/]+\/edit$/)) {
    // Lazy load EditApplicationPage to avoid circular dependencies
    const EditApplicationPage = React.lazy(() => import('./EditApplicationPage'));
    return (
      <React.Suspense fallback={<PageSkeleton rows={5} showTitle={true} showAvatar={false} />}>
        <EditApplicationPage />
      </React.Suspense>
    );
  }

  const applicationsData = {
    overview: {
      totalApplications: dashboard?.stats?.totalApplications || 0,
      submitted: dashboard?.stats?.submittedApplications || 0,
      inProgress: dashboard?.stats?.inProgressApplications || 0,
      accepted: dashboard?.stats?.acceptedApplications || 0,
    },
    applications: finalApplicationsData || [],
    scholarships: finalScholarshipsData || [],
  };

  // Button click handlers
  const handleNewApplication = () => {
    navigate('/student-hub/applications/new');
  };


  const handleDeleteApplication = (application: any) => {
    setApplicationToDelete(application);
    setDeleteModalVisible(true);
  };

  const confirmDeleteApplication = async () => {
    if (!applicationToDelete) {
      message.error('No item selected for deletion');
      return;
    }
    const itemId = applicationToDelete.id;
    if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
      message.error('Invalid item ID. Cannot delete.');
      return;
    }
    try {
      if (applicationToDelete.type === 'scholarship') {
        await deleteScholarshipApplication(itemId).unwrap();
        message.success(t('studentHub.applications.deleteScholarshipSuccess') || 'Scholarship deleted successfully');
        refetchScholarships();
      } else {
        await deleteCollegeApplication(itemId).unwrap();
        message.success(t('studentHub.applications.deleteSuccess') || 'Application deleted successfully');
        refetchApplications();
      }
      setDeleteModalVisible(false);
      setApplicationToDelete(null);
    } catch (error: any) {
      const errorMessage = error?.data?.message ||
        error?.message ||
        t('studentHub.applications.deleteError') ||
        'Failed to delete. Please try again.';
      message.error(errorMessage);
    }
  };

  const cancelDeleteApplication = () => {
    setDeleteModalVisible(false);
    setApplicationToDelete(null);
  };

  const handleDeleteScholarship = (scholarship: any) => {
    const scholarshipId = scholarship?.id || scholarship?._id || scholarship?.scholarshipId;
    if (!scholarshipId) {
      message.error('Cannot delete: Scholarship ID is missing');
      return;
    }
    setApplicationToDelete({ ...scholarship, id: scholarshipId, type: 'scholarship' });
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

  const getCategoryText = (category: string) => {
    if (!category) return 'UNKNOWN';
    const categoryKey = `studentHub.applications.category.${category}`;
    const translated = t(categoryKey);
    // If translation key doesn't exist, fallback to formatted category
    if (translated === categoryKey) {
      return category.toUpperCase();
    }
    return translated.toUpperCase();
  };

  const getApplicationTypeText = (type: string) => {
    if (!type) return 'UNKNOWN';
    const typeKey = `studentHub.applications.applicationType.${type}`;
    const translated = t(typeKey);
    // If translation key doesn't exist, fallback to formatted type
    if (translated === typeKey) {
      return type.replace('-', ' ').toUpperCase();
    }
    return translated.toUpperCase();
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

  // Application Health Score calculation (must be defined before combinedList uses it)
  const calculateHealthScore = (app: any): number => {
    let score = 0;
    let factors = 0;

    // Status factor (20 points)
    if (app.status === 'submitted') score += 20;
    else if (app.status === 'applying') score += 10;
    factors += 1;

    // Priority factor (10 points) - having a priority set
    if (app.priority != null) {
      score += 10;
      factors += 1;
    }

    // Category factor (10 points) - having a category set
    if (app.category) {
      score += 10;
      factors += 1;
    }

    // Deadline factor (10 points) - having a deadline set
    if (app.deadline || app.applicationDeadline) {
      score += 10;
      factors += 1;
    }

    // Major factor (10 points) - having a major set
    if (app.major) {
      score += 10;
      factors += 1;
    }

    // Application type factor (10 points)
    if (app.applicationType) {
      score += 10;
      factors += 1;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  };

  const combinedList: any[] = [
    ...(applicationsData.applications || []).map((app: any) => ({ 
      ...app, 
      id: app.id || app._id || app.applicationId, // Ensure ID is always present
      itemType: 'application',
      healthScore: calculateHealthScore(app),
      // Ensure universityName is available
      universityName: app.universityName || app.name || null,
      universityId: app.universityId || null,
    })),
    ...(applicationsData.scholarships || []).map((sch: any) => ({ 
      ...sch, 
      id: sch.id || sch._id || sch.scholarshipId, // Ensure ID is always present
      itemType: 'scholarship',
      healthScore: calculateHealthScore(sch),
    })),
  ]
    .filter((item: any) => (typeFilter === 'all' || item.itemType === typeFilter) && (statusFilter === 'all' || (item.status || item.applicationStatus) === statusFilter))
    .sort((a: any, b: any) => {
      const dA = new Date(a.deadline || a.applicationDeadline || 0);
      const dB = new Date(b.deadline || b.applicationDeadline || 0);
      if (sortBy === 'deadline') {
        return dA.getTime() - dB.getTime(); // Soonest first
      }
      if (sortBy === 'deadline-furthest') {
        return dB.getTime() - dA.getTime(); // Furthest first
      }
      return dA.getTime() - dB.getTime(); // Default: soonest
    });

  const upcomingDeadlines = [
    ...(applicationsData.applications || []).filter((a: any) => a?.deadline).map((a: any) => ({ ...a, type: 'application', deadlineDate: a.deadline })),
    ...(applicationsData.scholarships || []).filter((s: any) => s?.applicationDeadline).map((s: any) => ({ ...s, type: 'scholarship', deadlineDate: s.applicationDeadline })),
  ].sort((a: any, b: any) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime()).slice(0, 10);

  // Safely calculate next deadline with proper null checks
  const allItems = [
    ...(applicationsData?.applications || []),
    ...(applicationsData?.scholarships || [])
  ];
  
  const nextDeadline = allItems.length > 0
    ? allItems
        .filter((item: any) => {
          if (!item) return false;
          const d = item.deadline || item.applicationDeadline;
          if (!d) return false;
          try {
            const days = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return days > 0 && days <= 30;
          } catch {
            return false;
          }
        })
        .sort((a: any, b: any) => {
          const dA = a?.deadline || a?.applicationDeadline;
          const dB = b?.deadline || b?.applicationDeadline;
          if (!dA || !dB) return 0;
          try {
            return new Date(dA).getTime() - new Date(dB).getTime();
          } catch {
            return 0;
          }
        })[0]
    : undefined;

  // Calculate application strategy metrics
  const totalApps = applicationsData.overview.totalApplications;
  const reachApps = (applicationsData.applications || []).filter((a: any) => a?.category === 'reach' || (a?.priority >= 8)).length;
  const targetApps = (applicationsData.applications || []).filter((a: any) => a?.category === 'target' || (a?.priority >= 5 && a.priority < 8)).length;
  const safetyApps = (applicationsData.applications || []).filter((a: any) => a?.category === 'safety' || (a?.priority && a.priority < 5)).length;

  // Calculate average match score from psychometric recommendations
  const averageMatchScore = recommendations?.recommendations && recommendations.recommendations.length > 0
    ? Math.round(recommendations.recommendations.reduce((sum: number, rec: any) => sum + (rec.fitScore || 0), 0) / recommendations.recommendations.length)
    : null;

  // Calculate days until next deadline
  const nextDeadlineDate = nextDeadline && ((nextDeadline as { deadline?: string; applicationDeadline?: string }).deadline || (nextDeadline as { deadline?: string; applicationDeadline?: string }).applicationDeadline);
  const nextDeadlineDays = nextDeadlineDate
    ? Math.ceil((new Date(nextDeadlineDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate overall completion rate
  const totalSubmitted = applicationsData.overview.submitted;
  const totalInProgress = applicationsData.overview.inProgress;
  const completionRate = totalApps > 0 ? Math.round((totalSubmitted / totalApps) * 100) : 0;

  // Strategy recommendations based on mix
  const getStrategyRecommendation = () => {
    if (totalApps === 0) {
      return {
        type: 'info',
        message: 'Start building your application strategy',
        description: 'Aim for 8–12 applications: 2–3 reach, 4–6 target, 2–3 safety schools.',
      };
    }
    if (totalApps < 8) {
      return {
        type: 'warning',
        message: 'Consider adding more applications',
        description: `You have ${totalApps} application${totalApps !== 1 ? 's' : ''}. For best results, aim for 8–12 total: 2–3 reach, 4–6 target, 2–3 safety.`,
      };
    }
    if (reachApps > 5) {
      return {
        type: 'warning',
        message: 'Too many reach schools',
        description: `You have ${reachApps} reach applications. Consider adding more target (${targetApps}) and safety (${safetyApps}) schools to balance your strategy.`,
      };
    }
    if (safetyApps < 2) {
      return {
        type: 'warning',
        message: 'Not enough safety schools',
        description: `You have ${safetyApps} safety application${safetyApps !== 1 ? 's' : ''}. Add at least 2–3 safety schools to ensure admission options.`,
      };
    }
    if (targetApps < 4) {
      return {
        type: 'info',
        message: 'Consider more target schools',
        description: `You have ${targetApps} target application${targetApps !== 1 ? 's' : ''}. Target schools (4–6) are your best chances for admission.`,
      };
    }
    return {
      type: 'success',
      message: 'Well-balanced application strategy',
      description: `Great mix: ${reachApps} reach, ${targetApps} target, ${safetyApps} safety. This gives you strong options across all admission probability levels.`,
    };
  };

  const strategyRec = getStrategyRecommendation();

  return (
    <div className="applications-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>
            {t('studentHub.applications.title')}
          </h1>
          <p style={{ fontSize: 14, color: '#666', marginTop: 4, marginBottom: 0 }}>
            {t('studentHub.applications.subtitle')}
          </p>
        </div>
      </div>

      {/* Simplified Stats - Only show key metrics, compact design */}
      {totalApps > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: 16, 
          marginBottom: 24, 
          padding: '16px 20px', 
          background: '#f9fafb', 
          borderRadius: 12,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UnifiedIcon name="layers" size="sm" color="primary" />
            <span style={{ fontSize: 14, color: '#666' }}>Total:</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>{totalApps}</span>
          </div>
          <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UnifiedIcon name="check-circle" size="sm" color="success" />
            <span style={{ fontSize: 14, color: '#666' }}>Submitted:</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#22c55e' }}>{applicationsData.overview.submitted}</span>
          </div>
          {averageMatchScore && (
            <>
              <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UnifiedIcon name="target" size="sm" color="primary" />
                <span style={{ fontSize: 14, color: '#666' }}>Avg Match:</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: averageMatchScore >= 70 ? '#22c55e' : averageMatchScore >= 50 ? '#f59e0b' : '#666' }}>
                  {averageMatchScore}%
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Removed Next Action Banner - redundant with Upcoming Deadlines sidebar */}

      {/* Strategy section removed per user request - not needed */}

      {/* Enhanced Filters and Actions Bar - Modern Design */}
      <Card 
        className="applications-filters-card"
        style={{ 
          marginBottom: 24,
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={24} md={14} lg={15}>
            {applicationsTab === 'applications' && (
              <Space size="middle" wrap style={{ width: '100%' }}>
                <Select 
                  value={typeFilter} 
                  onChange={setTypeFilter} 
                  style={{ minWidth: 130 }}
                  size="middle"
                  suffixIcon={<UnifiedIcon name="filter" size="sm" color="secondary" />}
                >
                  <Select.Option value="all">{t('studentHub.applications.allLists', 'All')}</Select.Option>
                  <Select.Option value="application">Universities</Select.Option>
                  <Select.Option value="scholarship">Scholarships</Select.Option>
                </Select>
                <Select 
                  value={statusFilter} 
                  onChange={setStatusFilter} 
                  style={{ minWidth: 130 }}
                  size="middle"
                  suffixIcon={<UnifiedIcon name="filter" size="sm" color="secondary" />}
                >
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="in_progress">In Progress</Select.Option>
                  <Select.Option value="submitted">Submitted</Select.Option>
                  <Select.Option value="accepted">Accepted</Select.Option>
                  <Select.Option value="rejected">Rejected</Select.Option>
                </Select>
                <Select 
                  value={sortBy} 
                  onChange={setSortBy} 
                  style={{ minWidth: 180 }}
                  size="middle"
                  suffixIcon={<UnifiedIcon name="arrow-up-down" size="sm" color="secondary" />}
                >
                  <Select.Option value="deadline">Deadline (Soonest)</Select.Option>
                  <Select.Option value="deadline-furthest">Deadline (Furthest)</Select.Option>
                </Select>
              </Space>
            )}
          </Col>
          {!isReadOnly && (
          <Col xs={24} sm={24} md={10} lg={9} className="applications-actions-col">
            <Space size="small" wrap className="applications-actions-btns">
              {/* Add Scholarship – hidden for now
              <Button 
                size="middle"
                icon={<UnifiedIcon name="award" size="sm" color="primary" />} 
                onClick={() => navigate('/student-hub/applications/scholarships/new')}
                style={{
                  height: 40,
                  borderRadius: 10,
                  fontWeight: 600,
                  borderColor: '#8b0000',
                  color: '#8b0000',
                }}
              >
                Add Scholarship
              </Button>
              */}
              <Button 
                type="primary" 
                size="middle"
                icon={<UnifiedIcon name="plus" size="sm" color="white" />} 
                onClick={handleNewApplication}
                style={{
                  height: 40,
                  borderRadius: 10,
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(139, 0, 0, 0.2)',
                }}
              >
                {t('studentHub.applications.addApplication', 'Add to List')}
              </Button>
            </Space>
          </Col>
          )}
        </Row>
      </Card>

      <Tabs
        activeKey={applicationsTab}
        onChange={(k) => setApplicationsTab((k || 'applications') as 'applications' | 'timeline')}
        size="middle"
        style={{ marginBottom: 16 }}
        items={[
          { key: 'applications', label: t('studentHub.applications.yourCollegeLists', 'Your college lists') },
          { key: 'timeline', label: 'Timeline' },
        ]}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {applicationsTab === 'timeline' ? (
            <Card
              id="applications-timeline"
              title="Activity timeline"
              className="applications-card applications-card--compact"
              style={{ minHeight: 200 }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <GlobalActivityTimeline
                applications={applicationsData.applications || []}
                scholarships={applicationsData.scholarships || []}
                emptyMessage={t('studentHub.applications.timelineEmpty', 'No activity yet. Add colleges to your list and complete checklist items to see your timeline.')}
                onApplicationClick={(id) => navigate(`/student-hub/applications/${id}/edit`)}
              />
            </Card>
          ) : (
          <Card 
            id="applications-list" 
            title={typeFilter === 'all' ? t('studentHub.applications.yourCollegeLists', 'Your college lists') : typeFilter === 'application' ? 'Universities' : 'Scholarships'} 
            className="applications-card applications-card--compact"
            style={{ minHeight: combinedList.length === 0 ? 200 : undefined }}
            styles={{ body: { padding: combinedList.length === 0 ? '24px 20px' : '16px 20px', display: 'flex', flexDirection: 'column' } }}
          >
            <List
              dataSource={combinedList}
              locale={{ 
                emptyText: (
                  <div className="applications-empty-state">
                    <UnifiedIcon name="file-text" size="md" color="secondary" style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p>No applications yet. Add one to get started.</p>
                  </div>
                )
              }}
              renderItem={(item: any) => {
                const isSch = item.itemType === 'scholarship';
                const matchScore = recommendations?.recommendations && item.major
                  ? (() => {
                      const m = recommendations.recommendations.find((r: any) => r.majorName?.toLowerCase().includes((item.major || '').toLowerCase()));
                      return m ? Math.round(m.fitScore) : null;
                    })()
                  : null;
                return (
                  <List.Item className="application-detail-item" style={{ padding: 0, marginBottom: 12 }}>
                    <Card
                      className="application-card application-card--compact"
                      style={{
                        borderRadius: 14,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s ease',
                        background: '#fff',
                        overflow: 'hidden',
                        margin: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 0, 0, 0.08)';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <div className="application-card-inner">
                        {/* Compact header: title, subtitle, tags */}
                        <div className="application-card-header">
                          <div className="application-card-title-row">
                            <span className="application-card-title">
                              {isSch ? (item.scholarshipName || t('studentHub.applications.unknownScholarship')) : <UniversityNameDisplay universityId={item.universityId} universityName={item.universityName} />}
                            </span>
                            <Space size={6} wrap className="application-card-tags">
                              {matchScore && !isSch && matchScore >= 60 && (
                                <Tag color={matchScore >= 80 ? 'success' : 'warning'} className="application-tag">
                                  {matchScore}% Match
                                </Tag>
                              )}
                              {!isSch && item.category && (
                                <Tag color={getCategoryColor(item.category)} className="application-tag">
                                  {getCategoryText(item.category)}
                                </Tag>
                              )}
                              {(() => {
                                const deadline = item.deadline || item.applicationDeadline;
                                if (deadline) {
                                  const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                  if (daysUntil <= 7 && daysUntil > 0) {
                                    return <Tag color="error" className="application-tag">{daysUntil}d left</Tag>;
                                  }
                                }
                                return null;
                              })()}
                              <Tag
                                color={item.status === 'accepted' ? 'success' : item.status === 'rejected' ? 'error' : item.status === 'applying' ? 'processing' : 'default'}
                                className="application-tag"
                              >
                                {getStatusText(item.status)}
                              </Tag>
                            </Space>
                          </div>
                          <div className="application-card-subtitle">
                            {!isSch && item.major && (
                              <span className="application-card-subtitle-major">
                                <UnifiedIcon name="graduation-cap" size="xs" color="#64748b" style={{ marginRight: 6 }} />
                                {item.major}
                              </span>
                            )}
                            {isSch && item.amount != null && (
                              <span className="application-card-amount">
                                <UnifiedIcon name="award" size="xs" color="#16a34a" style={{ marginRight: 6 }} />
                                ${Number(item.amount).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline meta: deadline, type, priority | Assign Mentor (right) */}
                        <div className="application-card-meta">
                          <div className="application-card-meta-left">
                            <span className="application-meta-item application-meta-item--deadline">
                              <UnifiedIcon name="calendar" size="sm" color="#0ea5e9" />
                              {formatDate(item.deadline || item.applicationDeadline)}
                            </span>
                            {!isSch && item.applicationType && (
                              <span className="application-meta-item application-meta-item--type">
                                <UnifiedIcon name="file-text" size="sm" color="#6366f1" />
                                {getApplicationTypeText(item.applicationType)}
                              </span>
                            )}
                            {!isSch && item.priority != null && (
                              <span className="application-meta-item application-meta-item--priority">
                                <UnifiedIcon name="star" size="sm" color="#f59e0b" />
                                {getPriorityText(item.priority)}
                              </span>
                            )}
                          </div>
                          {!isReadOnly && !isSch && item.id && (
                            <div
                              className="application-card-meta-mentor"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <MentorAssignment
                                applicationId={item.id}
                                mentorId={item.mentorId}
                                onUpdate={() => refetchApplications()}
                              />
                            </div>
                          )}
                        </div>

                        {/* Requirements only */}
                        {!isSch && item.id && (
                          <div className="application-card-requirements">
                            <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                              <RequirementsChecklist
                                applicationId={item.id}
                                requirements={item.requirements}
                                onUpdate={
                                  !isReadOnly
                                    ? (r, meta) =>
                                        updateCollegeApplication({
                                          id: item.id,
                                          data: {
                                            requirements: r,
                                            ...(meta && {
                                              activityEvent: {
                                                type: 'checklist_item_completed',
                                                payload: meta,
                                              },
                                            }),
                                          },
                                        })
                                    : undefined
                                }
                              />
                            </div>
                          </div>
                        )}

                        {!isReadOnly && (
                        <div className="application-card-actions">
                          {!isSch && item.id && (
                            <Button
                              size="small"
                              style={{ height: 32, borderRadius: 8, fontWeight: 600, borderColor: '#8b0000', color: '#8b0000', fontSize: 13 }}
                              icon={<UnifiedIcon name="edit" size="xs" color="primary" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const applicationId = item.id || item._id || item.applicationId;
                                if (applicationId && typeof applicationId === 'string' && applicationId.trim() !== '') {
                                  navigate(`/student-hub/applications/${applicationId}/edit`);
                                } else {
                                  message.error('Application ID is missing or invalid.');
                                }
                              }}
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            size="small"
                            className="btn-delete-crimson"
                            icon={<UnifiedIcon name="trash-2" size="xs" color="white" />}
                            style={{ height: 32, borderRadius: 8, fontWeight: 600, fontSize: 13 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              isSch ? handleDeleteScholarship(item) : handleDeleteApplication(item);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                        )}
                      </div>
                    </Card>
                  </List.Item>
                );
              }}
            />
          </Card>
          )}
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={t('studentHub.applications.upcomingDeadlines')} 
            className="deadlines-card deadlines-card--compact"
            style={{ minHeight: combinedList.length === 0 ? 200 : undefined }}
            styles={{ body: { padding: upcomingDeadlines.length === 0 ? '24px 20px' : '16px 20px' } }}
          >
            {upcomingDeadlines.length > 0 ? (
              <List
                dataSource={upcomingDeadlines}
                renderItem={(item: any) => (
                  <List.Item className="deadline-item deadline-item--compact">
                    <div className="deadline-content">
                      <div className="deadline-title">{item.type === 'scholarship' ? (item.scholarshipName || t('studentHub.applications.unknownScholarship')) : <UniversityNameDisplay universityId={item.universityId} universityName={item.universityName} />}</div>
                      {item.type === 'application' && item.major && <div className="deadline-major">{item.major}</div>}
                      <div className="deadline-date">
                        <UnifiedIcon name="calendar" size="xs" color="#0ea5e9" style={{ marginRight: 6, flexShrink: 0 }} />
                        {formatDate(item.deadlineDate)}
                      </div>
                    </div>
                    <Tag color={item.type === 'scholarship' ? 'blue' : getCategoryColor(item.category)}>{item.type === 'scholarship' ? 'Scholarship' : 'University'}</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <div className="deadlines-empty-state">
                <UnifiedIcon name="calendar" size="md" color="secondary" style={{ marginBottom: 12, opacity: 0.4 }} />
                <p>{t('studentHub.dashboard.noUpcomingDeadlines') || 'No upcoming deadlines'}</p>
                {!isReadOnly && (
                <Button type="link" onClick={handleNewApplication} style={{ padding: 0 }}>
                  {t('studentHub.applications.addApplication', 'Add to List')}
                </Button>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={t('studentHub.applications.deleteApplication')}
        open={deleteModalVisible}
        onOk={confirmDeleteApplication}
        onCancel={cancelDeleteApplication}
        confirmLoading={deleteLoading || deleteScholarshipLoading}
        okText={t('studentHub.applications.delete')}
        cancelText={t('common.cancel')}
        okButtonProps={{ style: { backgroundColor: '#8b0000', borderColor: '#8b0000', color: 'white' } }}
      >
        <p>{applicationToDelete?.type === 'scholarship' ? t('studentHub.applications.deleteConfirmScholarship') : t('studentHub.applications.deleteConfirm')}</p>
        {applicationToDelete && (
          <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              {applicationToDelete.type === 'scholarship' 
                ? (applicationToDelete.scholarshipName || applicationToDelete.name || t('studentHub.applications.unknownScholarship'))
                : <UniversityNameDisplay 
                    universityId={applicationToDelete.universityId} 
                    universityName={applicationToDelete.universityName || applicationToDelete.name} 
                  />
              }
            </div>
            {applicationToDelete.id && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#666' }}>ID: </span>
                <span style={{ fontSize: 12, color: '#999', fontFamily: 'monospace' }}>{applicationToDelete.id}</span>
              </div>
            )}
            {applicationToDelete.category && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#666' }}>Category: </span>
                <Tag color={getCategoryColor(applicationToDelete.category)} style={{ margin: 0 }}>
                  {getCategoryText(applicationToDelete.category)}
                </Tag>
              </div>
            )}
            {applicationToDelete.status && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#666' }}>Status: </span>
                <Tag color={getStatusColor(applicationToDelete.status)} style={{ margin: 0 }}>
                  {getStatusText(applicationToDelete.status)}
                </Tag>
              </div>
            )}
          </div>
        )}
        <p style={{ marginTop: 16, color: '#8b0000' }}>
          <UnifiedIcon name="alert-circle" size="sm" color="#8b0000" style={{ marginRight: 8 }} />
          {t('studentHub.applications.deleteWarning')}
        </p>
      </Modal>
    </div>
  );
};

export default ApplicationsPage;