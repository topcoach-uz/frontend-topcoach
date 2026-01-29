import React, { useMemo, useState } from 'react';
import { Progress, Typography, Card, Row, Col, Tag, Button, Modal, Space, message } from 'antd';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';
import UnifiedIcon from '../../../../components/common/icons/UnifiedIcon';

const { Text, Title } = Typography;

interface AssessmentProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestionType: string;
  includeAptitude: boolean;
  language?: 'en' | 'uz' | 'ru';
  onSave?: () => Promise<void>; // New: just save without exiting
  onSaveAndExit?: () => void;
  onAbandon?: () => void;
  questions?: Array<{ questionType: string }>; // Actual questions for dynamic calculation
}

// Module configuration V2 (updated question counts)
const MODULES = {
  riasec: {
    name: 'Interests',
    shortName: 'RIASEC',
    icon: 'compass',
    color: '#8b0000',
    questionCount: 12, // V2: 12 forced-choice pairs
    description: 'Discover your career interests',
  },
  'big-five': {
    name: 'Personality',
    shortName: 'Big Five',
    icon: 'brain',
    color: '#6366f1',
    questionCount: 20, // V2: Behavioral + reverse scoring
    description: 'Your work style',
  },
  values: {
    name: 'Values',
    shortName: 'Values',
    icon: 'star',
    color: '#ec4899',
    questionCount: 10, // V2: Reduced, more tradeoffs
    description: 'What motivates you',
  },
  sjt: {
    name: 'Scenarios',
    shortName: 'SJT',
    icon: 'lightbulb',
    color: '#14b8a6',
    questionCount: 4, // V2: New - Situational Judgment
    description: 'Real-life situations',
  },
  'work-style': {
    name: 'Open Questions',
    shortName: 'Open',
    icon: 'edit',
    color: '#f59e0b',
    questionCount: 2,
    description: 'Tell us about yourself',
  },
  aptitude: {
    name: 'Aptitude',
    shortName: 'Aptitude',
    icon: 'calculator',
    color: '#10b981',
    questionCount: 12, // V2: Reduced from 16
    description: 'Skills assessment',
  },
};

type ModuleKey = keyof typeof MODULES;

