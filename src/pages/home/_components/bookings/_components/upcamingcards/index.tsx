import { App, Form, Input, MenuProps, Rate } from 'antd';
import dayjs from 'dayjs';
import { Radio } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { SessionsSchema, SessionTypeEnum, UserRole } from 'src/app/api/Api';
import {
  type AttendanceRecord,
  useCancelSessionAsStudentMutation,
  useCancelSessionMutation,
} from 'src/app/services/sessions';
import { useTypedSelector } from 'src/app/store';
import { GoogleMeetingSvg, RightUpSvg, ThreeDotsSvg } from 'src/assets/svg';
import { CustomCard } from 'src/components/cards';
import { CustomButton, CustomModal, CustomText } from 'src/components/common';
import styles from './upcoming.module.scss';
import ChatModal from 'src/components/chat/ChatModal';
import { useGetConversationsQuery, useGetThreadsQuery, useCreateThreadMutation, useFindOrCreateConversationMutation } from 'src/app/services/chat/chatApi';
import { MessageCircle } from 'lucide-react';

import {
  useRateSessionMutation,
  useReportSessionMutation,
} from 'src/app/services/sessions';
import { useGetMeQuery } from 'src/app/services/users';

interface UpcomingCardProps extends SessionsSchema {
  attendanceRecord?: AttendanceRecord | null;
  id: string;
  time?: string;
  duration?: number;
  onCancelOk?: (id: string) => void;
  cancelCheck?: boolean;
  reportCheck?: boolean;
  detailCheck?: boolean;
  rateCheck?: boolean;
  dropdownVisible?: boolean;
  hideChatButton?: boolean;
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
  hideChatButton = false,
  calendarInfo,
  comments,
  mentor,
  participants,
  type,
  duration,
  reviews,
  attendanceRecord,
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
  const { message } = App.useApp();

  const [form] = Form.useForm();
  const [rating, setRating] = useState<number>(0);
  const role = useTypedSelector((state) => state.auth.profile?.profile?.role);
  const currentUser = useTypedSelector((state) => state.auth.profile);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chat integration
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const { data: conversations, refetch: refetchConversations } = useGetConversationsQuery(undefined, {
    skip: !currentUser?.id,
  });
  const [findOrCreateConversation] = useFindOrCreateConversationMutation();
  const [createThread] = useCreateThreadMutation();

  // Find conversation for this session
  useEffect(() => {
    if (!conversations || !id || !currentUser?.id) return;

    const conversationList = Array.isArray(conversations) 
      ? conversations 
      : conversations.conversations || [];

    // Find conversation with mentor/student
    const conversation = conversationList.find((conv) => {
      if (role === UserRole.Student) {
        return conv.mentorId === (mentor as any)?.id && conv.studentId === currentUser.id;
      } else {
        return conv.mentorId === currentUser.id && conv.studentId === (participants?.[0] as any)?.id;
      }
    });

    if (conversation) {
      setConversationId(conversation.id);
    }
  }, [conversations, id, currentUser?.id, role, (mentor as any)?.id, participants]);

  // Fetch threads for the conversation to find the session thread
  const { data: threadsData, refetch: refetchThreads } = useGetThreadsQuery(conversationId || '', {
    skip: !conversationId,
  });

