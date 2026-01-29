import React from 'react';
import { Card, Typography, Progress, Tooltip, Row, Col } from 'antd';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

const { Title, Text, Paragraph } = Typography;

interface BigFiveScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface WorkStyleProfile {
  preferredEnvironment?: 'structured' | 'flexible' | 'mixed';
  collaborationStyle?: 'independent' | 'team' | 'mixed';
  pacePreference?: 'fast' | 'moderate' | 'deliberate';
  leadershipTendency?: number;
  riskTolerance?: number;
}

interface BigFiveChartProps {
  scores: BigFiveScores;
  workStyleProfile?: WorkStyleProfile;
  variant?: 'radar' | 'bars' | 'detailed';
  height?: number;
}

// Big Five trait information with detailed descriptions
const BIG_FIVE_INFO: Record<
  string,
  {
    label: string;
    emoji: string;
    color: string;
    highLabel: string;
    lowLabel: string;
    description: string;
    highDescription: string;
    lowDescription: string;
  }
> = {
  openness: {
    label: 'Openness',
    emoji: '🌟',
    color: '#9333ea',
    highLabel: 'Creative & Curious',
    lowLabel: 'Practical & Traditional',
    description: 'Openness to new experiences, ideas, and creativity',
    highDescription: 'You love exploring new ideas, are imaginative, and embrace change.',
    lowDescription: 'You prefer familiar routines and practical, proven approaches.',
  },
  conscientiousness: {
    label: 'Conscientiousness',
    emoji: '🎯',
    color: '#10b981',
    highLabel: 'Organized & Disciplined',
    lowLabel: 'Flexible & Spontaneous',
    description: 'Self-discipline, organization, and goal-orientation',
    highDescription: 'You are highly organized, reliable, and persistent in achieving goals.',
    lowDescription: 'You prefer flexibility and may find strict schedules constraining.',
  },
  extraversion: {
    label: 'Extraversion',
    emoji: '🌞',
    color: '#f59e0b',
    highLabel: 'Outgoing & Energetic',
    lowLabel: 'Reserved & Reflective',
    description: 'Social energy and enthusiasm in social situations',
    highDescription: 'You thrive in social settings, are talkative, and energized by others.',
    lowDescription: 'You prefer quiet environments and recharge through solitary activities.',
  },
  agreeableness: {
    label: 'Agreeableness',
    emoji: '🤝',
    color: '#ec4899',
    highLabel: 'Cooperative & Trusting',
    lowLabel: 'Competitive & Skeptical',
    description: 'Tendency to be cooperative and compassionate vs competitive',
    highDescription: 'You are warm, trusting, and prioritize harmony in relationships.',
    lowDescription: 'You are more competitive and may challenge others\' ideas directly.',
  },
  neuroticism: {
    label: 'Emotional Stability',
    emoji: '⚖️',
    color: '#0ea5e9',
    highLabel: 'Sensitive & Aware',
    lowLabel: 'Calm & Resilient',
    description: 'Emotional sensitivity and stress response',
    highDescription: 'You are emotionally sensitive and may experience stress more intensely.',
    lowDescription: 'You remain calm under pressure and recover quickly from setbacks.',
  },
};

// Work style descriptions
const WORK_STYLE_DESCRIPTIONS = {
  preferredEnvironment: {
    structured: { label: 'Structured', description: 'Clear rules, defined processes', emoji: '📋' },
    flexible: { label: 'Flexible', description: 'Autonomy, creative freedom', emoji: '🎨' },
    mixed: { label: 'Balanced', description: 'Mix of structure and flexibility', emoji: '⚖️' },
  },
  collaborationStyle: {
    independent: { label: 'Independent', description: 'Work alone, focused time', emoji: '🧘' },
    team: { label: 'Team-Oriented', description: 'Collaborate, brainstorm together', emoji: '👥' },
    mixed: { label: 'Adaptable', description: 'Both solo and team work', emoji: '🔄' },
  },
  pacePreference: {
    fast: { label: 'Fast-Paced', description: 'Quick decisions, high energy', emoji: '⚡' },
    moderate: { label: 'Moderate', description: 'Balanced pace, thoughtful', emoji: '🎵' },
    deliberate: { label: 'Deliberate', description: 'Careful, thorough approach', emoji: '🔬' },
  },
};

