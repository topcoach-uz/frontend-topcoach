import React, { useState, useEffect } from 'react';
import { Layout, Spin, Button, message } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, ClockCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useGetCourseStructureQuery, useGetUserProgressQuery, useUpdateLessonProgressMutation, useGetEnrollmentStatusQuery } from 'src/app/services/courses';
import CourseSidebar from './components/CourseSidebar';
import VideoPlayer from './components/VideoPlayer';
import VdoCipherPlayer from './components/VdoCipherPlayer';
import PDFViewer from './components/PDFViewer';
import { ACCESS_TOKEN } from 'src/constants/storage';
import './index.scss';
import { useDispatch } from 'react-redux';
import { coursesApi } from 'src/app/services/courses';
import { useTypedSelector } from 'src/app/store';

const { Sider, Content } = Layout;

interface LearningPageProps {}

const LearningPage: React.FC<LearningPageProps> = () => {
  const { t } = useTranslation();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [vdocipherOTP, setVdocipherOTP] = useState<string | null>(null);
  const [vdocipherPlaybackInfo, setVdocipherPlaybackInfo] = useState<string | null>(null);
  const [isLoadingOTP, setIsLoadingOTP] = useState(false);
  const dispatch = useDispatch();
  
  // Check authentication
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);

  // API hooks - ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL LOGIC
  const { data: enrollmentStatus, isLoading: enrollmentLoading } = useGetEnrollmentStatusQuery();
  const { data: courseStructure, isLoading: structureLoading, error: structureError, refetch: refetchCourseStructure } = useGetCourseStructureQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !enrollmentStatus?.canAccessLearning,
  });
  const { data: userProgress, isLoading: progressLoading, error: progressError, refetch: refetchUserProgress } = useGetUserProgressQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !enrollmentStatus?.canAccessLearning,
  });
  const [updateLessonProgress] = useUpdateLessonProgressMutation();

  // Additional state hooks - ALL HOOKS MUST BE AT THE TOP
  const [lastCompletionTime, setLastCompletionTime] = useState<number>(0);
  const [isCurrentLessonCompleted, setIsCurrentLessonCompleted] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('Please log in to access the learning content');
      window.location.href = '/auth/signin';
      return;
    }
  }, [isAuthenticated]);

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Show loading while enrollment status is being fetched
  if (enrollmentLoading) {
    return (
      <div className="learning-loading">
        <Spin size="large" />
        <p>Checking your enrollment status...</p>
      </div>
    );
  }

  // Debug: Log enrollment status
  console.log('Learning page - Enrollment status:', enrollmentStatus);

  // Check enrollment status and show appropriate message
  if (!enrollmentStatus) {
    return (
      <div className="learning-error">
        <h2>Unable to Load Enrollment Status</h2>
        <p>We're having trouble loading your enrollment information. Please try refreshing the page or contact support.</p>
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

  if (!enrollmentStatus.isEnrolled) {
    return (
      <div className="learning-error">
        <h2>Not Enrolled</h2>
        <p>You need to enroll in a course to access the learning content.</p>
        <Button 
          type="primary" 
          onClick={() => window.location.href = '/programs'}
          style={{ marginTop: '16px' }}
        >
          View Programs
        </Button>
      </div>
    );
  }

  // Check if enrollment is pending approval
  if (enrollmentStatus.isEnrolled && !enrollmentStatus.canAccessLearning) {
    return (
      <div className="learning-pending-approval">
        <div className="pending-content">
          <div className="pending-icon">
            <ClockCircleOutlined />
          </div>
          <h2>Enrollment Pending Approval</h2>
          <p className="pending-message">
            Thank you for enrolling in our course! Your application has been submitted and is currently under review.
          </p>
          <p className="pending-details">
            Our administrator will review your enrollment and contact you within 12 hours. You'll receive access to all learning materials once your enrollment is approved.
          </p>
          <div className="pending-actions">
            <Button 
              type="primary" 
              size="large"
              onClick={() => window.location.href = '/programs'}
              icon={<RocketOutlined />}
            >
              Back to Programs
            </Button>
            <Button 
              size="large"
              onClick={() => window.location.href = '/'}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Generate VdoCipher OTP
  const generateVdoCipherOTP = async (videoId: string) => {
    try {
      setIsLoadingOTP(true);
      const token = localStorage.getItem(ACCESS_TOKEN);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/vdocipher/generate-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId,
          ttl: 300, // 5 minutes
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate OTP: ${response.status}`);
      }

      const data = await response.json();
      setVdocipherOTP(data.otp);
      setVdocipherPlaybackInfo(data.playbackInfo);
      
      console.log('VdoCipher OTP generated successfully');
    } catch (error) {
      console.error('Failed to generate VdoCipher OTP:', error);
      message.error('Failed to load secure video. Please try again.');
    } finally {
      setIsLoadingOTP(false);
    }
  };

  // Clear VdoCipher data when lesson changes
  useEffect(() => {
    setVdocipherOTP(null);
    setVdocipherPlaybackInfo(null);
  }, [selectedLessonId]);

  // Force refetch user progress after any completion
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

  // Find the selected lesson with safe fallback
  const selectedLesson = courseStructure?.flatMap(module => 
    module.lessons?.filter(lesson => lesson.id === selectedLessonId) || []
  )[0] || null;

  // Restore last selected lesson from localStorage on page load
  useEffect(() => {
    if (courseStructure && courseStructure.length > 0 && userProgress) {
      // Try to restore the last selected lesson
      const lastSelectedLessonId = localStorage.getItem('topcoach-selected-lesson');
      
      if (lastSelectedLessonId) {
        // Verify the lesson still exists in the course structure
        const lessonExists = courseStructure.some(module => 
          module.lessons?.some(lesson => lesson.id === lastSelectedLessonId)
        );
        
        if (lessonExists) {
          setSelectedLessonId(lastSelectedLessonId);
          return;
        } else {
          // Clear invalid lesson ID from localStorage
          localStorage.removeItem('topcoach-selected-lesson');
        }
      }
      
      // If no valid last lesson, find the next incomplete lesson (like Udemy/Coursera)
      if (!selectedLessonId) {
        const nextIncompleteLesson = findNextIncompleteLesson(courseStructure, userProgress);
        if (nextIncompleteLesson) {
          setSelectedLessonId(nextIncompleteLesson.id);
        } else {
          // If all lessons are completed, select the first lesson
          const firstLesson = courseStructure[0]?.lessons?.[0];
          if (firstLesson?.id) {
            setSelectedLessonId(firstLesson.id);
          }
        }
      }
    }
  }, [courseStructure, userProgress, selectedLessonId]);

  // Helper function to find the next incomplete lesson
  const findNextIncompleteLesson = (courseStructure: any[], userProgress: any) => {
    if (!userProgress?.progress) return null;
    
    const completedLessonIds = new Set(
      userProgress.progress
        .filter((p: any) => p.isCompleted)
        .map((p: any) => p.lessonId)
    );
    
    // Find the first incomplete lesson
    for (const module of courseStructure) {
      if (module.lessons) {
        for (const lesson of module.lessons) {
          if (!completedLessonIds.has(lesson.id)) {
            return lesson;
          }
        }
      }
    }
    
    return null;
  };

  // Save selected lesson to localStorage whenever it changes
  useEffect(() => {
    if (selectedLessonId) {
      localStorage.setItem('topcoach-selected-lesson', selectedLessonId);
    }
  }, [selectedLessonId]);

  // Clear stored lesson when course is completed
  useEffect(() => {
    if (userProgress && courseStructure) {
      const totalLessons = courseStructure.reduce((total, module) => 
        total + (module.lessons?.length || 0), 0
      );
      const completedLessons = userProgress.completedLessons || 0;
      
      // If all lessons are completed, clear the stored lesson
      if (totalLessons > 0 && completedLessons >= totalLessons) {
        localStorage.removeItem('topcoach-selected-lesson');
      }
    }
  }, [userProgress, courseStructure]);

  // Debug: Log selected lesson to catch undefined issues
  console.log('Selected lesson debug:', {
    selectedLessonId,
    selectedLesson: selectedLesson ? {
      id: selectedLesson.id,
      title: selectedLesson.title,
      lessonType: selectedLesson.lessonType,
      useVdoCipher: selectedLesson.useVdoCipher,
      vdocipherVideoId: selectedLesson.vdocipherVideoId,
      contentUrl: selectedLesson.contentUrl
    } : null,
    courseStructure: courseStructure?.length || 0,
    lastSelectedFromStorage: localStorage.getItem('topcoach-selected-lesson')
  });

  // Debug: Log when lesson is selected
  if (selectedLesson && selectedLesson.id) {
    console.log('Rendering lesson:', selectedLesson.title, 'Type:', selectedLesson.lessonType);
  }


  // Debug: Log selected lesson data
  useEffect(() => {
    if (selectedLesson) {
      console.log('Selected lesson data:', {
        id: selectedLesson.id,
        title: selectedLesson.title,
        lessonType: selectedLesson.lessonType,
        useVdoCipher: selectedLesson.useVdoCipher,
        vdocipherVideoId: selectedLesson.vdocipherVideoId,
        contentUrl: selectedLesson.contentUrl,
        vdocipherOTP,
        vdocipherPlaybackInfo,
        isLoadingOTP
      });
    }
  }, [selectedLesson, vdocipherOTP, vdocipherPlaybackInfo, isLoadingOTP]);

  // Find the selected module
  const selectedModule = courseStructure?.find(module => 
    module.lessons?.some(lesson => lesson.id === selectedLessonId)
  );

  // Debug: Log selected module
  console.log('Selected module debug:', {
    selectedModule: selectedModule ? {
      id: selectedModule.id,
      title: selectedModule.title,
      mentorName: selectedModule.mentorName,
      mentor: selectedModule.mentor
    } : null
  });

  // Generate OTP when VdoCipher lesson is selected
  useEffect(() => {
    console.log('VdoCipher lesson check:', {
      useVdoCipher: selectedLesson?.useVdoCipher,
      vdocipherVideoId: selectedLesson?.vdocipherVideoId,
      hasOTP: !!vdocipherOTP,
      shouldGenerate: selectedLesson?.useVdoCipher && selectedLesson?.vdocipherVideoId && !vdocipherOTP
    });
    
    if (selectedLesson?.useVdoCipher && selectedLesson?.vdocipherVideoId && !vdocipherOTP) {
      console.log('Generating VdoCipher OTP for video:', selectedLesson.vdocipherVideoId);
      generateVdoCipherOTP(selectedLesson.vdocipherVideoId);
    }
  }, [selectedLesson, vdocipherOTP]);

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
          {t('Refresh Page')}
        </Button>
      </div>
    );
  }

  // Handle case where course structure is empty or null
  if (!courseStructure || courseStructure.length === 0) {
    return (
      <div className="learning-error">
        <h2>{t('No course content available')}</h2>
        <p>{t('The course content is not available at the moment. Please try refreshing the page or contact support.')}</p>
        <Button 
          type="primary" 
          onClick={() => window.location.reload()}
          style={{ marginTop: '16px' }}
        >
          {t('Refresh Page')}
        </Button>
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
        {courseStructure && userProgress ? (
          <CourseSidebar
            key={`sidebar-${forceUpdate}`}
            courseStructure={courseStructure}
            userProgress={userProgress}
            selectedLessonId={selectedLessonId}
            onLessonSelect={setSelectedLessonId}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
        ) : (
          <div className="sidebar-loading">
            <Spin size="small" />
            <p>Loading sidebar...</p>
          </div>
        )}
      </Sider>
      
      <Layout className="learning-content">
        <Content className="content-area">
          {!selectedLesson ? (
            <div className="no-lesson-selected">
              <h2>{t('Select a lesson to start learning')}</h2>
              <p>{t('Choose a lesson from the sidebar to begin your course.')}</p>
            </div>
          ) : (
            <div className="lesson-container">
              <div className="lesson-header">
                <div className="lesson-title-section">
                  <h1>{selectedLesson.title || 'Untitled Lesson'}</h1>
                </div>
                {selectedModule ? (
                  <div className="module-info">
                    <span className="module-name">{selectedModule.title || 'Untitled Module'}</span>
                    <span className="mentor-name">
                      by {selectedModule.mentorName || selectedModule.mentor?.email || 'Unknown Mentor'}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="lesson-content">
                {!selectedLesson ? (
                  <div className="no-lesson-selected">
                    <h2>{t('Select a lesson to start learning')}</h2>
                    <p>{t('Choose a lesson from the sidebar to begin your course.')}</p>
                  </div>
                ) : !selectedLesson.contentUrl && !selectedLesson.useVdoCipher ? (
                  <div className="lesson-error">
                    <h2>{t('Content not available')}</h2>
                    <p>{t('This lesson has no video/PDF. Please contact support.')}</p>
                  </div>
                ) : selectedLesson.lessonType === 'video' ? (
                  <div className="video-content">
                    {/* VdoCipher Player */}
                    {selectedLesson.useVdoCipher && selectedLesson.vdocipherVideoId && vdocipherOTP && vdocipherPlaybackInfo && (
                      <VdoCipherPlayer
                        videoId={selectedLesson.vdocipherVideoId}
                        otp={vdocipherOTP}
                        playbackInfo={vdocipherPlaybackInfo}
                        title={selectedLesson.title || 'Untitled Video'}
                        onProgressUpdate={(progress) => {
                          if (progress > 0 && selectedLesson.id && selectedLesson.duration) {
                            handleProgressUpdate(progress, selectedLesson.id, selectedLesson.duration);
                          }
                        }}
                        onComplete={async () => {
                          try {
                            if (!enrollmentStatus?.isEnrolled) {
                              message.error('You must be enrolled in the course to mark lessons as completed');
                              return;
                            }

                            setIsCurrentLessonCompleted(true);
                            setForceUpdate(prev => prev + 1);

                            const updateData = {
                              isCompleted: true,
                              progressPercentage: 100,
                              timeWatched: (selectedLesson.duration || 0) * 60,
                            };
                            
                            updateLessonProgress({
                              lessonId: selectedLesson.id,
                              data: updateData
                            }).unwrap().then(() => {
                              refetchUserProgress();
                            }).catch((error) => {
                              console.error('Server update failed:', error);
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

                    {/* VdoCipher Loading States */}
                    {selectedLesson.useVdoCipher && selectedLesson.vdocipherVideoId && isLoadingOTP && (
                      <div className="loading-container">
                        <Spin size="large" />
                        <p>Loading secure video...</p>
                      </div>
                    )}

                    {selectedLesson.useVdoCipher && selectedLesson.vdocipherVideoId && !vdocipherOTP && !isLoadingOTP && (
                      <div className="video-loading">
                        <Spin size="large" />
                        <p>Loading video player...</p>
                        <p>Generating video access...</p>
                      </div>
                    )}

                    {/* Regular Video Player (fallback) */}
                    {(!selectedLesson.useVdoCipher || !selectedLesson.vdocipherVideoId) && selectedLesson.contentUrl && (
                      <VideoPlayer
                        src={selectedLesson.contentUrl}
                        title={selectedLesson.title || 'Untitled Video'}
                        onProgressUpdate={(progress) => {
                          if (progress > 0 && selectedLesson.id && selectedLesson.duration) {
                            handleProgressUpdate(progress, selectedLesson.id, selectedLesson.duration);
                          }
                        }}
                        onComplete={async () => {
                          try {
                            if (!enrollmentStatus?.isEnrolled) {
                              message.error('You must be enrolled in the course to mark lessons as completed');
                              return;
                            }

                            setIsCurrentLessonCompleted(true);
                            setForceUpdate(prev => prev + 1);

                            const updateData = {
                              isCompleted: true,
                              progressPercentage: 100,
                              timeWatched: (selectedLesson.duration || 0) * 60,
                            };
                            
                            updateLessonProgress({
                              lessonId: selectedLesson.id,
                              data: updateData
                            }).unwrap().then(() => {
                              refetchUserProgress();
                            }).catch((error) => {
                              console.error('Server update failed:', error);
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
                  </div>
                ) : selectedLesson.lessonType === 'pdf' ? (
                  selectedLesson.contentUrl ? (
                    <PDFViewer
                      key={`${selectedLesson.id}-${forceUpdate}`}
                      pdfUrl={selectedLesson.contentUrl}
                      lessonId={selectedLesson.id || ''}
                      title={selectedLesson.title || 'Untitled PDF'}
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
                          timeWatched: (selectedLesson.duration || 0) * 60,
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
                    ) : (
                      <div className="pdf-error">
                        <h3>PDF Content Not Available</h3>
                        <p>This lesson's PDF content is not available at the moment. Please try again later or contact support.</p>
                      </div>
                    )
                ) : selectedLesson.lessonType === 'live_session' ? (
                  <div className="live-session-placeholder">
                    <h3>Live Session</h3>
                    <p>This is a live session. Please check your email for meeting details.</p>
                  </div>
                ) : (
                  <div className="unknown-lesson-type">
                    <h3>Unknown Lesson Type</h3>
                    <p>This lesson type is not supported yet.</p>
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
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default LearningPage; 