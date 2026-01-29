/**
 * Next Best Action Card Component
 * The MOST IMPORTANT element on the Dashboard - shows ONE primary action
 */

import React from 'react';
import { Card, Button, Space, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import { useGetUniversityDetailQuery } from '../../../app/services/universities';
import { getTranslation } from '../../../lib/i18n/translationUtils';
import './NextBestActionCard.scss';

interface NextBestAction {
  id: string;
  type: 'profile' | 'application' | 'essay' | 'document' | 'assessment' | 'deadline';
  title: string;
  description: string;
  deadline?: string;
  estimatedTime?: string;
  priority: 'overdue' | 'urgent' | 'normal';
  actionLabel: string;
  actionPath: string;
  secondaryActionLabel?: string;
  secondaryActionPath?: string;
  universityId?: string;
  universityName?: string;
}

interface NextBestActionCardProps {
  action: NextBestAction | null;
}

const NextBestActionCard: React.FC<NextBestActionCardProps> = ({ action }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Don't show default action - only show when there's a real action needed
  if (!action) {
    return null;
  }

  // Fetch university name if we have universityId but not a proper title
  const { data: university } = useGetUniversityDetailQuery(
    action.universityId || '', 
    { skip: !action.universityId || (action.title && !action.title.includes('University Application') && !action.title.includes('Unknown')) }
  );

  // Resolve the display title
  let displayTitle = action.title;
  if (action.type === 'deadline' && action.universityId) {
    if (university) {
      const universityDisplayName = getTranslation(university.name);
      if (universityDisplayName) {
        displayTitle = `${t('studentHub.dashboard.nextAction.completeApplication') || 'Complete application for'}: ${universityDisplayName}`;
      } else if (action.universityName && action.universityName !== 'Unknown University' && action.universityName !== 'undefined') {
        displayTitle = `${t('studentHub.dashboard.nextAction.completeApplication') || 'Complete application for'}: ${action.universityName}`;
      }
    } else if (action.universityName && action.universityName !== 'Unknown University' && action.universityName !== 'undefined') {
      displayTitle = `${t('studentHub.dashboard.nextAction.completeApplication') || 'Complete application for'}: ${action.universityName}`;
    }
  }

  const priorityConfig = {
    overdue: {
      color: '#ff4d4f',
      borderColor: '#ff4d4f',
      bgColor: '#fff1f0',
      label: t('studentHub.dashboard.overdue') || 'Overdue',
    },
    urgent: {
      color: '#ff9800',
      borderColor: '#ff9800',
      bgColor: '#fff7e6',
      label: t('studentHub.dashboard.urgent') || 'Urgent',
    },
    normal: {
      color: '#8b0000',
      borderColor: '#8b0000',
      bgColor: '#fff',
      label: '',
    },
  };

  const config = priorityConfig[action.priority];

  return (
    <Card 
      className="next-best-action-card"
      style={{
        borderColor: config.borderColor,
        borderWidth: 2,
        backgroundColor: config.bgColor,
      }}
    >
      <div className="next-action-content">
        <div className="action-header">
          <div className="action-badge">
            <UnifiedIcon name="target" size="md" color="primary" />
            <span>{t('studentHub.dashboard.nextAction.yourNextStep') || 'Your next step'}</span>
          </div>
          {action.priority !== 'normal' && (
            <Tag color={config.color} style={{ marginLeft: 'auto' }}>
              {config.label}
            </Tag>
          )}
        </div>
        <div className="action-main">
          <h3 className="action-title">{displayTitle}</h3>
          <p className="action-description">{action.description}</p>
          {action.deadline && (
            <div className="action-meta">
              <Space>
                <UnifiedIcon name="clock" size="sm" color="gray" />
                <span>
                  <strong>{t('studentHub.dashboard.deadline')}:</strong> {action.deadline}
                </span>
              </Space>
            </div>
          )}
          {action.estimatedTime && (
            <div className="action-meta">
              <Space>
                <UnifiedIcon name="clock" size="sm" color="gray" />
                <span>
                  <strong>{t('studentHub.dashboard.estimated')}:</strong> {action.estimatedTime}
                </span>
              </Space>
            </div>
          )}
        </div>
        <div className="action-actions">
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate(action.actionPath)}
            icon={<UnifiedIcon name="plus" size="md" color="white" />}
          >
            {action.actionLabel}
          </Button>
          {action.secondaryActionLabel && action.secondaryActionPath && (
            <Button 
              type="default"
              onClick={() => navigate(action.secondaryActionPath!)}
            >
              {action.secondaryActionLabel}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default NextBestActionCard;