export const AssessmentProgress: React.FC<AssessmentProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  currentQuestionType,
  includeAptitude,
  language = 'en',
  onSave,
  onSaveAndExit,
  onAbandon,
  questions = [],
}) => {
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle save button click (saves progress without exiting)
  const handleSaveClick = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave();
      message.success('Progress saved successfully!');
    } catch (error) {
      message.error('Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate actual question counts from questions array (dynamic, not hardcoded)
  const actualModuleCounts = useMemo(() => {
    if (questions.length === 0) {
      // Fallback to hardcoded counts if questions not provided
      return null;
    }
    
    const counts: Record<string, number> = {};
    questions.forEach(q => {
      const type = q.questionType;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [questions]);

  // Calculate module progress (dynamically from actual questions)
  const moduleProgress = useMemo(() => {
    // Determine which modules exist based on actual questions or default order
    const defaultModules: ModuleKey[] = includeAptitude
      ? ['riasec', 'big-five', 'values', 'sjt', 'work-style', 'aptitude']
      : ['riasec', 'big-five', 'values', 'sjt', 'work-style'];

    // Filter to only modules that have questions (handles V1 vs V2)
    const modules = actualModuleCounts
      ? (defaultModules.filter(m => (actualModuleCounts[m] || 0) > 0) as ModuleKey[])
      : defaultModules;

    // Get question count for each module (from actual data or fallback to hardcoded)
    const getModuleCount = (moduleKey: ModuleKey): number => {
      if (actualModuleCounts && actualModuleCounts[moduleKey] !== undefined) {
        return actualModuleCounts[moduleKey];
      }
      return MODULES[moduleKey].questionCount;
    };

    let questionsSoFar = 0;
    let currentModuleIndex = 0;

    for (let i = 0; i < modules.length; i++) {
      const moduleKey = modules[i];
      const moduleQuestionCount = getModuleCount(moduleKey);
      
      if (currentQuestionIndex < questionsSoFar + moduleQuestionCount) {
        currentModuleIndex = i;
        break;
      }
      questionsSoFar += moduleQuestionCount;
      if (i === modules.length - 1) {
        currentModuleIndex = i;
      }
    }

    const currentModule = modules[currentModuleIndex];
    const questionsInCurrentModule = currentQuestionIndex - questionsSoFar + 1;
    const currentModuleTotal = getModuleCount(currentModule);

    return {
      modules,
      currentModuleIndex,
      currentModule,
      questionsInCurrentModule,
      currentModuleTotal,
      getModuleCount,
    };
  }, [currentQuestionIndex, includeAptitude, actualModuleCounts]);

  const overallProgress = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const moduleConfig = MODULES[moduleProgress.currentModule as ModuleKey];

  const handleExitClick = () => {
    setShowExitModal(true);
  };

  const handleSaveAndExit = () => {
    setShowExitModal(false);
    onSaveAndExit?.();
  };

  const handleAbandon = () => {
    setShowExitModal(false);
    onAbandon?.();
  };

  return (
    <>
      {/* Save and Exit Buttons Outside Card */}
      {(onSaveAndExit || onAbandon || onSave) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
          {onSave && (
            <Button
              type="text"
              onClick={handleSaveClick}
              loading={isSaving}
              icon={<FontAwesomeIcon icon="save" />}
            >
              Save
            </Button>
          )}
          <Button
            type="text"
            onClick={handleExitClick}
            icon={<FontAwesomeIcon icon="sign-out-alt" />}
          >
            Exit
          </Button>
        </div>
      )}

      <Card
        className="assessment-progress"
        style={{
          background: '#ffffff',
          marginBottom: 16,
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        {/* Module Progress */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: moduleConfig.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FontAwesomeIcon icon={moduleConfig.icon as any} style={{ color: 'white', fontSize: 18 }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0, color: moduleConfig.color }}>
                {moduleConfig.name}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {moduleConfig.description}
              </Text>
            </div>
            <Tag
              style={{
                marginLeft: 'auto',
                background: `${moduleConfig.color}15`,
                borderColor: moduleConfig.color,
                color: moduleConfig.color,
              }}
            >
              {currentQuestionIndex + 1} / {totalQuestions}
            </Tag>
          </div>

          {/* Module Stepper with Labels Below Each Section */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {moduleProgress.modules.map((moduleKey, index) => {
                const module = MODULES[moduleKey];
                const moduleCount = moduleProgress.getModuleCount(moduleKey); // Use dynamic count
                const isActive = index === moduleProgress.currentModuleIndex;
                const isCompleted = index < moduleProgress.currentModuleIndex;
                
                return (
                  <div
                    key={moduleKey}
                    style={{
                      flex: moduleCount, // Use dynamic count for proportional width
                      height: 6,
                      borderRadius: 3,
                      background: isCompleted
                        ? module.color
                        : isActive
                        ? `linear-gradient(90deg, ${module.color} ${(moduleProgress.questionsInCurrentModule / moduleCount) * 100}%, #e5e7eb ${(moduleProgress.questionsInCurrentModule / moduleCount) * 100}%)`
                        : '#e5e7eb',
                      transition: 'all 0.3s ease',
                    }}
                    title={`${module.name}: ${moduleCount} questions`}
                  />
                );
              })}
            </div>

            {/* Module Labels - Centered Below Each Section */}
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {moduleProgress.modules.map((moduleKey, index) => {
                const module = MODULES[moduleKey];
                const moduleCount = moduleProgress.getModuleCount(moduleKey); // Use dynamic count
                const isActive = index === moduleProgress.currentModuleIndex;
                const isCompleted = index < moduleProgress.currentModuleIndex;
                
                return (
                  <div
                    key={moduleKey}
                    style={{
                      flex: moduleCount, // Use dynamic count for proportional width
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isActive ? 1 : isCompleted ? 0.7 : 0.4,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={isCompleted ? 'check-circle' : (module.icon as any)}
                      style={{
                        color: isCompleted ? '#10b981' : isActive ? module.color : '#9ca3af',
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        color: isActive ? module.color : '#6b7280',
                        fontWeight: isActive ? 600 : 400,
                        textAlign: 'center',
                      }}
                    >
                      {module.shortName}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Exit Modal */}
      <Modal
        title="Exit Assessment"
        open={showExitModal}
        onCancel={() => setShowExitModal(false)}
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Text style={{ display: 'block', marginBottom: 24, fontSize: 16 }}>
            Your progress has been saved automatically. What would you like to do?
          </Text>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleSaveAndExit}
              icon={<FontAwesomeIcon icon="save" style={{ marginRight: 8 }} />}
            >
              Save & Continue Later
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Your answers are saved. You can resume within 24 hours.
            </Text>
            
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Button
                className="btn-delete-crimson"
                size="large"
                block
                onClick={handleAbandon}
                icon={<UnifiedIcon name="trash-2" size="sm" color="white" />}
              >
                Abandon Assessment
              </Button>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                All progress will be lost. You'll start fresh next time.
              </Text>
            </div>
          </Space>
        </div>
      </Modal>
    </>
  );
};

export default AssessmentProgress;
