import { message, Modal, Button } from 'antd';
import { useForm } from 'antd/es/form/Form';
import dayjs, { Dayjs } from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MentorExperienceLevel } from 'src/app/api/Api';
import { useBookSessionMutation } from 'src/app/services/sessions';
import { useTypedSelector } from 'src/app/store';
import { IBaseOption } from 'src/app/type';
import useParamsHook from 'src/hooks/params';
import useColors from 'src/hooks/useColors';
import { useScreenSize } from 'src/hooks/useScreenSize';
import useTimezone from 'src/hooks/useTimezone';
import { PaymentTypeEnum } from 'src/pages/payment/sms';
import { IHandleBookArgs } from '..';
import { useGetSubscriptionUsageQuery } from 'src/app/services/api';
import { useGetPlansQuery } from 'src/app/services/mentors';

dayjs.extend(weekday);
dayjs.extend(localeData);

interface Props {
  handleModalClose: () => void;
  bookingInfo?: IHandleBookArgs | null;
}

export default function useBookModal({ handleModalClose, bookingInfo }: Props) {
  const colors = useColors();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const splittedPathname = pathname.split('/');
  const mentorId = splittedPathname[splittedPathname.length - 1].split('?')[0];
  const { balance: mentorBalance, lastMentorData: mentorData } =
    useTypedSelector((state) => state.mentor);

  const [form] = useForm();

  // Timezone
  const { selectedTimezone, setSelectedTimezone, timezones } = useTimezone();
  const [date, setDate] = useState<Dayjs | null>(null);
  const { searchParams } = useParamsHook();
  const [bookSession, { isLoading: bookSessionLoading }] =
    useBookSessionMutation();

  // Interval
  const [chosenInterval, setChosenInterval] = useState<IBaseOption>({
    value: '',
    label: '',
  });

  useEffect(() => {
    setChosenInterval({ label: '', value: '' });
    setDate(dayjs(new Date()));
  }, [selectedTimezone]);

  // Step related stuff
  const [step, setStep] = useState<number>(0);

  const handleStepChange = () => {
    setStep(step + 1);
  };

  // datepicker data

  const sessionDate = mentorData?.sessionStats?.upcomingSessions;

  const filteredSessions = sessionDate?.filter(
    (session) => session.type === bookingInfo?.planType
  );

  const disabledDate = (current: any) => {
    // Disable past dates
    if (current.isBefore(dayjs(), 'day')) {
      return true;
    }
    
    // Disable dates that don't have available sessions
    return !filteredSessions?.some((session) =>
      dayjs(session?.date).isSame(current, 'day')
    );
  };

  // State to manage date, intervals, and chosen interval
  const [sessionData, setSessionData] = useState<{
    date: Dayjs | null;
    availableIntervals: { label: string; value: any }[];
    chosenIntervalId: any;
  }>({
    date: null,
    availableIntervals: [],
    chosenIntervalId: null,
  });

  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: usageData, isLoading: usageLoading, refetch: refetchUsage } = useGetSubscriptionUsageQuery(undefined, { skip: !isAuthenticated });
  const { data: plans } = useGetPlansQuery();

  // Temporarily disabled - rethinking subscription plans
  const [quotaModalVisible, setQuotaModalVisible] = useState(false);
  const [quotaSessionId, setQuotaSessionId] = useState<string | null>(null);

  const handleOk = async () => {
    if (step === 0) {
      if (sessionData.date === null) {
        message.error('Please select a date to continue.');
        return;
      }
      setStep(step + 1);
    } else if (step === 1) {
      if (sessionData.chosenIntervalId.value === '') {
        message.error('Please select a time slot.');
        return;
      }

      if (!form.getFieldValue('reason')) {
        form.setFields([
          {
            name: 'reason',
            errors: ['Please, answer the question to book a session.'],
          },
        ]);
        return;
      }

      // Temporarily disabled - bypassing quota checks, going directly to payment
      // OLD CODE - quota checking logic (commented out for future use)
      // Refetch usage before booking for extra robustness
      // const usageResult = await refetchUsage();
      // const latestUsage = usageResult.data?.usage;
      // Optionally, check quota for the session type here
      // (Assume session type is available as bookingInfo.planType or similar)
      // let feature = '';
      // const mentorLevel = (bookingInfo as any)?.mentorLevel;
      // if (mentorLevel && mentorLevel.toLowerCase?.() === MentorExperienceLevel.Probono.toLowerCase?.()) feature = 'proBonoSessions';
      // else if (bookingInfo?.planType === 'individual30m') feature = 'juniorCoachSessions';
      // else if (bookingInfo?.planType === 'individual60m') feature = 'seniorCoachSessions';
      // if (feature && latestUsage) {
      //   const u = latestUsage.find((x: any) => x.feature === feature);
      //   if (u && u.used >= u.limit) {
      //     setQuotaSessionId(sessionData.chosenIntervalId.value);
      //     setQuotaModalVisible(true);
      //   return;
      //   }
      // }

      // Book session and handle payment logic
      // If payment is required, redirect directly to payment page (bypassing quota modal)
      bookSession({
        id: sessionData.chosenIntervalId.value,
        comment: form.getFieldValue('reason'),
      })
        .unwrap()
      .then((res: any) => {
        if (res && res.paymentRequired) {
          const mentorLevel = mentorData?.mentorProfile?.level;
          
          // For pro bono mentors, never redirect to payment - show error instead
          if (mentorLevel && mentorLevel.toLowerCase() === 'probono') {
            message.error(res.message || 'Unable to book this pro bono session. Please try again later.');
            return;
          }
          
          // Directly redirect to payment, bypassing quota modal (only for non-pro bono mentors)
          if (sessionData.chosenIntervalId.value && bookingInfo?.planId && mentorData && plans) {
            const plan = plans.find(p => p.id === bookingInfo.planId);
            
            if (plan && mentorLevel && plan.prices && mentorLevel !== 'probono') {
              const sessionAmount = (plan.prices as any)[mentorLevel];
              
              // Determine currency based on amount size and plan currency
              let currency = (plan.currency as any)?.name;
              if (!currency) {
                currency = sessionAmount > 1000 ? 'UZS' : 'USD';
              }
              
              // Build payment URL with all required params including amount
              const params = new URLSearchParams();
              params.set('mentorId', mentorId);
              params.set('sessionId', sessionData.chosenIntervalId.value);
              params.set('planId', bookingInfo.planId);
              params.set('amount', sessionAmount.toString());
              params.set('currencyName', currency);
              params.set('buyType', bookingInfo?.planType || 'individual');
              
              navigate(`/payment?${params.toString()}`);
              handleModalClose();
              return;
            } else {
              // Fallback without amount (will be calculated on payment page)
              const params = new URLSearchParams();
              params.set('mentorId', mentorId);
              params.set('sessionId', sessionData.chosenIntervalId.value);
              params.set('planId', bookingInfo.planId);
              params.set('buyType', bookingInfo?.planType || 'individual');
              navigate(`/payment?${params.toString()}`);
              handleModalClose();
              return;
            }
          }
        }
        // OLD CODE - quota modal handling (commented out for future use)
        // if (res && res.paymentRequired) {
        //   setQuotaSessionId(sessionData.chosenIntervalId.value);
        //   setQuotaModalVisible(true);
        //   return;
        // }
        message.success('Session booked successfully');
        handleModalClose();
      })
      .catch((err) => {
        if (err?.data?.error === 'PROFILE_REQUIREMENTS_NOT_MET') {
          // Modal is now handled globally, just return
          return;
        }
        message.error(err.data?.message || 'Booking failed.');
      });
      return;
    }

    if (!sessionData) {
      message.warning('Please select a session before proceeding.');
      return;
    }
  };

  // Handle panel change (month/year navigation)
  const handlePanelChange = (value: Dayjs, mode: any) => {
    console.log('Panel changed to:', value.format('YYYY-MM-DD'), mode);
    // Allow navigation to any month/year
  };

  // Handle date change
  const handleDateChange = (date: Dayjs | null) => {
    if (!date) return;
    // If date is null, don't update the state
    const isToday = date.isSame(dayjs(), 'day');
    const isPast = date.isBefore(dayjs(), 'day');
    
    let selectedDaySessions = filteredSessions?.filter((session: any) =>
      dayjs(session.date).isSame(dayjs(date), 'day')
    );

    // Filter out past sessions - both for past dates and past times on today
    if (isPast) {
      // For past dates, no sessions should be available
      selectedDaySessions = [];
    } else if (isToday) {
      // For today, only show sessions that are in the future
      selectedDaySessions = selectedDaySessions?.filter((session: any) =>
        dayjs(session.date).isAfter(dayjs())
      );
    }

    const intervals =
      selectedDaySessions?.map((item: any) => ({
        // format the date to local time
        label: `${dayjs(item.date).format('HH:mm')}`,
        value: item.id,
      })) ?? [];

    if (intervals.length === 1) {
      setChosenInterval(intervals[0]);
      setSessionData({
        date,
        availableIntervals: intervals,
        chosenIntervalId: intervals[0],
      });
      return;
    }

    setSessionData({
      date,
      availableIntervals: intervals,
      chosenIntervalId: null,
    });
  };

  // Handle interval change
  const handleIntervalChange = (value: any) => {
    setSessionData({
      ...sessionData,
      chosenIntervalId: value,
    });
  };

  // Temporarily hidden - rethinking subscription plans
  // Custom quota exceeded modal - commented out for future use
  const QuotaExceededModal = (
    <Modal
      open={quotaModalVisible}
      onCancel={() => setQuotaModalVisible(false)}
      footer={null}
      title="Session Quota Exceeded"
      centered
    >
      <div style={{ marginBottom: 16 }}>
        <p>You have used all included sessions for your plan.</p>
        {mentorData?.mentorProfile?.level === MentorExperienceLevel.Probono ? (
          <p>Please upgrade your plan to continue.</p>
        ) : (
          <p>Please upgrade your plan or pay for this session to continue.</p>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => setQuotaModalVisible(false)}>Cancel</Button>
        <Button onClick={() => { setQuotaModalVisible(false); navigate('/'); }}>Upgrade Plan</Button>
        {mentorData?.mentorProfile?.level !== MentorExperienceLevel.Probono && (
          <Button type="primary" onClick={() => {
            setQuotaModalVisible(false);
            if (quotaSessionId && bookingInfo?.planId && mentorData && plans) {
              // Calculate amount based on mentor level and plan type
              const plan = plans.find(p => p.id === bookingInfo.planId);
              const mentorLevel = mentorData?.mentorProfile?.level;
              
              if (plan && mentorLevel && plan.prices && mentorLevel !== 'probono') {
                const sessionAmount = (plan.prices as any)[mentorLevel];
                
                // Determine currency based on amount size and plan currency
                let currency = (plan.currency as any)?.name;
                if (!currency) {
                  // If no currency specified, determine based on amount size
                  // Large amounts (>1000) are likely UZS, smaller amounts are likely USD
                  currency = sessionAmount > 1000 ? 'UZS' : 'USD';
                }
                
                // Dynamically build payment URL with all required params including amount
                const params = new URLSearchParams();
                params.set('mentorId', mentorId);
                params.set('sessionId', quotaSessionId);
                params.set('planId', bookingInfo.planId);
                params.set('amount', sessionAmount.toString());
                params.set('currencyName', currency);
                params.set('buyType', bookingInfo?.planType || 'individual');
                
                console.log('Quota exceeded payment URL params:', {
                  mentorId,
                  sessionId: quotaSessionId,
                  planId: bookingInfo.planId,
                  amount: sessionAmount,
                  currency,
                  planType: bookingInfo?.planType
                });
                
                navigate(`/payment?${params.toString()}`);
              } else {
                // Fallback without amount (will be calculated on payment page)
                const params = new URLSearchParams();
                params.set('mentorId', mentorId);
                params.set('sessionId', quotaSessionId);
                params.set('planId', bookingInfo.planId);
                params.set('buyType', bookingInfo?.planType || 'individual');
                navigate(`/payment?${params.toString()}`);
              }
            }
          }}>
            Pay for This Session
          </Button>
        )}
      </div>
    </Modal>
  );

  return {
    colors,
    // timezone
    timezones,
    selectedTimezone,
    setSelectedTimezone,
    date,
    setDate,

    // Interval
    chosenInterval,
    handleIntervalChange,

    // Step related stuff
    step,
    setStep,
    handleStepChange,
    CustomProgressDot,
    handleOk,

    // datepicker data
    disabledDate,
    sessionData,
    handleDateChange,
    handlePanelChange,

    // Session dates
    filteredSessions,
    bookSessionLoading,

    // Question input
    form,

    usageData,
    usageLoading,

    QuotaExceededModal,
  };
}

// Function to generate time intervals based on timezone
// const generateIntervals = (start: number, end: number, gmtOffset: number) => {
//   let newIntervals = [];
//   for (let hour = start; hour < end; hour++) {
//     let localHourStart = (hour + gmtOffset + 24) % 24; // Convert to local timezone
//     let localHourEnd = (hour + gmtOffset + 1 + 24) % 24;

//     newIntervals.push({
//       value: `${localHourStart}-${localHourEnd}`,
//       label: `${String(localHourStart).padStart(2, '0')}:00 - ${String(localHourEnd).padStart(2, '0')}:00`,
//     });
//   }

//   return newIntervals;
// };

const CustomProgressDot = (dot: any, { status }: any) => {
  const colors = useColors();
  const { screenSize } = useScreenSize();

  return (
    <div
      style={{
        width: screenSize > 460 ? 140 : 100,
        height: '4px',
        position: 'relative',
        left: screenSize > 460 ? -35 : -20,
        backgroundColor:
          status === 'process' || status === 'finish'
            ? colors.colorPrimary
            : colors.colorBorder,
        borderRadius: '2px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    ></div>
  );
};
