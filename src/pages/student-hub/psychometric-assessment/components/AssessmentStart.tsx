import React, { useState } from 'react';
import { Card, Button, Radio, Space, Typography, Alert, Tag, Row, Col } from 'antd';
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

  return (
    <div className="assessment-start">
      <Card className="start-info-card">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={14}>
            <Title level={3}>Get Started</Title>
            <Paragraph>
              This assessment will help you discover majors that align with your interests, 
              personality, values, and strengths. The assessment takes approximately 15-20 minutes 
              and includes:
            </Paragraph>
            <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
              <div className="assessment-feature">
                <FontAwesomeIcon icon="check-circle" style={{ color: '#10b981', marginRight: 8 }} />
                <Text strong>Interest Inventory (RIASEC)</Text>
                <Text type="secondary"> - 42 questions to identify your career interests</Text>
              </div>
              <div className="assessment-feature">
                <FontAwesomeIcon icon="check-circle" style={{ color: '#10b981', marginRight: 8 }} />
                <Text strong>Values Assessment</Text>
                <Text type="secondary"> - 12 questions about what matters most to you</Text>
              </div>
              <div className="assessment-feature">
                <FontAwesomeIcon icon="check-circle" style={{ color: '#10b981', marginRight: 8 }} />
                <Text strong>Personality Profile (Big Five)</Text>
                <Text type="secondary"> - 20 questions to understand your personality traits</Text>
              </div>
              {includeAptitude && (
                <div className="assessment-feature">
                  <FontAwesomeIcon icon="check-circle" style={{ color: '#3b82f6', marginRight: 8 }} />
                  <Text strong>Aptitude Tests</Text>
                  <Text type="secondary"> - 16 questions to assess your cognitive abilities (Optional)</Text>
                </div>
              )}
            </Space>
          </Col>
          <Col xs={24} md={10}>
            <Card className="settings-card" title="Assessment Settings">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong>Language:</Text>
                  <Radio.Group
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Space direction="vertical">
                      <Radio value="en">English</Radio>
                      <Radio value="uz">O'zbek</Radio>
                      <Radio value="ru">Русский</Radio>
                    </Space>
                  </Radio.Group>
                </div>
                <div>
                  <Text strong>Include Aptitude Tests:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Radio.Group
                      value={includeAptitude}
                      onChange={(e) => setIncludeAptitude(e.target.value)}
                    >
                      <Space>
                        <Radio value={true}>Yes (+16 questions)</Radio>
                        <Radio value={false}>No</Radio>
                      </Space>
                    </Radio.Group>
                    <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                      Recommended for STEM majors or if you want more detailed insights
                    </Text>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {hasExistingAssessment && (
        <Alert
          message="Previous Assessment Found"
          description="You have a previous assessment. You can view your results or start a new assessment."
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

      <Card className="start-actions-card">
        <div className="start-actions">
          <Button
            type="primary"
            size="large"
            onClick={handleStart}
            loading={isLoading}
            icon={<FontAwesomeIcon icon="play" />}
            style={{ minWidth: 200 }}
          >
            Start Assessment
          </Button>
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              Estimated time: {includeAptitude ? '20-25' : '15-20'} minutes
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

