import React from 'react';
import { Card, Button, Row, Col, Tag, Badge, Descriptions, Divider, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import FontAwesomeIcon from '../../../components/common/icons/FontAwesomeIcon';
import { useGetCollegeApplicationQuery } from '../../../app/services/student-hub/applicationTrackingApi';
import ApplicationTimeline from './components/ApplicationTimeline';
import './ViewApplicationPage.scss';

const ViewApplicationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const { data: applicationResponse, isLoading, error } = useGetCollegeApplicationQuery(id!);

  const application = applicationResponse?.data;

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
      case 'under_review':
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
    if (priorityNum >= 8) return 'HIGH';
    if (priorityNum >= 5) return 'MEDIUM';
    return 'LOW';
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

  if (isLoading) {
    return (
      <div className="view-application-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t('studentHub.applications.loadingCollegeDetails', 'Loading college details...')}</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="view-application-error">
        <div className="error-content">
          <h3>Application Not Found</h3>
          <p>The application you're looking for could not be found.</p>
          <Button type="primary" onClick={() => navigate('/student-hub/applications')}>
            {t('studentHub.applications.backToCollegeLists', 'Back to College Lists')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-application-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1 className="page-title">{application.universityName || 'Unknown University'}</h1>
            <div className="header-badges">
              <Tag color={getCategoryColor(application.category)}>
                {application.category?.toUpperCase() || 'UNKNOWN'}
              </Tag>
              <Tag color="blue">
                {application.applicationType?.replace('-', ' ').toUpperCase() || 'UNKNOWN'}
              </Tag>
              <Tag color={getPriorityColor(application.priority)}>
                {getPriorityText(application.priority)}
              </Tag>
            </div>
          </div>
          <div className="header-actions">
            <Space>
              <Button 
                icon={<FontAwesomeIcon icon="edit" />}
                onClick={() => navigate(`/student-hub/applications/${id}/edit`)}
              >
                {t('studentHub.applications.editCollege', 'Edit College')}
              </Button>
              <Button 
                icon={<FontAwesomeIcon icon="arrow-left" />}
                onClick={() => navigate('/student-hub/applications')}
              >
                {t('studentHub.applications.backToCollegeLists', 'Back to College Lists')}
              </Button>
            </Space>
          </div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Application Details" className="details-card">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="University">
                {application.universityName || 'Unknown University'}
              </Descriptions.Item>
              <Descriptions.Item label="Application Type">
                {application.applicationType?.replace('-', ' ').toUpperCase() || 'UNKNOWN'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge
                  status={getStatusColor(application.status) as any}
                  text={application.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag color={getCategoryColor(application.category)}>
                  {application.category?.toUpperCase() || 'UNKNOWN'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={getPriorityColor(application.priority)}>
                  {getPriorityText(application.priority)} ({application.priority}/10)
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Deadline">
                {application.deadline ? new Date(application.deadline).toLocaleDateString() : 'TBD'}
              </Descriptions.Item>
              {/* Submitted and decision dates not available in current schema */}
            </Descriptions>

            {application.whyThisSchool && (
              <div className="why-this-school-section" style={{ marginTop: 16 }}>
                <Divider orientation="left">Why this school</Divider>
                <div className="why-this-school-content" style={{ color: '#333', whiteSpace: 'pre-wrap' }}>
                  {application.whyThisSchool}
                </div>
              </div>
            )}

            {(application.financialInfo && Object.keys(application.financialInfo).length > 0) && (
              <div className="financial-section">
                <Divider orientation="left">Financial Information</Divider>
                <Descriptions column={2} bordered>
                  {application.financialInfo.tuition && (
                    <Descriptions.Item label="Tuition">
                      ${application.financialInfo.tuition.toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {application.financialInfo.roomBoard && (
                    <Descriptions.Item label="Room & Board">
                      ${application.financialInfo.roomBoard.toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {application.financialInfo.totalCost && (
                    <Descriptions.Item label="Total Cost">
                      ${application.financialInfo.totalCost.toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {application.financialInfo.aidOffered && (
                    <Descriptions.Item label="Aid Offered">
                      ${application.financialInfo.aidOffered.toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {application.financialInfo.netCost && (
                    <Descriptions.Item label="Net Cost">
                      ${application.financialInfo.netCost.toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {application.financialInfo.loanAmount && (
                    <Descriptions.Item label="Loan Amount">
                      ${application.financialInfo.loanAmount.toLocaleString()}
                    </Descriptions.Item>
                  )}
                  {application.financialInfo.monthlyPayment && (
                    <Descriptions.Item label="Monthly Payment">
                      ${application.financialInfo.monthlyPayment.toLocaleString()}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}

            {(application.requirements && Object.keys(application.requirements).length > 0) && (
              <div className="requirements-section">
                <Divider orientation="left">Application Requirements</Divider>
                <Descriptions column={1} bordered>
                  {application.requirements.essays && (
                    <Descriptions.Item label="Essays">
                      {application.requirements.essays.completed || 0} of {application.requirements.essays.required || 0} completed
                    </Descriptions.Item>
                  )}
                  {application.requirements.recommendations && (
                    <Descriptions.Item label="Recommendations">
                      {application.requirements.recommendations.submitted || 0} of {application.requirements.recommendations.required || 0} submitted
                    </Descriptions.Item>
                  )}
                  {application.requirements.transcripts && (
                    <Descriptions.Item label="Transcripts">
                      Status: {application.requirements.transcripts.status} 
                      {application.requirements.transcripts.verified && ' (Verified)'}
                    </Descriptions.Item>
                  )}
                  {application.requirements.testScores && (
                    <Descriptions.Item label="Test Scores">
                      Status: {application.requirements.testScores.status}
                      {application.requirements.testScores.submitted && application.requirements.testScores.submitted.length > 0 && 
                        ` (${application.requirements.testScores.submitted.join(', ')})`
                      }
                    </Descriptions.Item>
                  )}
                  {application.requirements.interviews && (
                    <Descriptions.Item label="Interviews">
                      {application.requirements.interviews.required ? 'Required' : 'Not Required'}
                      {application.requirements.interviews.scheduled && ` - Scheduled: ${application.requirements.interviews.scheduled}`}
                      {application.requirements.interviews.completed && ` - Completed: ${application.requirements.interviews.completed}`}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Application Status" className="status-card">
            <div className="status-content">
              <div className="status-badge">
                <Badge
                  status={getStatusColor(application.status) as any}
                  text={application.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                />
              </div>

              <div className="progress-info">
                <h4>Application Progress</h4>
                <div className="progress-item">
                  <span>Application Started</span>
                  <FontAwesomeIcon icon="check-circle" style={{ color: 'green' }} />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Activity" className="activity-card" style={{ marginTop: 24 }}>
            <ApplicationTimeline
              createdAt={application.createdAt}
              activity={application.activity}
              emptyMessage="Complete checklist items or update status to see activity here."
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ViewApplicationPage;