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
  const totalMinutes = balance?.totalMinutes - balance?.usedMinutes;

  const handleIndividualSubmit = () => {
    if (!selectedPlan?.id) {
      message.warning('Please select a session plan.');
      return;
    }

    // if the last mentor level is probono, jump to booking without some steps
    if (
      lastMentorData?.mentorProfile?.level === MentorExperienceLevel.Probono
    ) {
      handleBook({
        name: `${selectedPlan.minutes}-minute session`,
        planId: selectedPlan.id,
        planType: selectedPlan.type,
      });
      return;
    }

    handleMakeParams('planId', selectedPlan?.id);
    // when user has a package and wants to book a session
    if (totalMinutes && totalMinutes >= selectedPlan?.minutes) {
      Modal.confirm({
        title: `You have ${totalMinutes} minutes left.`,
        content: `Are you sure you want to proceed with scheduling a ${selectedPlan?.minutes}-minute session?`,
        okText: "I'm sure",
        onOk: () => {
          handleBook({
            name: `${selectedPlan.minutes}-minute session`,
            planId: selectedPlan.id,
            planType: selectedPlan.type,
          });
        },
        footer: (_, { CancelBtn, OkBtn }) => {
          return (
            <ConfigProvider
              theme={{
                token: themeColors.dark,
                components: {
                  Button: {
                    colorPrimary: colors.colorPrimary,
                    colorPrimaryHover: colors.colorPrimary,
                    colorPrimaryActive: colors.colorPrimary,
                  },
                },
              }}
            >
              <CancelBtn />
              <OkBtn />
            </ConfigProvider>
          );
        },
      });
      return;
    }
    // when user doesn't have a package and wants to buy a session
    Modal.confirm({
      title: totalMinutes
        ? `You have ${totalMinutes} minutes left.`
        : `You don't have any packages`,
      // @ts-ignore
      content: `Are you sure that you want to proceed with buying a one-time ${selectedPlan?.minutes}-minute session for ${price?.toLocaleString()} ${selectedPlan?.currency?.name}?`,
      okText: "I'm sure",
      footer: (_, { CancelBtn, OkBtn }) => {
        return (
          <Flex vertical gap={10}>
            <Flex justify="space-between">
              <ConfigProvider
                theme={{
                  token: themeColors.dark,
                  components: {
                    Button: {
                      colorPrimary: colors.colorPrimary,
                      colorPrimaryHover: colors.colorPrimary,
                      colorPrimaryActive: colors.colorPrimary,
                    },
                  },
                }}
              >
                <CancelBtn />
                <OkBtn />
              </ConfigProvider>
            </Flex>
            <ConfigProvider
              theme={{
                token: themeColors.dark,
                components: {
                  Button: {
                    colorPrimary: colors.colorPrimary, // Set the primary color for all primary buttons in this context
                    colorPrimaryHover: colors.colorPrimaryHover,
                    colorPrimaryActive: colors.colorPrimaryActive,
                  },
                },
              }}
            >
              <Button
                type="primary"
                onClick={() => {
                  Modal.destroyAll();
                  handleChangeTab(PaymentTypeEnum.Package);
                }}
              >
                I want to buy a package
              </Button>
            </ConfigProvider>
          </Flex>
        );
      },
      onOk: () => {
        handleBook({
          name: `${selectedPlan.minutes}-minute session`,
          planId: selectedPlan.id,
          planType: selectedPlan.type,
        });
      },
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
              <Flex gap={5} align="center">
                <Clock size="20" color={colors.colorPrimary} />
                <CustomText color={colors.colorText}>
                  {plan?.minutes} minutes{' '}
                </CustomText>
              </Flex>
              {/* if the mentor level is probono, ai major search perks are not given */}
              {!isProbono && (
                <CustomText color={colors.colorText}>
                  You can use AI major search{' '}
                  {plan?.minutes === 30 ? '5 times' : '10 times'}{' '}
                </CustomText>
              )}
              {!isProbono && (!totalMinutes || totalMinutes == 0) && (
                <CustomText color={colors.colorText}>
                  {/* @ts-ignore */}
                  {mentorLevel && mentorLevel !== MentorExperienceLevel.Probono
                    ? // @ts-ignore
                      `${plan.prices[mentorLevel]?.toLocaleString()} ${plan.currency?.symbol} (${individualDataInDollars[index]?.prices[mentorLevel]} USD)`
                    : 'N/A'}
                </CustomText>
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
          Submit
        </CustomButton>
      </div>
    </>
  );
}
