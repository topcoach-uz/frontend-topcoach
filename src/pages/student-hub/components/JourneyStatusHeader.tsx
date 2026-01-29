/**
 * Journey Status Header Component
 * Shows journey phase, progress, and alerts
 */

import React from 'react';
import { Card, Badge, Progress, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import './JourneyStatusHeader.scss';

interface JourneyStatusHeaderProps {
  userName: string;
  phase: 'discovery' | 'building' | 'applying' | 'finalizing';
  progressPercentage: number;
  deadlineCount?: number;
  profileCompletion?: number;
}

const JourneyStatusHeader: React.FC<JourneyStatusHeaderProps> = ({
  userName,
  phase,
  progressPercentage,
  deadlineCount = 0,
  profileCompletion = 0,
}) => {
  const { t } = useTranslation();

  const phaseConfig = {
    discovery: {
      label: t('studentHub.dashboard.phase.discovery') || 'Discovery',
      color: '#f59e0b',
      icon: 'search',
    },
    building: {
      label: t('studentHub.dashboard.phase.building') || 'Building',
      color: '#3b82f6',
      icon: 'edit',
    },
    applying: {
      label: t('studentHub.dashboard.phase.applying') || 'Applying',
      color: '#8b0000',
      icon: 'university',
    },
    finalizing: {
      label: t('studentHub.dashboard.phase.finalizing') || 'Finalizing',
      color: '#22c55e',
      icon: 'check-circle',
    },
  };

  const currentPhase = phaseConfig[phase];

  // Minimal header - only show progress if not 100%
  if (progressPercentage === 100) {
    return null; // Don't show header if profile is complete
  }

  return (
    <Card className="journey-status-header" style={{ 
      background: `linear-gradient(135deg, ${currentPhase.color}08 0%, #ffffff 100%)`,
      border: `1px solid ${currentPhase.color}20`,
      marginBottom: 24,
    }}>
      <div className="journey-status-content">
        <div className="journey-status-left">
          <div className="greeting-section">
            <div className="phase-badge" style={{ backgroundColor: currentPhase.color }}>
              <UnifiedIcon name={currentPhase.icon} size="sm" color="white" />
              <span>{currentPhase.label}</span>
            </div>
            <p className="phase-subtext" style={{ marginTop: 8, marginBottom: 0 }}>
              {phase === 'discovery' && (t('studentHub.dashboard.phase.discoveryDesc') || 'Complete your profile to get started')}
              {phase === 'building' && (t('studentHub.dashboard.phase.buildingDesc') || 'Start building your application portfolio')}
              {phase === 'applying' && (t('studentHub.dashboard.phase.applyingDesc') || 'You\'re actively applying to universities')}
              {phase === 'finalizing' && (t('studentHub.dashboard.phase.finalizingDesc') || 'Applications submitted, awaiting decisions')}
            </p>
          </div>
        </div>
        <div className="journey-status-right">
          <div className="progress-section">
            <Tooltip title={`${progressPercentage}% complete`}>
              <div className="progress-ring" style={{ position: 'relative', width: 60, height: 60 }}>
                <Progress
                  type="circle"
                  percent={progressPercentage}
                  strokeColor={currentPhase.color}
                  size={60}
                  format={() => `${progressPercentage}%`}
                />
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default JourneyStatusHeader;
