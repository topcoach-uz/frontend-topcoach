import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { useGetTelegramStatusQuery } from 'src/app/services/users';
import CheckListItem from '../../home/mentor/_components/CheckListItem';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, Flex, Button } from 'antd';
import TelegramConnectionModal from 'src/components/TelegramConnectionModal';

import HomeAiSearchSection from '../_components/aiSearch';
import BannerSection from '../_components/banner';
import BookingsSection from '../_components/bookings';
import EventsSection from '../_components/events';
import FavoriteUniversitiesSection from '../_components/university';
import LearningProgramSection from '../_components/learningProgram';
import SchoolCounselorDashboardSection from '../_components/schoolCounselorDashboard';
import styles from '../mentor/_components/profile_status/profile_status.module.scss';
import { useGetEnrollmentStatusQuery } from 'src/app/services/courses';
import useOrgStaff from 'src/hooks/useOrgStaff';

function MenteeHomePage() {
  const navigate = useNavigate();
  const profile = useTypedSelector((state) => state.auth.profile);
  const nameMissing = !profile?.profile?.name;
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const { data: telegramStatus, refetch: refetchTelegramStatus, isLoading: telegramLoading } = useGetTelegramStatusQuery();
  const { data: enrollmentStatus } = useGetEnrollmentStatusQuery();
  // Org membership from the shared `/org/me` cache. Platform staff are
  // excluded (see useOrgStaff) so a SuperAdmin's mentee home is unchanged.
  const { isOrgStaff: isCounselor, isLoading: counselorLoading } = useOrgStaff();

  // Only show as missing if we have data and it's not connected
  const telegramMissing = !telegramLoading && telegramStatus?.status !== 'connected';

  const checklist = [
    {
      stepName: 'Full Name',
      isComplete: !nameMissing,
      buttonText: 'Edit',
      onClick: () => {
        navigate('/student-hub/settings');
      },
    },
    {
      stepName: 'Telegram Connection',
      isComplete: !telegramMissing,
      buttonText: telegramStatus?.status === 'pending' ? 'Continue' : 'Connect',
      onClick: () => {
        setShowTelegramModal(true);
      },
    },
  ];

  return (
    <div>
      {/* Only show checklist if we have loaded data and there are missing items */}
      {!telegramLoading && (nameMissing || telegramMissing) ? (
        <div className={'container ' + styles.container} style={{ marginBottom: 8 }}>
          <div>
            <CustomText
              fontSize={20}
              fontWeight={600}
              style={{ marginBottom: 8 }}
            >
              Complete your profile
            </CustomText>
            <ul className={styles.profile_check_list}>
              {checklist.map((check) => (
                <CheckListItem key={check.stepName} {...check} />
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {/* Show Learning Program for enrolled students, School Counselor Dashboard for counselors, or Banner for others */}
      {/* Always render LearningProgramSection first - it handles its own loading state */}
      <LearningProgramSection />
      {!counselorLoading && (
        <>
          {isCounselor && <SchoolCounselorDashboardSection />}
          {/* Banner section temporarily hidden */}
          {/* {!enrollmentStatus?.isEnrolled || !enrollmentStatus?.canAccessLearning ? (
            !isCounselor ? <BannerSection /> : null
          ) : null} */}
        </>
      )}
      {/* <HomeAiSearchSection /> */}
      <BookingsSection />
      <EventsSection />
      <FavoriteUniversitiesSection showOnlyFavorites={true} />
      <TelegramConnectionModal
        visible={showTelegramModal}
        onClose={() => {
          setShowTelegramModal(false);
          // Force refetch after modal closes
          setTimeout(() => {
            refetchTelegramStatus();
          }, 500);
        }}
      />
    </div>
  );
}
export default MenteeHomePage;
