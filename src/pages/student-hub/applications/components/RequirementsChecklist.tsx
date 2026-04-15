import React, { useState } from 'react';
import { Collapse, Checkbox, Progress, Space, Tag, Button, Typography, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import UnifiedIcon from '../../../../components/common/icons/UnifiedIcon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface RequirementItem {
  id: string;
  type: 'essay' | 'document' | 'recommendation' | 'interview' | 'portfolio' | 'financial_aid' | 'test_score' | 'other';
  name: string;
  required: boolean;
  dueDate?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  linkedItemId?: string;
  notes?: string;
}

interface RequirementsChecklistProps {
  applicationId: string;
  /** When true, show only "Requirements X% Complete" with no expandable bullet points */
  headerOnly?: boolean;
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
    custom?: {
      items: Array<{ id: string; title: string; completed: boolean }>;
    };
  };
  onUpdate?: (requirements: any, activityMeta?: { itemId: string; itemName: string }) => void;
}

function applyRequirementToggle(
  requirements: Record<string, any>,
  item: RequirementItem,
  checked: boolean
): Record<string, any> {
  const next = JSON.parse(JSON.stringify(requirements || {}));

  if (item.id.startsWith('essay-')) {
    const i = parseInt(item.id.replace('essay-', ''), 10);
    const e = next.essays || { required: 0, completed: 0, prompts: [] };
    const required = e.required || 0;
    let completed = Math.max(0, Math.min(required, e.completed ?? 0));
    if (checked) completed = Math.min(required, Math.max(completed, i + 1));
    else completed = Math.max(0, Math.min(completed, i));
    next.essays = { ...e, required, completed, prompts: e.prompts || [] };
    return next;
  }

  if (item.id.startsWith('recommendation-')) {
    const i = parseInt(item.id.replace('recommendation-', ''), 10);
    const r = next.recommendations || { required: 0, submitted: 0, requested: 0 };
    const required = r.required || 0;
    let submitted = Math.max(0, Math.min(required, r.submitted ?? 0));
    if (checked) submitted = Math.min(required, Math.max(submitted, i + 1));
    else submitted = Math.max(0, Math.min(submitted, i));
    next.recommendations = { ...r, required, submitted, requested: r.requested ?? 0 };
    return next;
  }

  if (item.id === 'transcript') {
    const t = next.transcripts || { status: 'pending', verified: false };
    next.transcripts = { ...t, status: checked ? 'received' : 'pending' };
    return next;
  }

  if (item.id.startsWith('test-')) {
    const i = parseInt(item.id.replace('test-', ''), 10);
    const ts = next.testScores || { status: 'pending', required: [], submitted: [] };
    const required = ts.required || [];
    const name = required[i] || `Test ${i + 1}`;
    let submitted = [...(ts.submitted || [])];
    if (checked) { if (!submitted.includes(name)) submitted.push(name); }
    else submitted = submitted.filter((s: string) => s !== name);
    next.testScores = { ...ts, required, submitted };
    return next;
  }

  if (item.id === 'interview') {
    const inv = next.interviews || { required: true, scheduled: undefined, completed: undefined };
    next.interviews = { ...inv, completed: checked ? new Date().toISOString() : undefined };
    return next;
  }

  if (item.id.startsWith('supplement-')) {
    const i = parseInt(item.id.replace('supplement-', ''), 10);
    const s = next.supplements || { required: 0, completed: 0, prompts: [] };
    const required = s.required || 0;
    let completed = Math.max(0, Math.min(required, s.completed ?? 0));
    if (checked) completed = Math.min(required, Math.max(completed, i + 1));
    else completed = Math.max(0, Math.min(completed, i));
    next.supplements = { ...s, required, completed, prompts: s.prompts || [] };
    return next;
  }

  // Custom items
  if (item.type === 'other' && ((next as any).custom?.items)) {
    const list = (next as any).custom.items as Array<{ id: string; title: string; completed: boolean }>;
    const idx = list.findIndex((c) => (c.id || '').toString() === item.id);
    if (idx >= 0) {
      const updated = [...list];
      updated[idx] = { ...updated[idx], completed: checked };
      (next as any).custom = { items: updated };
    }
    return next;
  }

  return next;
}

