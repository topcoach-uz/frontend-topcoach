import React, { useState } from 'react';
import { Card, Button, Radio, Space, Typography, Alert, Tag, Row, Col, Divider, Badge } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import type { StudentProfile } from '../../../../app/services/student-hub/types';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

const { Title, Paragraph, Text } = Typography;

interface AssessmentStartProps {
  studentProfile: StudentProfile;
  onStart: (language: 'en' | 'uz' | 'ru', includeAptitude: boolean) => void;
  hasExistingAssessment: boolean;
  onViewExisting: () => void;
  isLoading: boolean;
}

export const AssessmentStart: React.FC<AssessmentStartProps> = ({
  studentProfile,
  onStart,
  hasExistingAssessment,
  onViewExisting,
  isLoading,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'uz' | 'ru'>(
    (i18n.language.split('-')[0] as 'en' | 'uz' | 'ru') || 'en'
  );
  const [includeAptitude, setIncludeAptitude] = useState(false);

  const handleStart = () => {
    onStart(selectedLanguage, includeAptitude);
  };

  // Note: totalQuestions will be updated when questions are loaded
  // This is just an estimate for display
  const totalQuestions = 74 + (includeAptitude ? 16 : 0);
  const estimatedTime = includeAptitude ? '20-25' : '15-20';

  return (
    <div className="assessment-start">
      {/* Start Button - moved to top, right after header */}
      <Card className="assessment-actions-card" style={{ marginBottom: 24 }}>
        <div className="actions-content">
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} sm={18}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 14 }}>Total Questions</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#8b0000' }}>{totalQuestions}</div>
                  </div>
                  <Divider type="vertical" style={{ height: 40 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 14 }}>Estimated Time</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#8b0000' }}>{estimatedTime} min</div>
                  </div>
                  <Divider type="vertical" style={{ height: 40 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 14 }}>Language</Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                        {selectedLanguage === 'en' ? 'English' : selectedLanguage === 'uz' ? "O'zbek" : 'Русский'}
                      </Tag>
                    </div>
                  </div>
                  <Divider type="vertical" style={{ height: 40 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 14 }}>Aptitude Tests</Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color={includeAptitude ? 'green' : 'default'} style={{ fontSize: 14, padding: '4px 12px' }}>
                        {includeAptitude ? 'Included' : 'Not Included'}
                      </Tag>
                    </div>
                  </div>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={6}>
              <Button
                type="primary"
                size="large"
                onClick={handleStart}
                loading={isLoading}
                className="start-button"
                icon={<FontAwesomeIcon icon="play-circle" />}
                block
                style={{ height: 48, fontSize: 16 }}
              >
                Start Assessment
              </Button>
            </Col>
          </Row>
          <Text type="secondary" style={{ display: 'block', marginTop: 16, textAlign: 'center', fontSize: 13 }}>
            Your responses are confidential and used only for recommendations
          </Text>
        </div>
      </Card>

      {/* Overview Section */}
      <Card className="assessment-overview-card" title="Assessment Overview">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <div className="overview-item">
              <Text type="secondary" className="overview-label">Total Questions</Text>
              <Title level={4} style={{ margin: 0 }}>{totalQuestions}</Title>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="overview-item">
              <Text type="secondary" className="overview-label">Estimated Time</Text>
              <Title level={4} style={{ margin: 0 }}>{estimatedTime} min</Title>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="overview-item">
              <Text type="secondary" className="overview-label">Assessment Type</Text>
              <Title level={4} style={{ margin: 0 }}>Comprehensive</Title>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Assessment Components */}
      <Card className="assessment-components-card" title="Assessment Components">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className="component-item">
              <FontAwesomeIcon icon="user-circle" className="component-icon" />
              <div className="component-content">
                <Text strong>Interest Inventory (RIASEC)</Text>
                <Text type="secondary" className="component-description">
                  42 questions to identify your career interests
                </Text>
              </div>
              <Badge count={42} className="component-badge" />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="component-item">
              <FontAwesomeIcon icon="star" className="component-icon" />
              <div className="component-content">
                <Text strong>Values Assessment</Text>
                <Text type="secondary" className="component-description">
                  12 questions about what matters most to you
                </Text>
              </div>
              <Badge count={12} className="component-badge" />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="component-item">
              <FontAwesomeIcon icon="brain" className="component-icon" />
              <div className="component-content">
                <Text strong>Personality Profile (Big Five)</Text>
                <Text type="secondary" className="component-description">
                  20 questions to understand your personality traits
                </Text>
              </div>
              <Badge count={20} className="component-badge" />
            </div>
          </Col>
          {includeAptitude && (
            <Col xs={24} md={12}>
              <div className="component-item component-item-highlight">
                <FontAwesomeIcon icon="flask" className="component-icon" />
                <div className="component-content">
                  <Text strong>Aptitude Tests</Text>
                  <Text type="secondary" className="component-description">
                    16 questions to assess cognitive abilities
                  </Text>
                </div>
                <Badge count={16} className="component-badge" />
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {/* Settings */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card className="assessment-settings-card" title="Assessment Settings">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
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

              <Divider style={{ margin: '16px 0' }} />

              <div className="setting-group">
                <Text strong className="setting-label">Include Aptitude Tests</Text>
                <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 12 }}>
                  Get deeper insights with cognitive ability assessment (+16 questions)
                </Paragraph>
                <Radio.Group
                  value={includeAptitude}
                  onChange={(e) => setIncludeAptitude(e.target.value)}
                  size="large"
                >
                  <Radio.Button value={true}>Yes</Radio.Button>
                  <Radio.Button value={false}>No</Radio.Button>
                </Radio.Group>
                <div className="aptitude-hint">
                  <FontAwesomeIcon icon="lightbulb" style={{ marginRight: 6 }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Recommended for STEM majors or if you want more detailed insights
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="assessment-summary-card" title="Summary">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div className="summary-item">
                <Text type="secondary">Total Questions</Text>
                <Text strong style={{ fontSize: 18 }}>{totalQuestions}</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div className="summary-item">
                <Text type="secondary">Estimated Time</Text>
                <Text strong style={{ fontSize: 18 }}>{estimatedTime} min</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div className="summary-item">
                <Text type="secondary">Language</Text>
                <Tag color="blue">
                  {selectedLanguage === 'en' ? 'English' : selectedLanguage === 'uz' ? "O'zbek" : 'Русский'}
                </Tag>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div className="summary-item">
                <Text type="secondary">Aptitude Tests</Text>
                <Tag color={includeAptitude ? 'green' : 'default'}>
                  {includeAptitude ? 'Included' : 'Not Included'}
                </Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Existing Assessment Alert */}
      {hasExistingAssessment && (
        <Alert
          message="Previous Assessment Found"
          description="You have completed this assessment before. You can view your previous results or start a new assessment."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" onClick={onViewExisting}>
              View Previous Results
            </Button>
          }
        />
      )}

    </div>
  );
};
