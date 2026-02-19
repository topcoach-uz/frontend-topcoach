import React, { useState } from 'react';
import { Card, Button, Radio, Space, Typography, Alert, Row, Col, Divider, Badge, List, Empty, Collapse, Modal, message } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import UnifiedIcon from '../../../../components/common/icons/UnifiedIcon';
import type { StudentProfile } from '../../../../app/services/student-hub/types';
import { useGetAllAssessmentsQuery, useDeleteAssessmentMutation } from '../../../../app/services/student-hub/psychometricApi';

const { Panel } = Collapse;

const { Title, Paragraph, Text } = Typography;

interface ActiveSessionInfo {
  hasActiveSession: boolean;
  sessionId?: string;
  answeredCount?: number;
  totalCount?: number;
  includeAptitude?: boolean;
  lastUpdated?: string;
}

interface AssessmentStartProps {
  studentProfile: StudentProfile;
  onStart: (language: 'en' | 'uz' | 'ru', includeAptitude: boolean) => void;
  hasExistingAssessment: boolean;
  onViewExisting: (assessmentId: string) => void;
  isLoading: boolean;
  readOnly?: boolean;
  activeSession?: ActiveSessionInfo;
}

export const AssessmentStart: React.FC<AssessmentStartProps> = ({
  studentProfile,
  onStart,
  hasExistingAssessment,
  onViewExisting,
  isLoading,
  readOnly = false,
  activeSession,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'uz' | 'ru'>(
    (i18n.language.split('-')[0] as 'en' | 'uz' | 'ru') || 'en'
  );
  const [includeAptitude, setIncludeAptitude] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);

  // Fetch all completed assessments
  const { data: allAssessments, isLoading: assessmentsLoading } = useGetAllAssessmentsQuery(
    studentProfile?.id || '',
    { skip: !studentProfile?.id }
  );

  // Delete assessment mutation
  const [deleteAssessment, { isLoading: isDeleting }] = useDeleteAssessmentMutation();

  const handleStart = () => {
    onStart(selectedLanguage, includeAptitude);
  };

  const handleDeleteClick = (assessmentId: string) => {
    setAssessmentToDelete(assessmentId);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;

    try {
      await deleteAssessment(assessmentToDelete).unwrap();
      message.success('Assessment deleted successfully');
      setDeleteModalVisible(false);
      setAssessmentToDelete(null);
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to delete assessment');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setAssessmentToDelete(null);
  };

  // V2 Question counts:
  // Core: 48 (12 RIASEC + 20 Big Five + 10 Values + 4 SJT + 2 Open-ended)
  // Aptitude: 12 (optional)
  const totalQuestions = 48 + (includeAptitude ? 12 : 0); // 48 without aptitude, 60 with aptitude
  const estimatedTime = includeAptitude ? '18-22' : '12-15';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="assessment-start">
      {/* Completed Assessments History */}
      {allAssessments && allAssessments.length > 0 && (
        <Collapse
          defaultActiveKey={['history']}
          style={{ marginBottom: 24 }}
          items={[
            {
              key: 'history',
              label: (
                <span>
                  <FontAwesomeIcon icon="history" style={{ marginRight: 8 }} />
                  {t('studentHub.psychometric.assessmentHistory', 'Assessment History')} ({allAssessments.length})
                </span>
              ),
              children: (
                <List
                  dataSource={allAssessments}
                  loading={assessmentsLoading}
                  locale={{ emptyText: <Empty description={t('studentHub.psychometric.noCompletedAssessments', 'No completed assessments yet')} /> }}
                  renderItem={(assessment) => (
                    <List.Item
                      actions={[
                        <Button 
                          key="view" 
                          type="link" 
                          onClick={() => onViewExisting(assessment.id)}
                        >
                          {t('studentHub.psychometric.viewResults', 'View Results')}
                        </Button>,
                        !readOnly && (
                        <Button
                          key="delete"
                          type="link"
                          className="btn-delete-crimson-link"
                          icon={<UnifiedIcon name="trash-2" size="sm" color="primary" />}
                          onClick={() => handleDeleteClick(assessment.id)}
                        >
                          {t('common.delete', 'Delete')}
                        </Button>
                        ),
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{t('studentHub.psychometric.assessment', 'Assessment')} #{allAssessments.indexOf(assessment) + 1}</Text>
                            <Badge 
                              color={assessment.aptitudeScores ? 'green' : 'blue'} 
                              text={assessment.aptitudeScores ? t('studentHub.psychometric.withAptitude', 'With Aptitude') : t('studentHub.psychometric.coreOnly', 'Core Only')}
                            />
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4}>
                            <Text type="secondary">
                              {t('studentHub.psychometric.completed', 'Completed')}: {formatDate(assessment.assessmentMetadata?.completedAt || assessment.createdAt)}
                            </Text>
                            <Text type="secondary">
                              {t('studentHub.psychometric.riasecCode', 'RIASEC Code')}: <Text strong style={{ color: '#8b0000' }}>{assessment.riasecCode}</Text>
                              {' • '}
                              {t('studentHub.psychometric.questions', 'Questions')}: {assessment.assessmentMetadata?.questionCount || t('common.notAvailable', 'N/A')}
                              {' • '}
                              {t('studentHub.psychometric.time', 'Time')}: {Math.round((assessment.assessmentMetadata?.completionTime || 0) / 60)} {t('common.minutes', 'min')}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      )}

      {/* Start button (Overview removed per counselor view requirements) */}
      {!readOnly && (
        <Card className="assessment-start-card" style={{ marginBottom: 24 }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} lg={18}>
              <Title level={4} style={{ margin: 0 }}>{t('studentHub.psychometric.readyToStart', 'Ready to start?')}</Title>
              <Text type="secondary">
                {totalQuestions} {t('studentHub.psychometric.questions', 'questions')} · ~{estimatedTime} {t('common.minutes', 'minutes')}
              </Text>
            </Col>
            <Col xs={24} lg={6}>
              <Button
                type="primary"
                size="large"
                onClick={handleStart}
                loading={isLoading}
                className="start-button"
                icon={<FontAwesomeIcon icon={activeSession?.hasActiveSession ? "redo" : "play-circle"} />}
                block
                style={{ height: 56, fontSize: 16, fontWeight: 600 }}
              >
                {activeSession?.hasActiveSession 
                  ? t('studentHub.psychometric.resume', 'Resume ({{answered}}/{{total}})', { answered: activeSession.answeredCount, total: activeSession.totalCount })
                  : t('studentHub.psychometric.startAssessment', 'Start Assessment')}
              </Button>
              {activeSession?.hasActiveSession && activeSession.lastUpdated && (
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
                  {t('studentHub.psychometric.lastSaved', 'Last saved')}: {new Date(activeSession.lastUpdated).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </Text>
              )}
            </Col>
          </Row>
        </Card>
      )}

      {/* Assessment Components (V2) - hidden in read-only counselor view */}
      {!readOnly && (
      <Card className="assessment-components-card" title={t('studentHub.psychometric.assessmentComponents', 'Assessment Components')} style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className="component-item">
              <FontAwesomeIcon icon="compass" className="component-icon" />
              <div className="component-content">
                <Text strong>{t('studentHub.psychometric.interestInventory', 'Interest Inventory (RIASEC)')}</Text>
                <Text type="secondary" className="component-description">
                  {t('studentHub.psychometric.interestInventoryDesc', '12 choice pairs to identify your career interests')}
                </Text>
              </div>
              <Badge count={12} className="component-badge" />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="component-item">
              <FontAwesomeIcon icon="brain" className="component-icon" />
              <div className="component-content">
                <Text strong>{t('studentHub.psychometric.personalityProfile', 'Personality Profile (Big Five)')}</Text>
                <Text type="secondary" className="component-description">
                  {t('studentHub.psychometric.personalityProfileDesc', '20 questions to understand your personality traits')}
                </Text>
              </div>
              <Badge count={20} className="component-badge" />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="component-item">
              <FontAwesomeIcon icon="star" className="component-icon" />
              <div className="component-content">
                <Text strong>{t('studentHub.psychometric.valuesAssessment', 'Values Assessment')}</Text>
                <Text type="secondary" className="component-description">
                  {t('studentHub.psychometric.valuesAssessmentDesc', '10 questions about what matters most to you')}
                </Text>
              </div>
              <Badge count={10} className="component-badge" />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="component-item">
              <FontAwesomeIcon icon="lightbulb" className="component-icon" />
              <div className="component-content">
                <Text strong>{t('studentHub.psychometric.realLifeScenarios', 'Real-Life Scenarios (SJT)')}</Text>
                <Text type="secondary" className="component-description">
                  {t('studentHub.psychometric.realLifeScenariosDesc', '4 situational judgment questions')}
                </Text>
              </div>
              <Badge count={4} className="component-badge" />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="component-item">
              <FontAwesomeIcon icon="edit" className="component-icon" />
              <div className="component-content">
                <Text strong>{t('studentHub.psychometric.openEndedQuestions', 'Open-Ended Questions')}</Text>
                <Text type="secondary" className="component-description">
                  {t('studentHub.psychometric.openEndedQuestionsDesc', '2 questions for AI-powered personalization')}
                </Text>
              </div>
              <Badge count={2} className="component-badge" />
            </div>
          </Col>
          {includeAptitude && (
            <Col xs={24} md={12}>
              <div className="component-item component-item-highlight">
                <FontAwesomeIcon icon="flask" className="component-icon" />
                <div className="component-content">
                  <Text strong>{t('studentHub.psychometric.aptitudeTests', 'Aptitude Tests')}</Text>
                  <Text type="secondary" className="component-description">
                    {t('studentHub.psychometric.aptitudeTestsDesc', '12 questions to assess cognitive abilities')}
                  </Text>
                </div>
                <Badge count={12} className="component-badge" />
              </div>
            </Col>
          )}
        </Row>
      </Card>
      )}

      {/* Settings - hidden in read-only counselor view */}
      {!readOnly && (
      <Card className="assessment-settings-card" title={t('studentHub.psychometric.assessmentSettings', 'Assessment Settings')}>
        <Row gutter={[24, 24]}>
          {/* Language selection temporarily hidden - not working yet */}
          {/* <Col xs={24} md={12}>
            <div className="setting-group">
              <Text strong className="setting-label">Language</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 12 }}>
                Choose your preferred language for the assessment
              </Paragraph>
              <Radio.Group
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                size="large"
              >
                <Radio.Button value="en">English</Radio.Button>
                <Radio.Button value="uz">O'zbek</Radio.Button>
                <Radio.Button value="ru">Русский</Radio.Button>
              </Radio.Group>
            </div>
          </Col> */}

          <Col xs={24} md={24}>
            <div className="setting-group">
              <Text strong className="setting-label">{t('studentHub.psychometric.includeAptitudeTests', 'Include Aptitude Tests')}</Text>
              <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 12 }}>
                {t('studentHub.psychometric.includeAptitudeTestsDesc', 'Get deeper insights with cognitive ability assessment (+12 questions)')}
              </Paragraph>
              <Radio.Group
                value={includeAptitude}
                onChange={(e) => setIncludeAptitude(e.target.value)}
                size="large"
              >
                <Radio.Button value={true}>{t('studentHub.psychometric.yesInclude', 'Yes, Include')}</Radio.Button>
                <Radio.Button value={false}>{t('studentHub.psychometric.noSkip', 'No, Skip')}</Radio.Button>
              </Radio.Group>
              <div className="aptitude-hint" style={{ marginTop: 8 }}>
                <FontAwesomeIcon icon="lightbulb" style={{ marginRight: 6, color: '#f59e0b' }} />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {t('studentHub.psychometric.recommendedForStem', 'Recommended for STEM majors')}
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        title={t('studentHub.psychometric.deleteAssessment', 'Delete Assessment')}
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmLoading={isDeleting}
        okText={t('common.delete', 'Delete')}
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel', 'Cancel')}
      >
        <p>{t('studentHub.psychometric.deleteConfirm', 'Are you sure you want to delete this assessment? This action cannot be undone.')}</p>
        <p style={{ color: '#ff4d4f', fontWeight: 500 }}>
          {t('studentHub.psychometric.deleteWarning', 'All assessment data, scores, and recommendations will be permanently removed.')}
        </p>
      </Modal>
    </div>
  );
};
