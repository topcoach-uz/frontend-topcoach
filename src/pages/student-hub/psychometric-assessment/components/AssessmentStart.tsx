import React, { useState } from 'react';
import { Card, Button, Radio, Space, Typography, Alert, Row, Col, Divider, Badge } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import type { StudentProfile } from '../../../../app/services/student-hub/types';

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

  const totalQuestions = 74 + (includeAptitude ? 16 : 0);
  const estimatedTime = includeAptitude ? '20-25' : '15-20';

  return (
    <div className="assessment-start">
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

      {/* Assessment Overview with Start Button */}
      <Card className="assessment-overview-card" style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={18}>
            <Title level={4} style={{ margin: 0, marginBottom: 16 }}>Assessment Overview</Title>
            <Row gutter={[32, 16]}>
              <Col xs={12} sm={6}>
                <div className="overview-item">
                  <Text type="secondary" style={{ fontSize: 12 }}>Total Questions</Text>
                  <Title level={4} style={{ margin: 0, color: '#8b0000' }}>{totalQuestions}</Title>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="overview-item">
                  <Text type="secondary" style={{ fontSize: 12 }}>Estimated Time</Text>
                  <Title level={4} style={{ margin: 0, color: '#8b0000' }}>{estimatedTime} min</Title>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="overview-item">
                  <Text type="secondary" style={{ fontSize: 12 }}>Assessment Type</Text>
                  <Title level={4} style={{ margin: 0 }}>Comprehensive</Title>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div className="overview-item">
                  <Text type="secondary" style={{ fontSize: 12 }}>Components</Text>
                  <Title level={4} style={{ margin: 0 }}>{includeAptitude ? 4 : 3} Sections</Title>
                </div>
              </Col>
            </Row>
          </Col>
          <Col xs={24} lg={6}>
            <Button
              type="primary"
              size="large"
              onClick={handleStart}
              loading={isLoading}
              className="start-button"
              icon={<FontAwesomeIcon icon="play-circle" />}
              block
              style={{ height: 56, fontSize: 16, fontWeight: 600 }}
            >
              Start Assessment
            </Button>
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
              Your responses are confidential
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Assessment Components */}
      <Card className="assessment-components-card" title="Assessment Components" style={{ marginBottom: 24 }}>
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
      <Card className="assessment-settings-card" title="Assessment Settings">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
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
          </Col>

          <Col xs={24} md={12}>
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
                <Radio.Button value={true}>Yes, Include</Radio.Button>
                <Radio.Button value={false}>No, Skip</Radio.Button>
              </Radio.Group>
              <div className="aptitude-hint" style={{ marginTop: 8 }}>
                <FontAwesomeIcon icon="lightbulb" style={{ marginRight: 6, color: '#f59e0b' }} />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Recommended for STEM majors
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
