import React from 'react';
import { Card, Typography, Progress, Tooltip } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

const { Title, Text } = Typography;

interface ValuesScores {
  achievement: number;
  creativity: number;
  helpingOthers: number;
  independence: number;
  security: number;
  prestige: number;
  workLifeBalance?: number;
  intellectualStimulation?: number;
}

interface ValuesChartProps {
  scores: ValuesScores;
  variant?: 'bars' | 'horizontal' | 'compact';
  height?: number;
}

// Values metadata with icons and descriptions
const VALUES_INFO: Record<string, { label: string; emoji: string; description: string; color: string }> = {
  achievement: {
    label: 'Achievement',
    emoji: '🏆',
    description: 'Drive to accomplish goals and be recognized for success',
    color: '#8b0000',
  },
  creativity: {
    label: 'Creativity',
    emoji: '🎨',
    description: 'Desire to create, innovate, and express original ideas',
    color: '#9333ea',
  },
  helpingOthers: {
    label: 'Helping Others',
    emoji: '💝',
    description: 'Motivation to support, care for, and make a difference',
    color: '#ec4899',
  },
  independence: {
    label: 'Independence',
    emoji: '🦅',
    description: 'Preference for autonomy and self-direction',
    color: '#0ea5e9',
  },
  security: {
    label: 'Security',
    emoji: '🛡️',
    description: 'Need for stability, predictability, and financial safety',
    color: '#10b981',
  },
  prestige: {
    label: 'Prestige',
    emoji: '⭐',
    description: 'Desire for status, respect, and recognition',
    color: '#f59e0b',
  },
  workLifeBalance: {
    label: 'Work-Life Balance',
    emoji: '⚖️',
    description: 'Importance of balance between work and personal life',
    color: '#06b6d4',
  },
  intellectualStimulation: {
    label: 'Learning',
    emoji: '📚',
    description: 'Love of learning and intellectual challenges',
    color: '#6366f1',
  },
};

export const ValuesChart: React.FC<ValuesChartProps> = ({
  scores,
  variant = 'horizontal',
  height = 300,
}) => {
  // Transform and sort scores
  const chartData = Object.entries(scores)
    .filter(([_, value]) => value !== undefined && value > 0)
    .map(([key, value]) => ({
      key,
      value: value || 0,
      ...VALUES_INFO[key],
    }))
    .sort((a, b) => b.value - a.value);

  const topValues = chartData.slice(0, 4);

  if (variant === 'compact') {
    return (
      <Card className="values-chart-compact">
        <Title level={5} style={{ marginBottom: 16 }}>
          🎯 Your Core Values
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topValues.map((item, index) => (
            <Tooltip key={item.key} title={item.description} placement="right">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: index === 0 ? '#fff7f7' : '#f9f9f9',
                  border: index === 0 ? '2px solid #8b0000' : '1px solid #e8e8e8',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 24 }}>{item.emoji}</span>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ color: index === 0 ? '#8b0000' : '#333' }}>
                    {item.label}
                  </Text>
                  <Progress
                    percent={item.value}
                    size="small"
                    strokeColor={item.color}
                    showInfo={false}
                  />
                </div>
                <Text strong style={{ color: item.color, fontSize: 16 }}>
                  {item.value.toFixed(0)}%
                </Text>
              </div>
            </Tooltip>
          ))}
        </div>
      </Card>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Card className="values-chart-horizontal">
        <Title level={4} style={{ marginBottom: 8 }}>
          Your Values Profile
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          What drives and motivates you in your career
        </Text>

        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 60, bottom: 5, left: 20 }}
          >
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="label"
              width={120}
              tick={{ fontSize: 13, fill: '#333' }}
              tickLine={false}
              axisLine={false}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              barSize={24}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: number) => `${value.toFixed(0)}%`}
                style={{ fill: '#333', fontWeight: 600, fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Top values summary */}
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: '#f9fafb',
            borderRadius: 8,
          }}
        >
          <Text strong>Your Driving Forces:</Text>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topValues.map((item) => (
              <span
                key={item.key}
                style={{
                  padding: '4px 12px',
                  background: 'white',
                  border: `2px solid ${item.color}`,
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {item.emoji} {item.label}
              </span>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Default bars variant
  return (
    <Card className="values-chart-bars">
      <Title level={4}>Values & Motivations</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {chartData.map((item) => (
          <Tooltip key={item.key} title={item.description}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32 }}>{item.emoji}</div>
              <Text strong>{item.label}</Text>
              <Progress
                percent={item.value}
                strokeColor={item.color}
                format={(percent) => `${percent?.toFixed(0)}%`}
              />
            </div>
          </Tooltip>
        ))}
      </div>
    </Card>
  );
};

export default ValuesChart;

