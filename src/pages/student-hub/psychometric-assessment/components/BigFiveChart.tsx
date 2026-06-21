import React from 'react';
import { Tooltip } from 'antd';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import {
  Sparkles,
  Target,
  Sun,
  Handshake,
  Anchor,
  ClipboardList,
  Palette,
  Scale,
  User,
  Users,
  RefreshCw,
  Zap,
  Gauge,
  Microscope,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

const MM_BRAND = '#7b1f2f';
const MM_INK = '#1c1a17';
const MM_MUTED = '#6b6258';
const MM_HAIRLINE = '#e5e3da';

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
    Icon: LucideIcon;
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
    Icon: Sparkles,
    color: '#9333ea',
    highLabel: 'Creative & Curious',
    lowLabel: 'Practical & Traditional',
    description: 'Openness to new experiences, ideas, and creativity',
    highDescription: 'You love exploring new ideas, are imaginative, and embrace change.',
    lowDescription: 'You prefer familiar routines and practical, proven approaches.',
  },
  conscientiousness: {
    label: 'Conscientiousness',
    Icon: Target,
    color: '#10b981',
    highLabel: 'Organized & Disciplined',
    lowLabel: 'Flexible & Spontaneous',
    description: 'Self-discipline, organization, and goal-orientation',
    highDescription: 'You are highly organized, reliable, and persistent in achieving goals.',
    lowDescription: 'You prefer flexibility and may find strict schedules constraining.',
  },
  extraversion: {
    label: 'Extraversion',
    Icon: Sun,
    color: '#f59e0b',
    highLabel: 'Outgoing & Energetic',
    lowLabel: 'Reserved & Reflective',
    description: 'Social energy and enthusiasm in social situations',
    highDescription: 'You thrive in social settings, are talkative, and energized by others.',
    lowDescription: 'You prefer quiet environments and recharge through solitary activities.',
  },
  agreeableness: {
    label: 'Agreeableness',
    Icon: Handshake,
    color: '#ec4899',
    highLabel: 'Cooperative & Trusting',
    lowLabel: 'Competitive & Skeptical',
    description: 'Tendency to be cooperative and compassionate vs competitive',
    highDescription: 'You are warm, trusting, and prioritize harmony in relationships.',
    lowDescription: 'You are more competitive and may challenge others\' ideas directly.',
  },
  neuroticism: {
    label: 'Emotional Stability',
    Icon: Anchor,
    color: '#0ea5e9',
    highLabel: 'Sensitive & Aware',
    lowLabel: 'Calm & Resilient',
    description: 'Emotional sensitivity and stress response',
    highDescription: 'You are emotionally sensitive and may experience stress more intensely.',
    lowDescription: 'You remain calm under pressure and recover quickly from setbacks.',
  },
};

// Work style descriptions
const WORK_STYLE_DESCRIPTIONS: Record<
  string,
  Record<string, { label: string; description: string; Icon: LucideIcon }>
