import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Tag,
  Progress,
  List,
  Avatar,
  Space,
  Spin,
  Alert,
  Tabs,
  Divider,
  Modal,
} from 'antd';
import { useTranslation } from 'react-i18next';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import type {
  PsychometricAssessment,
  RecommendationsResponse,
} from '../../../../app/services/student-hub/psychometricApi';
import { RiasecRadarChart } from './RiasecRadarChart';
import { ValuesChart } from './ValuesChart';
import { BigFiveChart } from './BigFiveChart';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { PdfExport } from './PdfExport';
import { UniversityMatches } from './UniversityMatches';

const { Title, Paragraph, Text } = Typography;

interface AssessmentResultsProps {
  assessmentId: string;
  studentProfileId: string;
  assessment?: PsychometricAssessment;
  recommendations?: RecommendationsResponse;
  onRetake: () => void;
  onTakeAptitude?: () => void;
  isLoading: boolean;
}

// Career path visualization component
const CareerPathCard: React.FC<{
  majorName: string;
  careers: string[];
  relatedMajors?: string[];
}> = ({ majorName, careers, relatedMajors }) => (
  <Card size="small" style={{ marginTop: 12 }}>
    <Title level={5} style={{ margin: '0 0 8px 0' }}>
      🚀 Career Paths for {majorName}
    </Title>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {careers.map((career, i) => (
        <Tag key={i} color="blue">
          {career}
        </Tag>
      ))}
    </div>
    {relatedMajors && relatedMajors.length > 0 && (
      <>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Related Majors:
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {relatedMajors.map((major, i) => (
            <Tag key={i} style={{ fontSize: 11 }}>
              {major}
            </Tag>
          ))}
        </div>
      </>
    )}
  </Card>
);

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  assessment,
  recommendations,
  onRetake,
  onTakeAptitude,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonMajors, setComparisonMajors] = useState<number[]>([]);

  // Compute derived values
  const derivedData = useMemo(() => {
    if (!assessment || !recommendations) return null;

    const aptitudeTaken = assessment.aptitudeScores !== null && assessment.aptitudeScores !== undefined;
    const topMajors = recommendations.recommendations.slice(0, 5);
    const hasSTEMMajors = topMajors.some((rec) =>
      ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Data Science', 'Medicine'].some(
        (stem) => rec.majorName.includes(stem)
      )
    );

    // Calculate confidence level
    let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
    const confidenceScore = recommendations.confidenceScore || 70;
    if (confidenceScore >= 80) confidenceLevel = 'high';
    else if (confidenceScore >= 60) confidenceLevel = 'medium';
    else confidenceLevel = 'low';

    return {
      aptitudeTaken,
      topMajors,
      hasSTEMMajors,
      confidenceLevel,
      confidenceScore,
    };
  }, [assessment, recommendations]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spin size="large" />
        <Title level={4} style={{ marginTop: 24 }}>
          Analyzing Your Results...
        </Title>
        <Text type="secondary">Our AI is generating personalized insights</Text>
      </div>
    );
  }

  if (!assessment || !recommendations || !derivedData) {
    return (
      <Card>
        <Alert
          message="No Results Available"
          description="Assessment results are not available. Please complete an assessment first."
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  const topRecommendations = derivedData.topMajors;

  return (
    <div className="assessment-results">
      {/* Header with key stats */}
      <Card
        className="results-header-card"
        style={{
          background: 'linear-gradient(135deg, #8b0000 0%, #dc143c 100%)',
          color: 'white',
          marginBottom: 24,
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              🎉 Your Assessment Complete!
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, margin: '8px 0 0 0' }}>
              Based on {assessment.assessmentMetadata?.questionCount || 0} questions answered in{' '}
              {Math.round((assessment.assessmentMetadata?.completionTime || 0) / 60)} minutes
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                padding: 16,
                textAlign: 'center',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>YOUR RIASEC CODE</Text>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: 4,
                  color: 'white',
                }}
              >
                {assessment.riasecCode}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Tabs for different views */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <FontAwesomeIcon icon="chart-pie" style={{ marginRight: 8 }} />
                Overview
              </span>
            ),
            children: (
              <Row gutter={[24, 24]}>
                {/* RIASEC Radar Chart */}
                <Col xs={24} lg={14}>
                  <RiasecRadarChart
                    scores={assessment.riasecScores}
                    riasecCode={assessment.riasecCode}
                    height={350}
                  />
                </Col>

                {/* Confidence Indicator */}
                <Col xs={24} lg={10}>
                  <ConfidenceIndicator
                    confidenceLevel={derivedData.confidenceLevel}
                    confidenceScore={derivedData.confidenceScore}
                    aptitudeTaken={derivedData.aptitudeTaken}
                    hasSTEMMajors={derivedData.hasSTEMMajors}
                    riskFlags={assessment.riskFlags || []}
                    academicConfidenceScore={assessment.academicConfidenceScore}
                    onBoostAccuracy={onTakeAptitude}
                  />
                </Col>

                {/* Values Chart */}
                <Col xs={24} lg={12}>
                  <ValuesChart scores={assessment.valuesScores} variant="horizontal" height={280} />
                </Col>

                {/* Big Five Chart */}
                <Col xs={24} lg={12}>
                  <BigFiveChart
                    scores={assessment.bigFiveScores}
                    workStyleProfile={assessment.workStyleProfile}
                    variant="detailed"
                  />
                </Col>

                {/* Quick Summary */}
                <Col xs={24}>
                  <Card>
                    <Title level={4}>📊 Quick Summary</Title>
                    <Row gutter={[16, 16]}>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 700, color: '#8b0000' }}>
                            {topRecommendations.length}
                          </div>
                          <Text type="secondary">Major Matches</Text>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>
                            {topRecommendations[0]?.fitScore.toFixed(0)}%
                          </div>
                          <Text type="secondary">Top Match Score</Text>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>
                            {recommendations.assessmentSummary.topInterests[0]?.dimension || 'N/A'}
                          </div>
                          <Text type="secondary">Top Interest</Text>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>
                            {derivedData.aptitudeTaken ? 'Complete' : 'Partial'}
                          </div>
                          <Text type="secondary">Assessment</Text>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'majors',
            label: (
              <span>
                <FontAwesomeIcon icon="graduation-cap" style={{ marginRight: 8 }} />
                Major Recommendations
              </span>
            ),
            children: (
              <div>
                {/* Comparison button */}
                {comparisonMajors.length >= 2 && (
                  <Button
                    type="primary"
                    style={{ marginBottom: 16 }}
                    onClick={() => setShowComparisonModal(true)}
                  >
                    Compare {comparisonMajors.length} Majors
                  </Button>
                )}

                <List
                  dataSource={topRecommendations}
                  renderItem={(rec, index) => (
                    <List.Item style={{ padding: 0, marginBottom: 16, border: 'none' }}>
                      <Card
                        className="recommendation-item"
                        style={{
                          width: '100%',
                          border: selectedMajor === index ? '2px solid #8b0000' : '1px solid #e8e8e8',
                        }}
                        onClick={() => setSelectedMajor(selectedMajor === index ? null : index)}
                      >
                        <Row gutter={[24, 16]}>
                          <Col xs={24} md={16}>
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Avatar
                                  size={48}
                                  style={{
                                    backgroundColor: index < 3 ? '#8b0000' : '#d9d9d9',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: 20,
                                  }}
                                >
                                  {index + 1}
                                </Avatar>
                                <div>
                                  <Title level={4} style={{ margin: 0 }}>
                                    {rec.majorName}
                                  </Title>
                                  <Tag
                                    color={rec.fitScore >= 80 ? 'green' : rec.fitScore >= 60 ? 'orange' : 'default'}
                                  >
                                    {rec.fitScore.toFixed(0)}% Match
                                  </Tag>
                                  {rec.explanation?.confidence && (
                                    <Tag color="blue">{rec.explanation.confidence} Confidence</Tag>
                                  )}
                                </div>
                              </div>

                              {rec.explanation?.whyFits && (
                                <Paragraph style={{ margin: '8px 0' }}>{rec.explanation.whyFits}</Paragraph>
                              )}

                              {rec.explanation?.keyContributors && rec.explanation.keyContributors.length > 0 && (
                                <div>
                                  <Text strong>Key Contributors: </Text>
                                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {rec.explanation.keyContributors.map((contributor, i) => (
                                      <Tag key={i} color="geekblue">
                                        {contributor}
                                      </Tag>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {rec.explanation?.academicFeasibility && (
                                <div style={{ marginTop: 8 }}>
                                  <Text strong>Academic Feasibility: </Text>
                                  <Text>{rec.explanation.academicFeasibility}</Text>
                                </div>
                              )}

                              {rec.explanation?.nextSteps && rec.explanation.nextSteps.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                  <Text strong>Next Steps:</Text>
                                  <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                                    {rec.explanation.nextSteps.map((step, i) => (
                                      <li key={i}>{step}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Career paths (always shown for all majors) */}
                              {rec.majorProfile && (
                                <CareerPathCard
                                  majorName={rec.majorName}
                                  careers={rec.majorProfile.relatedCareers || []}
                                  relatedMajors={rec.majorProfile.relatedMajors}
                                />
                              )}
                            </Space>
                          </Col>

                          <Col xs={24} md={8}>
                            <Card size="small" title="Fit Breakdown">
                              <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Interest</Text>
                                    <Text strong>{rec.fitBreakdown.interestFit.toFixed(0)}%</Text>
                                  </div>
                                  <Progress
                                    percent={rec.fitBreakdown.interestFit}
                                    size="small"
                                    strokeColor="#8b0000"
                                    showInfo={false}
                                  />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Values</Text>
                                    <Text strong>{rec.fitBreakdown.valuesFit.toFixed(0)}%</Text>
                                  </div>
                                  <Progress
                                    percent={rec.fitBreakdown.valuesFit}
                                    size="small"
                                    strokeColor="#9333ea"
                                    showInfo={false}
                                  />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Work Style</Text>
                                    <Text strong>{rec.fitBreakdown.workStyleFit?.toFixed(0) || 0}%</Text>
                                  </div>
                                  <Progress
                                    percent={rec.fitBreakdown.workStyleFit || 0}
                                    size="small"
                                    strokeColor="#f59e0b"
                                    showInfo={false}
                                  />
                                </div>
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text>Academic</Text>
                                    <Text strong>{rec.fitBreakdown.academicFit.toFixed(0)}%</Text>
                                  </div>
                                  <Progress
                                    percent={rec.fitBreakdown.academicFit}
                                    size="small"
                                    strokeColor="#10b981"
                                    showInfo={false}
                                  />
                                </div>
                                {rec.fitBreakdown.aptitudeFit !== undefined && rec.fitBreakdown.aptitudeFit > 0 && (
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Text>Aptitude</Text>
                                      <Text strong>{rec.fitBreakdown.aptitudeFit.toFixed(0)}%</Text>
                                    </div>
                                    <Progress
                                      percent={rec.fitBreakdown.aptitudeFit}
                                      size="small"
                                      strokeColor="#6366f1"
                                      showInfo={false}
                                    />
                                  </div>
                                )}
                                <Divider style={{ margin: '8px 0' }} />
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text strong>Overall</Text>
                                    <Text strong style={{ color: '#10b981' }}>
                                      {rec.fitBreakdown.overallFit.toFixed(0)}%
                                    </Text>
                                  </div>
                                  <Progress
                                    percent={rec.fitBreakdown.overallFit}
                                    size="small"
                                    strokeColor={{
                                      '0%': '#10b981',
                                      '100%': '#059669',
                                    }}
                                    showInfo={false}
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
              </div>
            ),
          },
          {
            key: 'personality',
            label: (
              <span>
                <FontAwesomeIcon icon="brain" style={{ marginRight: 8 }} />
                Personality Deep Dive
              </span>
            ),
            children: (
              <Row gutter={[24, 24]}>
                <Col xs={24}>
                  <BigFiveChart
                    scores={assessment.bigFiveScores}
                    workStyleProfile={assessment.workStyleProfile}
                    variant="detailed"
                    height={350}
                  />
                </Col>
                <Col xs={24}>
                  <ValuesChart scores={assessment.valuesScores} variant="horizontal" height={350} />
                </Col>
              </Row>
            ),
          },
          {
            key: 'universities',
            label: (
              <span>
                <FontAwesomeIcon icon="university" style={{ marginRight: 8 }} />
                University Matches
              </span>
            ),
            children: (
              <UniversityMatches
                assessment={assessment}
                recommendations={recommendations}
                maxDisplay={6}
              />
            ),
          },
        ]}
      />

      {/* Actions */}
      <Card style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
          <Button type="primary" size="large" onClick={onRetake}>
            <FontAwesomeIcon icon="redo" style={{ marginRight: 8 }} />
            Retake Assessment
          </Button>
          {/* PDF Export temporarily hidden */}
          {/* <PdfExport assessment={assessment} recommendations={recommendations} /> */}
        </div>
      </Card>

      {/* Comparison Modal */}
      <Modal
        title="Compare Majors"
        open={showComparisonModal}
        onCancel={() => setShowComparisonModal(false)}
        width={900}
        footer={null}
      >
        <Row gutter={16}>
          {comparisonMajors.map((idx) => {
            const rec = topRecommendations[idx];
            if (!rec) return null;
            return (
              <Col key={idx} xs={24} md={12}>
                <Card title={rec.majorName}>
                  <p>
                    <strong>Fit Score:</strong> {rec.fitScore.toFixed(0)}%
                  </p>
                  {rec.explanation?.whyFits && (
                    <p>
                      <strong>Why it fits:</strong> {rec.explanation.whyFits}
                    </p>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      </Modal>
    </div>
  );
};

export default AssessmentResults;
