import { Dropdown, Form, Input, MenuProps, message, Rate } from 'antd';
import dayjs from 'dayjs';
import { Brodcast } from 'iconsax-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SessionsSchema, SessionTypeEnum, UserRole } from 'src/app/api/Api';
import {
  useCancelSessionAsStudentMutation,
  useCancelSessionMutation,
} from 'src/app/services/sessions';
import { useTypedSelector } from 'src/app/store';
import { GoogleMeetingSvg, RightUpSvg, ThreeDotsSvg } from 'src/assets/svg';
import { CustomCard } from 'src/components/cards';
import { CustomButton, CustomModal, CustomText } from 'src/components/common';
import styles from './upcoming.module.scss';

import {
  useRateSessionMutation,
  useReportSessionMutation,
} from 'src/app/services/sessions';
import { useGetMeQuery } from 'src/app/services/users';

interface UpcomingCardProps extends SessionsSchema {
  id: string;
  time?: string;
  duration?: number;
  onCancelOk?: (id: string) => void;
  cancelCheck?: boolean;
  reportCheck?: boolean;
  detailCheck?: boolean;
  rateCheck?: boolean;
  dropdownVisible?: boolean;
}

export default function UpcomingCard({
  id,
  date,
  time,
  onCancelOk,
  cancelCheck = true,
  reportCheck = true,
  detailCheck = false,
  rateCheck = true,
  dropdownVisible = true,
  calendarInfo,
  comments,
  mentor,
  participants,
  type,
  duration,
}: UpcomingCardProps) {
  const { colors } = useTypedSelector((state) => state.layout);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isDetailModalVisible, setIsDetailModalVisible] =
    useState<boolean>(false);
  const [isModalVisibleReport, setIsModalVisibleReport] =
    useState<boolean>(false);
  const [isModalVisibleRate, setIsModalVisibleRate] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const [cancelSession, { isLoading }] = useCancelSessionMutation();
  const [cancelAsStudent, { isSuccess: cancelAsStudentSuccess }] =
    useCancelSessionAsStudentMutation();
  const [reportMentor] = useReportSessionMutation();

  const [rateSession, { isLoading: rateLoading }] = useRateSessionMutation();
  const { t } = useTranslation();

  const [form] = Form.useForm();
  const role = useTypedSelector((state) => state.auth.profile?.profile?.role);

  useGetMeQuery(undefined, { skip: !cancelAsStudentSuccess });

  const menuItems: MenuProps['items'] = [
    {
      label: t('homeMentor.rateMeeting'),
      key: '1',
      className:
        role == UserRole.Student && rateCheck ? '' : styles.displayNone,
      onClick: () => {
        setIsModalVisibleRate(true);
      },
    },
    {
      label: (
        <div>
          {role === UserRole.Mentor
            ? t('homeMentor.reportMentee')
            : t('homeMentor.reportMentor')}
        </div>
      ),
      key: '2',
      className: reportCheck ? '' : styles.displayNone,
      onClick: () => {
        setIsModalVisibleReport(true);
      },
    },
    {
      label: (
        <div style={{ color: colors.colorError }}>
          {role === UserRole.Mentor
            ? 'Cancel meeting'
            : 'Withdraw from the meeting'}
        </div>
      ),
      key: '3',
      className: cancelCheck ? '' : styles.displayNone,
      onClick: () => {
        setIsModalVisible(true);
      },
    },
    {
      label: t('homeMentor.reasonForBooking'),
      key: '4',
      className: detailCheck ? '' : styles.displayNone,
      onClick: () => {
        setIsDetailModalVisible(true);
      },
    },
  ];

  // modals
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleCancelReport = () => {
    setIsModalVisibleReport(false);
  };

  const handleCancelRate = () => {
    setIsModalVisibleRate(false);
  };

  const handleDetails = () => {
    setIsDetailModalVisible(true);
  };

  const handleCancelDetails = () => {
    setIsDetailModalVisible(false);
  };

  //report meeting
  const [selectedReportReason, setSelectedReportReason] = useState<string>('');
  const handleReportMeeting = async () => {
    console.log('report send');
    try {
      await form.validateFields(); // runs validator inside Form.Item
    } catch {
      return;
    }

    const values = form.getFieldsValue();
    // @ts-ignore
    const subjectId = mentor?.id;
    const finalReport = selectedReportReason;
    const finalComment = values.reportText;

    if (!finalReport) {
      message.warning('Please select a reason');
      return;
    }

    setLoading(true);

    try {
      await reportMentor({
        subjectId,
        reasons: [finalReport],
        comment: finalComment,
      });
      setIsModalVisibleReport(false);
      setSelectedReportReason('');
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  // cancel meeting
  const [selectedReason, setSelectedReason] = useState<string>('');

  const handleCancelMeeting = async () => {
    try {
      await form.validateFields(); // runs validator inside Form.Item
    } catch {
      return;
    }

    const formValues = form.getFieldsValue();
    const finalReason =
      selectedReason === 'Other' ? formValues.customReason : selectedReason;

    if (!finalReason) {
      message.warning('Please select a reason');
      return;
    }

    setLoading(true);
    if (role === UserRole.Mentor) {
      cancelSession({ id, reason: finalReason })
        .then((res: any) => {
          if (res?.error?.status) {
            throw res?.error?.data?.message;
          }
          message.success('Meeting canceled successfully');

          if (onCancelOk) {
            onCancelOk(id);
          }

          setIsModalVisible(false);
          setSelectedReason('');
          form.resetFields();
        })
        .catch((error) => {
          message.error(error || 'Something went wrong');
          setIsModalVisible(false);
          throw error; // Propagate error for finally block
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (role === UserRole.Student) {
      cancelAsStudent({ id, comment: finalReason })
        .then((res: any) => {
          if (res?.error?.status) {
            throw res?.error?.data?.message;
          }
          message.success('You have withdrawn from the session');

          if (onCancelOk) {
            onCancelOk(id);
          }

          setIsModalVisible(false);
          setSelectedReason('');
          form.resetFields();
        })
        .catch((error) => {
          message.error(error || 'Something went wrong');
          setIsModalVisible(false);
          throw error; // Propagate error for finally block
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  // rate meeting
  const handleRateMeeting = async () => {
    try {
      await form.validateFields(); // runs validator inside Form.Item
    } catch {
      return;
    }

    const formValues = form.getFieldsValue();
    const finalReason = formValues.rateText;

    setLoading(true);
    try {
      await rateSession({ id, rating: 4, comment: 'test' });
      message.success('Meeting rated successfully');

      if (onCancelOk) {
        onCancelOk(id);
      }

      setIsModalVisibleRate(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Something went wrong');
      setIsModalVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const sessionStartTime = dayjs(date);
  const sessionEndTime = sessionStartTime.add(duration || 60, 'minute'); // Default duration is 60 minutes

  // const isMeetingNow =
  //   dayjs().isAfter(sessionStartTime) && dayjs().isBefore(sessionEndTime);

  const handleMentorNameClick = () => {
    if (role === UserRole.Student) {
      // @ts-ignore
      navigate(`/mentors/${mentor?.id}`);
    }
  };

  const handleLinkClick = () => {
    window.open(calendarInfo?.meetingLink, '_blank');
  };
  return (
    <CustomCard
      padding={16}
      borderRadius={8}
      className={styles.upcoming}
      bordered
      shadowed={false}
    >
      <div className={styles.top}>
        <div className={styles.meeting}>
          <GoogleMeetingSvg />

          <>
            <div className={styles.link}>
              <CustomButton
                icon={<RightUpSvg />}
                iconPosition="end"
                color={colors.colorLink}
                type="link"
                onClick={handleLinkClick}
              >
                {t('home.joinSession')}
              </CustomButton>
            </div>
            <Brodcast size="24" color={colors.green6} />
          </>
        </div>
        {dropdownVisible && (
          <Dropdown menu={{ items: menuItems }}>
            <CustomButton
              className={styles.dots}
              size="small"
              icon={<ThreeDotsSvg color={colors.colorText} />}
            />
          </Dropdown>
        )}
      </div>
      <div className={styles.meetingInfo}>
        <CustomText
          fontSize={20}
          fontWeight={600}
          color={colors.colorText}
          mt={16}
        >
          {dayjs(date).format('MMMM Do, YYYY')}
        </CustomText>
        <CustomText
          fontSize={14}
          fontWeight={400}
          mt={4}
          color={colors.colorTextDescription}
        >
          {dayjs(date).format('h:mm A')}
        </CustomText>
      </div>
      <div className={styles.bottom}>
        <CustomText
          fontSize={16}
          color={colors.colorTextSecondary}
          style={{ display: 'block' }}
        >
          {type === SessionTypeEnum.Individual30M ? '30' : '60'} min meeting{' '}
          {role === UserRole.Mentor ? '' : 'with'}
        </CustomText>
        <CustomButton
          style={{ padding: 0, border: 0 }}
          type="link"
          color={colors.colorLink}
          onClick={handleMentorNameClick}
        >
          {/* @ts-ignore */}
          {role === UserRole.Mentor
            ? // @ts-ignore
              participants?.[0]?.profile?.name
            : // @ts-ignore
              mentor?.profile?.name}
        </CustomButton>
      </div>

      {/* Cancel meeting */}
      <CustomModal
        title={
          UserRole.Mentor == role
            ? t('homeMentor.cancelMeeting')
            : t('home.withdrawFromMeeting')
        }
        open={isModalVisible}
        onOk={handleCancelMeeting}
        onCancel={handleCancel}
        okButtonProps={{ loading: isLoading }}
        footer
      >
        <div>
          <CustomText
            fontSize={14}
            fontWeight={500}
            color={colors.colorTextSecondary}
          >
            {t('homeMentor.sessionDay')}
          </CustomText>
          <CustomText color={colors.colorText} mt={2}>
            {/* Friday, Feb 8, 10:00 - 10:30 */}
            {dayjs(date).format('dddd, MMM D, h:mm A')} -&nbsp;
            {/* The end time of the session */}
            {dayjs(date)
              .add(type === SessionTypeEnum.Individual30M ? 30 : 60, 'minute')
              .format('h:mm A')}
          </CustomText>
        </div>
        <div style={{ marginTop: '24px' }}>
          <CustomText mb={4}>Reason</CustomText>
          <div className={styles.reasons}>
            {dataReasons.map((reason, index) => (
              <div
                className={`${styles.reason} ${selectedReason === reason ? styles.active : ''}`}
                key={index + reason}
                onClick={() => setSelectedReason(reason)}
                style={{
                  cursor: 'pointer',
                  border:
                    selectedReason === reason
                      ? `1px solid ${colors.colorPrimary}`
                      : '1px solid #e0e0e0',
                  borderRadius: 6,
                  padding: '6px 12px',
                  marginBottom: 8,
                }}
              >
                {reason}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '24px' }}>
          <Form form={form} layout="vertical">
            <CustomText mb={4}>{t('homeMentor.reasons')}</CustomText>
            <Form.Item
              name="customReason"
              rules={[
                {
                  validator: (_, value) => {
                    if (selectedReason === 'Other' && !value?.trim()) {
                      return Promise.reject(
                        'Please provide a reason for cancelling the meeting'
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input.TextArea
                placeholder={t('homeMentor.reasonPlaceholder')}
                rows={4}
                disabled={selectedReason !== 'Other'}
              />
            </Form.Item>
          </Form>
        </div>
      </CustomModal>
      {/* Report meeting */}
      <CustomModal
        title={t('homeMentor.reportMeeting')}
        open={isModalVisibleReport}
        onOk={handleReportMeeting}
        onCancel={handleCancelReport}
        footer
      >
        <div>
          <div style={{ marginBottom: '24px' }}>
            <CustomText color={colors.colorTextSecondary}>
              {role === UserRole.Mentor
                ? t('homeMentor.mentees')
                : t('homeMentor.mentor')}
            </CustomText>
            {/* @ts-ignore */}
            <CustomText>{mentor?.profile?.name}</CustomText>
          </div>
          <CustomText
            fontSize={14}
            fontWeight={500}
            color={colors.colorTextSecondary}
          >
            Session day
          </CustomText>
          <CustomText color={colors.colorText} mt={2}>
            {dayjs(date).format('dddd, MMMM D')}, {dayjs(date).format('h:mm A')}
          </CustomText>
        </div>
        <div style={{ marginTop: '24px' }}>
          <CustomText color={colors.colorTextSecondary} mb={4}>
            {t('homeMentor.reason')}
          </CustomText>
          <div className={styles.reasons}>
            {dataReasons.map((reason, index) => (
              <div
                className={`${styles.reason} ${selectedReportReason === reason ? styles.active : ''}`}
                key={index + reason}
                onClick={() => setSelectedReportReason(reason)}
                style={{
                  cursor: 'pointer',
                  border:
                    selectedReportReason === reason
                      ? `1px solid ${colors.colorPrimary}`
                      : '1px solid #e0e0e0',
                  borderRadius: 6,
                  padding: '6px 12px',
                  marginBottom: 8,
                }}
              >
                {reason}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '24px' }}>
          <Form form={form} layout="vertical">
            <CustomText mb={4}>{t('homeMentor.reasons')}</CustomText>
            <Form.Item
              name="reportText"
              // rules={[
              //   {
              //     validator: (_, value) => {
              //       if (selectedReason === 'Other' && !value?.trim()) {
              //         return Promise.reject(
              //           'Please provide a reason for cancelling the meeting'
              //         );
              //       }
              //       return Promise.resolve();
              //     },
              //   },
              // ]}
            >
              <Input.TextArea
                placeholder={t('homeMentor.mentorsReasonPlaceholder')}
                typeof="textArea"
                rows={4}
              />
            </Form.Item>
          </Form>
        </div>
      </CustomModal>

      {/* Rate meeting -=-------------------------------------------------*/}
      <CustomModal
        title="Rate meeting"
        open={isModalVisibleRate}
        onOk={handleRateMeeting}
        onCancel={handleCancelRate}
        footer
      >
        <div>
          <div style={{ marginBottom: '24px' }}>
            <CustomText>{role === 'Mentor' ? 'Mentees' : 'Mentor'}</CustomText>
            <CustomText>Xumoyunmirzo Yakubjonov</CustomText>
          </div>
          <CustomText
            fontSize={14}
            fontWeight={500}
            color={colors.colorTextSecondary}
          >
            Session day
          </CustomText>
          <CustomText color={colors.colorText} mt={2}>
            Friday, Feb 8, 10:00 - 10:30
          </CustomText>
        </div>
        <div style={{ marginTop: '24px' }}>
          <Rate />
        </div>
        <div style={{ marginTop: '24px' }}>
          <Form form={form} layout="vertical">
            <CustomText mb={4}>Reasons</CustomText>
            <Form.Item
              name="rateText"
              // rules={[
              //   {
              //     validator: (_, value) => {
              //       if (selectedReason === 'Other' && !value?.trim()) {
              //         return Promise.reject(
              //           'Please provide a reason for cancelling the meeting'
              //         );
              //       }
              //       return Promise.resolve();
              //     },
              //   },
              // ]}
            >
              <Input.TextArea
                placeholder="It looks like the mentor didn’t join the scheduled meeting."
                rows={4}
              />
            </Form.Item>
          </Form>
        </div>
      </CustomModal>
      {/* Session details */}
      <CustomModal
        open={isDetailModalVisible}
        onCancel={handleCancelDetails}
        onOk={handleDetails}
      >
        <CustomText fontSize={16} color={colors.colorText}>
          Why am I attending to this meeting
        </CustomText>
        <CustomText
          fontSize={14}
          color={colors.colorTextSecondary}
          fontWeight={500}
        >
          {Array.isArray(comments) && comments[0] === 'undefined'
            ? 'Student has not written any comments for the meeting'
            : comments}
        </CustomText>
      </CustomModal>
    </CustomCard>
  );
}

const dataReasons = [
  'I have another meeting',
  'I have an emergency',
  'I have a personal problem',
  'I have a technical problem',
  'Other',
];
