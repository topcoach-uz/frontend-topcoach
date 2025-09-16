import { Breadcrumb, Flex, message, Skeleton, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MEDIA_TAGS } from 'src/app/api/Api';
import { useGetMentorDetailQuery } from 'src/app/services/mentors';
import { useTypedSelector } from 'src/app/store';
import { useScreenSize } from 'src/hooks/useScreenSize';
import { getLatestVideo } from 'src/utils';
import Avatar from './_components/avatar';
import Background from './_components/background';
import MentorAvailableSessions from './_components/MentorAvailableSessions';
import MentorVideosView from './_components/MentorVideosView';
import Overview from './_components/overview';
import GiveawaySessions from './_components/GiveawaySessions';
import PackageBalance from './_components/PackageBalance';
import Socials from './_components/socials';
import Statistics from './_components/statistics';
import BookModal from './bookModal';
import MentorBookingPaymentModal from './bookModal/_components/payment';
import styles from './mentor_details.module.scss';
import { useTranslation } from 'react-i18next';
import Reviews from './_components/reviews';
import { useGetMeQuery } from 'src/app/services/users';
import { useAppDispatch } from 'src/app/store';
import { show as showProfilePopup } from 'src/app/slices/profilePopupSlice';
import { useGetTelegramStatusQuery } from 'src/app/services/users';
import { useGetGiveawaySessionsQuery, useGetGiveawayStatusQuery, useBookGiveawaySessionMutation } from 'src/app/services/sessions';