const RequirementsChecklist: React.FC<RequirementsChecklistProps> = ({
  applicationId,
  requirements = {},
  onUpdate,
  headerOnly = false,
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
          name: prompts[i] || t('studentHub.applications.essayNumber', 'Essay {{number}}', { number: i + 1 }),
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
          name: t('studentHub.applications.recommendationLetterNumber', 'Recommendation Letter {{number}}', { number: i + 1 }),
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
        name: t('studentHub.applications.officialTranscripts', 'Official Transcripts'),
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
        name: t('studentHub.applications.interview', 'Interview') + (requirements.interviews.type ? ` (${requirements.interviews.type})` : ''),
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
          name: prompts[i] || t('studentHub.applications.supplementNumber', 'Supplement {{number}}', { number: i + 1 }),
          required: true,
          status: i < completed ? 'completed' : 'not_started',
        });
      }
    }

    // Custom items
    const customItems = (requirements as any).custom?.items;
    if (Array.isArray(customItems)) {
      customItems.forEach((c: { id: string; title: string; completed: boolean }, i: number) => {
        items.push({
          id: c.id || `custom-${i}`,
          type: 'other',
          name: c.title || t('studentHub.applications.customNumber', 'Custom {{number}}', { number: i + 1 }),
          required: true,
          status: c.completed ? 'completed' : 'not_started',
        });
      });
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
        return t('studentHub.applications.status.complete', 'Complete');
      case 'in_progress':
        return t('studentHub.applications.status.inProgress', 'In Progress');
      case 'overdue':
        return t('studentHub.applications.status.overdue', 'Overdue');
      default:
        return t('studentHub.applications.status.notStarted', 'Not Started');
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
      case 'other':
        return 'file';
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

  if (totalItems === 0 && !headerOnly) {
    return (
      <div style={{ padding: '4px 0', color: '#94a3b8', fontSize: '12px' }}>
        <Text type="secondary">{t('studentHub.applications.noRequirementsTracked', 'No requirements tracked yet. Add them in the edit page.')}</Text>
      </div>
    );
  }

  const headerBlock = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
      <Space size="small">
        <span style={{ fontWeight: 500 }}>Requirements</span>
        <Tag color={completionPercentage === 100 ? 'success' : completionPercentage >= 50 ? 'processing' : 'warning'}>
          {completionPercentage}% Complete
        </Tag>
      </Space>
      <Progress
        percent={completionPercentage}
        size="small"
        strokeColor={completionPercentage === 100 ? '#22c55e' : completionPercentage >= 50 ? '#3b82f6' : '#f59e0b'}
        style={{ width: 100, flexShrink: 0 }}
        showInfo={false}
      />
    </div>
  );

  if (headerOnly) {
    return (
      <div
        className="requirements-checklist requirements-checklist--header-only"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {headerBlock}
      </div>
    );
  }

  const collapseItems = [
    {
      key: 'requirements',
      label: headerBlock,
      children: (
        <>
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
                    if (!onUpdate) return;
                    const checked = e.target.checked;
                    const updated = applyRequirementToggle(requirements, item, checked);
                    const activityMeta = checked ? { itemId: item.id, itemName: item.name } : undefined;
                    onUpdate(updated, activityMeta);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Space style={{ flex: 1, marginLeft: 8 }} wrap>
                  <UnifiedIcon name={getTypeIcon(item.type)} size="sm" color="primary" />
                  <Text style={{ flex: 1 }}>{item.name}</Text>
                  <Tag color={getStatusColor(item.status)}>
                    {getStatusText(item.status)}
                  </Tag>
                  {item.type === 'essay' && (
                    <Link
                      to="/student-hub/essays"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      {t('studentHub.applications.openInEssaysHub', 'Open in Essays Hub')} →
                    </Link>
                  )}
                  {(item.type === 'document' || item.type === 'recommendation') && (
                    <Link
                      to="/student-hub/documents"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      {t('studentHub.applications.openInDocuments', 'Open in Documents')} →
                    </Link>
                  )}
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
                {t('studentHub.applications.updateRequirements', 'Update Requirements')}
              </Button>
            </div>
          )}
        </>
      ),
      style: { background: '#f9fafb', borderRadius: 8, marginTop: 8 },
    },
  ];

  return (
    <div
      className="requirements-checklist"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Collapse
        activeKey={expanded ? ['requirements'] : undefined}
        onChange={(keys) => setExpanded(Array.isArray(keys) && keys.includes('requirements'))}
        items={collapseItems}
        style={{ background: 'transparent', border: 'none' }}
      />
    </div>
  );
};

export default RequirementsChecklist;
