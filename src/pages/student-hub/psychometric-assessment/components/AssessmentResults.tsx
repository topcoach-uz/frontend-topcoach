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
import UnifiedIcon from '../../../../components/common/icons/UnifiedIcon';
import type {
  PsychometricAssessment,
  RecommendationsResponse,
} from '../../../../app/services/student-hub/psychometricApi';
import { RiasecRadarChart, RIASEC_DESCRIPTIONS } from './RiasecRadarChart';
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
  isGeneratingResults?: boolean; // True when initially completing, false when viewing existing
}

// Career path visualization component
const CareerPathCard: React.FC<{
  majorName: string;
  careers: string[];
  relatedMajors?: string[];
}> = ({ majorName, careers = [], relatedMajors }) => {
  const safeCareers = Array.isArray(careers) ? careers : [];
  const safeRelatedMajors = Array.isArray(relatedMajors) ? relatedMajors : [];
  if (safeCareers.length === 0 && safeRelatedMajors.length === 0) return null;
  return (
    <Card size="small" style={{ marginTop: 12 }}>
      <Title level={5} style={{ margin: '0 0 8px 0' }}>
        🚀 Career Paths for {majorName}
      </Title>
      {safeCareers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {safeCareers.map((career, i) => (
            <Tag key={i} color="blue">
              {typeof career === 'string' ? career : String(career)}
            </Tag>
          ))}
        </div>
      )}
      {safeRelatedMajors.length > 0 && (
        <>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Related Majors:
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {safeRelatedMajors.map((major, i) => (
              <Tag key={i} style={{ fontSize: 11 }}>
                {typeof major === 'string' ? major : String(major)}
              </Tag>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  assessment,
  recommendations,
  onRetake,
  onTakeAptitude,
  isLoading,
  isGeneratingResults = false,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMajor, setSelectedMajor] = useState<number | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonMajors, setComparisonMajors] = useState<number[]>([]);

  // Compute derived values with defensive null checks
  const derivedData = useMemo(() => {
    if (!assessment || !recommendations) return null;

    const recs = Array.isArray(recommendations.recommendations) ? recommendations.recommendations : [];
    const topMajors = recs
      .filter((rec) => rec && rec.majorName && rec.fitBreakdown)
      .slice(0, 5);

    const aptitudeTaken = assessment.aptitudeScores != null;
    const hasSTEMMajors = topMajors.some((rec) =>
      ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Data Science', 'Medicine'].some(
        (stem) => (rec?.majorName || '').includes(stem)
      )
    );

    // Calculate confidence level
    let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
    const confidenceScore = recommendations.confidenceScore ?? 70;
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: 16,
        textAlign: 'center',
        minHeight: 300,
      }}>
        <Spin size="large" />
        <div>
          <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
            {isGeneratingResults ? 'Analyzing Your Results...' : 'Loading Your Results...'}
          </Title>
          <Text type="secondary" style={{ display: 'block' }}>
            {isGeneratingResults 
              ? t('studentHub.psychometric.results.generatingInsights', 'Our AI is generating personalized insights and recommendations')
              : t('studentHub.psychometric.results.fetchingData', 'Fetching your assessment data and recommendations')}
          </Text>
        </div>
      </div>
    );
  }

  if (!assessment || !recommendations || !derivedData) {
    return (
      <Card>
        <Alert
          message={t('studentHub.psychometric.results.noResultsAvailable', 'No Results Available')}
          description={t('studentHub.psychometric.results.noResultsDescription', 'Assessment results are not available. Please complete an assessment first.')}
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
              🎉 {t('studentHub.psychometric.results.assessmentComplete', 'Your Assessment Complete!')}
            </Title>
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
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{t('studentHub.psychometric.results.yourRiasecCode', 'YOUR RIASEC CODE')}</Text>
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

      {/* RIASEC code explanation — simple, clear for high-school-age users */}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
        message={t('studentHub.psychometric.results.whatDoesRiasecMean', 'What does my RIASEC code mean?')}
        description={
          <div>
            <Paragraph style={{ margin: '0 0 12px 0', fontSize: 14 }}>
              {t('studentHub.psychometric.results.riasecExplanation', 'Your code {{code}} shows your top three interest types. RIASEC helps you explore majors and careers that fit you — especially useful when you\'re deciding what to study (e.g. in high school or before university).', { code: assessment.riasecCode })}
            </Paragraph>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px' }}>
              {(assessment.riasecCode || '')
                .split(/[- ]/)
                .map((letter) => letter.trim().toUpperCase())
                .filter(Boolean)
                .map((L) => {
                  const info = RIASEC_DESCRIPTIONS[L];
                  if (!info) return null;
                  return (
                    <div key={L} style={{ flex: '1 1 180px', maxWidth: 280 }}>
                      <Text strong style={{ color: '#8b0000' }}>{info.full} ({L})</Text>
                      <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{info.description}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        }
      />

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
                <UnifiedIcon name="compass" size="sm" color="primary" style={{ marginRight: 8 }} />
                {t('studentHub.psychometric.results.overview', 'Overview')}
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
                    <Title level={4}>📊 {t('studentHub.psychometric.results.quickSummary', 'Quick Summary')}</Title>
                    <Row gutter={[16, 16]}>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 700, color: '#8b0000' }}>
                            {topRecommendations.length}
                          </div>
                          <Text type="secondary">{t('studentHub.psychometric.results.majorMatches', 'Major Matches')}</Text>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>
                            {(topRecommendations[0]?.fitScore ?? 0).toFixed(0)}%
                          </div>
                          <Text type="secondary">{t('studentHub.psychometric.results.topMatchScore', 'Top Match Score')}</Text>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>
                            {recommendations?.assessmentSummary?.topInterests?.[0]?.dimension ?? t('common.notAvailable', 'N/A')}
                          </div>
                          <Text type="secondary">{t('studentHub.psychometric.results.topInterest', 'Top Interest')}</Text>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>
                            {derivedData.aptitudeTaken ? t('common.complete', 'Complete') : t('studentHub.psychometric.results.partial', 'Partial')}
                          </div>
                          <Text type="secondary">{t('studentHub.psychometric.assessment', 'Assessment')}</Text>
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
                <UnifiedIcon name="star" size="sm" color="primary" style={{ marginRight: 8 }} />
                {t('studentHub.psychometric.results.majorRecommendations', 'Major Recommendations')}
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
                    {t('studentHub.psychometric.results.compareMajors', 'Compare {{count}} Majors', { count: comparisonMajors.length })}
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
                                    color={(rec.fitScore ?? 0) >= 80 ? 'green' : (rec.fitScore ?? 0) >= 60 ? 'orange' : 'default'}
                                  >
                                    {(rec.fitScore ?? 0).toFixed(0)}% {t('studentHub.psychometric.results.match', 'Match')}
                                  </Tag>
                                  {rec.explanation?.confidence && (
                                    <Tag color="blue">{rec.explanation.confidence} {t('studentHub.psychometric.results.confidence', 'Confidence')}</Tag>
                                  )}
                                </div>
                              </div>

                              {rec.explanation?.whyFits && (
                                <Paragraph style={{ margin: '8px 0' }}>{rec.explanation.whyFits}</Paragraph>
                              )}

                              {(rec.explanation?.majorOverview || rec.majorProfile?.description) && (
                                <Paragraph type="secondary" style={{ margin: '4px 0 8px 0', fontSize: 14 }}>
                                  {rec.explanation?.majorOverview || rec.majorProfile?.description}
                                </Paragraph>
                              )}

                              {Array.isArray(rec.explanation?.keyContributors) && rec.explanation.keyContributors.length > 0 && (
                                <div>
                                  <Text strong>{t('studentHub.psychometric.results.keyContributors', 'Key Contributors:')} </Text>
                                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {rec.explanation.keyContributors.map((contributor, i) => (
                                      <Tag key={i} color="geekblue">
                                        {typeof contributor === 'string' ? contributor : String(contributor)}
                                      </Tag>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {rec.explanation?.academicFeasibility && (
                                <div style={{ marginTop: 8 }}>
                                  <Text strong>{t('studentHub.psychometric.results.academicFeasibility', 'Academic Feasibility:')} </Text>
                                  <Text>{rec.explanation.academicFeasibility}</Text>
                                </div>
                              )}

                              {Array.isArray(rec.explanation?.nextSteps) && rec.explanation.nextSteps.length > 0 && (
                                <div style={{ marginTop: 8 }} className="major-next-steps">
                                  <Text strong>{t('studentHub.psychometric.results.nextSteps', 'Next Steps:')}</Text>
                                  <ul className="major-next-steps-list">
                                    {rec.explanation.nextSteps.map((step, i) => (
                                      <li key={i}>{typeof step === 'string' ? step : String(step)}</li>
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
                            {rec.fitBreakdown && (
                              <Card size="small" title={t('studentHub.psychometric.results.fitBreakdown', 'Fit Breakdown')}>
                                <Space direction="vertical" style={{ width: '100%' }} size="small">
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Text>{t('studentHub.psychometric.results.interest', 'Interest')}</Text>
                                      <Text strong>{(rec.fitBreakdown.interestFit ?? 0).toFixed(0)}%</Text>
                                    </div>
                                    <Progress
                                      percent={rec.fitBreakdown.interestFit ?? 0}
                                      size="small"
                                      strokeColor="#8b0000"
                                      showInfo={false}
                                    />
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Text>{t('studentHub.psychometric.results.values', 'Values')}</Text>
                                      <Text strong>{(rec.fitBreakdown.valuesFit ?? 0).toFixed(0)}%</Text>
                                    </div>
                                    <Progress
                                      percent={rec.fitBreakdown.valuesFit ?? 0}
                                      size="small"
                                      strokeColor="#9333ea"
                                      showInfo={false}
                                    />
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Text>{t('studentHub.psychometric.results.workStyle', 'Work Style')}</Text>
                                      <Text strong>{(rec.fitBreakdown.workStyleFit ?? 0).toFixed(0)}%</Text>
                                    </div>
                                    <Progress
                                      percent={rec.fitBreakdown.workStyleFit ?? 0}
                                      size="small"
                                      strokeColor="#f59e0b"
                                      showInfo={false}
                                    />
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Text>{t('studentHub.psychometric.results.academic', 'Academic')}</Text>
                                      <Text strong>{(rec.fitBreakdown.academicFit ?? 0).toFixed(0)}%</Text>
                                    </div>
                                    <Progress
                                      percent={rec.fitBreakdown.academicFit ?? 0}
                                      size="small"
                                      strokeColor="#10b981"
                                      showInfo={false}
                                    />
                                  </div>
                                  {(rec.fitBreakdown.aptitudeFit ?? 0) > 0 && (
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text>{t('studentHub.psychometric.results.aptitude', 'Aptitude')}</Text>
                                        <Text strong>{(rec.fitBreakdown.aptitudeFit ?? 0).toFixed(0)}%</Text>
                                      </div>
                                      <Progress
                                        percent={rec.fitBreakdown.aptitudeFit ?? 0}
                                        size="small"
                                        strokeColor="#6366f1"
                                        showInfo={false}
                                      />
                                    </div>
                                  )}
                                  <Divider style={{ margin: '8px 0' }} />
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Text strong>{t('studentHub.psychometric.results.overall', 'Overall')}</Text>
                                      <Text strong style={{ color: '#10b981' }}>
                                        {(rec.fitBreakdown.overallFit ?? 0).toFixed(0)}%
                                      </Text>
                                    </div>
                                    <Progress
                                      percent={rec.fitBreakdown.overallFit ?? 0}
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
                            )}
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
            key: 'universities',
            label: (
              <span>
                <UnifiedIcon name="globe" size="sm" color="primary" style={{ marginRight: 8 }} />
                {t('studentHub.psychometric.results.universityMatches', 'University Matches')}
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
            {t('psychometric.retakeAssessment', 'Retake Assessment')}
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
