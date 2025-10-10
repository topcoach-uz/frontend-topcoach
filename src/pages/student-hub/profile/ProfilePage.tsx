import React, { useState, useEffect } from 'react';
import { Card, Tabs, Progress, Button, Row, Col, Statistic, Badge, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { PROFILE_ICONS, STATUS_ICONS, ACTION_ICONS } from '../../../constants/icons';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import { formatDateTime } from '../../../utils/dateFormatter';
import AcademicProfile from './AcademicProfile';
import PersonalProfile from './PersonalProfile';
import ActivitiesProfile from './ActivitiesProfile';
import './ProfilePage.scss';

const { TabPane } = Tabs;

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const { profile, isLoading, error, isProfileComplete, profileStatus } = useStudentProfile();

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['personal', 'academic', 'activities'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Handle tab changes
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // Show loading state only in main content area
  if (isLoading) {
    return (
      <div className="profile-loading-content">
        <div className="loading-spinner-container">
          <Spin size="large" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Alert
        message="Error Loading Profile"
        description="There was an error loading your profile data. Please try again."
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => window.location.reload()}>
            Retry
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
        return 'Complete';
      case 'in_progress':
        return 'In Progress';
      case 'incomplete':
        return 'Incomplete';
      default:
        return 'Unknown';
    }
  };

  const tabItems = [
    {
      key: 'personal',
      label: (
        <div className="tab-label">
          <FontAwesomeIcon icon={PROFILE_ICONS.PERSONAL} />
          <span>Personal Profile</span>
        </div>
      ),
      children: <PersonalProfile data={profileData.sections.personal} />,
    },
    {
      key: 'academic',
      label: (
        <div className="tab-label">
          <FontAwesomeIcon icon={PROFILE_ICONS.ACADEMIC} />
          <span>Academic Profile</span>
        </div>
      ),
      children: <AcademicProfile data={profileData.sections.academic} />,
    },
    {
      key: 'activities',
      label: (
        <div className="tab-label">
          <FontAwesomeIcon icon={PROFILE_ICONS.ACTIVITIES} />
          <span>Activities & Achievements</span>
        </div>
      ),
      children: <ActivitiesProfile data={profileData.sections.activities} />,
    },
  ];

  return (
    <div className="student-profile-page">
      {/* Profile Header */}
      <Card className="profile-header-card">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24}>
            <div className="profile-header-content">
              <h1 className="profile-title">My Student Profile</h1>
              <p className="profile-subtitle">
                Complete your profile to maximize your college application success
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