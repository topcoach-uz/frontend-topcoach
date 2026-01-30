/**
 * Admissions Program Progress Card
 * Shows progress for enrolled students (Admissions + SAT) with Continue Learning button.
 * Used on My Journey Dashboard and Mentor Home.
 */

import React, { useMemo } from 'react';
import { Card, Progress, Button, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlayCircleOutlined } from '@ant-design/icons';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import {
  useGetEnrollmentStatusQuery,
  useGetUserProgressQuery,
  useGetCourseStructureQuery,
} from '../../../app/services/courses';
import './AdmissionsProgramProgressCard.scss';

interface AdmissionsProgramProgressCardProps {
  /** Skip rendering (e.g. in read-only mode) */
  skip?: boolean;
}

export default function AdmissionsProgramProgressCard({ skip }: AdmissionsProgramProgressCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: admissionsEnrollment, isLoading: enrollmentLoading } = useGetEnrollmentStatusQuery(
    'admissions',
    { skip: !!skip }
  );
  const { data: satEnrollment } = useGetEnrollmentStatusQuery('sat', { skip: !!skip });

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
  const hasSat = satEnrollment?.isEnrolled && satEnrollment?.canAccessLearning;

  const isLoading = enrollmentLoading || (hasAdmissions && progressLoading);
  if (isLoading && !hasAdmissions && !hasSat) {
    return null;
  }
  if (!hasAdmissions && !hasSat) {
    return null;
  }

  const renderCourseBlock = (
    courseName: 'admissions' | 'sat',
    title: string,
    completed: number,
    total: number,
    progressPercent: number
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
        onClick={() => navigate(`/learning?course=${courseName}`)}
        className="admissions-progress-btn"
      >
        {t('programs.enrollment.continueLearning')}
      </Button>
    </div>
  );

  return (
    <Card className="admissions-progress-card" style={{ marginBottom: 24 }}>
      <div className="admissions-progress-header">
        <h3 className="admissions-progress-title">
          {t('programs.enrollment.learningProgress')}
        </h3>
        <p className="admissions-progress-subtitle">
          {t('programs.enrollment.trackJourney')}
        </p>
      </div>
      {isLoading ? (
        <div className="admissions-progress-loading">
          <Spin size="large" />
        </div>
      ) : (
        <div className="admissions-progress-courses">
          {hasAdmissions &&
            renderCourseBlock(
              'admissions',
              'Admissions Program',
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
              'SAT Prep Course',
              satProgress?.completedLessons ?? 0,
              satTotalLessons,
              satTotalLessons > 0
                ? Math.round(((satProgress?.completedLessons ?? 0) / satTotalLessons) * 100)
                : 0
            )}
        </div>
      )}
    </Card>
  );
}
