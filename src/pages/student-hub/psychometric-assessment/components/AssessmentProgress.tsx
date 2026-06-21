import React, { useMemo, useState } from 'react';
import { Modal, message } from 'antd';
import {
  Compass,
  Brain,
  Star,
  Lightbulb,
  PenLine,
  Calculator,
  Check,
  Save,
  LogOut,
  Trash2,
} from 'lucide-react';
import './AssessmentQuestions.scss';

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

// Module configuration V2 (updated question counts).
// `Icon` is a lucide-react component so the segmented bar matches the
// rest of the editorial AI Major Match feature.
const MODULES = {
  riasec: {
    name: 'Interests',
    shortName: 'RIASEC',
    Icon: Compass,
    questionCount: 12, // V2: 12 forced-choice pairs
    description: 'Discover your career interests',
  },
  'big-five': {
    name: 'Personality',
    shortName: 'Big Five',
    Icon: Brain,
    questionCount: 20, // V2: Behavioral + reverse scoring
    description: 'Your work style',
  },
  values: {
    name: 'Values',
    shortName: 'Values',
    Icon: Star,
    questionCount: 10, // V2: Reduced, more tradeoffs
    description: 'What motivates you',
  },
  sjt: {
    name: 'Scenarios',
    shortName: 'SJT',
    Icon: Lightbulb,
    questionCount: 4, // V2: New - Situational Judgment
    description: 'Real-life situations',
  },
  'work-style': {
    name: 'Open Questions',
    shortName: 'Open',
    Icon: PenLine,
    questionCount: 2,
    description: 'Tell us about yourself',
  },
  aptitude: {
    name: 'Aptitude',
    shortName: 'Aptitude',
    Icon: Calculator,
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

  const HeadIcon = moduleConfig.Icon;

  return (
    <>
      <div className="majormatch-progress">
        {/* Save and Exit controls */}
        {(onSaveAndExit || onAbandon || onSave) && (
          <div className="majormatch-progress__toolbar">
            {onSave && (
              <button
                type="button"
                className="majormatch-progress__btn"
                onClick={handleSaveClick}
                disabled={isSaving}
              >
                <Save size={14} />
                Save
              </button>
            )}
            <button
              type="button"
              className="majormatch-progress__btn"
              onClick={handleExitClick}
            >
              <LogOut size={14} />
              Exit
            </button>
          </div>
        )}

        <div className="majormatch-progress__panel">
          {/* Current module header */}
          <div className="majormatch-progress__head">
            <span className="majormatch-progress__head-icon">
              <HeadIcon size={18} />
            </span>
            <div className="majormatch-progress__head-text">
              <div className="majormatch-progress__module-name">{moduleConfig.name}</div>
              <div className="majormatch-progress__module-desc">{moduleConfig.description}</div>
            </div>
            <span className="majormatch-progress__count">
              {currentQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>

          {/* Segmented progress track */}
          <div className="majormatch-progress__track">
            {moduleProgress.modules.map((moduleKey, index) => {
              const module = MODULES[moduleKey];
              const moduleCount = moduleProgress.getModuleCount(moduleKey); // Use dynamic count
              const isActive = index === moduleProgress.currentModuleIndex;
              const isCompleted = index < moduleProgress.currentModuleIndex;
              const fillPct = isActive
                ? (moduleProgress.questionsInCurrentModule / moduleCount) * 100
                : 0;

              return (
                <div
                  key={moduleKey}
                  className={`majormatch-progress__segment ${isCompleted ? 'is-completed' : ''}`}
                  style={{ flex: moduleCount }} // Use dynamic count for proportional width
                  title={`${module.name}: ${moduleCount} questions`}
                >
                  {isActive && (
                    <span
                      className="majormatch-progress__segment-fill"
                      style={{ width: `${fillPct}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Module labels centered below each section */}
          <div className="majormatch-progress__labels">
            {moduleProgress.modules.map((moduleKey, index) => {
              const module = MODULES[moduleKey];
              const moduleCount = moduleProgress.getModuleCount(moduleKey); // Use dynamic count
              const isActive = index === moduleProgress.currentModuleIndex;
              const isCompleted = index < moduleProgress.currentModuleIndex;
              const LabelIcon = module.Icon;

              return (
                <div
                  key={moduleKey}
                  className={`majormatch-progress__label ${
                    isActive ? 'is-active' : isCompleted ? 'is-completed' : ''
                  }`}
                  style={{ flex: moduleCount }} // Use dynamic count for proportional width
                >
                  {isCompleted ? <Check size={14} /> : <LabelIcon size={14} />}
                  <span className="majormatch-progress__label-text">{module.shortName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exit Modal */}
      <Modal
        title="Exit Assessment"
        open={showExitModal}
        onCancel={() => setShowExitModal(false)}
        footer={null}
        centered
      >
        <div className="majormatch-exit-modal">
          <span className="majormatch-exit-modal__lede">
            Your progress has been saved automatically. What would you like to do?
          </span>

          <button
            type="button"
            className="majormatch-exit-modal__btn majormatch-exit-modal__btn--primary"
            onClick={handleSaveAndExit}
          >
            <Save size={16} />
            Save &amp; Continue Later
          </button>
          <span className="majormatch-exit-modal__meta">
            Your answers are saved. You can resume within 24 hours.
          </span>

          <div className="majormatch-exit-modal__divider">
            <button
              type="button"
              className="majormatch-exit-modal__btn majormatch-exit-modal__btn--danger"
              onClick={handleAbandon}
            >
              <Trash2 size={16} />
              Abandon Assessment
            </button>
            <span className="majormatch-exit-modal__meta">
              All progress will be lost. You&apos;ll start fresh next time.
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AssessmentProgress;
