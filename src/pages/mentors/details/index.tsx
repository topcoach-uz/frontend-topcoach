import { Breadcrumb, Flex, message, Skeleton } from 'antd';
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
import PackageBalance from './_components/PackageBalance';
import Socials from './_components/socials';
import Statistics from './_components/statistics';
import BookModal from './bookModal';
import MentorBookingPaymentModal from './bookModal/_components/payment';
import styles from './mentor_details.module.scss';
import { useTranslation } from 'react-i18next';
import Reviews from './_components/reviews';

export default function MentorDetailsPage() {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [bookingInfo, setBookingInfo] = useState<IHandleBookArgs | null>(null);
  const { pathname } = useLocation();
  const { screenSize } = useScreenSize();
  const splittedPathname = pathname.split('/');
  const mentorId = splittedPathname[splittedPathname.length - 1].split('?')[0];
  const { t } = useTranslation();

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
  const isAuthenticated = useTypedSelector(
    (state) => state.auth.isAuthenticated
  );

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

  const handleBookPayment = () => {
    if (!isAuthenticated) {
      message.error('Please login to book a session');
      return;
    }

    if (mentorData?.sessionStats.upcomingSessions.length === 0) {
      message.error('No available sessions to book');
      return;
    }
    // customHistory.push('?booking=true');
    setPaymentModalOpen(true);
    // message.success('Your session has been booked successfully');
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

        <Flex gap={40} style={{ marginTop: '48px', justifyContent: 'center' }}>
          <div className={styles.left_side}>
            <Overview />
            <Socials />
            <MentorVideosView
              demoLesson={demoLesson}
              introductionVideo={introVideo}
            />
            {screenSize < 1024 && (
              <Flex gap={24} style={{ width: '100%' }} vertical>
                <Statistics />
                <MentorAvailableSessions
                  noSessions={noSessions}
                  availableSessions={availableSessions}
                  handleBookPayment={handleBookPayment}
                />
                {/* @ts-ignore */}
                {isAuthenticated && <PackageBalance />}
              </Flex>
            )}
            <Background />

            {/* <Reviews /> */}
          </div>
          {screenSize > 1024 && (
            <Flex gap={24} style={{ width: '100%' }} vertical>
              <Statistics />
              <MentorAvailableSessions
                availableSessions={availableSessions}
                handleBookPayment={handleBookPayment}
                noSessions={noSessions}
              />
              {isAuthenticated && <PackageBalance />}
            </Flex>
          )}
        </Flex>
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
