import React from 'react';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Check,
  Zap,
  Info,
  GraduationCap,
} from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidenceLevel: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-100
  aptitudeTaken: boolean;
  hasSTEMMajors: boolean;
  riskFlags?: string[];
  academicConfidenceScore?: number;
  onBoostAccuracy?: () => void;
  /** Sends the student to add grades/test scores (unlocks academic fit). */
  onAddGrades?: () => void;
  language?: 'en' | 'uz' | 'ru';
}

const CONFIDENCE_CONFIG = {
  high: {
    Icon: CheckCircle2,
    label: 'High Confidence',
    description: 'Strong match across all dimensions. Your results are highly reliable.',
    fill: 'majormatch-results__meter-fill--green',
  },
  medium: {
    Icon: AlertTriangle,
    label: 'Medium Confidence',
    description: 'Good match with some areas to consider. Results are reliable but could be improved.',
    fill: 'majormatch-results__meter-fill--amber',
  },
  low: {
    Icon: XCircle,
    label: 'Low Confidence',
    description: 'Weak match or missing data. Consider providing more information.',
    fill: '',
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
  onAddGrades,
}) => {
  const { t } = useTranslation();
  const config = CONFIDENCE_CONFIG[confidenceLevel];
  const { Icon } = config;

  // The two concrete things that make the match sharper. We only surface a
  // step if it's actually actionable (not already done).
  const needAptitude = !aptitudeTaken;
  const needGrades = academicConfidenceScore === undefined || academicConfidenceScore <= 0;
  const sharpenSteps = [needAptitude, needGrades].filter(Boolean).length;

  // Map academic readiness to a palette fill class.
  const academicFill =
    academicConfidenceScore !== undefined && academicConfidenceScore >= 0.75
      ? 'majormatch-results__meter-fill--green'
      : academicConfidenceScore !== undefined && academicConfidenceScore >= 0.5
      ? 'majormatch-results__meter-fill--amber'
      : '';

  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  return (
    <div className="majormatch-results__conf">
      {/* Main confidence display */}
      <div className="majormatch-results__conf-head">
        <div className={`majormatch-results__conf-badge majormatch-results__conf-badge--${confidenceLevel}`}>
          <Icon size={26} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 className="majormatch-results__conf-label">
            {config.label}
            <span className={`majormatch-results__conf-pill majormatch-results__conf-pill--${confidenceLevel}`}>
              {confidenceScore.toFixed(0)}%
            </span>
          </h4>
          <div className="majormatch-results__conf-desc">{config.description}</div>
        </div>
      </div>

      {/* Result reliability meter */}
      <div className="majormatch-results__meter">
        <div className="majormatch-results__meter-head">
          <span className="majormatch-results__meter-label">
            {t('studentHub.psychometric.results.resultReliability', 'Result Reliability')}
          </span>
          <span className="majormatch-results__meter-value">{confidenceScore.toFixed(0)}%</span>
        </div>
        <div className="majormatch-results__meter-track">
          <div
            className={`majormatch-results__meter-fill ${config.fill}`}
            style={{ width: `${clamp(confidenceScore)}%` }}
          />
        </div>
      </div>

      {/* Academic readiness — only when we actually have academic data.
          A score of 0 means no grades/test scores were provided, so we hide
          the meter (showing "Low / 0%" reads as broken/judgmental) and let the
          "Areas to Consider" note prompt the student to add their data. */}
      {academicConfidenceScore !== undefined && academicConfidenceScore > 0 && (
        <div className="majormatch-results__meter" style={{ marginTop: 12 }}>
          <div className="majormatch-results__meter-head">
            <span className="majormatch-results__meter-label">
              {t('studentHub.psychometric.results.academicReadiness', 'Academic Readiness')}
            </span>
            <span className="majormatch-results__meter-value">
              {academicConfidenceScore >= 0.75
                ? t('common.high', 'High')
                : academicConfidenceScore >= 0.5
                ? t('studentHub.psychometric.results.mediumConfidence', 'Medium')
                : t('common.low', 'Low')}
            </span>
          </div>
          <div className="majormatch-results__meter-track">
            <div
              className={`majormatch-results__meter-fill ${academicFill}`}
              style={{ width: `${clamp(academicConfidenceScore * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Make your matches sharper — concrete, actionable steps instead of a
          passive "Aptitude: Not Taken" status. */}
      {sharpenSteps > 0 ? (
        <div className="majormatch-results__sharpen">
          <div className="majormatch-results__sharpen-title">
            {sharpenSteps === 1
              ? t('studentHub.psychometric.results.sharpenOne', 'One step makes your matches sharper')
              : t('studentHub.psychometric.results.sharpenTwo', '2 steps make your matches sharper')}
          </div>
          <ol className="majormatch-results__sharpen-list">
            {needAptitude && (
              <li className="majormatch-results__sharpen-step">
                <div className="majormatch-results__sharpen-body">
                  <div className="majormatch-results__sharpen-step-title">
                    {t('studentHub.psychometric.results.stepAptitude', 'Take the 10-minute aptitude test')}
                  </div>
                  <div className="majormatch-results__sharpen-step-desc">
                    {hasSTEMMajors
                      ? t('studentHub.psychometric.results.stepAptitudeStem', 'Your top matches include STEM majors — this sharpens their accuracy the most.')
                      : t('studentHub.psychometric.results.stepAptitudeDesc', 'Adds aptitude fit to your major matches.')}
                  </div>
                  {onBoostAccuracy && (
                    <button
                      type="button"
                      className="majormatch-results__sharpen-cta"
                      onClick={onBoostAccuracy}
                    >
                      <Zap size={13} />
                      {t('studentHub.psychometric.results.takeAptitudeTest', 'Take the test')}
                    </button>
                  )}
                </div>
              </li>
            )}
            {needGrades && (
              <li className="majormatch-results__sharpen-step">
                <div className="majormatch-results__sharpen-body">
                  <div className="majormatch-results__sharpen-step-title">
                    {t('studentHub.psychometric.results.stepGrades', 'Add your grades & test scores')}
                  </div>
                  <div className="majormatch-results__sharpen-step-desc">
                    {t('studentHub.psychometric.results.stepGradesDesc', 'Unlocks the academic-fit score on every major recommendation.')}
                  </div>
                  {onAddGrades && (
                    <button
                      type="button"
                      className="majormatch-results__sharpen-cta"
                      onClick={onAddGrades}
                    >
                      <GraduationCap size={13} />
                      {t('studentHub.psychometric.results.addGrades', 'Add grades')}
                    </button>
                  )}
                </div>
              </li>
            )}
          </ol>
        </div>
      ) : (
        <div className="majormatch-results__sharpen majormatch-results__sharpen--complete">
          <Check size={15} />
          {t('studentHub.psychometric.results.profileComplete', 'Your results are based on a complete profile.')}
        </div>
      )}

      {/* Risk flags */}
      {riskFlags.length > 0 && (
        <div className="majormatch-results__conf-flags">
          <div className="majormatch-results__conf-flags-title">
            <AlertTriangle size={14} />
            {t('studentHub.psychometric.results.areasToConsider', 'Areas to Consider')}
          </div>
          <ul className="majormatch-results__conf-flags-list">
            {riskFlags.map((flag, index) => (
              <li key={index}>{RISK_FLAG_DESCRIPTIONS[flag] || flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* What affects confidence */}
      <div style={{ marginTop: 16 }}>
        <Tooltip
          title={
            <div>
              <p><strong>{t('studentHub.psychometric.results.whatAffectsConfidence', 'What affects confidence:')}</strong></p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>{t('studentHub.psychometric.results.consistentAnswers', 'Consistent answers across similar questions')}</li>
                <li>{t('studentHub.psychometric.results.completeAcademicProfile', 'Complete academic profile')}</li>
                <li>{t('studentHub.psychometric.results.aptitudeTestResults', 'Aptitude test results (for STEM)')}</li>
                <li>{t('studentHub.psychometric.results.alignmentBetweenInterests', 'Alignment between interests and stated goals')}</li>
              </ul>
            </div>
          }
        >
          <button type="button" className="majormatch-results__conf-link">
            <Info size={13} />
            {t('studentHub.psychometric.results.howIsConfidenceCalculated', 'How is confidence calculated?')}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default ConfidenceIndicator;
