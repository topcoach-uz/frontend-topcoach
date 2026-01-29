import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

interface RiasecScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

interface RiasecRadarChartProps {
  scores: RiasecScores;
  riasecCode: string;
  showLegend?: boolean;
  height?: number;
  comparison?: RiasecScores; // Optional comparison data (e.g., ideal major profile)
  comparisonLabel?: string;
}

// RIASEC dimension descriptions (exported for use in results explanation)
export const RIASEC_DESCRIPTIONS: Record<string, { full: string; description: string; careers: string[] }> = {
  R: {
    full: 'Realistic',
    description: 'Hands-on, practical work with tools, machines, plants, or animals',
    careers: ['Engineer', 'Mechanic', 'Farmer', 'Pilot', 'Architect'],
  },
  I: {
    full: 'Investigative',
    description: 'Research, analysis, and solving complex problems',
    careers: ['Scientist', 'Doctor', 'Researcher', 'Data Analyst', 'Professor'],
  },
  A: {
    full: 'Artistic',
    description: 'Creative expression through art, design, writing, or performance',
    careers: ['Designer', 'Writer', 'Musician', 'Artist', 'Filmmaker'],
  },
  S: {
    full: 'Social',
    description: 'Helping, teaching, or providing service to others',
    careers: ['Teacher', 'Counselor', 'Nurse', 'Social Worker', 'Coach'],
  },
  E: {
    full: 'Enterprising',
    description: 'Leading, persuading, and managing people or projects',
    careers: ['Entrepreneur', 'Manager', 'Lawyer', 'Politician', 'Sales Director'],
  },
  C: {
    full: 'Conventional',
    description: 'Organizing data, following procedures, and attention to detail',
    careers: ['Accountant', 'Administrator', 'Banker', 'Analyst', 'Paralegal'],
  },
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const letter = data.dimension.charAt(0).toUpperCase();
    const info = RIASEC_DESCRIPTIONS[letter];
    
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          padding: '12px 16px',
          maxWidth: 280,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Text strong style={{ fontSize: 16, color: '#8b0000' }}>
          {info.full} ({data.score.toFixed(0)}%)
        </Text>
        <p style={{ margin: '8px 0', fontSize: 13, color: '#666' }}>
          {info.description}
        </p>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Example careers: {info.careers.slice(0, 3).join(', ')}
        </Text>
      </div>
    );
  }
  return null;
};

export const RiasecRadarChart: React.FC<RiasecRadarChartProps> = ({
  scores,
  riasecCode,
  showLegend = true,
  height = 400,
  comparison,
  comparisonLabel = 'Ideal Profile',
}) => {
  // Transform scores into radar chart format
  const chartData = [
    { dimension: 'Realistic', score: scores.realistic, fullMark: 100 },
    { dimension: 'Investigative', score: scores.investigative, fullMark: 100 },
    { dimension: 'Artistic', score: scores.artistic, fullMark: 100 },
    { dimension: 'Social', score: scores.social, fullMark: 100 },
    { dimension: 'Enterprising', score: scores.enterprising, fullMark: 100 },
    { dimension: 'Conventional', score: scores.conventional, fullMark: 100 },
  ];

  // Add comparison data if provided
  if (comparison) {
    chartData[0] = { ...chartData[0], comparison: comparison.realistic } as any;
    chartData[1] = { ...chartData[1], comparison: comparison.investigative } as any;
    chartData[2] = { ...chartData[2], comparison: comparison.artistic } as any;
    chartData[3] = { ...chartData[3], comparison: comparison.social } as any;
    chartData[4] = { ...chartData[4], comparison: comparison.enterprising } as any;
    chartData[5] = { ...chartData[5], comparison: comparison.conventional } as any;
  }

  // Get top 3 dimensions for description
  const sortedDimensions = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <Card className="riasec-radar-card" style={{ height: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Your Interest Profile
        </Title>
        <div
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #8b0000 0%, #dc143c 100%)',
            color: 'white',
            padding: '8px 24px',
            borderRadius: 20,
            marginTop: 8,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 4,
          }}
        >
          {riasecCode}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#e8e8e8" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#333', fontSize: 12, fontWeight: 500 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#999', fontSize: 10 }}
            tickCount={5}
          />
          
          {/* Your profile */}
          <Radar
            name="Your Profile"
            dataKey="score"
            stroke="#8b0000"
            fill="#8b0000"
            fillOpacity={0.35}
            strokeWidth={2}
            dot={{ fill: '#8b0000', strokeWidth: 2, r: 4 }}
          />

          {/* Comparison profile (if provided) */}
          {comparison && (
            <Radar
              name={comparisonLabel}
              dataKey="comparison"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            />
          )}

          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend wrapperStyle={{ paddingTop: 20 }} />}
        </RadarChart>
      </ResponsiveContainer>

      {/* Description of top interests */}
      <div style={{ marginTop: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Your Top Interests:
        </Text>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sortedDimensions.map(([key, value], index) => {
            const letter = key.charAt(0).toUpperCase();
            const info = RIASEC_DESCRIPTIONS[letter];
            return (
              <div
                key={key}
                style={{
                  flex: '1 1 calc(33.33% - 8px)',
                  minWidth: 120,
                  padding: '12px',
                  background: index === 0 ? '#fff7f7' : '#f9f9f9',
                  borderRadius: 8,
                  border: index === 0 ? '2px solid #8b0000' : '1px solid #e8e8e8',
                }}
              >
                <Text strong style={{ color: '#8b0000' }}>
                  #{index + 1} {info.full}
                </Text>
                <div style={{ fontSize: 20, fontWeight: 700, margin: '4px 0' }}>
                  {value.toFixed(0)}%
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {info.description.slice(0, 50)}...
                </Text>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default RiasecRadarChart;