export default function MentorDetailsPage() {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [bookingInfo, setBookingInfo] = useState<IHandleBookArgs | null>(null);
  const [giveawayConfirmModalOpen, setGiveawayConfirmModalOpen] = useState<boolean>(false);
  const [selectedGiveawaySession, setSelectedGiveawaySession] = useState<any>(null);
  const [giveawaySuccessModalOpen, setGiveawaySuccessModalOpen] = useState<boolean>(false);
  const { pathname } = useLocation();
  const { screenSize } = useScreenSize();
  const splittedPathname = pathname.split('/');
  const mentorId = splittedPathname[splittedPathname.length - 1].split('?')[0];
  const { t } = useTranslation();
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );
  const { data: currentUser } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: telegramStatus } = useGetTelegramStatusQuery(undefined, {
    skip: !isAuthenticated,
  });
  const dispatch = useAppDispatch();

  // Fetch giveaway sessions and user status only if authenticated
  const { data: giveawaySessions } = useGetGiveawaySessionsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: giveawayStatus } = useGetGiveawayStatusQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [bookGiveawaySession] = useBookGiveawaySessionMutation();

  const {
    data: mentorData,
    refetch,
    isLoading,
  } = useGetMentorDetailQuery({
    mentorId,
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleBook = (bookingArgs: IHandleBookArgs) => {
    setPaymentModalOpen(false);
    setModalOpen(true);
    setBookingInfo(bookingArgs);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  // Payment modal
  const handleClosePayment = () => {
    setPaymentModalOpen(false);
  };

  // Get giveaway sessions for this mentor
  const mentorGiveawaySessions = giveawaySessions?.filter(
    session => (session.mentor as any)?.id === mentorId && !session.giveawayBookedBy
  ) || [];

  // For non-authenticated users, show all giveaway sessions (without booking status)
  // If giveawaySessions is undefined (not fetched), show empty array for non-authenticated users
  const allMentorGiveawaySessions = !isAuthenticated ? 
    (giveawaySessions ? giveawaySessions.filter(session => (session.mentor as any)?.id === mentorId) : []) :
    mentorGiveawaySessions;

  const handleBookPayment = () => {
    if (!isAuthenticated) {
      message.error('Please login to book a session');
      return;
    }

    if (mentorData?.sessionStats.upcomingSessions.length === 0) {
      message.error('No available sessions to book');
      return;
    }

    // Check for required profile fields before opening booking modal (only for students)
    if (currentUser?.profile?.role === 'Student') {
      const missingTelegram = telegramStatus?.status !== 'connected';
      if (missingTelegram) {
        dispatch(showProfilePopup());
        return;
      }
    }

    setPaymentModalOpen(true);
  };

  const handleBookGiveawaySession = (session: any) => {
    if (!isAuthenticated) {
      message.error('Please login to book a giveaway session');
      return;
    }

    // Check if user has already booked a giveaway session
    if (giveawayStatus?.hasBookedGiveaway) {
      message.error('You have already booked a giveaway session. Only one giveaway session per user is allowed.');
      return;
    }

    // Check for required profile fields before booking (only for students)
    if (currentUser?.profile?.role === 'Student') {
      const missingTelegram = telegramStatus?.status !== 'connected';
      if (missingTelegram) {
        dispatch(showProfilePopup());
        return;
      }
    }

    // Show confirmation modal
    setSelectedGiveawaySession(session);
    setGiveawayConfirmModalOpen(true);
  };

  const handleConfirmGiveawayBooking = async () => {
    if (!selectedGiveawaySession) return;

    try {
      await bookGiveawaySession({ sessionId: selectedGiveawaySession.id }).unwrap();
      setGiveawayConfirmModalOpen(false);
      setSelectedGiveawaySession(null);
      // Show success modal
      setGiveawaySuccessModalOpen(true);
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to book giveaway session');
    }
  };

  const handleCancelGiveawayBooking = () => {
    setGiveawayConfirmModalOpen(false);
    setSelectedGiveawaySession(null);
  };

  const handleSuccessModalClose = () => {
    setGiveawaySuccessModalOpen(false);
    // Redirect to homepage
    window.location.href = '/';
  };

  const noSessions =
    mentorData?.sessionStats.upcomingSessions.length === 0 ? false : true;

  const media = mentorData?.profile?.media || [];

  const demoLesson = getLatestVideo(media, MEDIA_TAGS.DemoLession);
  const introVideo = getLatestVideo(media, MEDIA_TAGS.IntroVideo);

  const breadcrumbItems = [
    {
      title: <Link to="/">{t('breadCrumb.home')}</Link>,
    },
    {
      title: <Link to="/mentors">{t('breadCrumb.mentors')}</Link>,
    },
    {
      title: t('breadCrumb.mentorsInfo'),
    },
  ];

  const availableSessions = [
    { name: t('mentors.oneOnOne'), duration: 30 },
    // { name: 'Group session', duration: 60 },
  ];

  if (isLoading) {
    return <Fallback />;
  }

  console.log('mentorData', mentorData);

  return (
    <main className={styles.main}>
      <div className={'container ' + styles.container}>
        <Breadcrumb rootClassName={styles.breadcrumb} items={breadcrumbItems} />
        <Avatar />

        <div style={{ 
          display: screenSize > 1024 ? 'flex' : 'none', 
          gap: '40px', 
          marginTop: '48px', 
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '100%'
        }}>
          <div style={{ 
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            maxWidth: 'calc(100% - 400px)'
          }}>
            <Overview />
            <Socials />
            <MentorVideosView
              demoLesson={demoLesson}
              introductionVideo={introVideo}
            />
            <Background />
            <Reviews data={(mentorData as any)?.receivedReviews || []} />
          </div>
          {screenSize > 1024 && (
            <div style={{ 
              width: '380px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              alignSelf: 'flex-start',
              marginTop: '-250px'
            }}>
              <Statistics />
              <MentorAvailableSessions
                availableSessions={availableSessions}
                handleBookPayment={handleBookPayment}
                noSessions={noSessions}
                mentorName={mentorData?.profile?.name || 'Mentor'}
                mentorId={mentorId}
              />
              <GiveawaySessions
                giveawaySessions={allMentorGiveawaySessions}
                onBookGiveawaySession={handleBookGiveawaySession}
                hasBookedGiveaway={giveawayStatus?.hasBookedGiveaway}
                isAuthenticated={isAuthenticated}
              />
              {isAuthenticated && <PackageBalance />}
            </div>
          )}
        </div>

        {/* Mobile sections - moved after the main flex container */}
        {screenSize < 1024 && (
          <div className={styles.mobile_layout}>
            <Statistics />
            <MentorAvailableSessions
              noSessions={noSessions}
              availableSessions={availableSessions}
              handleBookPayment={handleBookPayment}
              mentorName={mentorData?.profile?.name || 'Mentor'}
              mentorId={mentorId}
            />
            <GiveawaySessions
              giveawaySessions={allMentorGiveawaySessions}
              onBookGiveawaySession={handleBookGiveawaySession}
              hasBookedGiveaway={giveawayStatus?.hasBookedGiveaway}
              isAuthenticated={isAuthenticated}
            />
            {/* @ts-ignore */}
            {isAuthenticated && <PackageBalance />}
          </div>
        )}
      </div>
      <BookModal
        bookingInfo={bookingInfo}
        setModalOpen={setModalOpen}
        modalOpen={modalOpen}
        handleClose={handleClose}
      />
      <MentorBookingPaymentModal
        modalOpen={paymentModalOpen}
        handleClosePayment={handleClosePayment}
        handleBook={handleBook}
      />

      {/* Giveaway Session Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎁</span>
            <span>Confirm Giveaway Session Booking</span>
          </div>
        }
        open={giveawayConfirmModalOpen}
        onOk={handleConfirmGiveawayBooking}
        onCancel={handleCancelGiveawayBooking}
        okText="Yes, Book Free Session"
        cancelText="Cancel"
        okButtonProps={{
          style: {
            backgroundColor: '#FF6B35',
            borderColor: '#FF6B35',
          }
        }}
        width={500}
      >
        {selectedGiveawaySession && (
          <div style={{ padding: '16px 0' }}>
            <p style={{ fontSize: '16px', marginBottom: '16px' }}>
              Are you sure you want to book this <strong>free giveaway session</strong>?
            </p>
            
            <div style={{ 
              backgroundColor: '#fff5f2', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #FF6B35'
            }}>
              <h4 style={{ color: '#FF6B35', margin: '0 0 8px 0' }}>
                Session Details:
              </h4>
              <p style={{ margin: '4px 0' }}>
                <strong>Type:</strong> Free 30-Minute Session
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Date:</strong> {new Date(selectedGiveawaySession.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Time:</strong> {new Date(selectedGiveawaySession.date).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>

            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '6px',
              border: '1px solid #ffeaa7'
            }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#856404' }}>
                <strong>⚠️ Important:</strong> You can only book one giveaway session per account. 
                This action cannot be undone.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Giveaway Session Success Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🎉</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>CONGRATULATIONS!</span>
          </div>
        }
        open={giveawaySuccessModalOpen}
        onOk={handleSuccessModalClose}
        onCancel={handleSuccessModalClose}
        okText="Okay"
        cancelButtonProps={{ style: { display: 'none' } }}
        okButtonProps={{
          style: {
            backgroundColor: '#52c41a',
            borderColor: '#52c41a',
            fontWeight: 'bold',
            fontSize: '16px',
            padding: '8px 24px',
            height: 'auto'
          }
        }}
        width={500}
        closable={false}
      >
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <div style={{ 
            backgroundColor: '#f6ffed', 
            padding: '24px', 
            borderRadius: '12px',
            border: '2px solid #b7eb8f',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#52c41a', margin: '0 0 16px 0', fontSize: '18px' }}>
              You have successfully booked your session!
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
              Please, check the Telegram bot for the reminder.
            </p>
            <div style={{ 
              backgroundColor: '#e6f7ff', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #91d5ff',
              marginTop: '16px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1890ff', fontWeight: 'bold' }}>
                📱 Telegram Bot Link:
              </p>
              <a 
                href="https://t.me/topcoach_official_bot" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#1890ff', 
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                @topcoach_official_bot
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}

const Fallback = () => {
  return (
    <main className={styles.main}>
      <div className={'container ' + styles.container}>
        <Flex gap={50} vertical>
          <Flex gap={10} align="center">
            <Skeleton.Avatar
              active
              style={{ width: 200, height: 200, borderRadius: '50%' }}
            />
            <Skeleton active />
          </Flex>
          <Skeleton active />
          <Skeleton.Avatar active className={styles.linkedinImgFallback} />
          <Flex gap={30}>
            <Skeleton.Node active className={styles.videoFallback} />
            <Skeleton.Node active className={styles.videoFallback} />
          </Flex>
        </Flex>
      </div>
    </main>
  );
};

export interface IHandleBookArgs {
  name?: string;
  planType?: string;
  planId?: string;
}
