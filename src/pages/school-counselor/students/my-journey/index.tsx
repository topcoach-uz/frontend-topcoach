import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Button, Alert, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import UnifiedIcon from 'src/components/common/icons/UnifiedIcon';
import { useGetUserByIdQuery } from 'src/app/services/users';
import { useGetStudentProfileByUserIdQuery } from 'src/app/services/student-hub/studentProfileApi';
import StudentHubDashboard from './components/Dashboard';
import StudentHubProfile from './components/Profile';
import StudentHubApplications from './components/Applications';
import StudentHubEssays from './components/Essays';
import StudentHubDocuments from './components/Documents';
import StudentHubPsychometricAssessment from './components/PsychometricAssessment';
import './my-journey.scss';

const StudentMyJourneyView: React.FC = () => {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch the student's user data and profile (profile is fallback if user fetch fails)
  const { data: studentUser, isLoading: userLoading } = useGetUserByIdQuery(studentId || '', { 
    skip: !studentId 
  });
  const { data: studentProfileRes } = useGetStudentProfileByUserIdQuery(studentId || '', {
    skip: !studentId || !!studentUser?.profile?.name,
  });

  const studentProfileData = (studentProfileRes as any)?.data || studentProfileRes;
  const studentName = studentUser?.profile?.name 
    || studentProfileData?.profile?.name 
    || t('Student');

  if (!studentId) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error"
          description="Student ID is missing"
          type="error"
          showIcon
        />
      </div>
    );
  }

  // Show loading only while user fetch is in progress and we don't have a fallback name yet
  const hasName = !!(studentUser?.profile?.name || studentProfileData?.profile?.name);
  if (userLoading && !hasName) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Tab items aligned with My Journey sidebar: Dashboard, Applications, Major Match, Opportunities, Essays, Documents, My Profile
  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <UnifiedIcon name="dashboard" size="sm" color="primary" style={{ marginRight: 8 }} />
          {t('Dashboard')}
        </span>
      ),
    },
    {
      key: 'applications',
      label: (
        <span>
          <UnifiedIcon name="applications" size="sm" color="primary" style={{ marginRight: 8 }} />
          {t('Applications')}
        </span>
      ),
    },
    {
      key: 'psychometric-assessment',
      label: (
        <span>
          <UnifiedIcon name="activity" size="sm" color="primary" style={{ marginRight: 8 }} />
          {t('studentHub.psychometric.majorMatch', 'Major Match')}
        </span>
      ),
    },
    {
      key: 'essays',
      label: (
        <span>
          <UnifiedIcon name="essays" size="sm" color="primary" style={{ marginRight: 8 }} />
          {t('Essays')}
        </span>
      ),
    },
    {
      key: 'documents',
      label: (
        <span>
          <UnifiedIcon name="documents" size="sm" color="primary" style={{ marginRight: 8 }} />
          {t('Documents')}
        </span>
      ),
    },
    {
      key: 'profile',
      label: (
        <span>
          <UnifiedIcon name="profile" size="sm" color="primary" style={{ marginRight: 8 }} />
          {t("Student's Profile")}
        </span>
      ),
    },
  ];

  return (
    <div className="student-my-journey-view">
      <div className="journey-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/school-counselor/students')}
          className="back-button"
          style={{ borderColor: '#8b0000', color: '#8b0000' }}
        >
          {t('Back to Students')}
        </Button>
        <h1 className="page-title">
          {studentName}'s Journey
        </h1>
      </div>

      <div className="tabs-container">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="line"
          items={tabItems}
        />
      </div>

      <div className="tabs-content-wrapper">
        {activeTab === 'dashboard' && <StudentHubDashboard studentId={studentId} studentName={studentName} />}
        {activeTab === 'applications' && <StudentHubApplications studentId={studentId} studentName={studentName} />}
        {activeTab === 'psychometric-assessment' && <StudentHubPsychometricAssessment studentId={studentId} studentName={studentName} />}
        {activeTab === 'essays' && <StudentHubEssays studentId={studentId} studentName={studentName} />}
        {activeTab === 'documents' && <StudentHubDocuments studentId={studentId} studentName={studentName} />}
        {activeTab === 'profile' && <StudentHubProfile studentId={studentId} studentName={studentName} />}
      </div>
    </div>
  );
};

export default StudentMyJourneyView;

