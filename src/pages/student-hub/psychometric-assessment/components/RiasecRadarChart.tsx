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

const MM_BRAND = '#7b1f2f';
const MM_INK = '#1c1a17';
const MM_MUTED = '#6b6258';
const MM_HAIRLINE = '#e5e3da';
const MM_GREEN = '#2e6e4e';
const MM_SERIF = "'Iowan Old Style', 'Charter', 'Georgia', serif";

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
          background: '#fbfaf6',
          border: `1px solid ${MM_HAIRLINE}`,
          borderRadius: 10,
          padding: '12px 16px',
          maxWidth: 280,
          boxShadow: '0 6px 18px rgba(28, 26, 23, 0.08)',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: MM_BRAND, fontFamily: MM_SERIF }}>
          {info.full} ({data.score.toFixed(0)}%)
        </span>
        <p style={{ margin: '8px 0', fontSize: 13, color: '#4b463f', lineHeight: 1.45 }}>
          {info.description}
        </p>
        <span style={{ fontSize: 12, color: MM_MUTED }}>
          Example careers: {info.careers.slice(0, 3).join(', ')}
        </span>
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
    <div className="majormatch-results__card riasec-radar-card" style={{ height: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h4 className="majormatch-results__card-title" style={{ justifyContent: 'center', marginBottom: 10 }}>
          Your Interest Profile
        </h4>
        <span className="majormatch-results__code-value" style={{ letterSpacing: '0.18em' }}>
          {riasecCode}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke={MM_HAIRLINE} />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: MM_INK, fontSize: 12, fontWeight: 500 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: MM_MUTED, fontSize: 10 }}
            tickCount={5}
          />

          {/* Your profile */}
          <Radar
            name="Your Profile"
            dataKey="score"
            stroke={MM_BRAND}
            fill={MM_BRAND}
            fillOpacity={0.18}
            strokeWidth={2}
            dot={{ fill: MM_BRAND, strokeWidth: 2, r: 4 }}
          />

          {/* Comparison profile (if provided) */}
          {comparison && (
            <Radar
              name={comparisonLabel}
              dataKey="comparison"
              stroke={MM_GREEN}
              fill={MM_GREEN}
              fillOpacity={0.12}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: MM_GREEN, strokeWidth: 2, r: 3 }}
            />
          )}

          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12, color: MM_MUTED }} />}
        </RadarChart>
      </ResponsiveContainer>

      {/* Description of top interests */}
      <div style={{ marginTop: 8 }}>
        <span className="majormatch-results__rec-block-label">Your Top Interests</span>
        <div className="majormatch-results__interest-grid">
          {sortedDimensions.map(([key, value], index) => {
            const letter = key.charAt(0).toUpperCase();
            const info = RIASEC_DESCRIPTIONS[letter];
            return (
              <div
                key={key}
                className={`majormatch-results__interest ${index === 0 ? 'majormatch-results__interest--top' : ''}`}
              >
                <div className="majormatch-results__interest-rank">
                  #{index + 1} {info.full}
                </div>
                <div className="majormatch-results__interest-value">{value.toFixed(0)}%</div>
                <div className="majormatch-results__interest-desc">
                  {info.description.slice(0, 50)}...
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RiasecRadarChart;

