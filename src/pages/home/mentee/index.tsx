import { useState, useEffect } from 'react';
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
import SubscriptionPlans from 'src/components/subscriptions/SubscriptionPlans';
import LearningProgramSection from '../_components/learningProgram';
import SchoolCounselorDashboardSection from '../_components/schoolCounselorDashboard';
import styles from '../mentor/_components/profile_status/profile_status.module.scss';
import { useGetEnrollmentStatusQuery } from 'src/app/services/courses';
import { api } from 'src/app/api';

function MenteeHomePage() {
  const navigate = useNavigate();
  const profile = useTypedSelector((state) => state.auth.profile);
  const nameMissing = !profile?.profile?.name;
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const { data: telegramStatus, refetch: refetchTelegramStatus, isLoading: telegramLoading } = useGetTelegramStatusQuery();
  const { data: enrollmentStatus } = useGetEnrollmentStatusQuery();
  const [isCounselor, setIsCounselor] = useState(false);
  const [counselorLoading, setCounselorLoading] = useState(true);
  
  // Debug logging
  console.log('Telegram Status:', telegramStatus);
  
  // Only show as missing if we have data and it's not connected
  const telegramMissing = !telegramLoading && telegramStatus?.status !== 'connected';

  // Check if user is a counselor
  useEffect(() => {
    const checkCounselorStatus = async () => {
      try {
        const response = await api.request({
          path: '/organizations/my-organizations',
          method: 'GET',
          secure: true,
        });
        
        if (response.data && response.data.length > 0) {
          setIsCounselor(true);
        } else {
          setIsCounselor(false);
        }
      } catch (error: any) {
        setIsCounselor(false);
      } finally {
        setCounselorLoading(false);
      }
    };

    if (profile?.id) {
      checkCounselorStatus();
    } else {
      setCounselorLoading(false);
    }
  }, [profile?.id]);

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
      {/* Temporarily hidden - rethinking subscription plans */}
      {/* <SubscriptionPlans /> */}
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
