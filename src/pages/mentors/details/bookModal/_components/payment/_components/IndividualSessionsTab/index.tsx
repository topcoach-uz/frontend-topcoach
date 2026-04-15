import { App, Button, ConfigProvider, Flex, message, Modal } from 'antd';
import { Clock } from 'lucide-react';
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
  const totalMinutes = balance?.totalMinutes - balance?.usedMinutes;

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

  const price = isValidMentorLevel && mentorLevel 
    ? selectedPlan?.prices[mentorLevel as 'junior' | 'senior' | 'expert' | 'uzcombinator']
    : 'N/A';

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
              <div style={{ textAlign: 'left', width: '100%' }}>
                <Flex gap={8} align="center" style={{ marginBottom: '8px' }}>
                  <Clock size={24} color={colors.colorPrimary} />
                  <CustomText 
                    color={colors.colorPrimary}
                    fontSize={20}
                    fontWeight={600}
                  >
                    {plan?.minutes} minutes
                  </CustomText>
                </Flex>
                
                <CustomText 
                  color={colors.colorTextSecondary}
                  fontSize={14}
                  style={{ marginBottom: '12px' }}
                >
                  One-on-one session
                </CustomText>
                
                {!isProbono && (!totalMinutes || totalMinutes == 0) && (
                  <CustomText 
                    color={colors.colorTextBase}
                    fontSize={20}
                    fontWeight={600}
                    style={{ lineHeight: '1.4' }}
                  >
                    {/* @ts-ignore */}
                    {mentorLevel && mentorLevel !== MentorExperienceLevel.Probono
                      ? // @ts-ignore
                        `${plan.prices[mentorLevel]?.toLocaleString()} ${plan.currency?.symbol} (${individualDataInDollars[index]?.prices[mentorLevel]} USD)`
                      : 'N/A'}
                  </CustomText>
                )}
              </div>
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
          Submit
        </CustomButton>
      </div>
    </>
  );
}