export const BigFiveChart: React.FC<BigFiveChartProps> = ({
  scores,
  workStyleProfile,
  variant = 'detailed',
  height = 300,
}) => {
  // Transform scores for radar chart (invert neuroticism to show as "Emotional Stability")
  const chartData = [
    { trait: 'Openness', score: scores.openness, fullMark: 100 },
    { trait: 'Conscientiousness', score: scores.conscientiousness, fullMark: 100 },
    { trait: 'Extraversion', score: scores.extraversion, fullMark: 100 },
    { trait: 'Agreeableness', score: scores.agreeableness, fullMark: 100 },
    { trait: 'Emotional Stability', score: 100 - scores.neuroticism, fullMark: 100 },
  ];

  // Get trait interpretation
  const getTraitInterpretation = (key: string, value: number) => {
    const info = BIG_FIVE_INFO[key];
    if (key === 'neuroticism') {
      // Invert for display
      return value < 50 ? info.lowDescription : info.highDescription;
    }
    return value >= 50 ? info.highDescription : info.lowDescription;
  };

  const getTraitLabel = (key: string, value: number) => {
    const info = BIG_FIVE_INFO[key];
    if (key === 'neuroticism') {
      return value < 50 ? info.lowLabel : info.highLabel;
    }
    return value >= 50 ? info.highLabel : info.lowLabel;
  };

  if (variant === 'radar') {
    return (
      <Card>
        <Title level={4}>Personality Profile</Title>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Your Profile"
              dataKey="score"
              stroke="#8b0000"
              fill="#8b0000"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  if (variant === 'bars') {
    return (
      <Card>
        <Title level={4}>Personality Traits</Title>
        {Object.entries(BIG_FIVE_INFO).map(([key, info]) => {
          const value = key === 'neuroticism' ? 100 - scores[key as keyof BigFiveScores] : scores[key as keyof BigFiveScores];
          return (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>
                  {info.emoji} {key === 'neuroticism' ? 'Emotional Stability' : info.label}
                </Text>
                <Text type="secondary">{getTraitLabel(key, scores[key as keyof BigFiveScores])}</Text>
              </div>
              <Progress percent={value} strokeColor={info.color} showInfo />
            </div>
          );
        })}
      </Card>
    );
  }

  // Detailed variant (default)
  return (
    <Card className="big-five-chart-detailed">
      <Title level={4} style={{ marginBottom: 8 }}>
        Your Personality Profile
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Based on the Big Five personality model
      </Text>

      <Row gutter={[24, 24]}>
        {/* Radar chart */}
        <Col xs={24} md={12}>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="#e8e8e8" />
              <PolarAngleAxis
                dataKey="trait"
                tick={{ fontSize: 11, fill: '#333' }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#999' }}
                tickCount={5}
              />
              <Radar
                name="Your Profile"
                dataKey="score"
                stroke="#8b0000"
                fill="#8b0000"
                fillOpacity={0.35}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Col>

        {/* Trait details */}
        <Col xs={24} md={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(BIG_FIVE_INFO).map(([key, info]) => {
              const rawValue = scores[key as keyof BigFiveScores];
              const displayValue = key === 'neuroticism' ? 100 - rawValue : rawValue;
              const displayLabel = key === 'neuroticism' ? 'Emotional Stability' : info.label;

              return (
                <Tooltip
                  key={key}
                  title={getTraitInterpretation(key, rawValue)}
                  placement="left"
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#f9f9f9',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong>
                        {info.emoji} {displayLabel}
                      </Text>
                      <Text style={{ color: info.color, fontWeight: 600 }}>
                        {displayValue.toFixed(0)}%
                      </Text>
                    </div>
                    <Progress
                      percent={displayValue}
                      size="small"
                      strokeColor={info.color}
                      showInfo={false}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {getTraitLabel(key, rawValue)}
                    </Text>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </Col>
      </Row>

      {/* Work Style Summary */}
      {workStyleProfile && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
            borderRadius: 12,
          }}
        >
          <Title level={5} style={{ marginBottom: 16 }}>
            🏢 Your Work Style
          </Title>
          <Row gutter={[16, 16]}>
            {workStyleProfile.preferredEnvironment && (
              <Col xs={12} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>
                    {WORK_STYLE_DESCRIPTIONS.preferredEnvironment[workStyleProfile.preferredEnvironment].emoji}
                  </div>
                  <Text strong style={{ display: 'block' }}>
                    {WORK_STYLE_DESCRIPTIONS.preferredEnvironment[workStyleProfile.preferredEnvironment].label}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Environment
                  </Text>
                </div>
              </Col>
            )}
            {workStyleProfile.collaborationStyle && (
              <Col xs={12} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>
                    {WORK_STYLE_DESCRIPTIONS.collaborationStyle[workStyleProfile.collaborationStyle].emoji}
                  </div>
                  <Text strong style={{ display: 'block' }}>
                    {WORK_STYLE_DESCRIPTIONS.collaborationStyle[workStyleProfile.collaborationStyle].label}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Collaboration
                  </Text>
                </div>
              </Col>
            )}
            {workStyleProfile.pacePreference && (
              <Col xs={12} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>
                    {WORK_STYLE_DESCRIPTIONS.pacePreference[workStyleProfile.pacePreference].emoji}
                  </div>
                  <Text strong style={{ display: 'block' }}>
                    {WORK_STYLE_DESCRIPTIONS.pacePreference[workStyleProfile.pacePreference].label}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Pace
                  </Text>
                </div>
              </Col>
            )}
          </Row>

          {/* Leadership & Risk indicators */}
          {(workStyleProfile.leadershipTendency !== undefined || workStyleProfile.riskTolerance !== undefined) && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              {workStyleProfile.leadershipTendency !== undefined && (
                <Col xs={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Leadership Tendency
                  </Text>
                  <Progress
                    percent={workStyleProfile.leadershipTendency}
                    strokeColor="#8b0000"
                    size="small"
                  />
                </Col>
              )}
              {workStyleProfile.riskTolerance !== undefined && (
                <Col xs={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Risk Tolerance
                  </Text>
                  <Progress
                    percent={workStyleProfile.riskTolerance}
                    strokeColor="#f59e0b"
                    size="small"
                  />
                </Col>
              )}
            </Row>
          )}
        </div>
      )}
    </Card>
  );
};

export default BigFiveChart;

