import React, { useState } from 'react';
import { Collapse, Checkbox, Progress, Space, Tag, Button, Typography, Tooltip } from 'antd';
import UnifiedIcon from '../../../../components/common/icons/UnifiedIcon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const { Panel } = Collapse;
const { Text } = Typography;

interface RequirementItem {
  id: string;
  type: 'essay' | 'document' | 'recommendation' | 'interview' | 'portfolio' | 'financial_aid' | 'test_score';
  name: string;
  required: boolean;
  dueDate?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  linkedItemId?: string;
  notes?: string;
}

interface RequirementsChecklistProps {
  applicationId: string;
  requirements?: {
    essays?: {
      required: number;
      completed: number;
      prompts?: string[];
    };
    recommendations?: {
      required: number;
      submitted: number;
      requested: number;
    };
    transcripts?: {
      status: 'pending' | 'sent' | 'received';
      verified: boolean;
    };
    testScores?: {
      status: 'pending' | 'sent' | 'received';
      required: string[];
      submitted: string[];
    };
    interviews?: {
      required: boolean;
      scheduled?: string;
      completed?: string;
      type?: string;
    };
    supplements?: {
      required: number;
      completed: number;
      prompts?: string[];
    };
  };
  onUpdate?: (requirements: any) => void;
}

const RequirementsChecklist: React.FC<RequirementsChecklistProps> = ({
  applicationId,
  requirements = {},
  onUpdate,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  // Build requirement items from requirements object
  const buildRequirementItems = (): RequirementItem[] => {
    const items: RequirementItem[] = [];

    // Essays
    if (requirements.essays) {
      const { required, completed, prompts = [] } = requirements.essays;
      for (let i = 0; i < required; i++) {
        items.push({
          id: `essay-${i}`,
          type: 'essay',
          name: prompts[i] || `Essay ${i + 1}`,
          required: true,
          status: i < completed ? 'completed' : 'not_started',
        });
      }
    }

    // Recommendations
    if (requirements.recommendations) {
      const { required, submitted, requested } = requirements.recommendations;
      for (let i = 0; i < required; i++) {
        items.push({
          id: `recommendation-${i}`,
          type: 'recommendation',
          name: `Recommendation Letter ${i + 1}`,
          required: true,
          status: i < submitted ? 'completed' : i < requested ? 'in_progress' : 'not_started',
        });
      }
    }

    // Transcripts
    if (requirements.transcripts) {
      items.push({
        id: 'transcript',
        type: 'document',
        name: 'Official Transcripts',
        required: true,
        status: requirements.transcripts.status === 'received' ? 'completed' : 
                requirements.transcripts.status === 'sent' ? 'in_progress' : 'not_started',
      });
    }

    // Test Scores
    if (requirements.testScores) {
      const { required, submitted } = requirements.testScores;
      required.forEach((test, i) => {
        items.push({
          id: `test-${i}`,
          type: 'test_score',
          name: test,
          required: true,
          status: submitted.includes(test) ? 'completed' : 'not_started',
        });
      });
    }

    // Interviews
    if (requirements.interviews?.required) {
      items.push({
        id: 'interview',
        type: 'interview',
        name: `Interview${requirements.interviews.type ? ` (${requirements.interviews.type})` : ''}`,
        required: true,
        status: requirements.interviews.completed ? 'completed' :
                requirements.interviews.scheduled ? 'in_progress' : 'not_started',
        dueDate: requirements.interviews.scheduled,
      });
    }

    // Supplements
    if (requirements.supplements) {
      const { required, completed, prompts = [] } = requirements.supplements;
      for (let i = 0; i < required; i++) {
        items.push({
          id: `supplement-${i}`,
          type: 'essay',
          name: prompts[i] || `Supplement ${i + 1}`,
          required: true,
          status: i < completed ? 'completed' : 'not_started',
        });
      }
    }

    return items;
  };

  const requirementItems = buildRequirementItems();
  const totalItems = requirementItems.length;
  const completedItems = requirementItems.filter(item => item.status === 'completed').length;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const getStatusColor = (status: RequirementItem['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'processing';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: RequirementItem['status']) => {
    switch (status) {
      case 'completed':
        return 'Complete';
      case 'in_progress':
        return 'In Progress';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Not Started';
    }
  };

  const getTypeIcon = (type: RequirementItem['type']) => {
    switch (type) {
      case 'essay':
        return 'edit';
      case 'document':
        return 'file-text';
      case 'recommendation':
        return 'users';
      case 'interview':
        return 'calendar';
      case 'portfolio':
        return 'folder';
      case 'financial_aid':
        return 'dollar-sign';
      case 'test_score':
        return 'check-circle';
      default:
        return 'file';
    }
  };

  const handleItemClick = (item: RequirementItem) => {
    switch (item.type) {
      case 'essay':
        navigate('/student-hub/essays');
        break;
      case 'document':
        navigate('/student-hub/documents');
        break;
      case 'recommendation':
        navigate('/student-hub/documents');
        break;
      default:
        break;
    }
  };

  if (totalItems === 0) {
    return (
      <div style={{ padding: '12px 0', color: '#999', fontSize: '14px' }}>
        <Text type="secondary">No requirements tracked yet. Add requirements in the edit page.</Text>
      </div>
    );
  }

  return (
    <div 
      className="requirements-checklist"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Collapse
        activeKey={expanded ? 'requirements' : undefined}
        onChange={(keys) => setExpanded(keys.includes('requirements'))}
        style={{ background: 'transparent', border: 'none' }}
      >
        <Panel
          key="requirements"
          header={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Space>
                <UnifiedIcon name="check-square" size="sm" color="primary" />
                <span style={{ fontWeight: 500 }}>Requirements</span>
                <Tag color={completionPercentage === 100 ? 'success' : completionPercentage >= 50 ? 'processing' : 'warning'}>
                  {completionPercentage}% Complete
                </Tag>
              </Space>
              <Progress
                percent={completionPercentage}
                size="small"
                strokeColor={completionPercentage === 100 ? '#22c55e' : completionPercentage >= 50 ? '#3b82f6' : '#f59e0b'}
                style={{ width: 100, marginRight: 8 }}
                showInfo={false}
              />
            </div>
          }
          style={{ background: '#f9fafb', borderRadius: 8, marginTop: 8 }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {requirementItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#fff',
                  borderRadius: 6,
                  cursor: item.type === 'essay' || item.type === 'document' ? 'pointer' : 'default',
                }}
                onClick={() => handleItemClick(item)}
              >
                <Checkbox
                  checked={item.status === 'completed'}
                  onChange={(e) => {
                    // Update requirement status
                    if (onUpdate) {
                      const updatedRequirements = { ...requirements };
                      // Update logic would go here based on item type
                      onUpdate(updatedRequirements);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Space style={{ flex: 1, marginLeft: 8 }}>
                  <UnifiedIcon name={getTypeIcon(item.type)} size="sm" color="primary" />
                  <Text style={{ flex: 1 }}>{item.name}</Text>
                  <Tag color={getStatusColor(item.status)}>
                    {getStatusText(item.status)}
                  </Tag>
                </Space>
              </div>
            ))}
          </Space>
          {completionPercentage < 100 && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Button
                type="link"
                size="small"
                onClick={() => navigate(`/student-hub/applications/${applicationId}/edit`)}
              >
                Update Requirements
              </Button>
            </div>
          )}
        </Panel>
      </Collapse>
    </div>
  );
};

export default RequirementsChecklist;
