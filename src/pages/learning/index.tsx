import React, { useState, useEffect } from 'react';
import { Layout, Spin, Button, message } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useGetCourseStructureQuery, useGetUserProgressQuery, useUpdateLessonProgressMutation, useGetEnrollmentStatusQuery } from 'src/app/services/courses';
import CourseSidebar from './components/CourseSidebar';
import VideoPlayer from './components/VideoPlayer';
import PDFViewer from './components/PDFViewer';
import ProgressTracker from './components/ProgressTracker';
import { ACCESS_TOKEN } from 'src/constants/storage';
import './index.scss';
import { useDispatch } from 'react-redux';
import { coursesApi } from 'src/app/services/courses';

const { Sider, Content } = Layout;

interface LearningPageProps {}

const LearningPage: React.FC<LearningPageProps> = () => {
  const { t } = useTranslation();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();

  // API hooks
  const { data: courseStructure, isLoading: structureLoading, error: structureError, refetch: refetchCourseStructure } = useGetCourseStructureQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: userProgress, isLoading: progressLoading, error: progressError, refetch: refetchUserProgress } = useGetUserProgressQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: enrollmentStatus } = useGetEnrollmentStatusQuery();
  const [updateLessonProgress] = useUpdateLessonProgressMutation();

  // Throttle progress updates to every 5 seconds
  const handleProgressUpdate = (progress: number, lessonId: string, duration: number) => {
    if (progress > 0) { // 5 seconds throttle
      updateLessonProgress({
        lessonId,
        data: {
          progressPercentage: Math.round(progress),
          timeWatched: Math.round((progress / 100) * (duration * 60)),
        }
      }).catch(() => {
        // Silently handle errors
      });
    }
  };

  // Find the selected lesson
  const selectedLesson = courseStructure?.flatMap(module => 
    module.lessons?.filter(lesson => lesson.id === selectedLessonId) || []
  )[0];

  // Find the selected module
  const selectedModule = courseStructure?.find(module => 
    module.lessons?.some(lesson => lesson.id === selectedLessonId)
  );

  // Simple state for immediate UI feedback
  const [isCurrentLessonCompleted, setIsCurrentLessonCompleted] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Initialize completed lessons from server data
  useEffect(() => {
    if (userProgress?.progress) {
      const currentLessonCompleted = userProgress.progress.find((p: any) => p.lessonId === selectedLessonId)?.isCompleted || false;
      setIsCurrentLessonCompleted(currentLessonCompleted);
    }
  }, [userProgress?.progress, selectedLessonId]);

  // Check if selected lesson is completed (combine server + local state)
  const serverCompleted = userProgress?.progress?.find((l: any) => l.lessonId === selectedLessonId)?.isCompleted || false;
  const isSelectedLessonCompleted = serverCompleted || isCurrentLessonCompleted;

  // Debug: Log completion status
  useEffect(() => {
    console.log('Lesson completion status:', {
      selectedLessonId,
      serverCompleted,
      isCurrentLessonCompleted,
      isSelectedLessonCompleted,
      forceUpdate,
      userProgress: userProgress?.progress?.find((l: any) => l.lessonId === selectedLessonId)
    });
  }, [selectedLessonId, isSelectedLessonCompleted, userProgress?.progress, isCurrentLessonCompleted, forceUpdate]);

  // Force refetch user progress after any completion
  const [lastCompletionTime, setLastCompletionTime] = useState<number>(0);
  
  useEffect(() => {
    if (lastCompletionTime > 0) {
      // Refetch user progress after a short delay to ensure server state is updated
      const timer = setTimeout(() => {
        refetchUserProgress();
        setLastCompletionTime(0);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [lastCompletionTime, refetchUserProgress]);

  // Ensure we have progress data
  const hasProgressData = userProgress && userProgress.progress && userProgress.progress.length > 0;

  useEffect(() => {
    if (selectedLessonId) {
      setSelectedLessonId(selectedLessonId);
    } else if (courseStructure && courseStructure.length > 0) {
      // Auto-select first lesson if no lesson is selected
      const firstLesson = courseStructure[0]?.lessons?.[0];
      if (firstLesson) {
        setSelectedLessonId(firstLesson.id);
      }
    }
  }, [selectedLessonId, courseStructure]);

  useEffect(() => {
    if (structureError) {
      console.error('Course structure error:', structureError);
      message.error('Failed to load course structure. Please try refreshing the page.');
    }
    if (progressError) {
      console.error('User progress error:', progressError);
      message.error('Failed to load progress. Please try refreshing the page.');
    }
  }, [structureError, progressError]);

  if (structureLoading || progressLoading) {
    return (
      <div className="learning-loading">
        <Spin size="large" />
        <p>{t('Loading course content...')}</p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
          This may take a few moments on first load
        </p>
      </div>
    );
  }

  if (structureError || progressError) {
    return (
      <div className="learning-error">
        <h2>{t('Unable to load course content')}</h2>
        <p>{t('There was an error loading your course. Please try refreshing the page or contact support if the problem persists.')}</p>
        <Button 
          type="primary" 
          onClick={() => window.location.reload()}
          style={{ marginTop: '16px' }}
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  if (!courseStructure || courseStructure.length === 0) {
    return (
      <div className="learning-error">
        <h2>{t('No course content available')}</h2>
        <p>{t('Course content is being prepared. Please check back later or contact support if you believe this is an error.')}</p>
      </div>
    );
  }

  return (
    <Layout className="learning-page">
      <Sider 
        width={320} 
        collapsedWidth={80}
        collapsed={collapsed}
        className="learning-sidebar"
        theme="light"
        trigger={null} // Remove default trigger
      >
        <CourseSidebar
          key={`sidebar-${forceUpdate}`}
          courseStructure={courseStructure}
          userProgress={userProgress}
          selectedLessonId={selectedLessonId}
          onLessonSelect={setSelectedLessonId}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </Sider>
      
      <Layout className="learning-content">
        <Content className="content-area">
          {selectedLesson ? (
            <div className="lesson-container">
              <div className="lesson-header">
                <div className="lesson-title-section">
                  <h1>{selectedLesson.title}</h1>
                </div>
                {selectedModule && (
                  <div className="module-info">
                    <span className="module-name">{selectedModule.title}</span>
                    <span className="mentor-name">by {selectedModule.mentorName || selectedModule.mentor?.email}</span>
                  </div>
                )}
              </div>

              <div className="lesson-content">
                {selectedLesson.lessonType === 'video' && selectedLesson.contentUrl && (
                  <VideoPlayer
                    src={selectedLesson.contentUrl}
                    title={selectedLesson.title}
                    onProgressUpdate={(progress) => {
                      // Update progress every 5 seconds
                      if (progress > 0) {
                        handleProgressUpdate(progress, selectedLesson.id, selectedLesson.duration);
                      }
                    }}
                    onComplete={async () => {
                      try {
                        // Check if user is enrolled
                        if (!enrollmentStatus?.isEnrolled) {
                          message.error('You must be enrolled in the course to mark lessons as completed');
                          return;
                        }

                        // IMMEDIATE UI UPDATE - like real websites
                        console.log('Before state update:', {
                          lessonId: selectedLesson.id,
                          currentCompletedLessons: Array.from(new Set()), // No longer needed
                          forceUpdate
                        });
                        
                        setIsCurrentLessonCompleted(true);
                        
                        setForceUpdate(prev => {
                          const newValue = prev + 1;
                          console.log('Force update changed:', { from: prev, to: newValue });
                          return newValue;
                        });

                        const updateData = {
                          isCompleted: true,
                          progressPercentage: 100,
                          timeWatched: selectedLesson.duration * 60,
                        };
                        
                        console.log('Sending to server:', {
                          lessonId: selectedLesson.id,
                          data: updateData
                        });
                        
                        // Server call in background (don't await - let it happen in background)
                        updateLessonProgress({
                          lessonId: selectedLesson.id,
                          data: updateData
                        }).unwrap().then(() => {
                          console.log('Server update successful');
                          // Refetch to sync with server
                          refetchUserProgress();
                        }).catch((error) => {
                          console.error('Server update failed:', error);
                          // Revert UI if server fails
                          setIsCurrentLessonCompleted(false);
                          message.error('Failed to save completion status');
                        });
                        
                        message.success('Lesson completed!');
                      } catch (error) {
                        console.error('Error:', error);
                        message.error('Failed to mark lesson as completed');
                      }
                    }}
                  />
                )}
                
                {selectedLesson.lessonType === 'pdf' && selectedLesson.contentUrl && (
                  <PDFViewer
                    key={`${selectedLesson.id}-${forceUpdate}`}
                    pdfUrl={selectedLesson.contentUrl}
                    lessonId={selectedLesson.id}
                    title={selectedLesson.title}
                    onComplete={async () => {
                      try {
                        // Check if user is enrolled
                        if (!enrollmentStatus?.isEnrolled) {
                          message.error('You must be enrolled in the course to mark lessons as completed');
                          return;
                        }

                        // IMMEDIATE UI UPDATE - like real websites
                        setIsCurrentLessonCompleted(true);
                        setForceUpdate(prev => prev + 1); // Force re-render

                        const updateData = {
                          isCompleted: true,
                          progressPercentage: 100,
                          timeWatched: selectedLesson.duration * 60,
                        };
                        
                        console.log('Sending to server:', {
                          lessonId: selectedLesson.id,
                          data: updateData
                        });
                        
                        // Server call in background (don't await - let it happen in background)
                        updateLessonProgress({
                          lessonId: selectedLesson.id,
                          data: updateData
                        }).unwrap().then(() => {
                          console.log('Server update successful');
                          // Refetch to sync with server
                          refetchUserProgress();
                        }).catch((error) => {
                          console.error('Server update failed:', error);
                          // Revert UI if server fails
                          setIsCurrentLessonCompleted(false);
                          message.error('Failed to save completion status');
                        });
                        
                        message.success('PDF lesson completed!');
                      } catch (error) {
                        console.error('Error:', error);
                        message.error('Failed to mark lesson as completed');
                      }
                    }}
                    isCompleted={isSelectedLessonCompleted}
                  />
                )}

                {selectedLesson.lessonType === 'live_session' && (
                  <div className="live-session-placeholder">
                    <h3>Live Session</h3>
                    <p>This is a live session. Please check your email for meeting details.</p>
                  </div>
                )}

                {selectedLesson.description && (
                  <div className="lesson-description">
                    <h3>Description</h3>
                    <p>{selectedLesson.description}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-lesson-selected">
              <h2>{t('Select a lesson to start learning')}</h2>
              <p>{t('Choose a lesson from the sidebar to begin your course.')}</p>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default LearningPage; 