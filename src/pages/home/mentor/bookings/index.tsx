import {
  Button,
  DatePicker,
  DatePickerProps,
  Form,
  message,
  Segmented,
  TimePicker,
} from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useState } from 'react';
import { api } from 'src/app/api';
import { SessionTypeEnum } from 'src/app/api/Api';
import { setHasGoogleCredentials } from 'src/app/slices/authSlice';
import { useAppDispatch, useTypedSelector } from 'src/app/store';
import { CustomCard } from 'src/components/cards';
import { CustomModal, CustomTabs, CustomText } from 'src/components/common';
import CustomSelect from 'src/components/common/select';
import { PlusIcon } from 'src/components/icons';
import useColors from 'src/hooks/useColors';
import styles from './bookings.module.scss';
import useBookings from './useBookings';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { scopes } from '../_components/profile_status/useProfileStatus';
import { useLinkCalendarMutation } from 'src/app/services/users';
import { isProduction } from 'src/utils';
import { sendErrorToTelegram } from 'src/utils/telegramLogger';

dayjs.extend(customParseFormat);

export default function BookingsSection() {
  const {
    activeTab,
    tabItems,
    mainTab,
    mainTabOptions,
    isLoading,
    handleTabsChange,
    setMainTab,
    refetch,
  } = useBookings();
  const colors = useColors();
  const { t } = useTranslation();

  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const getMe = useTypedSelector((state) => state.auth.profile);
  const dispatch = useAppDispatch();
  const [linkCalendar] = useLinkCalendarMutation();

  const mentorStatus = getMe?.mentorProfile?.status;
  const googleCalendarConnected = getMe?.hasGoogleCredentials;

  const handleAddSession = async (sessionData: {
    type: SessionTypeEnum;
    date: string;
  }) => {
    setLoading(true);
    console.log('api sessions');
    api.sessions
      .createSession(sessionData)
      .then((res) => {
        setShowModal(false);
        refetch(); // refetch the data
        message.success('Session added successfully');
      })
      .catch((err) => {
        if (err.response.data.statusCode === 401) {
          dispatch(setHasGoogleCredentials(false));
          login();
          message.error('Please connect your Google Calendar to add sessions');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const login = useGoogleLogin({
    scope: scopes,
    // prompt: 'consent',
    flow: 'auth-code',
    redirect_uri: 'https://topcoach.uz/api/auth/google/callback',
    onSuccess: (tokenResponse) => {
      tokenResponse.code;
      const code = tokenResponse.code;
      linkCalendar({ authCode: code })
        .unwrap()
        .then(() => {
          message.success('Google Calendar connected successfully');
          dispatch(setHasGoogleCredentials(true));
        })
        .catch((err) => {
          message.error(err.data.message);
          if (isProduction()) {
            sendErrorToTelegram(err);
          }
        });
    },
    onError: (error) => console.log(error),
  });

  const onCompleted = () => {
    form.validateFields().then((values) => {
      const { type, date, time } = values;

      const dateTime = dayjs(
        `${date.format('YYYY-MM-DD')}T${time.format('HH:mm:ss.SSS')}`
      );

      handleAddSession({
        type,
        date: dateTime.format(),
      });
    });
  };

  // Modal
  const handleShowModal = () => {
    if (isAddSessionButtonDisabled()) return;
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleOk = () => {
    onCompleted();
  };

  // if google calendar is not connected or mentor status is pending, then disable the button
  const isAddSessionButtonDisabled = () => {
    if (!googleCalendarConnected) {
      message.error(t('homeMentor.mustConnectGoogleCalendar'), 5);
      return true;
    } else if (mentorStatus == 'pending') {
      message.error(t('homeMentor.mustBeApproved'), 5);
      return true;
    } else {
      return false;
    }
  };

  return (
    <div className={'container ' + styles.bookings}>
      <CustomText
        fontSize={32}
        fontWeight={600}
        color={colors.colorTextBase}
        lineHeight="38px"
        mb={4}
      >
        {t('homeMentor.upcomingBookings')}
      </CustomText>
      <CustomText
        fontSize={16}
        fontWeight={400}
        mb={24}
        lineHeight="22px"
        color={colors.colorTextSecondary}
      >
        {t('homeMentor.upcomingBookingsDescription')}
      </CustomText>
      <CustomCard
        className={styles.card_wrapper}
        padding={24}
        borderRadius={24}
        shadowed={false}
      >
        <div className={styles.main_tab_wrapper}>
          <Segmented
            value={mainTab}
            onChange={setMainTab}
            rootClassName={styles.main_tab}
            options={mainTabOptions}
          />
          <Button
            className={styles.add_session_button}
            type="primary"
            icon={<PlusIcon />}
            onClick={handleShowModal}
          >
            {t('homeMentor.addSessionButton')}
          </Button>
        </div>
        <CustomTabs
          activeKey={activeTab}
          items={tabItems}
          onChange={handleTabsChange}
        />
      </CustomCard>
      <CustomModal
        title={t('homeMentor.addSession')}
        open={showModal}
        onOk={handleOk}
        okButtonProps={{ loading }}
        onCancel={handleCloseModal}
        footer
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('homeMentor.sessionType')}
            name="type"
            rules={[
              { required: true, message: 'Please, choose your meeting type' },
            ]}
            required={true}
          >
            <CustomSelect
              style={{ width: '100%', height: 40 }}
              placeholder={t('homeMentor.sessionTypePlaceholder')}
              options={[
                {
                  label: t('homeMentor.session30Min'),
                  value: SessionTypeEnum.Individual30M,
                },
                {
                  label: t('homeMentor.session60Min'),
                  value: SessionTypeEnum.Individual60M,
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={t('homeMentor.sessionDate')}
            name={'date'}
            rules={[{ required: true, message: 'Please, choose your date' }]}
            required={true}
          >
            <DatePicker
              placeholder={t('homeMentor.sessionDatePlaceholder')}
              disabledDate={(date) => {
                if (date.endOf('day').valueOf() < dayjs().valueOf()) {
                  return true;
                } else {
                  return false;
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label={t('homeMentor.sessionTime')}
            name="time"
            rules={[{ required: true, message: 'Please, choose your time' }]}
            required={true}
          >
            <TimePicker
              format="HH:mm"
              placeholder={t('homeMentor.sessionTimePlaceholder')}
            />
          </Form.Item>
        </Form>
      </CustomModal>
    </div>
  );
}
