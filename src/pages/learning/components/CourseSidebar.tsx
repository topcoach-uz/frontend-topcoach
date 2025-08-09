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
  BookOutlined
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
  const [expandedModules, setExpandedModules] = useState<string[]>(['0']); // Default expand first module

  // Calculate overall progress
  const totalLessons = courseStructure?.reduce((total, module) => 
    total + (module.lessons?.length || 0), 0
  ) || 0;
  
  const serverCompletedLessons = userProgress?.completedLessons || 0;
  const localCompletedCount = 0; // Removed localCompletedLessons prop
  const completedLessons = Math.max(serverCompletedLessons, localCompletedCount);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Debug: Log when component re-renders
  useEffect(() => {
    console.log('CourseSidebar re-rendered:', {
      completedLessons: userProgress?.completedLessons,
      totalLessons: userProgress?.totalLessons,
      progress: userProgress?.progress?.length,
      overallProgress,
      progressItems: userProgress?.progress?.map((p: any) => ({ lessonId: p.lessonId, isCompleted: p.isCompleted }))
    });
  }, [userProgress?.completedLessons, userProgress?.totalLessons, userProgress?.progress, overallProgress]);

  // Check if lesson is completed (combine server + local state)
  const isLessonCompleted = (lessonId: string) => {
    const serverCompleted = userProgress?.progress?.some((p: any) => 
      p.lessonId === lessonId && p.isCompleted
    ) || false;
    const localCompleted = false; // Removed completedLessonsProp.has(lessonId)
    const result = serverCompleted || localCompleted;
    
    // Debug: Log completion status for each lesson
    if (lessonId === selectedLessonId) {
      console.log('Sidebar lesson completion status:', {
        lessonId,
        serverCompleted,
        localCompleted,
        result,
        // completedLessons: Array.from(completedLessonsProp) // Removed as per new_code
      });
    }
    
    return result;
  };

  // Get lesson progress
  const getLessonProgress = (lessonId: string) => {
    const progress = userProgress?.progress?.find((p: any) => p.lessonId === lessonId);
    return progress?.progressPercentage || 0;
  };

  // Get lesson icon based on type
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

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleModuleChange = (keys: string | string[]) => {
    setExpandedModules(Array.isArray(keys) ? keys : [keys]);
  };

  const handleLessonClick = (lessonId: string) => {
    onLessonSelect(lessonId);
  };

  if (collapsed) {
    return (
      <div className="course-sidebar-collapsed">
        {/* Course Icon - Clickable to expand */}
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
    );
  }

  return (
    <div className="course-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="header-content">
          <h2>{t('Course Content')}</h2>
          <Button
            type="text"
            icon={collapsed ? <MenuOutlined /> : <DoubleLeftOutlined />}
            onClick={onToggleCollapse}
            className="collapse-btn"
            size="small"
          />
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
                    <h3>{module.title}</h3>
                    <div className="module-meta">
                      <span className="lesson-count">
                        {module.lessons?.length || 0} lessons
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
                {module.lessons?.map((lesson: any, lessonIndex: number) => {
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
                            { formatDuration(lesson.duration)}
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
      </div>
    </div>
  );
};

export default CourseSidebar; 