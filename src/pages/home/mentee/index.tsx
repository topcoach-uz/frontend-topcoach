import { useState } from 'react';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { useGetTelegramStatusQuery } from 'src/app/services/users';
import CheckListItem from '../../home/mentor/_components/CheckListItem';
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { Card, Flex, Button } from 'antd';
import TelegramConnectionModal from 'src/components/TelegramConnectionModal';

import HomeAiSearchSection from '../_components/aiSearch';
import BannerSection from '../_components/banner';
import BookingsSection from '../_components/bookings';
import EventsSection from '../_components/events';
import FavoriteUniversitiesSection from '../_components/university';
import SubscriptionPlans from 'src/components/subscriptions/SubscriptionPlans';
import styles from '../mentor/_components/profile_status/profile_status.module.scss';

function MenteeHomePage() {
  const profile = useTypedSelector((state) => state.auth.profile);
  const nameMissing = !profile?.profile?.name;
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const { data: telegramStatus, refetch: refetchTelegramStatus, isLoading: telegramLoading } = useGetTelegramStatusQuery();
  
  // Debug logging
  console.log('Telegram Status:', telegramStatus);
  
  // Only show as missing if we have data and it's not connected
  const telegramMissing = !telegramLoading && telegramStatus?.status !== 'connected';

  const checklist = [
    {
      stepName: 'Full Name',
      isComplete: !nameMissing,
      buttonText: 'Edit',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('openEditProfileModal'));
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
      <BannerSection />
      {/* <HomeAiSearchSection /> */}
      <BookingsSection />
      {/* <FavoriteUniversitiesSection /> */}
      <EventsSection />
      <SubscriptionPlans />
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
