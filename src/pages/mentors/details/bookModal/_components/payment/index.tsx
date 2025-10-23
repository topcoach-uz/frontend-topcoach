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
      title="Choose Your Session"
      onCancel={handleClosePayment}
      width={900}
    >
      <div className={styles.content}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <CustomText 
            color={colors.colorTextSecondary}
            fontSize={16}
            style={{ lineHeight: '1.5' }}
          >
            Select the session duration that works best for you
          </CustomText>
        </div>
        <IndividualSessionsTab
          handleBook={handleBook}
          handleChangeTab={handleTabChange}
        />
      </div>
    </CustomModal>
  );
}
