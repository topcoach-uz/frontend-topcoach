/**
 * Admissions Program Progress Card
 * Shows progress for enrolled students (Admissions + SAT) with Continue Learning button.
 * Used on My Journey Dashboard and Mentor Home.
 */

import React, { useMemo } from 'react';
import { Card, Progress, Button, Spin, Empty, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlayCircleOutlined } from '@ant-design/icons';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import {
  useGetEnrollmentStatusQuery,
  useGetUserProgressQuery,
  useGetCourseStructureQuery,
} from '../../../app/services/courses';
import { useGetEnrollmentMeQuery, useLazyGetScholarhubSsoLinkQuery } from '../../../app/services/fullSupportApi';
import './AdmissionsProgramProgressCard.scss';

interface AdmissionsProgramProgressCardProps {
  /** Skip rendering (e.g. in read-only mode) */
  skip?: boolean;
  /** When true, render without outer Card (for embedding in other sections) */
  embedded?: boolean;
  /** When true and not enrolled, render Empty state instead of null */
  showEmptyWhenNotEnrolled?: boolean;
  /** Optional title override (e.g. "Your Enrolled Programs" for Programs tab) */
  title?: string;
  /** Optional subtitle override */
  subtitle?: string;
}

export default function AdmissionsProgramProgressCard({
  skip,
  embedded = false,
  showEmptyWhenNotEnrolled = false,
  title,
  subtitle,
}: AdmissionsProgramProgressCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: admissionsEnrollment, isLoading: enrollmentLoading } = useGetEnrollmentStatusQuery(
    'admissions',
    { skip: !!skip }
  );
  const { data: satEnrollment } = useGetEnrollmentStatusQuery('sat', { skip: !!skip });
  const { data: enrollmentMe } = useGetEnrollmentMeQuery(undefined, { skip: !!skip });
  const [fetchSsoLink] = useLazyGetScholarhubSsoLinkQuery();

  const { data: admissionsProgress, isLoading: progressLoading } = useGetUserProgressQuery(
    'admissions',
    { skip: !!skip || !admissionsEnrollment?.canAccessLearning }
  );
  const { data: satProgress } = useGetUserProgressQuery('sat', {
    skip: !!skip || !satEnrollment?.canAccessLearning,
  });

  const { data: admissionsStructure } = useGetCourseStructureQuery('admissions', {
    skip: !!skip || !admissionsEnrollment?.canAccessLearning,
  });

  const admissionsTotalLessons = useMemo(() => {
    if (admissionsProgress?.totalLessons !== undefined && admissionsProgress.totalLessons > 0) {
      return admissionsProgress.totalLessons;
    }
    if (admissionsStructure?.length) {
      return admissionsStructure.reduce((total, module) => {
        const moduleLessons = module.lessons?.length || 0;
        const submoduleLessons =
          module.submodules?.reduce(
            (subTotal, sub) => subTotal + (sub.lessons?.length || 0),
            0
          ) || 0;
        return total + moduleLessons + submoduleLessons;
      }, 0);
    }
    return 0;
  }, [admissionsProgress?.totalLessons, admissionsStructure]);

  const satTotalLessons = satProgress?.totalLessons ?? 0;
  const hasAdmissions = admissionsEnrollment?.isEnrolled && admissionsEnrollment?.canAccessLearning;
  const hasSatCourse = satEnrollment?.isEnrolled && satEnrollment?.canAccessLearning;
  const hasSatFromFullSupport = enrollmentMe?.data?.enrolled === true;
  const hasSat = hasSatCourse || hasSatFromFullSupport;

  const isLoading = enrollmentLoading || (hasAdmissions && progressLoading);
  if (isLoading && !hasAdmissions && !hasSat) {
    return showEmptyWhenNotEnrolled ? <Empty description={t('programs.enrollment.noProgramsEnrolled') || 'No programs enrolled at the moment'} image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null;
  }
  if (!hasAdmissions && !hasSat) {
    return showEmptyWhenNotEnrolled ? <Empty description={t('programs.enrollment.noProgramsEnrolled') || 'No programs enrolled at the moment'} image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null;
  }

  const handleSatContinueLearning = async () => {
    try {
      const res = await fetchSsoLink(undefined).unwrap();
      const d = res?.data;
      if (d?.redirectUrl) {
        window.open(d.redirectUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      if (d?.frontendUrl && d?.token) {
        const url = `${String(d.frontendUrl).replace(/\/$/, '')}?token=${encodeURIComponent(d.token)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      if (d?.frontendUrl) {
        window.open(d.frontendUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      message.info(t('fullSupport.satPrepLinkUnavailable', 'SAT prep link is not configured. Please try again later.'));
    } catch {
      message.error(t('fullSupport.satPrepLinkError', 'Could not open SAT prep.'));
    }
  };

  const renderCourseBlock = (
    courseName: 'admissions' | 'sat',
    title: string,
    completed: number,
    total: number,
    progressPercent: number,
    continueLearningClick?: () => void
  ) => (
    <div key={courseName} className="admissions-progress-course">
      <div className="admissions-progress-course-header">
        <UnifiedIcon name="programs" size="md" color="primary" />
        <span className="admissions-progress-course-title">{title}</span>
      </div>
      <div className="admissions-progress-stats">
        <div className="admissions-progress-stat">
          <span className="admissions-progress-stat-value">{completed}</span>
          <span className="admissions-progress-stat-label">
            {t('programs.enrollment.lessonsCompleted')}
          </span>
        </div>
        <div className="admissions-progress-stat">
          <span className="admissions-progress-stat-value">{total}</span>
          <span className="admissions-progress-stat-label">
            {t('programs.enrollment.totalLessons')}
          </span>
        </div>
        <div className="admissions-progress-stat">
          <span className="admissions-progress-stat-value">{progressPercent}%</span>
          <span className="admissions-progress-stat-label">
            {t('programs.enrollment.overallProgress')}
          </span>
        </div>
      </div>
      <Progress
        percent={progressPercent}
        strokeColor="#8b0000"
        trailColor="#f0f0f0"
        showInfo={false}
        size="small"
        className="admissions-progress-bar"
      />
      <Button
        type="primary"
        size="middle"
        icon={<PlayCircleOutlined />}
        onClick={continueLearningClick ?? (() => navigate(`/learning?course=${courseName}`))}
        className="admissions-progress-btn"
      >
        {t('programs.enrollment.continueLearning')}
      </Button>
    </div>
  );

  const content = (
    <>
      {!embedded && (
        <div className="admissions-progress-header">
          <h3 className="admissions-progress-title">
            {title ?? t('programs.enrollment.learningProgress')}
          </h3>
          <p className="admissions-progress-subtitle">
            {subtitle ?? t('programs.enrollment.trackJourney')}
          </p>
        </div>
      )}
      {isLoading ? (
        <div className="admissions-progress-loading">
          <Spin size="large" tip="Loading..." />
        </div>
      ) : (
        <div className="admissions-progress-courses">
          {hasAdmissions &&
            renderCourseBlock(
              'admissions',
              t('studentHub.dashboard.admissionsProgram', 'Admissions Program'),
              admissionsProgress?.completedLessons ?? 0,
              admissionsTotalLessons,
              admissionsTotalLessons > 0
                ? Math.round(
                    ((admissionsProgress?.completedLessons ?? 0) / admissionsTotalLessons) * 100
                  )
                : 0
            )}
          {hasSat &&
            renderCourseBlock(
              'sat',
              t('studentHub.dashboard.satPrepCourse', 'SAT Prep Course'),
              hasSatCourse ? (satProgress?.completedLessons ?? 0) : 0,
              hasSatCourse ? satTotalLessons : 0,
              hasSatCourse && satTotalLessons > 0
                ? Math.round(((satProgress?.completedLessons ?? 0) / satTotalLessons) * 100)
                : 0,
              hasSatFromFullSupport && !hasSatCourse ? handleSatContinueLearning : undefined
            )}
        </div>
      )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card className="admissions-progress-card" style={{ marginTop: 24, marginBottom: 24 }}>
      {content}
    </Card>
  );
}
