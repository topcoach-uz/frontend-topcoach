import React, { useState, useEffect } from 'react';
import { Layout, Spin, Button, message } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, ClockCircleOutlined, RocketOutlined, VideoCameraOutlined, FileTextOutlined, LeftOutlined, RightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import { baseUrl } from 'src/app/services/api/const';

const { Sider, Content } = Layout;

const LAST_VIEWED_KEY = 'topcoach-last-viewed-lesson';

interface LearningPageProps {}

const LearningPage: React.FC<LearningPageProps> = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Check authentication
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const [collapsedMobile, setCollapsedMobile] = useState(false);
  
  // ALL STATE HOOKS - MUST BE DECLARED BEFORE ANY CONDITIONAL LOGIC
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [vdocipherOTP, setVdocipherOTP] = useState<string | null>(null);
  const [vdocipherPlaybackInfo, setVdocipherPlaybackInfo] = useState<string | null>(null);
  const [isLoadingOTP, setIsLoadingOTP] = useState(false);
  const [lastCompletionTime, setLastCompletionTime] = useState<number>(0);
  const [isCurrentLessonCompleted, setIsCurrentLessonCompleted] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [hasShownEnrollmentMessage, setHasShownEnrollmentMessage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Helper function to get all lessons in order
  const getAllLessonsInOrder = React.useCallback((courseStructure: any[]) => {
    const allLessons: any[] = [];
    courseStructure.forEach(module => {
      if (module.lessons && Array.isArray(module.lessons)) {
        module.lessons.forEach(lesson => {
          allLessons.push({
            ...lesson,
            moduleId: module.id,
            moduleTitle: module.title
          });
        });
      }
    });
    return allLessons;
  }, []);

  // Helper function to find the next incomplete lesson
  const findNextIncompleteLesson = React.useCallback((courseStructure: any[], userProgress: any) => {
    if (!userProgress?.progress) return null;
    
    const completedLessonIds = new Set(
      userProgress.progress
        .filter((p: any) => p.isCompleted)
        .map((p: any) => String(p.lessonId))
    );
    
    for (const module of courseStructure) {
      if (module.lessons) {
        for (const lesson of module.lessons) {
          if (!completedLessonIds.has(String(lesson.id))) {
            return lesson;
          }
        }
      }
    }
    
    return null;
  }, []);

  // Navigation helpers
  const getAdjacentLessons = React.useCallback(() => {
    if (!courseStructure || !selectedLessonId) {
      return { previousLesson: null, nextLesson: null, currentIndex: -1, totalLessons: 0 };
    }

    const allLessons = getAllLessonsInOrder(courseStructure);
    const currentIndex = allLessons.findIndex(lesson => String(lesson.id) === String(selectedLessonId));
    
    return {
      previousLesson: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
      nextLesson: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
      currentIndex,
      totalLessons: allLessons.length
    };
  }, [courseStructure, selectedLessonId, getAllLessonsInOrder]);

  const { previousLesson, nextLesson, currentIndex, totalLessons } = getAdjacentLessons();

  const handlePreviousLesson = () => {
    if (previousLesson) {
      const lessonId = String(previousLesson.id);
      setSelectedLessonId(lessonId);
      localStorage.setItem('topcoach-selected-lesson', lessonId);
      localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify({ id: lessonId, ts: Date.now() }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      const lessonId = String(nextLesson.id);
      setSelectedLessonId(lessonId);
      localStorage.setItem('topcoach-selected-lesson', lessonId);
      localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify({ id: lessonId, ts: Date.now() }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate VdoCipher OTP function
  const generateVdoCipherOTP = React.useCallback(async (videoId: string) => {
    try {
      setIsLoadingOTP(true);
      const token = localStorage.getItem(ACCESS_TOKEN);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${baseUrl}/vdocipher/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId,
          ttl: 300,
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
  }, []);

  // Handle manual mark as complete
  const handleMarkAsComplete = async () => {
    if (!selectedLesson || !enrollmentStatus?.isEnrolled) {
      message.error('You must be enrolled in the course to mark lessons as completed');
      return;
    }

    try {
      setIsCurrentLessonCompleted(true);
      setForceUpdate(prev => prev + 1);

      const updateData = {
        isCompleted: true,
        progressPercentage: 100,
        timeWatched: (selectedLesson.duration || 0) * 60,
      };
      
      await updateLessonProgress({
        lessonId: selectedLesson.id,
        data: updateData
      }).unwrap();
      
      await refetchUserProgress();
      message.success('Lesson marked as completed!');
    } catch (error) {
      console.error('Error:', error);
      setIsCurrentLessonCompleted(false);
      message.error('Failed to mark lesson as completed');
    }
  };

  // ALL useEffect HOOKS
  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('Please log in to access the learning content');
      navigate('/auth/signin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!enrollmentLoading && enrollmentStatus) {
      if (!enrollmentStatus.isEnrolled && !hasShownEnrollmentMessage) {
        setHasShownEnrollmentMessage(true);
        message.warning('Please enroll in the course first to access learning content', 5);
        setTimeout(() => {
          navigate('/programs/admissions', { replace: true });
        }, 2000);
      }
    }
  }, [enrollmentStatus, enrollmentLoading, hasShownEnrollmentMessage, navigate]);

  useEffect(() => {
    setVdocipherOTP(null);
    setVdocipherPlaybackInfo(null);
  }, [selectedLessonId]);

  useEffect(() => {
    if (lastCompletionTime > 0) {
      const timer = setTimeout(() => {
        refetchUserProgress();
        setLastCompletionTime(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lastCompletionTime, refetchUserProgress]);

  // SINGLE EFFECT FOR LESSON INITIALIZATION - This runs once when course data is loaded
  useEffect(() => {
    // Only run once when we have course structure and haven't initialized yet
    if (!courseStructure || courseStructure.length === 0 || isInitialized) {
      return;
    }

    console.log('Initializing lesson selection...');

    // Helper function to check if lesson exists in course structure
    const lessonExists = (lessonId: string) => {
      return courseStructure.some(module =>
        module.lessons?.some(lesson => String(lesson.id) === String(lessonId))
      );
    };

    // Try to restore last viewed lesson
    const lastViewedRaw = localStorage.getItem(LAST_VIEWED_KEY);
    const legacySelected = localStorage.getItem('topcoach-selected-lesson');

    let lastSelectedLessonId: string | null = null;

    // Parse last viewed lesson
    if (lastViewedRaw) {
      try {
        const parsed = JSON.parse(lastViewedRaw);
        if (parsed && parsed.id) {
          lastSelectedLessonId = String(parsed.id);
          console.log('Found last viewed lesson:', lastSelectedLessonId);
        }
      } catch (e) {
        console.error('Failed to parse last viewed lesson:', e);
      }
    } else if (legacySelected) {
      lastSelectedLessonId = String(legacySelected);
      console.log('Found legacy selected lesson:', lastSelectedLessonId);
    }

    // Validate and set the lesson
    if (lastSelectedLessonId && lessonExists(lastSelectedLessonId)) {
      console.log('Restoring lesson:', lastSelectedLessonId);
      setSelectedLessonId(lastSelectedLessonId);
      // Sync both storage keys
      localStorage.setItem('topcoach-selected-lesson', lastSelectedLessonId);
      localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify({ id: lastSelectedLessonId, ts: Date.now() }));
    } else {
      // Invalid or no saved lesson - pick a default
      if (lastSelectedLessonId) {
        console.log('Saved lesson not found in course structure, clearing...');
        localStorage.removeItem('topcoach-selected-lesson');
        localStorage.removeItem(LAST_VIEWED_KEY);
      }

      // Try next incomplete lesson, or fall back to first lesson
      const nextIncompleteLesson = userProgress ? findNextIncompleteLesson(courseStructure, userProgress) : null;
      if (nextIncompleteLesson) {
        const nid = String(nextIncompleteLesson.id);
        console.log('Setting next incomplete lesson:', nid);
        setSelectedLessonId(nid);
        localStorage.setItem('topcoach-selected-lesson', nid);
        localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify({ id: nid, ts: Date.now() }));
      } else {
        const firstLesson = courseStructure[0]?.lessons?.[0];
        if (firstLesson?.id) {
          const fid = String(firstLesson.id);
          console.log('Setting first lesson:', fid);
          setSelectedLessonId(fid);
          localStorage.setItem('topcoach-selected-lesson', fid);
          localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify({ id: fid, ts: Date.now() }));
        }
      }
    }

    // Mark as initialized so this doesn't run again
    setIsInitialized(true);
  }, [courseStructure, userProgress, isInitialized, findNextIncompleteLesson]);
  
  // Update localStorage when lesson changes (but only after initialization)
  useEffect(() => {
    if (selectedLessonId && isInitialized) {
      const lessonIdStr = String(selectedLessonId);
      localStorage.setItem('topcoach-selected-lesson', lessonIdStr);
      localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify({ id: lessonIdStr, ts: Date.now() }));
      console.log('Updated localStorage with lesson:', lessonIdStr);
    }
  }, [selectedLessonId, isInitialized]);

  useEffect(() => {
    if (userProgress?.progress) {
      const currentLessonCompleted = userProgress.progress.find((p: any) => String(p.lessonId) === String(selectedLessonId))?.isCompleted || false;
      setIsCurrentLessonCompleted(currentLessonCompleted);
    }
  }, [userProgress?.progress, selectedLessonId]);

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

  useEffect(() => {
    console.log('Learning page - Enrollment status:', enrollmentStatus);
  }, [enrollmentStatus]);

  const selectedLesson = courseStructure?.flatMap(module => 
    (module.lessons?.filter(lesson => String(lesson.id) === String(selectedLessonId)) || [])
  )[0] || null;

  const selectedModule = courseStructure?.find(module => 
    module.lessons?.some(lesson => String(lesson.id) === String(selectedLessonId))
  );

  useEffect(() => {
    if (selectedLesson?.useVdoCipher && selectedLesson?.vdocipherVideoId && !vdocipherOTP) {
      console.log('Generating VdoCipher OTP for video:', selectedLesson.vdocipherVideoId);
      generateVdoCipherOTP(selectedLesson.vdocipherVideoId);
    }
  }, [selectedLesson, vdocipherOTP, generateVdoCipherOTP]);

  useEffect(() => {
    if (selectedLesson) {
      console.log('Selected lesson data:', {
        id: selectedLesson.id,
        title: selectedLesson.title,
        lessonType: selectedLesson.lessonType,
        useVdocipher: selectedLesson.useVdocipher,
        vdocipherVideoId: selectedLesson.vdocipherVideoId,
        contentUrl: selectedLesson.contentUrl,
        vdocipherOTP,
        vdocipherPlaybackInfo,
        isLoadingOTP
      });
    }
  }, [selectedLesson, vdocipherOTP, vdocipherPlaybackInfo, isLoadingOTP]);

  const serverCompleted = userProgress?.progress?.find((l: any) => String(l.lessonId) === String(selectedLessonId))?.isCompleted || false;
  const isSelectedLessonCompleted = serverCompleted || isCurrentLessonCompleted;

  useEffect(() => {
    console.log('Lesson completion status:', {
      selectedLessonId,
      serverCompleted,
      isCurrentLessonCompleted,
      isSelectedLessonCompleted,
      forceUpdate,
      userProgress: userProgress?.progress?.find((l: any) => String(l.lessonId) === String(selectedLessonId))
    });
  }, [selectedLessonId, isSelectedLessonCompleted, userProgress?.progress, isCurrentLessonCompleted, forceUpdate, serverCompleted]);

  const hasProgressData = userProgress && userProgress.progress && userProgress.progress.length > 0;

  const handleProgressUpdate = React.useCallback((progress: number, lessonId: string | number, duration: number) => {
    if (progress > 0) {
      updateLessonProgress({
        lessonId,
        data: {
          progressPercentage: Math.round(progress),
          timeWatched: Math.round((progress / 100) * (duration * 60)),
        }
      }).catch(() => {});
    }
  }, [updateLessonProgress]);

  // CONDITIONAL RENDERING
  if (!isAuthenticated) {
    return null;
  }

  if (enrollmentLoading) {
    return (
      <div className="learning-loading">
        <Spin size="large" />
        <p>Checking your enrollment status...</p>
      </div>
    );
  }

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
        <p>You need to enroll in the course first to access the learning content.</p>
        <p style={{ marginTop: '8px', color: '#666' }}>Redirecting you to the enrollment page...</p>
        <Button 
          type="primary" 
          onClick={() => navigate('/programs/admissions', { replace: true })}
          style={{ marginTop: '16px' }}
        >
          Go to Enrollment Page
        </Button>
      </div>
    );
  }

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
              onClick={() => navigate('/programs/admissions', { replace: true })}
              icon={<RocketOutlined />}
            >
              Back to Programs
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/', { replace: true })}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
        collapsedWidth={collapsedMobile ? 0 : 80}       
        collapsed={collapsed}      
        className="learning-sidebar"
        theme="light"
        
        trigger={null}
        breakpoint="md"
        onBreakpoint={(broken) => {
          if (broken && !collapsed) {
            setCollapsedMobile(true);
          }
        }}
      >
        {courseStructure && userProgress ? (
          <CourseSidebar
            key={`sidebar-${forceUpdate}`}
            courseStructure={courseStructure}
            userProgress={userProgress}
            selectedLessonId={selectedLessonId}
            onLessonSelect={(lessonId) => {
              const lessonIdStr = String(lessonId);
              setSelectedLessonId(lessonIdStr);
              localStorage.setItem('topcoach-selected-lesson', lessonIdStr);
              localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify({ id: lessonIdStr, ts: Date.now() }));
            }}
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
              {/* Compact Mobile Header */}
              <div className="lesson-header-mobile">
                <div className="lesson-title-compact">
                  <span className="lesson-type-badge">
                    {selectedLesson.lessonType === 'video' ? <VideoCameraOutlined style={{color: '#FFF'}}/> : selectedLesson.lessonType === 'pdf' ? <FileTextOutlined style={{color: '#FFF'}} /> : '🎯'}
                  </span>
                  <h1>{selectedLesson.title || 'Untitled Lesson'}</h1>
                </div>
                {selectedModule && (
                  <div className="module-info-compact">
                    <span className="module-label">Module:</span>
                    <span className="module-name">{selectedModule.title || 'Untitled Module'}</span>
                    <span className="module-separator">•</span>
                    <span className="mentor-name">
                      {selectedModule.mentorName || selectedModule.mentor?.email || 'Unknown'}
                    </span>
                  </div>
                )}
                
            
              </div>

              <div className="lesson-content">
                {!selectedLesson.contentUrl && !selectedLesson.useVdoCipher ? (
                  <div className="lesson-error">
                    <h2>{t('Content not available')}</h2>
                    <p>{t('This lesson has no video/PDF. Please contact support.')}</p>
                  </div>
                ) : selectedLesson.lessonType === 'video' ? (
                  <div className="video-content">
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
                  </div>
                ) : selectedLesson.lessonType === 'pdf' ? (
                  selectedLesson.contentUrl ? (
                    <div className="pdf-content-wrapper">
                      <PDFViewer
                        key={`${selectedLesson.id}-${forceUpdate}`}
                        pdfUrl={selectedLesson.contentUrl}
                        lessonId={selectedLesson.id || ''}
                        title={selectedLesson.title || 'Untitled PDF'}
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
                            
                            message.success('PDF lesson completed!');
                          } catch (error) {
                            console.error('Error:', error);
                            message.error('Failed to mark lesson as completed');
                          }
                        }}
                        isCompleted={isSelectedLessonCompleted}
                      />
                    </div>
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
                    <h3>About This Lesson</h3>
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