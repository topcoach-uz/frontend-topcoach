import React, { useState } from 'react';
import { Card, Select, Button, Space, Spin, Alert, Empty, Progress, Tag, List, Collapse, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined,
  StarOutlined,
  BulbOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { 
  useGetStudentEssaysQuery,
  useGetEnhancedFeedbackQuery,
} from '../../../../app/services/student-hub/essayManagementApi';
import './AIFeedbackTab.scss';

const { Option } = Select;
const { Panel } = Collapse;

const AIFeedbackTab: React.FC = () => {
  const { t } = useTranslation();
  const [selectedEssayId, setSelectedEssayId] = useState<string | null>(null);
  
  const { data: essaysResponse, isLoading: essaysLoading } = useGetStudentEssaysQuery({ page: 1, limit: 100 });
  const { data: feedbackResponse, isLoading: feedbackLoading, refetch } = useGetEnhancedFeedbackQuery(
    selectedEssayId || '',
    { skip: !selectedEssayId }
  );

  const essays = essaysResponse?.data || [];
  const feedback = feedbackResponse?.data;

  const handleGetFeedback = () => {
    if (selectedEssayId) {
      refetch();
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'grammar': return <FileTextOutlined />;
      case 'clarity': return <BulbOutlined />;
      case 'structure': return <FileTextOutlined />;
      case 'tone': return <StarOutlined />;
      case 'content': return <BulbOutlined />;
      case 'style': return <StarOutlined />;
      default: return <BulbOutlined />;
    }
  };

  return (
    <div className="ai-feedback-tab">
      <Card 
        title={
          <Space>
            <BulbOutlined style={{ color: '#8b0000' }} />
            <span>AI Essay Feedback</span>
          </Space>
        }
        className="feedback-card"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Select an Essay to Analyze
            </label>
            <Select
              placeholder="Choose an essay to get AI feedback"
              style={{ width: '100%' }}
              size="large"
              value={selectedEssayId}
              onChange={setSelectedEssayId}
              loading={essaysLoading}
            >
              {essays.map(essay => (
                <Option key={essay.id} value={essay.id}>
                  {essay.title} ({essay.wordCount} words)
                </Option>
              ))}
            </Select>
          </div>

          {selectedEssayId && (
            <Button
              type="primary"
              onClick={handleGetFeedback}
              loading={feedbackLoading}
              size="large"
              style={{ backgroundColor: '#8b0000', borderColor: '#8b0000' }}
              icon={<BulbOutlined />}
            >
              Get AI Feedback
            </Button>
          )}

          {!selectedEssayId && essays.length === 0 && !essaysLoading && (
            <Empty
              description="No essays available. Create an essay first to get AI feedback."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Space>
      </Card>

      {/* Feedback Results */}
      {feedback && (
        <div className="feedback-results" style={{ marginTop: 24 }}>
          {/* Overall Score */}
          <Card className="overall-score-card">
            <div className="score-header">
              <h3>Overall Score</h3>
              <div className="score-display">
                <Progress
                  type="circle"
                  percent={feedback.overallScore ? feedback.overallScore * 10 : 0}
                  format={() => `${feedback.overallScore?.toFixed(1) || 0}/10`}
                  strokeColor={feedback.overallScore && feedback.overallScore >= 7 ? '#52c41a' : feedback.overallScore && feedback.overallScore >= 5 ? '#faad14' : '#ff4d4f'}
                  size={120}
                />
              </div>
            </div>
          </Card>

          {/* Detailed Scores */}
          <Card title="Detailed Scores" style={{ marginTop: 16 }}>
            <div className="score-grid">
              <div className="score-item">
                <span>Grammar</span>
                <Progress 
                  percent={feedback.grammarScore ? feedback.grammarScore * 10 : 0} 
                  status={getScoreColor(feedback.grammarScore) as any}
                  format={() => `${feedback.grammarScore?.toFixed(1) || 0}/10`}
                />
              </div>
              <div className="score-item">
                <span>Clarity</span>
                <Progress 
                  percent={feedback.clarityScore ? feedback.clarityScore * 10 : 0} 
                  status={getScoreColor(feedback.clarityScore) as any}
                  format={() => `${feedback.clarityScore?.toFixed(1) || 0}/10`}
                />
              </div>
              <div className="score-item">
                <span>Creativity</span>
                <Progress 
                  percent={feedback.creativityScore ? feedback.creativityScore * 10 : 0} 
                  status={getScoreColor(feedback.creativityScore) as any}
                  format={() => `${feedback.creativityScore?.toFixed(1) || 0}/10`}
                />
              </div>
              <div className="score-item">
                <span>Structure</span>
                <Progress 
                  percent={feedback.structureScore ? feedback.structureScore * 10 : 0} 
                  status={getScoreColor(feedback.structureScore) as any}
                  format={() => `${feedback.structureScore?.toFixed(1) || 0}/10`}
                />
              </div>
              <div className="score-item">
                <span>Coherence</span>
                <Progress 
                  percent={feedback.coherenceScore ? feedback.coherenceScore * 10 : 0} 
                  status={getScoreColor(feedback.coherenceScore) as any}
                  format={() => `${feedback.coherenceScore?.toFixed(1) || 0}/10`}
                />
              </div>
              <div className="score-item">
                <span>Argument Strength</span>
                <Progress 
                  percent={feedback.argumentStrength ? feedback.argumentStrength * 10 : 0} 
                  status={getScoreColor(feedback.argumentStrength) as any}
                  format={() => `${feedback.argumentStrength?.toFixed(1) || 0}/10`}
                />
              </div>
            </div>
          </Card>

          {/* Strengths */}
          {feedback.strengths && feedback.strengths.length > 0 && (
            <Card 
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>Strengths</span>
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              <List
                dataSource={feedback.strengths}
                renderItem={(strength: string) => (
                  <List.Item>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <span>{strength}</span>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Weaknesses */}
          {feedback.weaknesses && feedback.weaknesses.length > 0 && (
            <Card 
              title={
                <Space>
                  <WarningOutlined style={{ color: '#faad14' }} />
                  <span>Areas for Improvement</span>
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              <List
                dataSource={feedback.weaknesses}
                renderItem={(weakness: string) => (
                  <List.Item>
                    <Space>
                      <WarningOutlined style={{ color: '#faad14' }} />
                      <span>{weakness}</span>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Suggestions */}
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <Card 
              title={
                <Space>
                  <BulbOutlined style={{ color: '#8b0000' }} />
                  <span>Specific Suggestions</span>
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              <List
                dataSource={feedback.suggestions}
                renderItem={(suggestion: any) => (
                  <List.Item>
                    <div style={{ width: '100%' }}>
                      <Space style={{ marginBottom: 8 }}>
                        {getTypeIcon(suggestion.type)}
                        <Tag color={getSeverityColor(suggestion.severity)}>
                          {suggestion.severity.toUpperCase()}
                        </Tag>
                        <Tag>{suggestion.type}</Tag>
                      </Space>
                      <div style={{ marginLeft: 24 }}>
                        <p style={{ marginBottom: 4 }}>{suggestion.text}</p>
                        {suggestion.example && (
                          <Alert
                            message="Example"
                            description={suggestion.example}
                            type="info"
                            showIcon
                            style={{ marginTop: 8 }}
                          />
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* Detailed Analysis */}
          {feedback.detailedAnalysis && (
            <Card 
              title="Section-by-Section Analysis"
              style={{ marginTop: 16 }}
            >
              <Collapse>
                {feedback.detailedAnalysis.introduction && (
                  <Panel 
                    header={
                      <Space>
                        <span>Introduction</span>
                        <Tag color={getScoreColor(feedback.detailedAnalysis.introduction.score)}>
                          Score: {feedback.detailedAnalysis.introduction.score}/10
                        </Tag>
                      </Space>
                    } 
                    key="introduction"
                  >
                    <p>{feedback.detailedAnalysis.introduction.feedback}</p>
                  </Panel>
                )}
                {feedback.detailedAnalysis.body && feedback.detailedAnalysis.body.map((para: any) => (
                  <Panel
                    key={para.paragraph}
                    header={
                      <Space>
                        <span>Body Paragraph {para.paragraph}</span>
                        <Tag color={getScoreColor(para.score)}>
                          Score: {para.score}/10
                        </Tag>
                      </Space>
                    }
                  >
                    <p>{para.feedback}</p>
                  </Panel>
                ))}
                {feedback.detailedAnalysis.conclusion && (
                  <Panel
                    header={
                      <Space>
                        <span>Conclusion</span>
                        <Tag color={getScoreColor(feedback.detailedAnalysis.conclusion.score)}>
                          Score: {feedback.detailedAnalysis.conclusion.score}/10
                        </Tag>
                      </Space>
                    }
                    key="conclusion"
                  >
                    <p>{feedback.detailedAnalysis.conclusion.feedback}</p>
                  </Panel>
                )}
              </Collapse>
            </Card>
          )}

          {feedback.lastAnalyzed && (
            <div style={{ marginTop: 16, textAlign: 'right', color: '#8b8b8b', fontSize: 12 }}>
              Last analyzed: {new Date(feedback.lastAnalyzed).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {feedbackLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Analyzing your essay...</p>
        </div>
      )}
    </div>
  );
};

export default AIFeedbackTab;

