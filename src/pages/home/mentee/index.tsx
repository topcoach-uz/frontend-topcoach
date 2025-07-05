import { useState } from 'react';
import { useTypedSelector } from 'src/app/store';
import { CustomText } from 'src/components/common';
import { themeFontSize, themeFontWeight } from 'src/constants/theme';
import { PhoneNumberModal } from 'src/components/form/item/PhoneFormItem';
import { useUpdatePhoneNumberMutation } from 'src/app/services/users';
import CheckListItem from '../../home/mentor/_components/CheckListItem';
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { Card, Flex, Button } from 'antd';

import HomeAiSearchSection from '../_components/aiSearch';
import BannerSection from '../_components/banner';
import BookingsSection from '../_components/bookings';
import EventsSection from '../_components/events';
import FavoriteUniversitiesSection from '../_components/university';
import SubscriptionPlans from 'src/components/subscriptions/SubscriptionPlans';
import styles from '../mentor/_components/profile_status/profile_status.module.scss';

function MenteeHomePage() {
  const profile = useTypedSelector((state) => state.auth.profile);
  const phoneMissing = !profile?.phoneNumber || profile.phoneNumber.trim() === '';
  const nameMissing = !profile?.profile?.name;
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [updatePhoneNumber, { isLoading: updatingPhone }] = useUpdatePhoneNumberMutation();

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
      stepName: 'Phone Number',
      isComplete: !phoneMissing,
      buttonText: 'Edit',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('openEditProfileModal'));
      },
    },
  ];

  const handlePhoneModalSubmit = (phoneNumber: string) => {
    updatePhoneNumber({ phoneNumber })
      .unwrap()
      .then(() => {
        setShowPhoneModal(false);
        window.location.reload();
      });
  };

  return (
    <div>
      {nameMissing || phoneMissing ? (
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
      <PhoneNumberModal
        visible={showPhoneModal}
        onSubmit={handlePhoneModalSubmit}
        onCancel={() => setShowPhoneModal(false)}
        loading={updatingPhone}
      />
    </div>
  );
}
export default MenteeHomePage;
