import { useNavigate } from 'react-router-dom';
import { CustomCard } from 'src/components/cards';
import { CustomText, CustomButton } from 'src/components/common';
import useColors from 'src/hooks/useColors';
import { 
  useGetEnrollmentStatusQuery, 
  useGetUserProgressQuery,
  useGetCourseStructureQuery 
} from 'src/app/services/courses';
import { useGetMeQuery } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';
import { PlayCircleOutlined, DashboardOutlined, BookOutlined, SettingOutlined } from '@ant-design/icons';
import { Progress, Space, Spin } from 'antd';
import { useMemo, useState, useEffect } from 'react';
import { api } from 'src/app/api';
import styles from './learningProgram.module.scss';

export default function LearningProgramSection() {
  const colors = useColors();
  const navigate = useNavigate();
  const { data: enrollmentStatus } = useGetEnrollmentStatusQuery();
  const { data: userProgress } = useGetUserProgressQuery(undefined, {
    skip: !enrollmentStatus?.canAccessLearning,
  });
  const { data: courseStructure } = useGetCourseStructureQuery(undefined, {
    skip: !enrollmentStatus?.canAccessLearning,
  });
  
  // Check if user is SuperAdmin or Counselor
  const user = useTypedSelector((state) => state.auth.profile);
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: userData } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const currentUser = userData || user;
  const isSuperAdmin = currentUser?.managementRole === 'SuperAdmin' || currentUser?.managementRole === 'Owner';
  
  // Check if user is a counselor
  const [isCounselor, setIsCounselor] = useState(false);
  const [counselorLoading, setCounselorLoading] = useState(true);
  
  // Calculate total lessons from course structure - MUST be called before any conditional returns
  const totalLessons = useMemo(() => {
    if (courseStructure && courseStructure.length > 0) {
      return courseStructure.reduce((total, module) => {
        return total + (module.lessons?.length || 0);
      }, 0);
    }
    return userProgress?.totalLessons || 0;
  }, [courseStructure, userProgress?.totalLessons]);

  useEffect(() => {
    const checkCounselorStatus = async () => {
      try {
        const response = await api.request({
          path: '/organizations/my-organizations',
          method: 'GET',
          secure: true,
        });
        
        console.log('Counselor check response:', response.data);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setIsCounselor(true);
        } else {
          setIsCounselor(false);
        }
      } catch (error: any) {
        console.error('Error checking counselor status:', error);
        setIsCounselor(false);
      } finally {
        setCounselorLoading(false);
      }
    };

    if (isAuthenticated && currentUser?.id) {
      checkCounselorStatus();
    } else {
      setCounselorLoading(false);
    }
  }, [isAuthenticated, currentUser?.id]);

  // Show loading skeleton while checking counselor status or enrollment status
  if (counselorLoading || !enrollmentStatus) {
    return (
      <section className={styles.learning_section}>
        <div className={'container ' + styles.container}>
          <CustomCard
            bgColor={colors.colorBgContainer}
            mb={40}
            shadowed
            borderRadius={24}
            padding={24}
          >
            <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin size="large" />
            </div>
          </CustomCard>
        </div>
      </section>
    );
  }

  // Don't show if not enrolled or can't access
  // Note: Counselors with course access will also see this section
  if (!enrollmentStatus.isEnrolled || !enrollmentStatus.canAccessLearning) {
    return null;
  }

  // Calculate values after all hooks are called
  const lessonsCompleted = userProgress?.completedLessons || 0;
  // Calculate progress based on actual lesson completion
  const progress = totalLessons > 0 
    ? Math.round((lessonsCompleted / totalLessons) * 100) 
    : 0;
  const timeWatched = userProgress?.totalTimeWatched || 0;
  const timeWatchedMinutes = Math.floor(timeWatched / 60);

  return (
    <section className={styles.learning_section}>
      <div className={'container ' + styles.container}>
        <CustomCard
          bgColor={colors.colorBgContainer}
          mb={40}
          shadowed
          borderRadius={24}
          padding={24}
        >
          <CustomText
            fontSize={32}
            fontWeight={600}
            mb={4}
            color={colors.colorTextBase}
          >
            {isSuperAdmin ? 'Admin Dashboard' : 'Learning Program'}
          </CustomText>
          <CustomText
            fontSize={16}
            fontWeight={400}
            mb={65}
            color={colors.colorTextSecondary}
          >
            {isSuperAdmin 
              ? 'Access your learning progress and manage the platform' 
              : 'Track your progress and continue your learning journey'}
          </CustomText>

          <div className={styles.learning_content}>
            <div className={styles.stats_grid}>
              <div className={styles.stat_item}>
                <div className={styles.stat_number} style={{ color: colors.colorPrimary }}>
                  {lessonsCompleted}
                </div>
                <div className={styles.stat_label}>Lessons Completed</div>
              </div>
              <div className={styles.stat_item}>
                <div className={styles.stat_number} style={{ color: colors.colorPrimary }}>
                  {totalLessons}
                </div>
                <div className={styles.stat_label}>Total Lessons</div>
              </div>
              <div className={styles.stat_item}>
                <div className={styles.stat_number} style={{ color: colors.colorPrimary }}>
                  {progress}%
                </div>
                <div className={styles.stat_label}>Overall Progress</div>
              </div>
              <div className={styles.stat_item}>
                <div className={styles.stat_number} style={{ color: colors.colorPrimary }}>
                  {timeWatchedMinutes}m
                </div>
                <div className={styles.stat_label}>Time Watched</div>
              </div>
            </div>

            <div className={styles.progress_section}>
              <Progress
                percent={progress}
                strokeColor={colors.colorPrimary}
                showInfo={false}
                style={{ marginBottom: 16 }}
              />
              <div className={styles.progress_footer}>
                <CustomText fontSize={14} color={colors.colorTextSecondary}>
                  {progress}% complete
                </CustomText>
                <CustomButton
                  height={40}
                  onClick={() => navigate('/programs/admissions/learning')}
                  icon={<PlayCircleOutlined style={{ color: 'white' }} />}
                  className={styles.continue_learning_btn}
                  style={{ 
                    backgroundColor: colors.colorPrimary, 
                    borderColor: colors.colorPrimary,
                    color: 'white'
                  }}
                >
                  Continue Learning
                </CustomButton>
              </div>
              
              {/* SuperAdmin Quick Access Links */}
              {isSuperAdmin && (
                <div className={styles.superadmin_links}>
                  <CustomText 
                    fontSize={12} 
                    fontWeight={500}
                    color={colors.colorTextSecondary}
                    style={{ marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    Admin Quick Access
                  </CustomText>
                  <Space size="small" wrap>
                    <CustomButton
                      size="small"
                      height={40}
                      onClick={() => navigate('/b2b')}
                      icon={<DashboardOutlined />}
                      style={{ 
                        backgroundColor: 'transparent',
                        borderColor: colors.colorPrimary,
                        color: colors.colorPrimary,
                        height: '40px',
                        minHeight: '40px'
                      }}
                    >
                      B2B Dashboard
                    </CustomButton>
                    <CustomButton
                      size="small"
                      height={40}
                      onClick={() => navigate('/topcoach-management')}
                      icon={<SettingOutlined />}
                      style={{ 
                        backgroundColor: 'transparent',
                        borderColor: colors.colorPrimary,
                        color: colors.colorPrimary,
                        height: '40px',
                        minHeight: '40px'
                      }}
                    >
                      TopCoach Management
                    </CustomButton>
                    <CustomButton
                      size="small"
                      height={40}
                      onClick={() => navigate('/course-admin/courses/modules')}
                      icon={<BookOutlined />}
                      style={{ 
                        backgroundColor: 'transparent',
                        borderColor: colors.colorPrimary,
                        color: colors.colorPrimary,
                        height: '40px',
                        minHeight: '40px'
                      }}
                    >
                      Course Content Management
                    </CustomButton>
                  </Space>
                </div>
              )}
            </div>
          </div>
        </CustomCard>
      </div>
    </section>
  );
}

