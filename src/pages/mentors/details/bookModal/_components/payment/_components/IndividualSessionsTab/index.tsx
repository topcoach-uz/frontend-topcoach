import { App, Button, ConfigProvider, Flex, message, Modal } from 'antd';
import { Clock } from 'iconsax-react';
import { useState } from 'react';
import {
  MentorExperienceLevel,
  PaymentPlanTypeEnum,
  SessionTypeEnum,
} from 'src/app/api/Api';
import { useTypedSelector } from 'src/app/store';
import { CustomButton, CustomText } from 'src/components/common';
import useParamsHook from 'src/hooks/params';
import { IHandleBookArgs } from 'src/pages/mentors/details';
import styles from './IndividualSessionsTab.module.scss';
import useColors from 'src/hooks/useColors';
import { PaymentTypeEnum } from 'src/pages/payment/sms';
import { themeColors } from 'src/constants/theme';

interface Props {
  handleBook: (args: IHandleBookArgs) => void;
  handleChangeTab: (tab: PaymentTypeEnum) => void;
}

export default function IndividualSessionsTab({
  handleBook,
  handleChangeTab,
}: Props) {
  const { handleMakeParams } = useParamsHook();
  const colors = useColors();
  const { balance, lastMentorData, plans, plansWithParams } = useTypedSelector(
    (state) => state.mentor
  );
  const [activeIndividual, setActiveIndividual] =
    useState<PaymentPlanTypeEnum>();

  const individualData = [
    plans?.find((plan) => plan.type === PaymentPlanTypeEnum.Individual30M),
    plans?.find((plan) => plan.type === PaymentPlanTypeEnum.Individual60M),
  ];

  const individualDataInDollars = [
    plansWithParams?.find(
      (plan) => plan.type === PaymentPlanTypeEnum.Individual30M
    ),
    plansWithParams?.find(
      (plan) => plan.type === PaymentPlanTypeEnum.Individual60M
    ),
  ];

  const selectedPlan = individualData?.find(
    (plan) => plan?.type === activeIndividual
  );

  // @ts-ignore
  const totalMinutes = (balance?.totalMinutes || 0) - (balance?.usedMinutes || 0);

  const handleIndividualSubmit = () => {
    if (!selectedPlan?.id) {
      message.warning('Please select a session plan.');
      return;
    }

    // Go directly to session booking without any confirmation popups
    handleBook({
      name: `${selectedPlan.minutes}-minute session`,
      planId: selectedPlan.id,
      planType: selectedPlan.type,
    });
  };

  const hasSessionsOfType = (type: SessionTypeEnum | PaymentPlanTypeEnum) => {
    return lastMentorData?.sessionStats.upcomingSessions.some(
      (session) => session?.type === type
    );
  };

  const handleIndividualChange = (key: PaymentPlanTypeEnum) => {
    if (hasSessionsOfType(key)) {
      setActiveIndividual(key);
    } else {
      message.error(
        `We don't have any ${key == PaymentPlanTypeEnum.Individual30M ? '30-minute' : '60-minute'} sessions available for you.`
      );
    }
  };

  const mentorLevel = lastMentorData?.mentorProfile?.level;
  const isValidMentorLevel =
    mentorLevel && mentorLevel !== MentorExperienceLevel.Probono;

  const price = isValidMentorLevel ? selectedPlan?.prices[mentorLevel] : 'N/A';

  const isProbono =
    lastMentorData?.mentorProfile?.level === MentorExperienceLevel.Probono;

  return (
    <>
      <div className={styles.individual}>
        {individualData &&
          individualData.map((plan, index) => (
            <div
              onClick={() => plan?.type && handleIndividualChange(plan?.type)}
              className={
                activeIndividual === plan?.type
                  ? styles.individualDetailActive
                  : styles.individualDetail
              }
              key={index + (plan?.type ?? '')}
            >
              <div className={styles.sessionHeader}>
                <div>
                  <div className={styles.sessionDuration}>
                    {plan?.minutes} minutes
                  </div>
                  <div className={styles.sessionDescription}>
                    One-on-one session
                  </div>
                </div>
              </div>
              
              {!isProbono && (!totalMinutes || totalMinutes == 0) && (
                <div className={styles.sessionPrice}>
                  {/* @ts-ignore */}
                  {mentorLevel && mentorLevel !== MentorExperienceLevel.Probono && plan.prices && plan.prices[mentorLevel] && !isNaN(plan.prices[mentorLevel])
                    ? // @ts-ignore
                      `${plan.prices[mentorLevel]?.toLocaleString()} ${plan.currency?.symbol} (${Math.max(1, Math.ceil(plan.prices[mentorLevel] / 13000))} USD)`
                    : 'N/A'}
                </div>
              )}
              
              {isProbono && (
                <div className={styles.sessionPrice}>
                  Free Session
                </div>
              )}
              
              {totalMinutes && totalMinutes > 0 && (
                <div className={styles.sessionPrice}>
                  Included in your plan
                </div>
              )}
            </div>
          ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '24px',
        }}
      >
        <CustomButton type="primary" onClick={handleIndividualSubmit}>
          Next
        </CustomButton>
      </div>
    </>
  );
}
