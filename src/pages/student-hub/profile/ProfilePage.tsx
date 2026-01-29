import React, { useState, useEffect } from 'react';
import { Card, Tabs, Progress, Button, Row, Col, Statistic, Badge, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { STATUS_ICONS, ACTION_ICONS } from '../../../constants/icons';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import { formatDateTime } from '../../../utils/dateFormatter';
import { InlineLoader, PageSkeleton } from '../../../components/loading';
import AcademicProfile from './AcademicProfile';
import PersonalProfile from './PersonalProfile';
import ActivitiesProfile from './ActivitiesProfile';
import GpaCalculatorPage from '../gpa-calculator/GpaCalculatorPage';
import SettingsPage from '../settings/SettingsPage';
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

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['personal', 'academic', 'activities', 'gpa-calculator', 'settings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      // Default to personal if no tab specified
      setActiveTab('personal');
    }
  }, [searchParams]);

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
          <FontAwesomeIcon icon={PROFILE_ICONS.ACADEMIC} />
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
    {
      key: 'gpa-calculator',
      label: (
        <div className="tab-label">
          <FontAwesomeIcon icon="calculator" />
          <span>GPA Calculator</span>
        </div>
      ),
      children: <GpaCalculatorPage />,
    },
    {
      key: 'settings',
      label: (
        <div className="tab-label">
          <UnifiedIcon name="settings" size="sm" color="primary" />
          <span>Settings</span>
        </div>
      ),
      children: <SettingsPage />,
    },
  ];

  return (
    <div className="student-profile-page">
      {/* Profile Header */}
      <Card className="profile-header-card">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24}>
            <div className="profile-header-content">
              <h1 className="profile-title">{t('studentHub.profile.myStudentProfile')}</h1>
              <p className="profile-subtitle">
                {t('studentHub.profile.completeProfileMessage')}
              </p>
              <div className="profile-status">
                <Badge
                  status={getStatusColor(profileData.status)}
                  text={getStatusText(profileData.status)}
                />
                {/* <span className="last-updated">
                  Last updated: {profileData.lastUpdated}
                </span> */}
              </div>
            </div>
          </Col>
        </Row>
      </Card>


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