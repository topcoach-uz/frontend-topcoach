import React from 'react';
import { Card, Button, Typography, Row, Col, Tag, Progress, List, Avatar, Space, Spin, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import type {
  PsychometricAssessment,
  RecommendationsResponse,
} from '../../../../app/services/student-hub/psychometricApi';

const { Title, Paragraph, Text } = Typography;

interface AssessmentResultsProps {
  assessmentId: string;
  studentProfileId: string;
  assessment?: PsychometricAssessment;
  recommendations?: RecommendationsResponse;
  onRetake: () => void;
  isLoading: boolean;
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  assessment,
  recommendations,
  onRetake,
  isLoading,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <p>Loading results...</p>
      </div>
    );
  }

  if (!assessment || !recommendations) {
    return (
      <Card>
        <Alert
          message="No Results Available"
          description="Assessment results are not available. Please complete an assessment first."
          type="warning"
        />
      </Card>
    );
  }

  const topRecommendations = recommendations.recommendations.slice(0, 5);

  return (
    <div className="assessment-results">
      {/* Assessment Summary */}
      <Card className="results-summary-card">
        <Title level={3}>Your Assessment Summary</Title>
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Text type="secondary">RIASEC Code</Text>
              <Title level={2} style={{ margin: '8px 0 0 0' }}>
                {assessment.riasecCode}
              </Title>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Text type="secondary">Top Interest</Text>
              <Title level={4} style={{ margin: '8px 0 0 0' }}>
                {recommendations.assessmentSummary.topInterests[0]?.dimension || 'N/A'}
              </Title>
              <Text type="secondary">
                {recommendations.assessmentSummary.topInterests[0]?.score || 0}%
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small">
              <Text type="secondary">Completion Time</Text>
              <Title level={4} style={{ margin: '8px 0 0 0' }}>
                {Math.round(assessment.assessmentMetadata.completionTime / 60)} min
              </Title>
              <Text type="secondary">{assessment.assessmentMetadata.questionCount} questions</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Top Recommendations */}
      <Card className="recommendations-card">
        <Title level={3}>🎯 Top Major Recommendations</Title>
        <List
          dataSource={topRecommendations}
          renderItem={(rec, index) => (
            <List.Item>
              <Card className="recommendation-item" style={{ width: '100%' }}>
                <Row gutter={[24, 16]}>
                  <Col xs={24} md={16}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar
                          style={{
                            backgroundColor: index < 3 ? '#8b0000' : '#d9d9d9',
                            color: 'white',
                          }}
                        >
                          {index + 1}
                        </Avatar>
                        <Title level={4} style={{ margin: 0 }}>
                          {rec.majorName}
                        </Title>
                        <Tag color={rec.fitScore >= 80 ? 'green' : rec.fitScore >= 60 ? 'orange' : 'default'}>
                          {rec.fitScore.toFixed(0)}% Match
                        </Tag>
                      </div>
                      <Paragraph style={{ margin: 0 }}>
                        {rec.explanation.whyFits}
                      </Paragraph>
                      <div>
                        <Text strong>Key Contributors: </Text>
                        {rec.explanation.keyContributors.map((contributor, i) => (
                          <Tag key={i} style={{ marginTop: 4 }}>
                            {contributor}
                          </Tag>
                        ))}
                      </div>
                      <div>
                        <Text strong>Academic Feasibility: </Text>
                        <Text>{rec.explanation.academicFeasibility}</Text>
                      </div>
                      {rec.explanation.nextSteps.length > 0 && (
                        <div>
                          <Text strong>Next Steps:</Text>
                          <ul style={{ marginTop: 8, marginBottom: 0 }}>
                            {rec.explanation.nextSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Space>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title="Fit Breakdown">
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <div>
                          <Text>Interest: </Text>
                          <Progress
                            percent={rec.fitBreakdown.interestFit}
                            size="small"
                            strokeColor="#8b0000"
                          />
                        </div>
                        <div>
                          <Text>Values: </Text>
                          <Progress
                            percent={rec.fitBreakdown.valuesFit}
                            size="small"
                            strokeColor="#8b0000"
                          />
                        </div>
                        <div>
                          <Text>Academic: </Text>
                          <Progress
                            percent={rec.fitBreakdown.academicFit}
                            size="small"
                            strokeColor="#8b0000"
                          />
                        </div>
                        <div>
                          <Text strong>Overall: </Text>
                          <Progress
                            percent={rec.fitBreakdown.overallFit}
                            size="small"
                            strokeColor="#10b981"
                          />
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      {/* Actions */}
      <Card>
        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <Button type="primary" size="large" onClick={onRetake}>
              <FontAwesomeIcon icon="redo" style={{ marginRight: 8 }} />
              Retake Assessment
            </Button>
            <Button size="large" onClick={() => window.print()}>
              <FontAwesomeIcon icon="print" style={{ marginRight: 8 }} />
              Print Results
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