  useEffect(() => {
    if (!threadsData || !id) return;
    
    const threads = threadsData.threads || [];
    const thread = threads.find((t) => t.sessionId === id);
    if (thread) {
      setThreadId(thread.id);
    } else {
      setThreadId(null);
    }
  }, [threadsData, id]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Get unread count for thread
  const unreadCount = React.useMemo(() => {
    if (!threadsData || !threadId || !currentUser?.id) return 0;
    
    const threads = threadsData.threads || [];
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return 0;
    
    if (role === UserRole.Student) {
      return thread.unreadCountStudent;
    } else {
      return thread.unreadCountMentor;
    }
  }, [threadsData, threadId, currentUser?.id, role]);

  const handleChatClick = async () => {
    try {
      // For students: mentor is the session's mentor, student is current user
      // For mentors: mentor is current user, student is the participant
      const mentorId = role === UserRole.Student ? (mentor as any)?.id : currentUser?.id;
      const studentId = role === UserRole.Student ? currentUser?.id : (participants?.[0] as any)?.id;
      
      if (!mentorId || !studentId) {
        message.error('Unable to set up chat: missing user information');
        return;
      }

      let finalConversationId = conversationId;
      let finalThreadId = threadId;

      // Step 1: Find or create conversation
      if (!finalConversationId) {
        message.loading({ content: 'Setting up chat...', key: 'chat-setup' });
        
        const conversationResult = await findOrCreateConversation({
          mentorId,
          studentId,
        }).unwrap();
        
        finalConversationId = conversationResult.conversation.id;
        setConversationId(finalConversationId);
        
        // Refetch conversations to update the list
        await refetchConversations();
      }

      // Step 2: Find or create thread for this specific session
      if (finalConversationId) {
        // Refetch threads to ensure we have the latest data
        if (refetchThreads) {
          const threadsResult = await refetchThreads();
          const threads = threadsResult.data?.threads || [];
          const existingThread = threads.find((t) => t.sessionId === id);
          
          if (existingThread) {
            // Thread exists, use it
            finalThreadId = existingThread.id;
            setThreadId(finalThreadId);
          } else {
            // Thread doesn't exist, create it
            if (!threadId) {
              message.loading({ content: 'Creating session thread...', key: 'chat-setup' });
            }
            
            const threadResult = await createThread({
              conversationId: finalConversationId,
              sessionId: id,
            }).unwrap();
            
            finalThreadId = threadResult.thread.id;
            setThreadId(finalThreadId);
            
            // Refetch threads again after creating
            await refetchThreads();
          }
        } else {
          // Fallback: check existing threadsData
          const threads = threadsData?.threads || [];
          const existingThread = threads.find((t) => t.sessionId === id);
          
          if (existingThread) {
            finalThreadId = existingThread.id;
            setThreadId(finalThreadId);
          } else {
            // Create thread
            if (!threadId) {
              message.loading({ content: 'Creating session thread...', key: 'chat-setup' });
            }
            
            const threadResult = await createThread({
              conversationId: finalConversationId,
              sessionId: id,
            }).unwrap();
            
            finalThreadId = threadResult.thread.id;
            setThreadId(finalThreadId);
          }
        }
      }

      // Step 3: Open the chat modal with the specific thread
      setChatModalOpen(true);
      message.success({ content: 'Chat ready!', key: 'chat-setup' });
    } catch (error: any) {
      console.error('Error setting up chat:', error);
      message.error({ 
        content: error?.data?.message || 'Failed to set up chat. Please try again.', 
        key: 'chat-setup' 
      });
    }
  };

  // Helper function to check if current user has rated this session
  const hasUserRated = () => {
    if (!currentUser?.id || !reviews) return false;
    return reviews.some((review: any) => review.reviewer?.id === currentUser.id);
  };

  // Helper function to get user's rating for this session
  const getUserRating = () => {
    if (!currentUser?.id || !reviews) return null;
    const userReview = reviews.find((review: any) => review.reviewer?.id === currentUser.id);
    return userReview ? { rating: userReview.rating, comment: userReview.summary } : null;
  };

  useGetMeQuery(undefined, { skip: !cancelAsStudentSuccess });

  const menuItems: MenuProps['items'] = [
    {
      label: hasUserRated() ? 'View Rating' : t('homeMentor.rateMeeting'),
      key: '1',
      className:
        role == UserRole.Student && rateCheck ? '' : styles.displayNone,
      onClick: () => {
        if (hasUserRated()) {
          // Show read-only rating modal
          const userRating = getUserRating();
          if (userRating) {
            setRating(userRating.rating);
            form.setFieldsValue({ rateText: userRating.comment });
            setIsModalVisibleRate(true);
          }
        } else {
          setIsModalVisibleRate(true);
        }
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
    form.resetFields();
    setRating(0);
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
    const subjectId = (mentor as any)?.id;
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
      }).unwrap();
      message.success('Report submitted successfully');
      setIsModalVisibleReport(false);
      setSelectedReportReason('');
      form.resetFields();
    } catch (error: any) {
      message.error(error?.data?.message || 'Something went wrong');
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
        .unwrap()
        .then(() => {
          message.success('Meeting canceled successfully');

          if (onCancelOk) {
            onCancelOk(id);
          }

          setIsModalVisible(false);
          setSelectedReason('');
          form.resetFields();
        })
        .catch((error) => {
          message.error(error?.data?.message || 'Something went wrong');
          setIsModalVisible(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (role === UserRole.Student) {
      cancelAsStudent({ id, comment: finalReason })
        .unwrap()
        .then(() => {
          message.success('You have withdrawn from the session');

          if (onCancelOk) {
            onCancelOk(id);
          }

          setIsModalVisible(false);
          setSelectedReason('');
          form.resetFields();
        })
        .catch((error) => {
          message.error(error?.data?.message || 'Something went wrong');
          setIsModalVisible(false);
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
    const comment = formValues.rateText;

    // Validate rating and comment are both provided
    if (!rating || rating === 0) {
      message.warning('Please provide a rating');
      return;
    }

    if (!comment || comment.trim() === '') {
      message.warning('Please provide a comment');
      return;
    }

    setLoading(true);
    try {
      await rateSession({ id, rating, comment: comment.trim() }).unwrap();
      message.success('Meeting rated successfully');

      if (onCancelOk) {
        onCancelOk(id);
      }

      setIsModalVisibleRate(false);
      form.resetFields();
      setRating(0);
    } catch (error: any) {
      message.error(error?.data?.message || 'Something went wrong');
      setIsModalVisibleRate(false);
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
      navigate(`/mentors/${(mentor as any)?.id}`);
    }
  };

  const handleLinkClick = () => {
    window.open(calendarInfo?.meetingLink, '_blank');
  };

  const chatButtonStyle: React.CSSProperties = {
    backgroundColor: '#8b0000',
    border: '1px solid #8b0000',
    color: '#fff',
    width: '100%',
    marginTop: '8px',
    padding: '6px 14px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    fontWeight: 500,
    minHeight: 36,
  };

  // For mentors: only show "Chat with mentee" when session is booked (has a participant)
  // Hide entirely when hideChatButton (e.g. counselor view)
  const showChatButton =
    !hideChatButton &&
    (role === UserRole.Student || (role === UserRole.Mentor && participants?.length > 0));

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
            <Radio size={24} color={colors.green6} />
          </>
        </div>
        {dropdownVisible && (
          <div ref={dropdownRef} className={styles.dropdownWrap}>
            <button
              type="button"
              className={styles.dots}
              onClick={() => setDropdownOpen((o) => !o)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <ThreeDotsSvg color={colors.colorText} />
            </button>
            {dropdownOpen && (
              <div className={styles.dropdownMenu} role="menu">
                {menuItems
                  .filter(
                    (it): it is NonNullable<typeof it> & { key: string; label: React.ReactNode; onClick?: (info: any) => void } =>
                      !!it && it.className !== styles.displayNone && 'key' in it && 'label' in it
                  )
                  .map((it) => (
                    <div
                      key={it.key}
                      role="menuitem"
                      className={styles.dropdownItem}
                      onClick={() => {
                        it.onClick?.({ key: it.key, keyPath: [], domEvent: {} as any });
                        setDropdownOpen(false);
                      }}
                    >
                      {it.label}
                    </div>
                  ))}
              </div>
            )}
          </div>
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
      {attendanceRecord && <div style={{ marginTop: 12 }}>
        <strong>Lesson:</strong> {attendanceRecord.outcome.replaceAll('_', ' ')} · Attendance: {attendanceRecord.attendance === 'unknown' ? 'Not applicable' : attendanceRecord.attendance}
        {attendanceRecord.actualDurationMinutes ? ` · ${attendanceRecord.actualDurationMinutes} min` : ''}
        {attendanceRecord.sharedNotes && <p style={{ whiteSpace: 'pre-wrap' }}>{attendanceRecord.sharedNotes}</p>}
      </div>}
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
      {showChatButton && (
        <div className={styles.chatButtonContainer}>
          <ErrorBoundary
            fallbackRender={() => (
              <button
                type="button"
                className={styles.chatButtonRaw}
                title="Chat"
                style={chatButtonStyle}
              >
                <MessageCircle size={18} color="#fff" />
                <span style={{ color: '#fff' }}>Chat</span>
              </button>
            )}
          >
            <button
              type="button"
              className={styles.chatButtonRaw}
              onClick={handleChatClick}
              title={role === UserRole.Student ? 'Chat with mentor' : 'Chat with mentee'}
              style={chatButtonStyle}
            >
              <MessageCircle size={18} color="#fff" />
              <span style={{ color: '#fff' }}>
                {role === UserRole.Student ? 'Chat with mentor' : 'Chat with mentee'}
              </span>
            </button>
          </ErrorBoundary>
        </div>
      )}

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
        title={hasUserRated() ? "Your Rating" : "Rate meeting"}
        open={isModalVisibleRate}
        onOk={hasUserRated() ? handleCancelRate : handleRateMeeting}
        onCancel={handleCancelRate}
        footer
        okButtonProps={{ 
          loading: loading,
          style: hasUserRated() ? { display: 'none' } : undefined
        }}
      >
        <div>
          <div style={{ marginBottom: '24px' }}>
            <CustomText fontSize={14} fontWeight={500} color={colors.colorTextSecondary}>
              {role === UserRole.Mentor ? 'Student' : 'Mentor'}
            </CustomText>
            <CustomText fontSize={16} fontWeight={600} color={colors.colorText}>
              {role === UserRole.Mentor 
                ? 'Student'
                : (mentor as any)?.profile?.name || 'Mentor'
              }
            </CustomText>
          </div>
          <CustomText
            fontSize={14}
            fontWeight={500}
            color={colors.colorTextSecondary}
          >
            Session day
          </CustomText>
          <CustomText color={colors.colorText} mt={2}>
            {dayjs(date).format('dddd, MMM D, YYYY')} • {dayjs(date).format('HH:mm')} - {dayjs(date).add(duration || 30, 'minute').format('HH:mm')}
          </CustomText>
        </div>
        <div style={{ marginTop: '24px' }}>
          <CustomText mb={8}>Rating</CustomText>
          <Rate value={rating} onChange={hasUserRated() ? undefined : setRating} disabled={hasUserRated()} />
        </div>
        <div style={{ marginTop: '24px' }}>
          <Form form={form} layout="vertical">
            <CustomText mb={4}>Comment</CustomText>
            <Form.Item
              name="rateText"
              rules={
                hasUserRated()
                  ? []
                  : [
                      {
                        required: true,
                        message: 'Please provide a comment',
                      },
                      {
                        min: 10,
                        message: 'Comment must be at least 10 characters long',
                      },
                    ]
              }
            >
              <Input.TextArea rows={4} />
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
      
      {/* Chat Modal */}
      {conversationId && (
        <ChatModal
          conversationId={conversationId}
          threadId={threadId || undefined}
          open={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          onConversationChange={(newConversationId) => {
            setConversationId(newConversationId);
          }}
        />
      )}
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
