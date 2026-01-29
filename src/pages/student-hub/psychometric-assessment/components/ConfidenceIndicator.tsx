import React from 'react';
import { Card, Typography, Progress, Tag, Button, Tooltip, Alert } from 'antd';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

const { Title, Text, Paragraph } = Typography;

interface ConfidenceIndicatorProps {
  confidenceLevel: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-100
  aptitudeTaken: boolean;
  hasSTEMMajors: boolean;
  riskFlags?: string[];
  academicConfidenceScore?: number;
  onBoostAccuracy?: () => void;
  language?: 'en' | 'uz' | 'ru';
}

const CONFIDENCE_CONFIG = {
  high: {
    color: '#10b981',
    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    borderColor: '#10b981',
    icon: 'check-circle',
    label: 'High Confidence',
    description: 'Strong match across all dimensions. Your results are highly reliable.',
  },
  medium: {
    color: '#f59e0b',
    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    borderColor: '#f59e0b',
    icon: 'exclamation-circle',
    label: 'Medium Confidence',
    description: 'Good match with some areas to consider. Results are reliable but could be improved.',
  },
  low: {
    color: '#ef4444',
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    borderColor: '#ef4444',
    icon: 'times-circle',
    label: 'Low Confidence',
    description: 'Weak match or missing data. Consider providing more information.',
  },
};

const RISK_FLAG_DESCRIPTIONS: Record<string, string> = {
  'interest-high-readiness-unknown': 'High STEM interest but academic readiness not verified',
  'stem-low-conscientiousness': 'Interest in structured fields but prefer flexibility',
  'intended-major-conflict': 'Your stated major doesn\'t align with your interests',
  'flat-profile': 'No clear dominant interests - consider taking aptitude test',
  'high-ambition-unknown-readiness': 'Targeting competitive programs without verified readiness',
  'missing-academic-data': 'Academic profile incomplete',
};

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidenceLevel,
  confidenceScore,
  aptitudeTaken,
  hasSTEMMajors,
  riskFlags = [],
  academicConfidenceScore,
  onBoostAccuracy,
  language = 'en',
}) => {
  const config = CONFIDENCE_CONFIG[confidenceLevel];
  const showBoostCTA = !aptitudeTaken && hasSTEMMajors && confidenceLevel !== 'high';

  return (
    <Card
      className="confidence-indicator"
      style={{
        background: config.background,
        borderColor: config.borderColor,
        borderWidth: 2,
      }}
    >
      {/* Main confidence display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <FontAwesomeIcon
            icon={config.icon as IconProp}
            style={{ fontSize: 32, color: config.color }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Title level={4} style={{ margin: 0, color: config.color }}>
              {config.label}
            </Title>
            <Tag color={config.color}>{confidenceScore.toFixed(0)}%</Tag>
          </div>
          <Text type="secondary">{config.description}</Text>
        </div>
      </div>

      {/* Confidence breakdown */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text>Result Reliability</Text>
          <Text strong style={{ color: config.color }}>
            {confidenceScore.toFixed(0)}%
          </Text>
        </div>
        <Progress
          percent={confidenceScore}
          strokeColor={config.color}
          trailColor="rgba(255,255,255,0.5)"
          showInfo={false}
        />
      </div>

      {/* Academic confidence (if available) */}
      {academicConfidenceScore !== undefined && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text>Academic Readiness</Text>
            <Text strong>
              {academicConfidenceScore >= 0.75 ? 'High' : academicConfidenceScore >= 0.5 ? 'Medium' : 'Low'}
            </Text>
          </div>
          <Progress
            percent={academicConfidenceScore * 100}
            strokeColor={
              academicConfidenceScore >= 0.75
                ? '#10b981'
                : academicConfidenceScore >= 0.5
                ? '#f59e0b'
                : '#ef4444'
            }
            trailColor="rgba(255,255,255,0.5)"
            showInfo={false}
          />
        </div>
      )}

      {/* Aptitude status */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.7)',
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FontAwesomeIcon
            icon={aptitudeTaken ? 'check' : 'clock'}
            style={{ color: aptitudeTaken ? '#10b981' : '#f59e0b' }}
          />
          <Text>
            Aptitude Test:{' '}
            <Text strong style={{ color: aptitudeTaken ? '#10b981' : '#f59e0b' }}>
              {aptitudeTaken ? 'Completed' : 'Not Taken'}
            </Text>
          </Text>
        </div>
        {!aptitudeTaken && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            {hasSTEMMajors
              ? 'Recommended for STEM major recommendations'
              : 'Optional - can improve accuracy for some majors'}
          </Text>
        )}
      </div>

      {/* Risk flags */}
      {riskFlags.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Areas to Consider"
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              {riskFlags.map((flag, index) => (
                <li key={index} style={{ marginBottom: 4 }}>
                  {RISK_FLAG_DESCRIPTIONS[flag] || flag}
                </li>
              ))}
            </ul>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Boost accuracy CTA */}
      {showBoostCTA && onBoostAccuracy && (
        <div
          style={{
            padding: 16,
            background: 'linear-gradient(135deg, #8b0000 0%, #dc143c 100%)',
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <Title level={5} style={{ color: 'white', margin: '0 0 8px 0' }}>
            🎯 Boost Your Accuracy
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 12px 0' }}>
            Your top matches include STEM majors. Take the aptitude test (+10-15 min) for more accurate recommendations.
          </Paragraph>
          <Button
            type="default"
            size="large"
            onClick={onBoostAccuracy}
            style={{
              background: 'white',
              borderColor: 'white',
              color: '#8b0000',
              fontWeight: 600,
            }}
          >
            <FontAwesomeIcon icon="bolt" style={{ marginRight: 8 }} />
            Take Aptitude Test
          </Button>
        </div>
      )}

      {/* What affects confidence */}
      <div style={{ marginTop: 16 }}>
        <Tooltip
          title={
            <div>
              <p><strong>What affects confidence:</strong></p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>Consistent answers across similar questions</li>
                <li>Complete academic profile</li>
                <li>Aptitude test results (for STEM)</li>
                <li>Alignment between interests and stated goals</li>
              </ul>
            </div>
          }
        >
          <Text
            type="secondary"
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            <FontAwesomeIcon icon="info-circle" style={{ marginRight: 4 }} />
            How is confidence calculated?
          </Text>
        </Tooltip>
      </div>
    </Card>
  );
};

export default ConfidenceIndicator;

