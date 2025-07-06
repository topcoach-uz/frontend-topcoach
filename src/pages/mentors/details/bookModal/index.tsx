import { Button, Flex, Modal, Steps } from 'antd';
import React, { SetStateAction } from 'react';
import { CustomCard } from 'src/components/cards';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { IHandleBookArgs } from '..';
import IntervalPicker from './_components/IntervalPicker';
import SessionInfo from './_components/sessionInfo';
import styles from './book_modal.module.scss';
import BookingCalendar from './calendar';
import useBookModal from './useBookModal';
import { useTranslation } from 'react-i18next';

interface Props {
  modalOpen: boolean;
  setModalOpen: React.Dispatch<SetStateAction<boolean>>;
  bookingInfo: IHandleBookArgs | null;
  handleClose: () => void;
}

const { Step } = Steps;

function BookModal({
  modalOpen,
  setModalOpen,
  bookingInfo,
  handleClose,
}: Props) {
  const {
    // Interval related
    handleIntervalChange,
    chosenInterval,

    // Timezone
    selectedTimezone,
    setSelectedTimezone,
    timezones,

    // Step related
    handleStepChange,
    step,
    setStep,
    CustomProgressDot,
    handleOk,

    //datepicker date
    disabledDate,
    handleDateChange,
    // availableIntervals,
    sessionData,

    // Question
    form,

    bookSessionLoading,
    usageData,
    usageLoading,
    QuotaExceededModal,
  } = useBookModal({
    handleModalClose: handleClose,
    bookingInfo,
  });
  const { screenSize } = useScreenSize();

  const handleCancel = () => {
    setModalOpen(false);
    setStep(0);
  };
  const { t } = useTranslation();

  return (
    <Modal
      open={modalOpen}
      onCancel={handleCancel}
      title={`Book a ${bookingInfo?.name?.toLowerCase() ?? 'session'} `}
      okText={step === 0 ? t('btn.continue') : t('btn.book')}
      onOk={handleOk}
      width={'max-content'}
      destroyOnClose={true}
      okButtonProps={{ loading: bookSessionLoading }}
      footer={(_, { CancelBtn, OkBtn }) => (
        <Flex justify="space-between">
          <CancelBtn></CancelBtn>
          <Button
            disabled={step === 0}
            type="default"
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
          <OkBtn />
        </Flex>
      )}
    >
      {/* Quota display */}
      {!usageLoading && usageData && usageData.usage && (
        <div style={{ marginBottom: 16 }}>
          <b>Your included session quota this month:</b>
          <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
            {['juniorCoachSessions', 'proBonoSessions', 'seniorCoachSessions'].map((feature) => {
              const u = usageData.usage.find((x: any) => x.feature === feature);
              if (!u) return null;
              return (
                <li key={feature} style={{ color: u.used >= u.limit ? '#b02a37' : '#2e7d32', fontWeight: 500 }}>
                  {feature === 'juniorCoachSessions' && 'Junior Coach Sessions'}
                  {feature === 'proBonoSessions' && 'Pro Bono Sessions'}
                  {feature === 'seniorCoachSessions' && 'Senior Coach Sessions'}
                  : {u.limit - u.used} left (used {u.used} of {u.limit})
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <CustomCard bordered shadowed={false}>
        <Steps
          progressDot={CustomProgressDot}
          onChange={handleStepChange}
          current={step}
          direction="horizontal"
          responsive={false}
          style={{
            width: screenSize > 460 ? 220 : 190,
            margin: '0 auto',
          }}
        >
          <Step className={styles.individual_step} />
          <Step className={styles.individual_step} />
        </Steps>
        {step === 0 ? (
          <>
            <BookingCalendar
              date={sessionData.date}
              // setDate={setDate}
              handleDateChange={handleDateChange}
              selectedTimezone={selectedTimezone}
              setSelectedTimezone={setSelectedTimezone}
              timezoneOptions={timezones}
              disabledDate={disabledDate}
            />
          </>
        ) : step === 1 ? (
          <Flex vertical={screenSize < 768} gap={16}>
            <Flex vertical gap={16}>
              <SessionInfo
                bookingInfo={bookingInfo}
                chosenInterval={chosenInterval}
                date={sessionData.date}
                timezoneOptions={timezones}
                selectedTimezone={selectedTimezone}
                form={form}
              />
            </Flex>
            <IntervalPicker
              chosenInterval={sessionData.chosenIntervalId}
              intervals={sessionData.availableIntervals}
              handleIntervalChange={handleIntervalChange}
            />
          </Flex>
        ) : (
          ''
        )}
      </CustomCard>
      {QuotaExceededModal}
    </Modal>
  );
}

export default BookModal;
