import React, { useState, useEffect } from 'react';
import { Card, Tabs, Progress, Button, Statistic, Badge, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { STATUS_ICONS, ACTION_ICONS, PROFILE_ICONS } from '../../../constants/icons';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import { formatDateTime } from '../../../utils/dateFormatter';
import { InlineLoader, PageSkeleton } from '../../../components/loading';
import { useGetLatestAssessmentQuery } from '../../../app/services/student-hub/psychometricApi';
import AcademicProfile from './AcademicProfile';
import PersonalProfile from './PersonalProfile';
import ActivitiesProfile from './ActivitiesProfile';
import GpaCalculatorPage from '../gpa-calculator/GpaCalculatorPage';
// import SettingsPage from '../settings/SettingsPage'; // Settings tab hidden
import './ProfilePage.scss';

const { TabPane } = Tabs;

// Props interface for ProfilePage - supports both normal and read-only mode
export interface ProfilePageProps {
  readOnly?: boolean;
  studentId?: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ readOnly = false, studentId }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const isReadOnly = readOnly === true;
  
  // Pass studentId to hook when in read-only mode to fetch correct student data
  const hookOptions = isReadOnly && studentId ? { studentId } : undefined;
  const { profile, isLoading, error, isProfileComplete, profileStatus } = useStudentProfile(hookOptions);

  // Major Match (psychometric assessment) status card — own account only,
  // never in the counselor's read-only embed (see the `!isReadOnly` guard
  // around the card below). `getLatestAssessment` 404s / comes back empty
  // when the student hasn't taken it yet, which we read as "not taken".
  const {
    data: latestMajorMatchAssessment,
    isLoading: majorMatchLoading,
    isError: majorMatchError,
  } = useGetLatestAssessmentQuery(profile?.id || '', {
    skip: isReadOnly || !profile?.id,
  });
  const hasTakenMajorMatch =
    !isReadOnly && !majorMatchLoading && !majorMatchError && !!latestMajorMatchAssessment;

  // Handle URL parameters for tab navigation (gpa-calculator not available in read-only)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const allowedTabs = isReadOnly ? ['personal', 'academic', 'activities'] : ['personal', 'academic', 'activities', 'gpa-calculator'];
    if (tabFromUrl && allowedTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab('personal');
    }
  }, [searchParams, isReadOnly]);

  // Handle tab changes
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // Show loading state with unified skeleton
  if (isLoading) {
    return (
      <div className="profile-loading-content">
        <PageSkeleton 
          rows={6} 
          showTitle={true}
          showAvatar={false}
        />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert
        message={t('studentHub.profile.error')}
        description={t('studentHub.profile.errorDescription')}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => window.location.reload()}>
            {t('studentHub.profile.retry')}
          </Button>
        }
      />
    );
  }

  // Use real data from API
  const profileData = {
    status: profile?.profileStatus || 'incomplete',
    lastUpdated: formatDateTime(profile?.updatedAt || ''),
    sections: {
      personal: {
        completed: !!profile?.personalProfile,
        percentage: profile?.personalProfile ? 100 : 0,
        lastUpdated: formatDateTime(profile?.personalProfile?.updatedAt || ''),
      },
      academic: {
        completed: !!profile?.academicProfile,
        percentage: profile?.academicProfile ? 100 : 0,
        lastUpdated: formatDateTime(profile?.academicProfile?.updatedAt || ''),
      },
      activities: {
        completed: !!profile?.activitiesProfile,
        percentage: profile?.activitiesProfile ? 100 : 0,
        lastUpdated: formatDateTime(profile?.activitiesProfile?.updatedAt || ''),
      },
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'in_progress':
        return 'processing';
      case 'incomplete':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return t('studentHub.profile.status.complete');
      case 'in_progress':
        return t('studentHub.profile.status.inProgress');
      case 'incomplete':
        return t('studentHub.profile.status.incomplete');
      default:
        return t('studentHub.profile.status.unknown');
    }
  };

  const tabItems = [
    {
      key: 'personal',
      label: (
        <div className="tab-label">
          <UnifiedIcon name="user" size="sm" color="primary" />
          <span>{t('studentHub.profile.personalProfile')}</span>
        </div>
      ),
      children: <PersonalProfile data={profileData.sections.personal} readOnly={isReadOnly} studentId={studentId} />,
    },
    {
      key: 'academic',
      label: (
        <div className="tab-label">
          <UnifiedIcon name={PROFILE_ICONS.ACADEMIC} size="sm" color="primary" />
          <span>{t('studentHub.profile.academicProfile')}</span>
        </div>
      ),
      children: <AcademicProfile data={profileData.sections.academic} readOnly={isReadOnly} studentId={studentId} />,
    },
    {
      key: 'activities',
      label: (
        <div className="tab-label">
          <UnifiedIcon name="award" size="sm" color="primary" />
          <span>{t('studentHub.profile.activitiesAchievements')}</span>
        </div>
      ),
      children: <ActivitiesProfile data={profileData.sections.activities} readOnly={isReadOnly} studentId={studentId} />,
    },
    // GPA Calculator tab hidden in read-only (counselor) view
    ...(!isReadOnly
      ? [
          {
            key: 'gpa-calculator',
            label: (
              <div className="tab-label">
                <UnifiedIcon name="calculator" size="sm" color="primary" />
                <span>{t('studentHub.profile.gpaCalculator', 'GPA Calculator')}</span>
              </div>
            ),
            children: <GpaCalculatorPage />,
          },
        ]
      : []),
    // Settings tab hidden for now
    // {
    //   key: 'settings',
    //   label: (
    //     <div className="tab-label">
    //       <UnifiedIcon name="settings" size="sm" color="primary" />
    //       <span>Settings</span>
    //     </div>
    //   ),
    //   children: <SettingsPage />,
    // },
  ];

  return (
    <div className="student-profile-page student-hub-page">
      {/* Profile Header - same content start as other My Journey pages */}
      <div style={{ marginBottom: 24 }}>
        <div className="profile-header-content">
          <h1 className="profile-title student-hub-page-title">
            {isReadOnly ? t('studentHub.profile.counselorTitle') : t('studentHub.profile.myStudentProfile')}
          </h1>
          <p className="profile-subtitle student-hub-page-subtitle" style={{ marginTop: 8 }}>
            {isReadOnly ? t('studentHub.profile.counselorSubtitle') : t('studentHub.profile.completeProfileMessage')}
          </p>
          <div className="profile-status">
            <Badge
              status={getStatusColor(profileData.status)}
              text={getStatusText(profileData.status)}
            />
          </div>
        </div>
      </div>

      {/* Major Match status — own account only, hidden in the counselor's
          read-only embed of this page. */}
      {!isReadOnly && (
        <Card className="profile-major-match-card">
          <div className="profile-major-match-card__body">
            <div className="profile-major-match-card__text">
              <span className="profile-major-match-card__title">
                <UnifiedIcon name="major-match" size="sm" color="primary" />
                {t('studentHub.profile.majorMatch.cardTitle', 'Major Match')}
              </span>
              {majorMatchLoading ? (
                <InlineLoader />
              ) : (
                <span className="profile-major-match-card__desc">
                  {hasTakenMajorMatch
                    ? latestMajorMatchAssessment?.riasecCode && (
                        <>
                          {t('studentHub.profile.majorMatch.riasecLabel', 'Your RIASEC code')}:{' '}
                          <strong>{latestMajorMatchAssessment.riasecCode}</strong>
                        </>
                      )
                    : t(
                        'studentHub.profile.majorMatch.notTakenText',
                        'Find out which majors fit you best with a short AI-powered assessment.',
                      )}
                </span>
              )}
            </div>
            <div className="profile-major-match-card__action">
              {!majorMatchLoading &&
                (hasTakenMajorMatch ? (
                  <Button onClick={() => navigate('/student-hub/psychometric-assessment?step=results')}>
                    {t('studentHub.profile.majorMatch.viewResults', 'View full results')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => navigate('/student-hub/psychometric-assessment')}
                  >
                    {t('studentHub.profile.majorMatch.takeButton', 'Take the assessment')}
                  </Button>
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* Profile Tabs */}
      <Card className="profile-tabs-card">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          className="profile-tabs"
        />
      </Card>
    </div>
  );
};

export default ProfilePage;