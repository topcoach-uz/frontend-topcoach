/**
 * AI-powered suggestions — contextual next actions from goals, profile, and progress.
 */

import React from 'react';
import { Card, List, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import UniversityNameDisplay from '../applications/components/UniversityNameDisplay';
import './AISuggestionsCard.scss';

export interface SuggestionItem {
  id: string;
  type: 'essay' | 'recommendation' | 'mentor' | 'psychometric' | 'profile' | 'application' | 'deadline' | 'overdue';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel: string;
  actionPath: string;
  universityId?: string;
  universityName?: string;
  applicationId?: string;
}

interface AISuggestionsCardProps {
  suggestions: SuggestionItem[];
  loading?: boolean;
}

const AISuggestionsCard: React.FC<AISuggestionsCardProps> = ({ suggestions, loading }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!suggestions || suggestions.length === 0) return null;

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...suggestions].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <Card
      className="ai-suggestions-card ai-suggestions-card--crimson"
      title={
        <span className="ai-suggestions-card-title">
          <UnifiedIcon name="target" size="md" color="primary" style={{ marginRight: 8, flexShrink: 0 }} />
          <span className="ai-suggestions-card-title-text">AI-powered suggestions</span>
          <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
            Based on your goals & progress
          </Typography.Text>
        </span>
      }
    >
      <List
        loading={loading}
        dataSource={sorted}
        size="small"
        renderItem={(item) => (
          <List.Item
            className="ai-suggestion-item"
            actions={[
              <Button
                type="primary"
                size="middle"
                onClick={() => navigate(item.actionPath)}
                style={{
                  padding: '6px 16px',
                  height: 40,
                  borderRadius: 8,
                  fontWeight: 600,
                  backgroundColor: item.priority === 'high' ? '#8b0000' : undefined,
                  borderColor: item.priority === 'high' ? '#8b0000' : undefined,
                }}
              >
                {item.actionLabel}
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <div
                  className={`ai-suggestion-priority ai-suggestion-priority--${item.priority}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      item.priority === 'high'
                        ? '#fff1f0'
                        : item.priority === 'medium'
                        ? '#fff7e6'
                        : '#f6ffed',
                  }}
                >
                  <UnifiedIcon
                    name={
                      item.type === 'essay'
                        ? 'edit'
                        : item.type === 'recommendation'
                        ? 'users'
                        : item.type === 'mentor'
                        ? 'users'
                        : item.type === 'psychometric'
                        ? 'trending-up'
                        : item.type === 'overdue' || item.type === 'deadline'
                        ? 'clock'
                        : 'target'
                    }
                    size="sm"
                    color={item.priority === 'high' ? 'error' : 'primary'}
                  />
                </div>
              }
              title={
                item.universityId || item.universityName ? (
                  <>
                    <span>{item.title} — </span>
                    <UniversityNameDisplay
                      universityId={item.universityId}
                      universityName={item.universityName}
                    />
                  </>
                ) : (
                  item.title
                )
              }
              description={item.description}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default AISuggestionsCard;
