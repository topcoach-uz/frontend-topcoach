import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Button, Alert, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from 'src/components/common/icons/FontAwesomeIcon';
import { useGetUserByIdQuery } from 'src/app/services/users';
import StudentHubDashboard from './components/Dashboard';
import StudentHubProfile from './components/Profile';
import StudentHubApplications from './components/Applications';
import StudentHubEssays from './components/Essays';
import StudentHubDocuments from './components/Documents';
import StudentHubGPACalculator from './components/GPACalculator';
import StudentHubPsychometricAssessment from './components/PsychometricAssessment';
import './my-journey.scss';

const StudentMyJourneyView: React.FC = () => {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch the student's user data to get their name
  const { data: studentUser, isLoading: userLoading } = useGetUserByIdQuery(studentId || '', { 
    skip: !studentId 
  });

  const studentName = studentUser?.profile?.name || t('Student');

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

  if (userLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  // Tab items using the new `items` prop (fixing deprecation warning)
  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <FontAwesomeIcon icon="tachometer-alt" style={{ marginRight: 8 }} />
          {t('Dashboard')}
        </span>
      ),
    },
    {
      key: 'profile',
      label: (
        <span>
          <FontAwesomeIcon icon="user" style={{ marginRight: 8 }} />
          {t('My Profile')}
        </span>
      ),
    },
    {
      key: 'psychometric-assessment',
      label: (
        <span>
          <FontAwesomeIcon icon="chart-line" style={{ marginRight: 8 }} />
          {t('Psychometric Test')}
        </span>
      ),
    },
    {
      key: 'applications',
      label: (
        <span>
          <FontAwesomeIcon icon="building" style={{ marginRight: 8 }} />
          {t('Applications')}
        </span>
      ),
    },
    {
      key: 'essays',
      label: (
        <span>
          <FontAwesomeIcon icon="pen" style={{ marginRight: 8 }} />
          {t('Essays')}
        </span>
      ),
    },
    {
      key: 'documents',
      label: (
        <span>
          <FontAwesomeIcon icon="file" style={{ marginRight: 8 }} />
          {t('Documents')}
        </span>
      ),
    },
    {
      key: 'gpa-calculator',
      label: (
        <span>
          <FontAwesomeIcon icon="calculator" style={{ marginRight: 8 }} />
          {t('GPA Calculator')}
        </span>
      ),
    },
  ];

  return (
    <div className="student-my-journey-view">
      <div className="journey-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/school-counselor/students/${studentId}`)}
          className="back-button"
          style={{ borderColor: '#8b0000', color: '#8b0000' }}
        >
          {t('Back to Student Details')}
        </Button>
        <h1 className="page-title">
          {studentName}'s {t('My Journey')}
          <span className="read-only-badge">- {t('Read Only')}</span>
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
        {activeTab === 'profile' && <StudentHubProfile studentId={studentId} studentName={studentName} />}
        {activeTab === 'applications' && <StudentHubApplications studentId={studentId} studentName={studentName} />}
        {activeTab === 'essays' && <StudentHubEssays studentId={studentId} studentName={studentName} />}
        {activeTab === 'documents' && <StudentHubDocuments studentId={studentId} studentName={studentName} />}
        {activeTab === 'gpa-calculator' && <StudentHubGPACalculator studentId={studentId} studentName={studentName} />}
        {activeTab === 'psychometric-assessment' && <StudentHubPsychometricAssessment studentId={studentId} studentName={studentName} />}
      </div>
    </div>
  );
};

export default StudentMyJourneyView;

