import React, { useState } from 'react';
import { Alert, Button } from 'antd';
import { User, GraduationCap, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStudentProfile } from '../../../hooks/useStudentHub';
import { formatDateTime } from '../../../utils/dateFormatter';
import { PageSkeleton } from '../../../components/loading';
import PersonalProfile from '../profile/PersonalProfile';
import AcademicProfile from '../profile/AcademicProfile';
import ActivitiesProfile from '../profile/ActivitiesProfile';
import styles from './StudentProfileTab.module.scss';

type SubTab = 'personal' | 'academic' | 'activities';

/**
 * "Profile" settings tab — the rich student profile (Personal / Academic /
 * Activities) that powers AI recommendations. It re-uses the existing
 * profile form components but wraps them in an editorial sub-tab nav and
 * a scoped style override (see StudentProfileTab.module.scss) so the forms
 * read in the crimson/paper editorial language of the rest of My Journey
 * instead of the legacy blue design-system look.
 */
export default function StudentProfileTab() {
  const { t } = useTranslation();
  const [sub, setSub] = useState<SubTab>('personal');
  const { profile, isLoading, error } = useStudentProfile();

  if (isLoading) {
    return <PageSkeleton rows={6} showTitle={false} showAvatar={false} />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message={t('studentHub.profile.error', 'Could not load your profile')}
        description={t(
          'studentHub.profile.errorDescription',
          'Something went wrong loading your profile. Please try again.',
        )}
        action={
          <Button size="small" onClick={() => window.location.reload()}>
            {t('studentHub.profile.retry', 'Retry')}
          </Button>
        }
      />
    );
  }

  const sections = {
    personal: {
      completed: !!profile?.personalProfile,
      percentage: profile?.personalProfile ? 100 : 0,
      lastUpdated: formatDateTime(profile?.personalProfile?.updatedAt || ''),
    },
    academic: {
      completed: !!profile?.academicProfile,
      percentage: profile?.academicProfile ? 100 : 0,
      lastUpdated: formatDateTime(profile?.academicProfile?.updatedAt || ''),
    },
    activities: {
      completed: !!profile?.activitiesProfile,
      percentage: profile?.activitiesProfile ? 100 : 0,
      lastUpdated: formatDateTime(profile?.activitiesProfile?.updatedAt || ''),
    },
  };

  const subTabs: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'personal',
      label: t('studentHub.profile.personalProfile', 'Personal'),
      icon: <User size={15} />,
    },
    {
      key: 'academic',
      label: t('studentHub.profile.academicProfile', 'Academic'),
      icon: <GraduationCap size={15} />,
    },
    {
      key: 'activities',
      label: t('studentHub.profile.activitiesAchievements', 'Activities'),
      icon: <Award size={15} />,
    },
  ];

  return (
    <div className={styles.wrap}>
      <p className={styles.lead}>
        {t(
          'studentHub.profile.settingsLead',
          'Your full profile powers AI major matches and recommendations. The more complete it is, the sharper the guidance.',
        )}
      </p>

      <nav className={styles.subTabs} aria-label="Profile sections">
        {subTabs.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`${styles.subTab} ${sub === s.key ? styles.subTabActive : ''}`}
            onClick={() => setSub(s.key)}
          >
            <span className={styles.subTabIcon}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </nav>

      <div className={styles.editorialProfile}>
        {sub === 'personal' && <PersonalProfile data={sections.personal} />}
        {sub === 'academic' && <AcademicProfile data={sections.academic} />}
        {sub === 'activities' && <ActivitiesProfile data={sections.activities} />}
      </div>
    </div>
  );
}
