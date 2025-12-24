import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Button, Alert } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from 'src/components/common/icons/FontAwesomeIcon';
import StudentHubDashboard from './components/Dashboard';
import StudentHubProfile from './components/Profile';
import StudentHubApplications from './components/Applications';
import StudentHubEssays from './components/Essays';
import StudentHubDocuments from './components/Documents';
import StudentHubGPACalculator from './components/GPACalculator';
import StudentHubMajorMatch from './components/MajorMatch';
import './my-journey.scss';

const { TabPane } = Tabs;

const StudentMyJourneyView: React.FC = () => {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

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
          {t('My Journey')}
          <span className="read-only-badge">- {t('Read Only')}</span>
        </h1>
      </div>

      <div className="tabs-container">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="line"
        >
          <TabPane
            tab={
              <span>
                <FontAwesomeIcon icon="tachometer-alt" style={{ marginRight: 8 }} />
                {t('Dashboard')}
              </span>
            }
            key="dashboard"
          />
          <TabPane
            tab={
              <span>
                <FontAwesomeIcon icon="user" style={{ marginRight: 8 }} />
                {t('My Profile')}
              </span>
            }
            key="profile"
          />
          <TabPane
            tab={
              <span>
                <FontAwesomeIcon icon="building" style={{ marginRight: 8 }} />
                {t('Applications')}
              </span>
            }
            key="applications"
          />
          <TabPane
            tab={
              <span>
                <FontAwesomeIcon icon="pen" style={{ marginRight: 8 }} />
                {t('Essays')}
              </span>
            }
            key="essays"
          />
          <TabPane
            tab={
              <span>
                <FontAwesomeIcon icon="file" style={{ marginRight: 8 }} />
                {t('Documents')}
              </span>
            }
            key="documents"
          />
          <TabPane
            tab={
              <span>
                <FontAwesomeIcon icon="calculator" style={{ marginRight: 8 }} />
                {t('GPA Calculator')}
              </span>
            }
            key="gpa-calculator"
          />
          <TabPane
            tab={
              <span>
                <FontAwesomeIcon icon="book" style={{ marginRight: 8 }} />
                {t('Major Match')}
              </span>
            }
            key="major-match"
          />
        </Tabs>
      </div>

      <div className="tabs-content-wrapper">
        {activeTab === 'dashboard' && <StudentHubDashboard studentId={studentId} />}
        {activeTab === 'profile' && <StudentHubProfile studentId={studentId} />}
        {activeTab === 'applications' && <StudentHubApplications studentId={studentId} />}
        {activeTab === 'essays' && <StudentHubEssays studentId={studentId} />}
        {activeTab === 'documents' && <StudentHubDocuments studentId={studentId} />}
        {activeTab === 'gpa-calculator' && <StudentHubGPACalculator studentId={studentId} />}
        {activeTab === 'major-match' && <StudentHubMajorMatch studentId={studentId} />}
      </div>
    </div>
  );
};

export default StudentMyJourneyView;

