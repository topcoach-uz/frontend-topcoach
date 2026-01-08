import React, { useState } from 'react';
import { Card, Button, Radio, Space, Typography, Alert, Tag, Row, Col, Divider, Badge } from 'antd';
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

  const assessmentFeatures = [
    {
      icon: 'user-circle',
      title: 'Interest Inventory (RIASEC)',
      description: '42 questions to identify your career interests and personality type',
      count: 42,
      color: '#8b0000',
    },
    {
      icon: 'heart',
      title: 'Values Assessment',
      description: '12 questions about what matters most to you in your career',
      count: 12,
      color: '#dc2626',
    },
    {
      icon: 'brain',
      title: 'Personality Profile (Big Five)',
      description: '20 questions to understand your personality traits and working style',
      count: 20,
      color: '#b91c1c',
    },
  ];

  const totalQuestions = 74 + (includeAptitude ? 16 : 0);

  return (
    <div className="assessment-start">
      {/* Hero Section */}
      <Card className="hero-section-card">
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} lg={14}>
            <div className="hero-content">
              <div className="hero-icon">
                <FontAwesomeIcon icon="brain" />
              </div>
              <Title level={2} className="hero-title">
                Discover Your Perfect Major Match
              </Title>
              <Paragraph className="hero-description">
                Our comprehensive psychometric assessment analyzes your interests, personality, 
                values, and aptitudes to provide personalized major recommendations that align 
                with who you are and where you want to go.
              </Paragraph>
              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-value">{totalQuestions}</div>
                  <div className="stat-label">Questions</div>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <div className="stat-value">{includeAptitude ? '20-25' : '15-20'}</div>
                  <div className="stat-label">Minutes</div>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <div className="stat-value">100%</div>
                  <div className="stat-label">Personalized</div>
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} lg={10}>
            <div className="hero-visual">
              <div className="visual-card">
                <FontAwesomeIcon icon="chart-line" className="visual-icon" />
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Assessment Features */}
      <Card className="features-card">
        <Title level={4} className="section-title">
          What You'll Discover
        </Title>
        <Row gutter={[24, 24]}>
          {assessmentFeatures.map((feature, index) => (
            <Col xs={24} md={8} key={index}>
              <div className="feature-card">
                <div className="feature-icon" style={{ backgroundColor: `${feature.color}15` }}>
                  <FontAwesomeIcon icon={feature.icon} style={{ color: feature.color }} />
                </div>
                <div className="feature-content">
                  <div className="feature-header">
                    <Title level={5} className="feature-title">{feature.title}</Title>
                    <Badge count={feature.count} className="feature-badge" />
                  </div>
                  <Paragraph className="feature-description">{feature.description}</Paragraph>
                </div>
              </div>
            </Col>
          ))}
          {includeAptitude && (
            <Col xs={24} md={8}>
              <div className="feature-card feature-card-highlight">
                <div className="feature-icon" style={{ backgroundColor: '#3b82f615' }}>
                  <FontAwesomeIcon icon="flask" style={{ color: '#3b82f6' }} />
                </div>
                <div className="feature-content">
                  <div className="feature-header">
                    <Title level={5} className="feature-title">Aptitude Tests</Title>
                    <Badge count={16} className="feature-badge" />
                  </div>
                  <Paragraph className="feature-description">
                    Assess your cognitive abilities in numerical, verbal, and spatial reasoning
                  </Paragraph>
                </div>
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {/* Settings Card */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card className="settings-card">
            <Title level={4} className="section-title">
              <FontAwesomeIcon icon="cog" style={{ marginRight: 8 }} />
              Assessment Settings
            </Title>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div className="setting-group">
                <Text strong className="setting-label">
                  Language
                </Text>
                <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 12 }}>
                  Choose your preferred language for the assessment
                </Paragraph>
                <Radio.Group
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  size="large"
                  className="language-radio-group"
                >
                  <Radio.Button value="en">
                    <span className="radio-label">
                      <FontAwesomeIcon icon="globe" style={{ marginRight: 6 }} />
                      English
                    </span>
                  </Radio.Button>
                  <Radio.Button value="uz">
                    <span className="radio-label">
                      <FontAwesomeIcon icon="globe" style={{ marginRight: 6 }} />
                      O'zbek
                    </span>
                  </Radio.Button>
                  <Radio.Button value="ru">
                    <span className="radio-label">
                      <FontAwesomeIcon icon="globe" style={{ marginRight: 6 }} />
                      Русский
                    </span>
                  </Radio.Button>
                </Radio.Group>
              </div>

              <Divider />

              <div className="setting-group">
                <Text strong className="setting-label">
                  Include Aptitude Tests
                </Text>
                <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 12 }}>
                  Get deeper insights with cognitive ability assessment (adds 16 more questions)
                </Paragraph>
                <Radio.Group
                  value={includeAptitude}
                  onChange={(e) => setIncludeAptitude(e.target.value)}
                  size="large"
                  className="aptitude-radio-group"
                >
                  <Radio.Button value={true}>
                    <span className="radio-label">
                      <FontAwesomeIcon icon="check-circle" style={{ marginRight: 6 }} />
                      Yes (+16 questions)
                    </span>
                  </Radio.Button>
                  <Radio.Button value={false}>
                    <span className="radio-label">
                      <FontAwesomeIcon icon="times-circle" style={{ marginRight: 6 }} />
                      No
                    </span>
                  </Radio.Button>
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

        <Col xs={24} lg={10}>
          <Card className="summary-card">
            <Title level={4} className="section-title">
              Assessment Summary
            </Title>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div className="summary-item">
                <Text type="secondary">Total Questions</Text>
                <Text strong style={{ fontSize: 24 }}>{totalQuestions}</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div className="summary-item">
                <Text type="secondary">Estimated Time</Text>
                <Text strong style={{ fontSize: 24 }}>
                  {includeAptitude ? '20-25' : '15-20'} min
                </Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div className="summary-item">
                <Text type="secondary">Language</Text>
                <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                  {selectedLanguage === 'en' ? 'English' : selectedLanguage === 'uz' ? "O'zbek" : 'Русский'}
                </Tag>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div className="summary-item">
                <Text type="secondary">Aptitude Tests</Text>
                <Tag color={includeAptitude ? 'green' : 'default'} style={{ fontSize: 14, padding: '4px 12px' }}>
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
          message={
            <Space>
              <FontAwesomeIcon icon="info-circle" />
              <Text strong>Previous Assessment Found</Text>
            </Space>
          }
          description="You have completed this assessment before. You can view your previous results or start a new assessment to get updated recommendations."
          type="info"
          showIcon={false}
          className="existing-assessment-alert"
          action={
            <Button type="link" size="small" onClick={onViewExisting}>
              View Previous Results
            </Button>
          }
        />
      )}

      {/* CTA Section */}
      <Card className="cta-card">
        <div className="cta-content">
          <div className="cta-icon">
            <FontAwesomeIcon icon="rocket" />
          </div>
          <Title level={3} className="cta-title">
            Ready to Discover Your Perfect Major?
          </Title>
          <Paragraph className="cta-description">
            Start your personalized assessment now and get actionable insights in minutes
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={handleStart}
            loading={isLoading}
            className="cta-button"
            icon={<FontAwesomeIcon icon="play-circle" />}
          >
            Start Assessment
          </Button>
          <div className="cta-note">
            <FontAwesomeIcon icon="shield-alt" style={{ marginRight: 6 }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              Your responses are confidential and used only for recommendations
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};
