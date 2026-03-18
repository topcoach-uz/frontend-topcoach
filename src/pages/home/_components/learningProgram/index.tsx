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
import { useGetEnrollmentMeQuery, useGetMenteeSatProgressQuery } from 'src/app/services/fullSupportApi';
import styles from './learningProgram.module.scss';

export default function LearningProgramSection() {
  const colors = useColors();
  const navigate = useNavigate();
  
  // Fetch enrollments for both courses
  const { data: admissionsEnrollment } = useGetEnrollmentStatusQuery('admissions');
  const { data: satEnrollment } = useGetEnrollmentStatusQuery('sat');
  
  // Fetch progress for both courses
  const { data: admissionsProgress } = useGetUserProgressQuery('admissions', {
    skip: !admissionsEnrollment?.canAccessLearning,
  });
  const { data: satProgress } = useGetUserProgressQuery('sat', {
    skip: !satEnrollment?.canAccessLearning,
  });
  
  // Fetch course structures for both courses
  const { data: admissionsStructure } = useGetCourseStructureQuery('admissions', {
    skip: !admissionsEnrollment?.canAccessLearning,
  });
  const { data: satStructure } = useGetCourseStructureQuery('sat', {
    skip: !satEnrollment?.canAccessLearning,
  });

  // Full Support (ScholarHub) SAT integration:
  // This endpoint returns `null` if the user isn't enrolled, so we can safely call it whenever authenticated.
  const { data: fullSupportSatProgress } = useGetMenteeSatProgressQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 60000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  
  // Legacy support - use admissions as default for backward compatibility
  const enrollmentStatus = admissionsEnrollment;
  const userProgress = admissionsProgress;
  const courseStructure = admissionsStructure;
  
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
  
  // Calculate total lessons for each course - MUST be called before any conditional returns
  // Prioritize backend's totalLessons (which is correctly filtered by courseName) over structure calculation
  const admissionsTotalLessons = useMemo(() => {
    // Use backend's totalLessons first (it's already filtered correctly by courseName)
    if (admissionsProgress?.totalLessons !== undefined && admissionsProgress.totalLessons > 0) {
      return admissionsProgress.totalLessons;
    }
    // Fallback to calculating from structure if backend value not available
    if (admissionsStructure && admissionsStructure.length > 0) {
      return admissionsStructure.reduce((total, module) => {
        const moduleLessons = module.lessons?.length || 0;
        const submoduleLessons = module.submodules?.reduce((subTotal, submodule) => {
          return subTotal + (submodule.lessons?.length || 0);
        }, 0) || 0;
        return total + moduleLessons + submoduleLessons;
      }, 0);
    }
    return 0;
  }, [admissionsProgress?.totalLessons, admissionsStructure]);
  
  const satTotalLessons = useMemo(() => {
    // Use backend's totalLessons first (it's already filtered correctly by courseName)
    if (satProgress?.totalLessons !== undefined && satProgress.totalLessons > 0) {
      return satProgress.totalLessons;
    }
    // Fallback to calculating from structure if backend value not available
    if (satStructure && satStructure.length > 0) {
      return satStructure.reduce((total, module) => {
        const moduleLessons = module.lessons?.length || 0;
        const submoduleLessons = module.submodules?.reduce((subTotal, submodule) => {
          return subTotal + (submodule.lessons?.length || 0);
        }, 0) || 0;
        return total + moduleLessons + submoduleLessons;
      }, 0);
    }
    return 0;
  }, [satProgress?.totalLessons, satStructure]);
  
  // Legacy support
  const totalLessons = admissionsTotalLessons;

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
  if (counselorLoading || (!admissionsEnrollment && !satEnrollment)) {
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

  // Check if user has access to either course
  const hasAdmissionsAccess = admissionsEnrollment?.isEnrolled && admissionsEnrollment?.canAccessLearning;
  const hasSatAccess = satEnrollment?.isEnrolled && satEnrollment?.canAccessLearning;

  // Don't show if not enrolled in any course or can't access
  if (!hasAdmissionsAccess && !hasSatAccess) {
    return null;
  }

  // Calculate values for each course
  const admissionsLessonsCompleted = admissionsProgress?.completedLessons || 0;
  const admissionsProgressPercent = admissionsTotalLessons > 0 
    ? Math.round((admissionsLessonsCompleted / admissionsTotalLessons) * 100) 
    : 0;
  const admissionsTimeWatched = admissionsProgress?.totalTimeWatched || 0;
  const admissionsTimeWatchedMinutes = Math.floor(admissionsTimeWatched / 60);

  const satLessonsCompleted =
    (fullSupportSatProgress?.data?.completedLessons ?? satProgress?.completedLessons) || 0;
  const satTotalLessonsEffective =
    (fullSupportSatProgress?.data?.totalLessons ?? satTotalLessons) || 0;
  const satProgressPercent = satTotalLessonsEffective > 0
    ? Math.round((satLessonsCompleted / satTotalLessonsEffective) * 100)
    : 0;
  const satTimeWatched = satProgress?.totalTimeWatched || 0;
  const satTimeWatchedMinutes = Math.floor(satTimeWatched / 60);
  
  // Render course card component
  const renderCourseCard = (
    courseName: 'admissions' | 'sat',
    title: string,
    lessonsCompleted: number,
    totalLessons: number,
    progressPercent: number,
    timeWatchedMinutes: number,
    enrollment: any
  ) => (
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
        {title}
      </CustomText>
      <CustomText
        fontSize={16}
        fontWeight={400}
        mb={24}
        color={colors.colorTextSecondary}
      >
        {courseName === 'sat' && Array.isArray(fullSupportSatProgress?.data?.byCourse) && fullSupportSatProgress?.data?.byCourse?.length
          ? (() => {
              const by = fullSupportSatProgress.data.byCourse;
              const math = by.find((c) => (c.courseName || '').toLowerCase().includes('math'));
              const eng = by.find((c) => (c.courseName || '').toLowerCase().includes('english'));
              const mathLabel = `Math: ${math?.completedLessons ?? 0}/${math?.totalLessons ?? 0}`;
              const engLabel = `English: ${eng?.completedLessons ?? 0}/${eng?.totalLessons ?? 0}`;
              const total = (math?.totalLessons ?? 0) + (eng?.totalLessons ?? 0);
              return `${mathLabel} · ${engLabel}${total > 0 ? ` (Total: ${total})` : ''}`;
            })()
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
              {progressPercent}%
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
            percent={progressPercent}
            strokeColor={colors.colorPrimary}
            showInfo={false}
            style={{ marginBottom: 16 }}
          />
          <div className={styles.progress_footer}>
            <CustomText fontSize={14} color={colors.colorTextSecondary}>
              {progressPercent}% complete
            </CustomText>
            <CustomButton
              height={40}
              onClick={() => navigate(`/learning?course=${courseName}`)}
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
        </div>
      </div>
    </CustomCard>
  );

  return (
    <section className={`${styles.learning_section} ${styles.fade_in_slide}`}>
      <div className={'container ' + styles.container}>
        {/* SuperAdmin Quick Access Links - Show at top if SuperAdmin */}
        {isSuperAdmin && (
          <CustomCard
            bgColor={colors.colorBgContainer}
            mb={24}
            shadowed
            borderRadius={24}
            padding={24}
          >
            <CustomText 
              fontSize={20}
              fontWeight={600}
              mb={16}
              color={colors.colorTextBase}
            >
              Admin Dashboard
            </CustomText>
            <CustomText 
              fontSize={14} 
              fontWeight={500}
              color={colors.colorTextSecondary}
              style={{ marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            >
              Quick Access
            </CustomText>
            <Space size="small" wrap>
              <CustomButton
                size="small"
                height={40}
                onClick={() => navigate('/school-counselor')}
                icon={<DashboardOutlined />}
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: colors.colorPrimary,
                  color: colors.colorPrimary,
                  height: '40px',
                  minHeight: '40px'
                }}
              >
                School Counselor Dashboard
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
          </CustomCard>
        )}
        
        {/* Admissions Course Card */}
        {hasAdmissionsAccess && renderCourseCard(
          'admissions',
          'Admissions Program',
          admissionsLessonsCompleted,
          admissionsTotalLessons,
          admissionsProgressPercent,
          admissionsTimeWatchedMinutes,
          admissionsEnrollment
        )}
        
        {/* SAT Course Card */}
        {hasSatAccess && renderCourseCard(
          'sat',
          'SAT Prep Course',
          satLessonsCompleted,
          satTotalLessonsEffective,
          satProgressPercent,
          satTimeWatchedMinutes,
          satEnrollment
        )}
      </div>
    </section>
  );
}

