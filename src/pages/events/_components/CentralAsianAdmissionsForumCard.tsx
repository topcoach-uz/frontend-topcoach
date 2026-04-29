import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag } from 'antd';
import dayjs from 'dayjs';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTypedSelector } from 'src/app/store';
import {
  useGetCaafForumApplicationsMeQuery,
  useGetCaafForumRegistrationConfigQuery,
} from 'src/app/services/caafForumApi';
import {
  CAAF_FORUM_CARD_IMAGE,
  formatCaafRegistrationFeeUsd,
  REGISTRATION_FEE_USD_FALLBACK,
} from '../central-asian-admissions-forum/constants';
import { CAAF_DRAFT_STORAGE_KEY } from '../central-asian-admissions-forum/types';
import styles from './CentralAsianAdmissionsForumCard.module.scss';

const FORUM_REGISTER_PATH = '/events/central-asian-admissions-forum';

/** Next calendar day at 23:59:59.999 local — registration “closes tomorrow night”. */
function getRegistrationDeadlineEnd(fromNow: number): Date {
  const d = new Date(fromNow);
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  return d;
}

type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function getCountdownParts(target: Date, nowMs: number): CountdownParts {
  const targetTs = target.getTime();
  const distance = Math.max(targetTs - nowMs, 0);

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

/**
 * Events → Central Asian Admissions Forum 2026 registration.
 */
export default function CentralAsianAdmissionsForumCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);
  const { data: regConfig } = useGetCaafForumRegistrationConfigQuery();
  const feeUsd = regConfig?.registrationFeeUsd ?? REGISTRATION_FEE_USD_FALLBACK;
  const feeLabel = formatCaafRegistrationFeeUsd(feeUsd);
  const { data } = useGetCaafForumApplicationsMeQuery(undefined, { skip: !isAuthenticated });
  const app = data?.application;
  const [tick, setTick] = useState<number>(Date.now());

  const registrationDeadline = useMemo(() => getRegistrationDeadlineEnd(tick), [tick]);
  const deadlineLabel = useMemo(
    () =>
      registrationDeadline.toLocaleString(undefined, {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    [registrationDeadline],
  );

  const go = () => {
    if (!isAuthenticated) {
      try {
        window.localStorage.setItem('redirectAfterLogin', FORUM_REGISTER_PATH);
      } catch {
        /* ignore */
      }
      navigate('/auth/signin');
      return;
    }
    navigate(FORUM_REGISTER_PATH);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(() => getCountdownParts(registrationDeadline, tick), [registrationDeadline, tick]);
  const isDeadlinePassed = useMemo(
    () => registrationDeadline.getTime() <= tick,
    [registrationDeadline, tick],
  );

  let desc = t('caafForum.card.defaultDesc', { fee: feeLabel });
  let cta = t('caafForum.card.cta.register');
  let badge: React.ReactNode = null;

  if (app?.status === 'pending_payment') {
    const dateLabel = dayjs(app.submittedAt).format('MMM D, YYYY');
    desc = t('caafForum.card.pendingDesc', { date: dateLabel, fee: feeLabel });
    cta = t('caafForum.card.cta.completePay');
    badge = (
      <Tag color="gold" className={styles.statusTag}>
        {t('caafForum.card.tag.pending')}
      </Tag>
    );
  } else if (app?.status === 'paid') {
    desc = t('caafForum.card.paidDesc');
    cta = t('caafForum.card.cta.view');
    badge = (
      <Tag color="green" className={styles.statusTag}>
        {t('caafForum.card.tag.registered')}
      </Tag>
    );
  } else if (isAuthenticated && app === null) {
    try {
      const raw = window.localStorage.getItem(CAAF_DRAFT_STORAGE_KEY);
      if (raw && raw.length > 20) {
        desc = t('caafForum.card.draftDesc');
        cta = t('caafForum.card.cta.resume');
        badge = (
          <Tag color="blue" className={styles.statusTag}>
            {t('caafForum.card.tag.draft')}
          </Tag>
        );
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <section className={styles.wrapper}>
      <div
        className={styles.heroCard}
        role="button"
        tabIndex={0}
        onClick={go}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            go();
          }
        }}
      >
        <img className={styles.heroBg} src={CAAF_FORUM_CARD_IMAGE} alt="" aria-hidden />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.heroTop}>
            {badge}
          </div>
          <div className={styles.heroActions}>
            <Button
              type="primary"
              size="large"
              className={styles.applyButton}
              onClick={(event) => {
                event.stopPropagation();
                go();
              }}
            >
              {!isAuthenticated ? t('caafForum.card.cta.signIn') : cta} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.countdownCard} aria-live="polite">
        <div className={styles.countdownHeader}>
          <h3 className={styles.countdownTitle}>Registration closes in</h3>
          <span className={styles.deadlineText}>Deadline: {deadlineLabel}</span>
        </div>
        <div className={styles.countdownGrid}>
          <div className={styles.countdownItem}>
            <span className={styles.countdownValue}>{countdown.days}</span>
            <span className={styles.countdownLabel}>Days</span>
          </div>
          <div className={styles.countdownItem}>
            <span className={styles.countdownValue}>{countdown.hours}</span>
            <span className={styles.countdownLabel}>Hours</span>
          </div>
          <div className={styles.countdownItem}>
            <span className={styles.countdownValue}>{countdown.minutes}</span>
            <span className={styles.countdownLabel}>Minutes</span>
          </div>
          <div className={styles.countdownItem}>
            <span className={styles.countdownValue}>{countdown.seconds}</span>
            <span className={styles.countdownLabel}>Seconds</span>
          </div>
        </div>
        {isDeadlinePassed && (
          <p className={styles.closedText}>Registration deadline has passed.</p>
        )}
      </div>

      <div className={styles.detailsCard}>
        <h3 className={styles.detailsMainTitle}>🌏 Central Asian Admissions Forum 2026</h3>
        <p className={styles.detailsTagline}>
          Bridging the gap between Central Asian talent and the world&apos;s top universities.
        </p>

        <p className={styles.detailsSectionTitle}>Overview</p>
        <p className={styles.detailsLead}>
          The Central Asian Admissions Forum is an exclusive, high-impact online event designed for
          ambitious high school and university students across the region. Hosted by Top Coach, this
          forum brings together leading mentors, admissions experts, and successful alumni who have
          secured spots at the Ivy League, Russell Group, and other top-tier global institutions.
        </p>

        <p className={styles.detailsBody}>
          Our mission is simple: to move beyond generic advice and provide the exact academic,
          financial, and extracurricular strategies that distinguish a successful applicant on a
          global scale. If you are aiming to build a truly competitive, internationally recognized
          profile, then this is your chance to start.
        </p>

        <p className={styles.detailsSectionTitle}>What You Will Learn</p>
        <p className={styles.detailsBody}>
          By attending this forum, you will gain access to insider knowledge and actionable
          roadmaps, including:
        </p>
        <ul className={styles.detailsList}>
          <li>
            <strong>Admissions Strategies:</strong> Step-by-step breakdowns of the application
            processes for top universities in the US, UK, and Europe.
          </li>
          <li>
            <strong>The Art of the Essay:</strong> Live workshops on how to craft personal
            statements that authentically tell your unique story.
          </li>
          <li>
            <strong>Building a Standout Profile:</strong> Proven methods for developing
            extracurricular portfolios and high-impact passion projects.
          </li>
          <li>
            <strong>Financial Aid Masterclass:</strong> Insider tips on finding and securing
            full-ride scholarships as an international applicant.
          </li>
          <li>
            <strong>Direct Networking:</strong> Opportunities to ask questions and connect directly
            with mentors who were once sitting exactly where you are today.
          </li>
        </ul>

        <p className={styles.detailsSectionTitle}>Registration Details</p>
        <p className={styles.detailsFee}>
          To ensure the highest quality experience, space for this forum is strictly limited.
        </p>
        <ul className={styles.detailsList}>
          <li>
            <strong>Registration Fee:</strong> {feeLabel}
          </li>
          <li>
            <strong>Our Promise:</strong> This event is not for profit. We are committed to
            reinvesting 100% of this nominal fee directly back into our attendees. All proceeds are
            used exclusively to provide valuable gifts, premium resources, and study materials for
            every participant.
          </li>
        </ul>
        <p className={styles.detailsFee}>
          Apply now to secure your place.
        </p>

        <Button
          type="primary"
          size="large"
          className={styles.detailsApplyButton}
          onClick={go}
        >
          {isAuthenticated ? cta : t('caafForum.card.cta.applyNow', 'Apply now')}
        </Button>
      </div>

      <div className={styles.importantDatesBlock}>
        <p className={styles.detailsSectionTitle}>IMPORTANT DATES &amp; SCHEDULE</p>
        <div className={styles.importantDateRow}>
          <p className={styles.importantDateDay}>May 1 - How Admissions Actually Works</p>
          <p className={styles.importantDateTopic}>US &amp; UK, EUROPE, Asia Big Picture</p>
        </div>
        <div className={styles.importantDateRow}>
          <p className={styles.importantDateDay}>May 2 - Funding</p>
          <p className={styles.importantDateTopic}>Scholarships &amp; Strategy</p>
        </div>
        <div className={styles.importantDateRow}>
          <p className={styles.importantDateDay}>May 3 - From Profile to Offer</p>
          <p className={styles.importantDateTopic}>Essays &amp; Positioning</p>
        </div>
      </div>
    </section>
  );
}
