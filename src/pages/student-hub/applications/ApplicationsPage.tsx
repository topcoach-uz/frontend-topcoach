import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Statistic, List, Badge, Space, Tag, message, Modal, Avatar, Spin, Select, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import i18n from '../../../lib/i18n';
import { useNavigate, useLocation } from 'react-router-dom';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { useStudentHub } from '../../../hooks/useStudentHub';
import {
  useGetCollegeApplicationsQuery,
  useGetScholarshipApplicationsQuery,
  useDeleteCollegeApplicationMutation,
  useDeleteScholarshipApplicationMutation
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
  const [sortBy, setSortBy] = useState<string>('deadline'); // 'deadline', 'priority', 'recent'
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
          <h3>Error Loading Applications</h3>
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

    // Notes factor (10 points) - having notes shows engagement
    if (app.notes) {
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
      if (sortBy === 'deadline') {
        const dA = new Date(a.deadline || a.applicationDeadline || 0);
        const dB = new Date(b.deadline || b.applicationDeadline || 0);
        return dA.getTime() - dB.getTime();
      }
      if (sortBy === 'priority') return (b.priority || 0) - (a.priority || 0);
      if (sortBy === 'health') return a.healthScore - b.healthScore; // Lowest first (fix weak ones)
      if (sortBy === 'match') {
        // Sort by match score (would need to calculate from recommendations)
        return 0; // Placeholder - would calculate match score per application
      }
      const dA = new Date(a.updatedAt || a.createdAt || 0);
      const dB = new Date(b.updatedAt || b.createdAt || 0);
      return dB.getTime() - dA.getTime();
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
  const nextDeadlineDays = nextDeadline
    ? Math.ceil((new Date(nextDeadline.deadline || nextDeadline.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
        style={{ 
          marginBottom: 24,
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={24} md={18}>
            <Space size="middle" wrap style={{ width: '100%' }}>
              <Select 
                value={typeFilter} 
                onChange={setTypeFilter} 
                style={{ minWidth: 140 }}
                size="middle"
                suffixIcon={<UnifiedIcon name="filter" size="sm" color="secondary" />}
              >
                <Select.Option value="all">All Applications</Select.Option>
                <Select.Option value="application">Universities</Select.Option>
                <Select.Option value="scholarship">Scholarships</Select.Option>
              </Select>
              <Select 
                value={statusFilter} 
                onChange={setStatusFilter} 
                style={{ minWidth: 150 }}
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
                <Select.Option value="priority">Priority (Highest)</Select.Option>
                <Select.Option value="match">Match Score</Select.Option>
                <Select.Option value="health">Health Score</Select.Option>
                <Select.Option value="recent">Recently Updated</Select.Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={6} style={{ textAlign: 'right' }}>
            <Space size="small">
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
                Add Application
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            id="applications-list" 
            title={typeFilter === 'all' ? 'Your applications' : typeFilter === 'application' ? 'Universities' : 'Scholarships'} 
            className="applications-card"
            style={{ height: combinedList.length === 0 ? 320 : 'auto', minHeight: combinedList.length === 0 ? 320 : 'auto' }}
            styles={{ body: { height: combinedList.length === 0 ? 270 : 'auto', minHeight: combinedList.length === 0 ? 270 : 'auto', display: 'flex', flexDirection: 'column' } }}
          >
            <List
              dataSource={combinedList}
              locale={{ 
                emptyText: (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '40px 20px',
                    minHeight: 200,
                    textAlign: 'center'
                  }}>
                    <UnifiedIcon name="file-text" size="lg" color="secondary" style={{ marginBottom: 16, opacity: 0.5 }} />
                    <p style={{ fontSize: 16, color: '#666', margin: 0 }}>No applications yet. Add one to get started.</p>
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
                  <List.Item className="application-detail-item" style={{ padding: 0, marginBottom: 24 }}>
                    <Card
                      className="application-card"
                      style={{
                        borderRadius: 20,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: '#ffffff',
                        overflow: 'hidden',
                        position: 'relative',
                        margin: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 0, 0, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = '#8b0000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      {/* Modern Card Design - Completely Redesigned */}
                      <div style={{ padding: 0 }}>
                        {/* Header Section with Gradient */}
                        <div style={{
                          padding: '28px 32px',
                          background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
                          borderBottom: '1px solid #f1f5f9'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: 22, 
                                fontWeight: 700, 
                                color: '#0f172a', 
                                marginBottom: 10,
                                lineHeight: 1.3,
                                letterSpacing: '-0.02em'
                              }}>
                                {isSch ? (item.scholarshipName || t('studentHub.applications.unknownScholarship')) : <UniversityNameDisplay universityId={item.universityId} universityName={item.universityName} />}
                              </div>
                              {!isSch && item.major && (
                                <div style={{ 
                                  fontSize: 15, 
                                  color: '#64748b', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 8,
                                  fontWeight: 500,
                                  marginTop: 6
                                }}>
                                  <UnifiedIcon name="graduation-cap" size="sm" color="primary" />
                                  <span>{item.major}</span>
                                </div>
                              )}
                              {isSch && item.amount != null && (
                                <div style={{ 
                                  fontSize: 18, 
                                  color: '#16a34a', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 8,
                                  fontWeight: 700,
                                  marginTop: 8
                                }}>
                                  <UnifiedIcon name="award" size="md" color="success" />
                                  <span>${Number(item.amount).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                            <Space size={8} style={{ flexShrink: 0 }} wrap>
                              {matchScore && !isSch && matchScore >= 60 && (
                                <Tag 
                                  color={matchScore >= 80 ? 'success' : 'warning'} 
                                  style={{ 
                                    margin: 0,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                    border: 'none'
                                  }}
                                >
                                  {matchScore}% Match
                                </Tag>
                              )}
                              {!isSch && item.category && (
                                <Tag 
                                  color={getCategoryColor(item.category)} 
                                  style={{ 
                                    margin: 0,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                    border: 'none'
                                  }}
                                >
                                  {getCategoryText(item.category)}
                                </Tag>
                              )}
                              {(() => {
                                const deadline = item.deadline || item.applicationDeadline;
                                if (deadline) {
                                  const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                  if (daysUntil <= 7 && daysUntil > 0) {
                                    return (
                                      <Tag 
                                        color="error" 
                                        style={{ 
                                          margin: 0,
                                          fontSize: 12,
                                          fontWeight: 700,
                                          padding: '6px 14px',
                                          borderRadius: 20,
                                          border: 'none'
                                        }}
                                      >
                                        {daysUntil}d left
                                      </Tag>
                                    );
                                  }
                                }
                                return null;
                              })()}
                              <Tag 
                                color={item.status === 'accepted' ? 'success' : item.status === 'rejected' ? 'error' : item.status === 'applying' ? 'processing' : 'default'}
                                style={{ 
                                  margin: 0,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  padding: '6px 14px',
                                  borderRadius: 20,
                                  border: 'none'
                                }}
                              >
                                {getStatusText(item.status)}
                              </Tag>
                            </Space>
                          </div>
                        </div>

                        {/* Details Section */}
                        <div style={{ padding: '20px 32px', background: '#ffffff' }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 16,
                            marginBottom: 20
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 12,
                              padding: '12px 16px',
                              background: '#f8fafc',
                              borderRadius: 12,
                              border: '1px solid #e2e8f0'
                            }}>
                              <div style={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: 10, 
                                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <UnifiedIcon name="calendar" size="md" color="primary" />
                              </div>
                              <div>
                                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                                  Deadline
                                </div>
                                <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600 }}>
                                  {formatDate(item.deadline || item.applicationDeadline)}
                                </div>
                              </div>
                            </div>
                            {!isSch && item.applicationType && (
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 12,
                                padding: '12px 16px',
                                background: '#f8fafc',
                                borderRadius: 12,
                                border: '1px solid #e2e8f0'
                              }}>
                                <div style={{ 
                                  width: 40, 
                                  height: 40, 
                                  borderRadius: 10, 
                                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <UnifiedIcon name="file-text" size="md" color="primary" />
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                                    Type
                                  </div>
                                  <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600 }}>
                                    {getApplicationTypeText(item.applicationType)}
                                  </div>
                                </div>
                              </div>
                            )}
                            {!isSch && item.priority != null && (
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 12,
                                padding: '12px 16px',
                                background: '#f8fafc',
                                borderRadius: 12,
                                border: '1px solid #e2e8f0'
                              }}>
                                <div style={{ 
                                  width: 40, 
                                  height: 40, 
                                  borderRadius: 10, 
                                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <UnifiedIcon name="star" size="md" color="primary" />
                                </div>
                                <div>
                                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                                    Priority
                                  </div>
                                  <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600 }}>
                                    {getPriorityText(item.priority)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Requirements and Mentor Section - Fixed to prevent navigation */}
                          {!isSch && item.id && (
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '1fr 1fr',
                              gap: 16,
                              marginBottom: 20,
                              padding: '20px',
                              background: '#f8fafc',
                              borderRadius: 16,
                              border: '1px solid #e2e8f0'
                            }}>
                              <div 
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              >
                                <RequirementsChecklist
                                  applicationId={item.id}
                                  requirements={item.requirements}
                                  onUpdate={(updatedRequirements) => {
                                    refetchApplications();
                                  }}
                                />
                              </div>
                              <div 
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              style={{ display: 'flex', alignItems: 'flex-start' }}
                              >
                                <MentorAssignment
                                  applicationId={item.id}
                                  mentorId={item.mentorId}
                                  onUpdate={(mentorId) => {
                                    refetchApplications();
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {item.notes && (
                            <div style={{ 
                              marginBottom: 20,
                              padding: '16px 20px',
                              background: '#fffbeb',
                              borderRadius: 12,
                              borderLeft: '4px solid #f59e0b'
                            }}>
                              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <UnifiedIcon name="file-text" size="md" color="warning" style={{ marginTop: 2, flexShrink: 0 }} />
                                <div style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6 }}>
                                  {item.notes}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Actions Section */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            gap: 12, 
                            paddingTop: 20,
                            borderTop: '1px solid #f1f5f9'
                          }}>
                            {!isSch && item.id && (
                              <Button 
                                size="large"
                                style={{
                                  height: 44,
                                  borderRadius: 12,
                                  fontWeight: 600,
                                  borderColor: '#8b0000',
                                  color: '#8b0000',
                                  padding: '0 24px',
                                }}
                                icon={<UnifiedIcon name="edit" size="sm" color="primary" />} 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  e.preventDefault();
                                  // Debug: Log the item to see what we have
                                  console.log('Edit button clicked, item:', item);
                                  console.log('Item ID:', item.id);
                                  
                                  const applicationId = item.id || item._id || item.applicationId;
                                  if (applicationId && typeof applicationId === 'string' && applicationId.trim() !== '') {
                                    console.log('Navigating to edit page with ID:', applicationId);
                                    navigate(`/student-hub/applications/${applicationId}/edit`); 
                                  } else {
                                    console.error('Invalid application ID:', applicationId);
                                    message.error(`Application ID is missing or invalid. Cannot edit. ID: ${applicationId}`);
                                  }
                                }}
                              >
                                Edit
                              </Button>
                            )}
                            <Button 
                              size="large"
                              danger
                              style={{
                                height: 44,
                                borderRadius: 12,
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                                padding: '0 24px',
                              }}
                              icon={<UnifiedIcon name="trash-2" size="sm" color="white" />} 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                e.preventDefault();
                                isSch ? handleDeleteScholarship(item) : handleDeleteApplication(item); 
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={t('studentHub.applications.upcomingDeadlines')} 
            className="deadlines-card"
            style={{ height: combinedList.length === 0 ? 320 : 'auto', minHeight: combinedList.length === 0 ? 320 : 'auto' }}
            styles={{ body: { height: combinedList.length === 0 ? 270 : 'auto', minHeight: combinedList.length === 0 ? 270 : 'auto' } }}
          >
            {upcomingDeadlines.length > 0 ? (
              <List
                dataSource={upcomingDeadlines}
                renderItem={(item: any) => (
                  <List.Item className="deadline-item">
                    <div className="deadline-content">
                      <div className="deadline-title">{item.type === 'scholarship' ? (item.scholarshipName || t('studentHub.applications.unknownScholarship')) : <UniversityNameDisplay universityId={item.universityId} universityName={item.universityName} />}</div>
                      {item.type === 'application' && item.major && <div className="deadline-major" style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{item.major}</div>}
                      <div className="deadline-date" style={{ marginTop: 8 }}>Deadline: {formatDate(item.deadlineDate)}</div>
                    </div>
                    <Tag color={item.type === 'scholarship' ? 'blue' : getCategoryColor(item.category)}>{item.type === 'scholarship' ? 'Scholarship' : 'University'}</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '40px 20px',
                minHeight: 200,
                textAlign: 'center'
              }}>
                <UnifiedIcon name="calendar" size="lg" color="secondary" style={{ marginBottom: 16, opacity: 0.5 }} />
                <p style={{ fontSize: 16, color: '#666', margin: '0 0 12px 0' }}>
                  {t('studentHub.dashboard.noUpcomingDeadlines') || 'No upcoming deadlines'}
                </p>
                <Button type="link" onClick={handleNewApplication} style={{ padding: 0 }}>
                  Add application
                </Button>
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