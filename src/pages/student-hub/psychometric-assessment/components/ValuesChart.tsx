import React from 'react';
import { Tooltip } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import {
  Trophy,
  Palette,
  HeartHandshake,
  Bird,
  ShieldCheck,
  Crown,
  Scale,
  BookOpen,
  Target,
  type LucideIcon,
} from 'lucide-react';

const MM_INK = '#1c1a17';

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
const VALUES_INFO: Record<string, { label: string; Icon: LucideIcon; description: string; color: string }> = {
  achievement: {
    label: 'Achievement',
    Icon: Trophy,
    description: 'Drive to accomplish goals and be recognized for success',
    color: '#8b0000',
  },
  creativity: {
    label: 'Creativity',
    Icon: Palette,
    description: 'Desire to create, innovate, and express original ideas',
    color: '#9333ea',
  },
  helpingOthers: {
    label: 'Helping Others',
    Icon: HeartHandshake,
    description: 'Motivation to support, care for, and make a difference',
    color: '#ec4899',
  },
  independence: {
    label: 'Independence',
    Icon: Bird,
    description: 'Preference for autonomy and self-direction',
    color: '#0ea5e9',
  },
  security: {
    label: 'Security',
    Icon: ShieldCheck,
    description: 'Need for stability, predictability, and financial safety',
    color: '#10b981',
  },
  prestige: {
    label: 'Prestige',
    Icon: Crown,
    description: 'Desire for status, respect, and recognition',
    color: '#f59e0b',
  },
  workLifeBalance: {
    label: 'Work-Life Balance',
    Icon: Scale,
    description: 'Importance of balance between work and personal life',
    color: '#06b6d4',
  },
  intellectualStimulation: {
    label: 'Learning',
    Icon: BookOpen,
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
      <div className="majormatch-results__card values-chart-compact">
        <h5 className="majormatch-results__card-title">
          <Target size={18} style={{ color: MM_INK, marginRight: 6, verticalAlign: '-2px' }} />
          Your Core Values
        </h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topValues.map((item, index) => (
            <Tooltip key={item.key} title={item.description} placement="right">
              <div
                className={`majormatch-results__interest ${index === 0 ? 'majormatch-results__interest--top' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              >
                {item.Icon ? <item.Icon size={22} style={{ color: item.color }} /> : null}
                <div style={{ flex: 1 }}>
                  <div className="majormatch-results__meter-label" style={{ fontWeight: 600, color: MM_INK }}>
                    {item.label}
                  </div>
                  <div className="majormatch-results__meter-track" style={{ marginTop: 5 }}>
                    <div
                      className="majormatch-results__meter-fill"
                      style={{ width: `${Math.max(0, Math.min(100, item.value))}%`, background: item.color }}
                    />
                  </div>
                </div>
                <span className="majormatch-results__meter-value">{item.value.toFixed(0)}%</span>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className="majormatch-results__card values-chart-horizontal">
        <h4 className="majormatch-results__card-title">Your Values Profile</h4>
        <p className="majormatch-results__card-sub">
          What drives and motivates you in your career
        </p>

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
              tick={{ fontSize: 13, fill: MM_INK }}
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
                formatter={(value: any) => `${Number(value).toFixed(0)}%`}
                style={{ fill: MM_INK, fontWeight: 600, fontSize: 12 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Top values summary */}
        <div className="majormatch-results__rec-block" style={{ marginTop: 12 }}>
          <span className="majormatch-results__rec-block-label">Your Driving Forces</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topValues.map((item) => (
              <span
                key={item.key}
                style={{
                  padding: '4px 12px',
                  background: '#fff',
                  border: `1px solid ${item.color}`,
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 500,
                  color: MM_INK,
                }}
              >
                {item.Icon ? (
                  <item.Icon size={14} style={{ color: item.color, marginRight: 4, verticalAlign: '-2px' }} />
                ) : null}
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default bars variant
  return (
    <div className="majormatch-results__card values-chart-bars">
      <h4 className="majormatch-results__card-title">Values &amp; Motivations</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {chartData.map((item) => (
          <Tooltip key={item.key} title={item.description}>
            <div style={{ textAlign: 'center' }}>
              <div>{item.Icon ? <item.Icon size={24} style={{ color: item.color }} /> : null}</div>
              <div className="majormatch-results__meter-label" style={{ fontWeight: 600, color: MM_INK }}>
                {item.label}
              </div>
              <div className="majormatch-results__meter-head" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
                <span className="majormatch-results__meter-value">{item.value.toFixed(0)}%</span>
              </div>
              <div className="majormatch-results__meter-track">
                <div
                  className="majormatch-results__meter-fill"
                  style={{ width: `${Math.max(0, Math.min(100, item.value))}%`, background: item.color }}
                />
              </div>
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default ValuesChart;

