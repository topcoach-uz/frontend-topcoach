import { message } from 'antd';
import { useForm } from 'antd/es/form/Form';
import dayjs, { Dayjs } from 'dayjs';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

dayjs.extend(weekday);
dayjs.extend(localeData);

interface Props {
  handleModalClose: () => void;
  bookingInfo?: IHandleBookArgs | null;
}

export default function useBookModal({ handleModalClose, bookingInfo }: Props) {
  const colors = useColors();
  const navigate = useNavigate();
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
    return !filteredSessions?.some((date) =>
      dayjs(date?.date).isSame(current, 'day')
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

      // if the last mentor level is probono, book without payment
      if (mentorData?.mentorProfile?.level === MentorExperienceLevel.Probono) {
        bookSession({
          id: sessionData.chosenIntervalId.value,
          comment: form.getFieldValue('reason'),
        })
          .unwrap()
          .then(() => {
            message.success('Session booked successfully');
            handleModalClose();
          })
          .catch((err) => {
            message.error(err.data.message);
          });

        return;
      }

      if (
        mentorBalance?.totalMinutes &&
        // @ts-ignore
        mentorBalance?.totalMinutes - mentorBalance?.usedMinutes >= 60
      ) {
        bookSession({
          id: sessionData.chosenIntervalId.value,
          comment: form.getFieldValue('reason'),
        })
          .unwrap()
          .then(() => {
            message.success('Session booked successfully');
            handleModalClose();
          })
          .catch((err) => {
            message.error(err.data.message);
          });

        return;
      }

      navigate(
        // @ts-ignore
        `/payment?mentorId=${mentorData?.id}&sessionId=${sessionData.chosenIntervalId.value}&buyType=${PaymentTypeEnum.Individual}&${searchParams.toString()}`
      );
    }

    if (!sessionData) {
      message.warning('Please select a session before proceeding.');
      return;
    }
  };

  // Handle date change
  const handleDateChange = (date: Dayjs | null) => {
    if (!date) return;
    // If date is null, don't update the state
    const isToday = date.isSame(dayjs(), 'day');
    let selectedDaySessions = filteredSessions?.filter((session: any) =>
      dayjs(session.date).isSame(dayjs(date), 'day')
    );

    if (isToday) {
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

    // Session dates
    filteredSessions,
    bookSessionLoading,

    // Question input
    form,
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