> = {
  preferredEnvironment: {
    structured: { label: 'Structured', description: 'Clear rules, defined processes', Icon: ClipboardList },
    flexible: { label: 'Flexible', description: 'Autonomy, creative freedom', Icon: Palette },
    mixed: { label: 'Balanced', description: 'Mix of structure and flexibility', Icon: Scale },
  },
  collaborationStyle: {
    independent: { label: 'Independent', description: 'Work alone, focused time', Icon: User },
    team: { label: 'Team-Oriented', description: 'Collaborate, brainstorm together', Icon: Users },
    mixed: { label: 'Adaptable', description: 'Both solo and team work', Icon: RefreshCw },
  },
  pacePreference: {
    fast: { label: 'Fast-Paced', description: 'Quick decisions, high energy', Icon: Zap },
    moderate: { label: 'Moderate', description: 'Balanced pace, thoughtful', Icon: Gauge },
    deliberate: { label: 'Deliberate', description: 'Careful, thorough approach', Icon: Microscope },
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
      <div className="majormatch-results__card">
        <h4 className="majormatch-results__card-title">Personality Profile</h4>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={chartData}>
            <PolarGrid stroke={MM_HAIRLINE} />
            <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12, fill: MM_INK }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: MM_MUTED }} />
            <Radar
              name="Your Profile"
              dataKey="score"
              stroke={MM_BRAND}
              fill={MM_BRAND}
              fillOpacity={0.18}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className="majormatch-results__card">
        <h4 className="majormatch-results__card-title">Personality Traits</h4>
        {Object.entries(BIG_FIVE_INFO).map(([key, info]) => {
          const value = key === 'neuroticism' ? 100 - scores[key as keyof BigFiveScores] : scores[key as keyof BigFiveScores];
          return (
            <div key={key} className="majormatch-results__meter">
              <div className="majormatch-results__meter-head">
                <span className="majormatch-results__meter-label" style={{ fontWeight: 600, color: MM_INK }}>
                  {info.Icon ? (
                    <info.Icon size={14} style={{ color: info.color, marginRight: 4, verticalAlign: '-2px' }} />
                  ) : null}
                  {key === 'neuroticism' ? 'Emotional Stability' : info.label}
                </span>
                <span className="majormatch-results__meter-value" style={{ fontWeight: 400, color: MM_MUTED, fontFamily: 'inherit' }}>
                  {getTraitLabel(key, scores[key as keyof BigFiveScores])}
                </span>
              </div>
              <div className="majormatch-results__meter-track">
                <div
                  className="majormatch-results__meter-fill"
                  style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: info.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Detailed variant (default)
  return (
    <div className="majormatch-results__card big-five-chart-detailed">
      <h4 className="majormatch-results__card-title">Your Personality Profile</h4>
      <p className="majormatch-results__card-sub">
        Based on the Big Five personality model
      </p>

      <div className="majormatch-results__grid-2" style={{ marginTop: 0 }}>
        {/* Radar chart */}
        <div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={chartData}>
              <PolarGrid stroke={MM_HAIRLINE} />
              <PolarAngleAxis
                dataKey="trait"
                tick={{ fontSize: 11, fill: MM_INK }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: MM_MUTED }}
                tickCount={5}
              />
              <Radar
                name="Your Profile"
                dataKey="score"
                stroke={MM_BRAND}
                fill={MM_BRAND}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Trait details */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: '#fff',
                      border: `1px solid ${MM_HAIRLINE}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div className="majormatch-results__meter-head">
                      <span className="majormatch-results__meter-label" style={{ fontWeight: 600, color: MM_INK }}>
                        {info.Icon ? (
                          <info.Icon size={14} style={{ color: info.color, marginRight: 4, verticalAlign: '-2px' }} />
                        ) : null}
                        {displayLabel}
                      </span>
                      <span className="majormatch-results__meter-value">{displayValue.toFixed(0)}%</span>
                    </div>
                    <div className="majormatch-results__meter-track">
                      <div
                        className="majormatch-results__meter-fill"
                        style={{ width: `${Math.max(0, Math.min(100, displayValue))}%`, background: info.color }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: MM_MUTED, marginTop: 5 }}>
                      {getTraitLabel(key, rawValue)}
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      {/* Work Style Summary */}
      {workStyleProfile && (
        <div className="majormatch-results__workstyle">
          <h5 className="majormatch-results__rec-block-label" style={{ marginBottom: 12 }}>
            <Briefcase size={16} style={{ color: MM_BRAND, marginRight: 6, verticalAlign: '-2px' }} />
            Your Work Style
          </h5>
          <div className="majormatch-results__workstyle-grid">
            {workStyleProfile.preferredEnvironment && (() => {
              const item = WORK_STYLE_DESCRIPTIONS.preferredEnvironment[workStyleProfile.preferredEnvironment];
              return (
                <div className="majormatch-results__workstyle-item">
                  <div style={{ marginBottom: 4 }}>
                    {item.Icon ? <item.Icon size={24} style={{ color: MM_BRAND }} /> : null}
                  </div>
                  <div className="majormatch-results__workstyle-name">{item.label}</div>
                  <div className="majormatch-results__workstyle-label">Environment</div>
                </div>
              );
            })()}
            {workStyleProfile.collaborationStyle && (() => {
              const item = WORK_STYLE_DESCRIPTIONS.collaborationStyle[workStyleProfile.collaborationStyle];
              return (
                <div className="majormatch-results__workstyle-item">
                  <div style={{ marginBottom: 4 }}>
                    {item.Icon ? <item.Icon size={24} style={{ color: MM_BRAND }} /> : null}
                  </div>
                  <div className="majormatch-results__workstyle-name">{item.label}</div>
                  <div className="majormatch-results__workstyle-label">Collaboration</div>
                </div>
              );
            })()}
            {workStyleProfile.pacePreference && (() => {
              const item = WORK_STYLE_DESCRIPTIONS.pacePreference[workStyleProfile.pacePreference];
              return (
                <div className="majormatch-results__workstyle-item">
                  <div style={{ marginBottom: 4 }}>
                    {item.Icon ? <item.Icon size={24} style={{ color: MM_BRAND }} /> : null}
                  </div>
                  <div className="majormatch-results__workstyle-name">{item.label}</div>
                  <div className="majormatch-results__workstyle-label">Pace</div>
                </div>
              );
            })()}
          </div>

          {/* Leadership & Risk indicators */}
          {(workStyleProfile.leadershipTendency !== undefined || workStyleProfile.riskTolerance !== undefined) && (
            <div className="majormatch-results__grid-2" style={{ marginTop: 16 }}>
              {workStyleProfile.leadershipTendency !== undefined && (
                <div className="majormatch-results__meter">
                  <div className="majormatch-results__meter-head">
                    <span className="majormatch-results__meter-label">Leadership Tendency</span>
                    <span className="majormatch-results__meter-value">
                      {workStyleProfile.leadershipTendency.toFixed(0)}%
                    </span>
                  </div>
                  <div className="majormatch-results__meter-track">
                    <div
                      className="majormatch-results__meter-fill"
                      style={{ width: `${Math.max(0, Math.min(100, workStyleProfile.leadershipTendency))}%` }}
                    />
                  </div>
                </div>
              )}
              {workStyleProfile.riskTolerance !== undefined && (
                <div className="majormatch-results__meter">
                  <div className="majormatch-results__meter-head">
                    <span className="majormatch-results__meter-label">Risk Tolerance</span>
                    <span className="majormatch-results__meter-value">
                      {workStyleProfile.riskTolerance.toFixed(0)}%
                    </span>
                  </div>
                  <div className="majormatch-results__meter-track">
                    <div
                      className="majormatch-results__meter-fill majormatch-results__meter-fill--amber"
                      style={{ width: `${Math.max(0, Math.min(100, workStyleProfile.riskTolerance))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BigFiveChart;

