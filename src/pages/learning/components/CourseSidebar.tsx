import React, { useState, useEffect } from 'react';
import { Collapse, Progress, Button } from 'antd';
import { 
  PlayCircleOutlined, 
  FileTextOutlined, 
  VideoCameraOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  MenuOutlined,
  DoubleLeftOutlined,
  BookOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import './CourseSidebar.scss';

const { Panel } = Collapse;

interface CourseSidebarProps {
  courseStructure: any[];
  userProgress: any;
  selectedLessonId: string | null;
  onLessonSelect: (lessonId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  courseStructure,
  userProgress,
  selectedLessonId,
  onLessonSelect,
  collapsed,
  onToggleCollapse,
}) => {
  const { t } = useTranslation();
  const [expandedModules, setExpandedModules] = useState<string[]>(['0']);
  const [expandedSubmodules, setExpandedSubmodules] = useState<Record<string, string[]>>({});

  // Calculate overall progress (including lessons from submodules)
  const totalLessons = courseStructure?.reduce((total, module) => {
    const moduleLessons = module.lessons?.length || 0;
    const submoduleLessons = module.submodules?.reduce((subTotal: number, submodule: any) => 
      subTotal + (submodule.lessons?.length || 0), 0
  ) || 0;
    return total + moduleLessons + submoduleLessons;
  }, 0) || 0;
  
  const serverCompletedLessons = userProgress?.completedLessons || 0;
  const localCompletedCount = 0;
  const completedLessons = Math.max(serverCompletedLessons, localCompletedCount);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  useEffect(() => {
    console.log('CourseSidebar re-rendered:', {
      completedLessons: userProgress?.completedLessons,
      totalLessons: userProgress?.totalLessons,
      progress: userProgress?.progress?.length,
      overallProgress,
      progressItems: userProgress?.progress?.map((p: any) => ({ lessonId: p.lessonId, isCompleted: p.isCompleted }))
    });
  }, [userProgress?.completedLessons, userProgress?.totalLessons, userProgress?.progress, overallProgress]);

  const isLessonCompleted = (lessonId: string) => {
    const serverCompleted = userProgress?.progress?.some((p: any) => 
      p.lessonId === lessonId && p.isCompleted
    ) || false;
    const localCompleted = false;
    const result = serverCompleted || localCompleted;
    
    if (lessonId === selectedLessonId) {
      console.log('Sidebar lesson completion status:', {
        lessonId,
        serverCompleted,
        localCompleted,
        result,
      });
    }
    
    return result;
  };

  const getLessonProgress = (lessonId: string) => {
    const progress = userProgress?.progress?.find((p: any) => p.lessonId === lessonId);
    return progress?.progressPercentage || 0;
  };

  const getLessonIcon = (lessonType: string) => {
    switch (lessonType) {
      case 'video':
        return <PlayCircleOutlined />;
      case 'pdf':
        return <FileTextOutlined />;
      case 'live_session':
        return <VideoCameraOutlined />;
      default:
        return <PlayCircleOutlined />;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleModuleChange = (keys: string | string[]) => {
    setExpandedModules(Array.isArray(keys) ? keys : [keys]);
  };

  const handleSubmoduleChange = (moduleIndex: number, keys: string | string[]) => {
    setExpandedSubmodules(prev => ({
      ...prev,
      [moduleIndex.toString()]: Array.isArray(keys) ? keys : [keys]
    }));
  };

  const handleLessonClick = (lessonId: string) => {
    onLessonSelect(lessonId);
  };

  // Mobile floating button when sidebar is collapsed
  if (collapsed) {
    return (
      <>
        {/* Desktop collapsed sidebar */}
        <div className="course-sidebar-collapsed desktop-only">
          <div className="course-icon" onClick={onToggleCollapse}>
            <BookOutlined />
          </div>
          
          <div className="progress-summary">
            <div className="progress-text">
              <span className="percentage">{overallProgress}%</span>
              <span className="label">Complete</span>
            </div>
          </div>
        </div>

        {/* Mobile floating button */}
        <Button
          type="primary"
          icon={<MenuOutlined />}
          onClick={onToggleCollapse}
          className="mobile-sidebar-toggle"
          size="large"
      // style={{backgroundColor: '#667eea', borderColor: '#667eea'}}
        >
          Menu
        </Button>
      </>
    );
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div className="mobile-sidebar-overlay" onClick={onToggleCollapse} />
      
   <div className={`course-sidebar ${collapsed ? 'hidden' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="header-content">
            <h2>{t('Course Content')}</h2>
            <Button
              type="text"
              icon={<CloseOutlined className="mobile-only-icon" />}
              onClick={onToggleCollapse}
              className="collapse-btn"
              size="small"
            >
              <DoubleLeftOutlined className="desktop-only-icon" />
            </Button>
          </div>
          <div className="overall-progress">
            <Progress 
              percent={overallProgress} 
              size="small"
              strokeColor="#667eea"
              showInfo={false}
            />
            <span className="progress-text">
              {completedLessons} of {totalLessons} lessons completed
            </span>
          </div>
        </div>

        {/* Course Structure */}
        <div className="course-structure">
          <Collapse
            activeKey={expandedModules}
            onChange={handleModuleChange}
            ghost

            expandIconPosition="end"
          >
            {courseStructure?.map((module, moduleIndex) => (
              <Panel
                key={moduleIndex.toString()}
                header={
                  <div className="module-header">
                    <div className="module-info">
                      <h3>Module {moduleIndex + 1}</h3>
                      <div className="module-meta">
                        <span className="lesson-count">
                          {(module.lessons?.filter((l: any) => !l.submoduleId).length || 0) + 
                           (module.submodules?.reduce((total: number, sub: any) => total + (sub.lessons?.length || 0), 0) || 0)} lessons
                        </span>
                        <span className="duration">
                          {formatDuration(module.estimatedDuration)}
                        </span>
                      </div>
                    </div>
                    <div className="module-mentor">
                      <span className="mentor-name">
                        {(module.mentorName || module.mentor?.email?.split('@')[0])?.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                }
              >
                <div className="lessons-list">
                  {/* Direct lessons under module */}
                  {module.lessons?.filter((lesson: any) => !lesson.submoduleId).map((lesson: any, lessonIndex: number) => {
                    const isCompleted = isLessonCompleted(lesson.id);
                    const progress = getLessonProgress(lesson.id);
                    const isSelected = selectedLessonId === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        className={`lesson-item ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''}`}
                        onClick={() => handleLessonClick(lesson.id)}
                      >
                        <div className="lesson-icon">
                          {isCompleted ? (
                            <CheckCircleOutlined className="completed-icon" />
                          ) : (
                            getLessonIcon(lesson.lessonType)
                          )}
                        </div>
                        
                        <div className="lesson-content">
                          <div className="lesson-title">
                            <span className="title">{lesson.title}</span>
                            {lesson.isPremium && (
                              <span className="premium-tag">Premium</span>
                            )}
                          </div>
                          
                          <div className="lesson-meta">
                            <span className="lesson-duration">
                              <ClockCircleOutlined />
                              {formatDuration(lesson.duration)}
                            </span>
                            {!isCompleted && progress > 0 && lesson.lessonType !== 'pdf' && (
                              <span className="progress">
                                {progress}% watched
                              </span>
                            )}
                          </div>
                        </div>

                        {!isCompleted && progress > 0 && (
                          <div className="lesson-progress">
                            <Progress 
                              percent={progress} 
                              size="small"
                              showInfo={false}
                              strokeColor="#52c41a"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Submodules with their lessons */}
                  {module.submodules && module.submodules.length > 0 && (
                    <Collapse
                      ghost
                      expandIconPosition="end"
                      activeKey={expandedSubmodules[moduleIndex.toString()] || []}
                      onChange={(keys) => handleSubmoduleChange(moduleIndex, keys)}
                      className="submodules-collapse"
                    >
                      {module.submodules.map((submodule: any, submoduleIndex: number) => (
                        <Panel
                          key={submoduleIndex.toString()}
                          header={
                            <div className="submodule-header">
                              <h4 className="submodule-title">{submodule.title}</h4>
                              <span className="submodule-lesson-count">
                                {submodule.lessons?.length || 0} lessons
                              </span>
                            </div>
                          }
                        >
                          <div className="submodule-lessons">
                            {submodule.lessons?.map((lesson: any, lessonIndex: number) => {
                              const isCompleted = isLessonCompleted(lesson.id);
                              const progress = getLessonProgress(lesson.id);
                              const isSelected = selectedLessonId === lesson.id;

                              return (
                                <div
                                  key={lesson.id}
                                  className={`lesson-item submodule-lesson ${isSelected ? 'selected' : ''} ${isCompleted ? 'completed' : ''}`}
                                  onClick={() => handleLessonClick(lesson.id)}
                                >
                                  <div className="lesson-icon">
                                    {isCompleted ? (
                                      <CheckCircleOutlined className="completed-icon" />
                                    ) : (
                                      getLessonIcon(lesson.lessonType)
                                    )}
                                  </div>
                                  
                                  <div className="lesson-content">
                                    <div className="lesson-title">
                                      <span className="title">{lesson.title}</span>
                                      {lesson.isPremium && (
                                        <span className="premium-tag">Premium</span>
                                      )}
                                    </div>
                                    
                                    <div className="lesson-meta">
                                      <span className="lesson-duration">
                                        <ClockCircleOutlined />
                                        {formatDuration(lesson.duration)}
                                      </span>
                                      {!isCompleted && progress > 0 && lesson.lessonType !== 'pdf' && (
                                        <span className="progress">
                                          {progress}% watched
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {!isCompleted && progress > 0 && (
                                    <div className="lesson-progress">
                                      <Progress 
                                        percent={progress} 
                                        size="small"
                                        showInfo={false}
                                        strokeColor="#52c41a"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </Panel>
                      ))}
                    </Collapse>
                  )}
                </div>
              </Panel>
            ))}
          </Collapse>
        </div>
      </div>
    </>
  );
};

export default CourseSidebar;