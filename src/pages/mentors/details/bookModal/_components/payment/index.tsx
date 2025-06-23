import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MentorExperienceLevel, PaymentPlanTypeEnum } from 'src/app/api/Api';
import {
  useGetPlansQuery,
  useGetPlansWithParamsQuery,
} from 'src/app/services/mentors';
import { useTypedSelector } from 'src/app/store';
import { CustomButton, CustomModal, CustomText } from 'src/components/common';
import { TickIcon } from 'src/components/icons';
import { PaymentTypeEnum } from 'src/pages/payment/sms';
import { IHandleBookArgs } from '../../..';
import IndividualSessionsTab from './_components/IndividualSessionsTab';
import styles from './payment.module.scss';

interface Props {
  modalOpen?: boolean;
  setModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  handleClosePayment: () => void;
  handleBook: (args: IHandleBookArgs) => void;
}

export default function MentorBookingPayment({
  modalOpen,
  setModalOpen,
  handleClosePayment,
  handleBook,
}: Props) {
  const [activeTitle, setActiveTitle] = useState<PaymentTypeEnum>(
    PaymentTypeEnum.Individual
  );

  const { pathname } = useLocation();
  const splittedPathname = pathname.split('/');
  const mentorId = splittedPathname[splittedPathname.length - 1].split('?')[0];
  const { colors } = useTypedSelector((state) => state.layout);
  const { data: plans } = useGetPlansQuery();
  const { data: plansInDollars } = useGetPlansWithParamsQuery({
    currency: 'USD',
  });
  const navigate = useNavigate();
  const handleTabChange = (key: PaymentTypeEnum) => {
    setActiveTitle(key);
  };

  const { lastMentorData: mentorData } = useTypedSelector(
    (state) => state.mentor
  );

  const mentorLevel = mentorData?.mentorProfile?.level;

  const handleBuyPackage = (
    planId: string,
    amount?: number,
    currencyName?: string
  ) => {
    navigate(
      `/payment?mentorId=${mentorId}&planId=${planId}&amount=${amount}&currencyName=${currencyName}&buyType=${PaymentTypeEnum.Package}`
    );
  };

  let packageData = [
    plans?.find((plan) => plan.type === PaymentPlanTypeEnum.FullGuidence),
    plans?.find((plan) => plan.type === PaymentPlanTypeEnum.Intensive),
  ];

  let packageDataInDollars = [
    plansInDollars?.find(
      (plan) => plan.type === PaymentPlanTypeEnum.FullGuidence
    ),
    plansInDollars?.find((plan) => plan.type === PaymentPlanTypeEnum.Intensive),
  ];

  const isValidMentorLevel =
    mentorLevel && mentorLevel !== MentorExperienceLevel.Probono;

  return (
    <CustomModal
      open={modalOpen}
      title="Book a Session"
      onCancel={handleClosePayment}
      width={840}
    >
      <div className={styles.content}>
        <div className={styles.titles}>
          <CustomText
            onClick={() => handleTabChange(PaymentTypeEnum.Individual)}
            className={
              activeTitle === PaymentTypeEnum.Individual
                ? styles.active
                : styles.title
            }
          >
            Individual sessions
          </CustomText>
          {mentorLevel !== MentorExperienceLevel.Probono && (
            <CustomText
              onClick={() => handleTabChange(PaymentTypeEnum.Package)}
              className={
                activeTitle === PaymentTypeEnum.Package
                  ? styles.active
                  : styles.title
              }
            >
              Packages
            </CustomText>
          )}
        </div>
        {activeTitle === PaymentTypeEnum.Individual ? (
          <IndividualSessionsTab
            handleBook={handleBook}
            handleChangeTab={handleTabChange}
          />
        ) : (
          <div className={styles.package}>
            {packageData &&
              packageData.map((plan, index) => (
                <div
                  className={styles.packCard}
                  key={index + (plan?.type ?? '')}
                >
                  <div className={styles.info}>
                    <CustomText
                      fontSize={20}
                      fontWeight={600}
                      color={colors.colorPrimary}
                    >
                      {plan &&
                        plan.type === PaymentPlanTypeEnum.FullGuidence &&
                        'Full Guidance Package'}
                      {plan &&
                        plan.type === PaymentPlanTypeEnum.Intensive &&
                        'Intensive Course'}
                    </CustomText>
                    <CustomText
                      fontSize={16}
                      mt={12}
                      mb={12}
                      color={colors.colorTextTertiary}
                    >
                      {packageDummyData[index].desc}
                    </CustomText>
                    <CustomText
                      fontSize={20}
                      fontWeight={700}
                      mb={10}
                      color={colors.colorTextBase}
                    >
                      {isValidMentorLevel
                        ? // @ts-ignore
                          `${plan?.prices[mentorLevel]?.toLocaleString()} ${plan?.currency?.symbol} (${packageDataInDollars?.[index]?.prices[mentorLevel]} USD) `
                        : 'N/A'}
                    </CustomText>
                    <div>
                      {packageDummyData[index].perks.map((perk, index) => (
                        <CustomText
                          key={index + perk}
                          mb={6}
                          fontSize={16}
                          color={colors.colorTextSecondary}
                        >
                          <TickIcon /> &nbsp; {perk}
                        </CustomText>
                      ))}
                    </div>
                    <CustomText
                      fontSize={14}
                      mt={12}
                      color={colors.colorTextTertiary}
                    >
                      Total estimated hours: {(plan?.minutes ?? NaN) / 60}
                    </CustomText>
                  </div>
                  <CustomButton
                    type="primary"
                    mt={24}
                    onClick={() =>
                      handleBuyPackage(
                        plan?.id ?? '',
                        isValidMentorLevel ? plan?.prices[mentorLevel] : 0,
                        // @ts-ignore
                        plan.currency.name
                      )
                    }
                  >
                    Select Package
                  </CustomButton>
                </div>
              ))}
          </div>
        )}
      </div>
    </CustomModal>
  );
}

const packageDummyData = [
  {
    title: 'Full Guidance Package',
    desc: 'Comprehensive support for your university application journey',
    price: 0,
    perks: [
      '4 individual sessions (60 minutes each)',
      'Comprehensive application review',
      'Essay editing and feedback',
      'AI-major match (20 times)',
    ],
    time: ' 4',
  },
  {
    title: 'Intensive Course',
    desc: 'Complete end-to-end application support and strategy',
    price: 0,
    perks: [
      '8 individual sessions (60 minutes each)',
      'Full application strategy',
      'Mock interviews',
      'Complete essay development',
      'AI-major match (30 times)',
    ],
    time: ' 8',
  },
];
