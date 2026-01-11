import React, { useMemo } from 'react';
import { Progress, Typography, Card, Row, Col, Tag } from 'antd';
import FontAwesomeIcon from '../../../../components/common/icons/FontAwesomeIcon';

const { Text, Title } = Typography;

interface AssessmentProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestionType: string;
  includeAptitude: boolean;
  language?: 'en' | 'uz' | 'ru';
}

// Module configuration
const MODULES = {
  riasec: {
    name: 'Interests',
    shortName: 'RIASEC',
    icon: 'compass',
    color: '#8b0000',
    questionCount: 42,
    estimatedMinutes: 8,
    description: 'Discover your career interests',
  },
  values: {
    name: 'Values',
    shortName: 'Values',
    icon: 'heart',
    color: '#ec4899',
    questionCount: 12,
    estimatedMinutes: 3,
    description: 'What motivates you',
  },
  'big-five': {
    name: 'Personality',
    shortName: 'Big Five',
    icon: 'brain',
    color: '#6366f1',
    questionCount: 20,
    estimatedMinutes: 5,
    description: 'Your work style',
  },
  aptitude: {
    name: 'Aptitude',
    shortName: 'Aptitude',
    icon: 'calculator',
    color: '#10b981',
    questionCount: 16,
    estimatedMinutes: 12,
    description: 'Skills assessment',
  },
  'work-style': {
    name: 'Open Questions',
    shortName: 'Open',
    icon: 'edit',
    color: '#f59e0b',
    questionCount: 2,
    estimatedMinutes: 3,
    description: 'Tell us about yourself',
  },
};

type ModuleKey = keyof typeof MODULES;

export const AssessmentProgress: React.FC<AssessmentProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  currentQuestionType,
  includeAptitude,
  language = 'en',
}) => {
  // Calculate module progress
  const moduleProgress = useMemo(() => {
    const modules: ModuleKey[] = includeAptitude
      ? ['riasec', 'values', 'big-five', 'aptitude', 'work-style']
      : ['riasec', 'values', 'big-five', 'work-style'];

    let questionsSoFar = 0;
    let currentModuleIndex = 0;

    for (let i = 0; i < modules.length; i++) {
      const moduleKey = modules[i];
      const moduleQuestionCount = MODULES[moduleKey].questionCount;
      
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
    const currentModuleTotal = MODULES[currentModule].questionCount;

    return {
      modules,
      currentModuleIndex,
      currentModule,
      questionsInCurrentModule,
      currentModuleTotal,
    };
  }, [currentQuestionIndex, includeAptitude]);

  const overallProgress = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const moduleConfig = MODULES[moduleProgress.currentModule as ModuleKey];

  return (
    <Card
      className="assessment-progress"
      style={{
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        marginBottom: 24,
      }}
    >
      {/* Overall Progress */}
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={16}>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary">Overall Progress</Text>
            <Text strong style={{ float: 'right' }}>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Text>
          </div>
          <Progress
            percent={overallProgress}
            strokeColor={{
              '0%': '#8b0000',
              '100%': '#dc143c',
            }}
            strokeWidth={12}
            showInfo={false}
          />
        </Col>
        <Col xs={24} md={8}>
          <div
            style={{
              textAlign: 'center',
              padding: '8px 16px',
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            <Text strong style={{ color: '#8b0000' }}>
              {overallProgress}% Complete
            </Text>
          </div>
        </Col>
      </Row>

      {/* Module Progress */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
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
            {moduleProgress.questionsInCurrentModule} / {moduleProgress.currentModuleTotal}
          </Tag>
        </div>

        {/* Module Stepper */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {moduleProgress.modules.map((moduleKey, index) => {
            const module = MODULES[moduleKey];
            const isActive = index === moduleProgress.currentModuleIndex;
            const isCompleted = index < moduleProgress.currentModuleIndex;
            
            return (
              <div
                key={moduleKey}
                style={{
                  flex: module.questionCount,
                  height: 6,
                  borderRadius: 3,
                  background: isCompleted
                    ? module.color
                    : isActive
                    ? `linear-gradient(90deg, ${module.color} ${(moduleProgress.questionsInCurrentModule / module.questionCount) * 100}%, #e5e7eb ${(moduleProgress.questionsInCurrentModule / module.questionCount) * 100}%)`
                    : '#e5e7eb',
                  transition: 'all 0.3s ease',
                }}
                title={`${module.name}: ${module.questionCount} questions`}
              />
            );
          })}
        </div>

        {/* Module Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {moduleProgress.modules.map((moduleKey, index) => {
            const module = MODULES[moduleKey];
            const isActive = index === moduleProgress.currentModuleIndex;
            const isCompleted = index < moduleProgress.currentModuleIndex;
            
            return (
              <div
                key={moduleKey}
                style={{
                  textAlign: 'center',
                  flex: 1,
                  opacity: isActive ? 1 : isCompleted ? 0.7 : 0.4,
                }}
              >
                <FontAwesomeIcon
                  icon={isCompleted ? 'check-circle' : (module.icon as any)}
                  style={{
                    color: isCompleted ? '#10b981' : isActive ? module.color : '#9ca3af',
                    fontSize: 14,
                  }}
                />
                <Text
                  style={{
                    display: 'block',
                    fontSize: 10,
                    color: isActive ? module.color : '#6b7280',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {module.shortName}
                </Text>
              </div>
            );
          })}
        </div>
      </div>

    </Card>
  );
};

export default AssessmentProgress;

