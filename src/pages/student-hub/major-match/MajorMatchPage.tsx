import React, { useState } from 'react';
import { Card, Button, Spin, Alert, Typography, List, Tag, Rate, Space, Divider, Empty, message } from 'antd';
import { useTranslation } from 'react-i18next';
import i18n from '../../../lib/i18n';
import { 
  useCreateMajorMatchMutation, 
  useGetMajorMatchSessionsQuery,
  useGetMajorMatchSessionQuery,
  useSubmitFeedbackMutation,
  MajorMatchSession 
} from '../../../app/services/api';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import { CalendarOutlined, GlobalOutlined, TrophyOutlined, LinkOutlined } from '@ant-design/icons';
import { formatLocaleDate } from '../../../utils/dateFormatter';
import './MajorMatchPage.scss';

const { Title, Text, Paragraph } = Typography;

const MajorMatchPage: React.FC = () => {
  const { t } = useTranslation();
  const { profile: studentProfile } = useStudentProfile();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useGetMajorMatchSessionsQuery();
  const { data: selectedSession, isLoading: sessionLoading } = useGetMajorMatchSessionQuery(selectedSessionId || '', {
    skip: !selectedSessionId,
  });
  
  const [createMajorMatch, { isLoading: creating }] = useCreateMajorMatchMutation();
  const [submitFeedback, { isLoading: submittingFeedback }] = useSubmitFeedbackMutation();

  const isProfileComplete = studentProfile?.completionPercentage === 100;

  const handleCreateAnalysis = async () => {
    try {
      const result = await createMajorMatch(undefined).unwrap();
      setSelectedSessionId(result.id);
      refetchSessions();
      message.success('Major match analysis completed successfully!');
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to create major match analysis';
      message.error({
        content: errorMessage,
        duration: 6, // Show for 6 seconds so user can read it
      });
      console.error('Major Match error:', error);
    }
  };

  const handleFeedback = async (sessionId: string, rating: number, comment?: string) => {
    try {
      await submitFeedback({ sessionId, data: { rating, comment } }).unwrap();
      message.success('Feedback submitted successfully!');
      refetchSessions();
    } catch (error: any) {
      message.error('Failed to submit feedback');
    }
  };

  if (!isProfileComplete) {
    return (
      <div className="major-match-page">
        <Card>
          <Empty
            description={
              <span>
                <Text strong>{t('studentHub.majorMatch.completeProfile')}</Text>
                <br />
                <Text type="secondary">{t('studentHub.majorMatch.currentCompletion', { percentage: studentProfile?.completionPercentage || 0 })}</Text>
              </span>
            }
          >
            <Button type="primary" onClick={() => window.location.href = '/student-hub/profile'}>
              {t('studentHub.majorMatch.goToProfile')}
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="major-match-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('studentHub.majorMatch.title')}</h1>
        <p className="page-subtitle">{t('studentHub.majorMatch.subtitle')}</p>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Action Card */}
        <Card>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Title level={4}>{t('studentHub.majorMatch.startNewAnalysis')}</Title>
              <Text type="secondary">
                {t('studentHub.majorMatch.startNewAnalysisDesc')}
              </Text>
            </div>
            <Button 
              type="primary" 
              size="large"
              onClick={handleCreateAnalysis}
              loading={creating}
              disabled={creating}
            >
              {creating ? t('studentHub.majorMatch.analyzing') : t('studentHub.majorMatch.startAnalysis')}
            </Button>
          </Space>
        </Card>

        {/* Sessions History */}
        {sessions.length > 0 && (
          <Card title={t('studentHub.majorMatch.analysisHistory', { count: sessions.length })}>
            <List
              dataSource={sessions}
              renderItem={(session) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link"
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      {t('studentHub.majorMatch.viewDetails')}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{t('studentHub.majorMatch.analysis', { number: sessions.length - sessions.indexOf(session) })}</Text>
                        <Tag color="blue">
                          {session.analysisResult?.suggestedMajors?.length || 0} {t('studentHub.majorMatch.majors')}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <CalendarOutlined />
                        <Text type="secondary">
                          {formatLocaleDate(session.createdAt, i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Selected Session Details */}
        {selectedSessionId && (
          <Card>
            {sessionLoading ? (
              <Spin size="large" />
            ) : selectedSession ? (
              <MajorMatchDetails 
                session={selectedSession}
                onFeedback={handleFeedback}
                submittingFeedback={submittingFeedback}
              />
            ) : null}
          </Card>
        )}

        {sessions.length === 0 && !creating && (
          <Card>
            <Empty description={t('studentHub.majorMatch.noSessions')} />
          </Card>
        )}
      </Space>
    </div>
  );
};

interface MajorMatchDetailsProps {
  session: MajorMatchSession;
  onFeedback: (sessionId: string, rating: number, comment?: string) => void;
  submittingFeedback: boolean;
}

const MajorMatchDetails: React.FC<MajorMatchDetailsProps> = ({ session, onFeedback, submittingFeedback }) => {
  const { t } = useTranslation();
  const { analysisResult } = session;
  const [feedbackRating, setFeedbackRating] = useState(session.feedbackRating || 0);
  const [feedbackComment, setFeedbackComment] = useState(session.feedbackComment || '');

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>{t('studentHub.majorMatch.analysisResults')}</Title>
        <Tag color="green">{session.processingTimeMs ? t('studentHub.majorMatch.processedIn', { time: (session.processingTimeMs / 1000).toFixed(1) }) : 'N/A'}</Tag>
      </div>

      {/* Suggested Majors */}
      <Card title={<><TrophyOutlined /> {t('studentHub.majorMatch.suggestedMajors')}</>} size="small">
        <List
          dataSource={analysisResult?.suggestedMajors || []}
          renderItem={(major: any, index: number) => (
            <List.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={4}>#{index + 1} {major.major}</Title>
                  <Space>
                    <Tag color="green">{t('studentHub.majorMatch.confidence', { percentage: (major.confidence * 100).toFixed(0) })}</Tag>
                    <Tag color="blue">{t('studentHub.majorMatch.alignment', { score: major.alignmentScore })}</Tag>
                  </Space>
                </div>
                <Paragraph>{major.reasoning}</Paragraph>
                {major.keyFactors && major.keyFactors.length > 0 && (
                  <div>
                    <Text strong>{t('studentHub.majorMatch.keyFactors')} </Text>
                    {major.keyFactors.map((factor: string, i: number) => (
                      <Tag key={i} style={{ marginTop: 4 }}>{factor}</Tag>
                    ))}
                  </div>
                )}
              </Space>
            </List.Item>
          )}
        />
      </Card>

      {/* Universities */}
      <Card title={<><GlobalOutlined /> {t('studentHub.majorMatch.recommendedUniversities')}</>} size="small">
        <List
          dataSource={analysisResult?.universities || []}
          renderItem={(university: any) => (
            <List.Item
              actions={[
                university.website && (
                  <Button 
                    type="link" 
                    icon={<LinkOutlined />}
                    href={university.website}
                    target="_blank"
                  >
                    {t('studentHub.majorMatch.website')}
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{university.name}</Text>
                    <Tag>{university.country}</Tag>
                    {university.ranking && <Tag color="purple">{university.ranking}</Tag>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    {university.programs && university.programs.length > 0 && (
                      <div>
                        <Text strong>{t('studentHub.majorMatch.programs')} </Text>
                        {university.programs.map((program: string, i: number) => (
                          <Tag key={i}>{program}</Tag>
                        ))}
                      </div>
                    )}
                    {university.tuitionInfo && (
                      <Text type="secondary">
                        {t('studentHub.majorMatch.tuition', { 
                          currency: university.tuitionInfo.currency || 'USD', 
                          amount: university.tuitionInfo.estimatedCost?.toLocaleString() || '0',
                          note: university.tuitionInfo.note || ''
                        })}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Scholarships */}
      {analysisResult?.scholarships && analysisResult.scholarships.length > 0 && (
        <Card title={<><TrophyOutlined /> {t('studentHub.majorMatch.availableScholarships')}</>} size="small">
          <List
            dataSource={analysisResult.scholarships}
            renderItem={(scholarship: any) => (
              <List.Item
                actions={[
                  scholarship.link && (
                    <Button 
                      type="link" 
                      icon={<LinkOutlined />}
                      href={scholarship.link}
                      target="_blank"
                    >
                      Apply
                    </Button>
                  )
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{scholarship.name}</Text>
                      {scholarship.amount && <Tag color="green">{scholarship.amount}</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Paragraph>{scholarship.description}</Paragraph>
                      {scholarship.eligibility && scholarship.eligibility.length > 0 && (
                        <div>
                          <Text strong>Eligibility: </Text>
                          <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                            {scholarship.eligibility.map((req: string, i: number) => (
                              <li key={i}><Text>{req}</Text></li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {scholarship.applicationDeadline && (
                        <Text type="secondary">
                          {t('studentHub.majorMatch.deadline', { date: formatLocaleDate(scholarship.applicationDeadline, i18n.language, { year: 'numeric', month: 'short', day: 'numeric' }) })}
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Overall Analysis */}
      {analysisResult?.overallAnalysis && (
        <Card title="Overall Analysis" size="small">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {analysisResult.overallAnalysis.profileStrengths && (
              <div>
                <Title level={5}>Profile Strengths</Title>
                <ul>
                  {analysisResult.overallAnalysis.profileStrengths.map((strength: string, i: number) => (
                    <li key={i}><Text>{strength}</Text></li>
                  ))}
                </ul>
              </div>
            )}
            {analysisResult.overallAnalysis.recommendedPath && (
              <div>
                <Title level={5}>Recommended Path</Title>
                <Paragraph>{analysisResult.overallAnalysis.recommendedPath}</Paragraph>
              </div>
            )}
          </Space>
        </Card>
      )}

      {/* Feedback Section */}
      <Divider />
      <Card title={t('studentHub.majorMatch.feedback')} size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>{t('studentHub.majorMatch.rateAnalysis')}: </Text>
            <Rate 
              value={feedbackRating} 
              onChange={(value) => {
                setFeedbackRating(value);
                onFeedback(session.id, value);
              }}
              disabled={submittingFeedback}
            />
          </div>
        </Space>
      </Card>
    </Space>
  );
};

export default MajorMatchPage;

