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
const CAAF_DEADLINE_ISO = '2026-05-02T23:59:00+05:00';

type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function getCountdownParts(targetIso: string): CountdownParts {
  const targetTs = new Date(targetIso).getTime();
  const nowTs = Date.now();
  const distance = Math.max(targetTs - nowTs, 0);

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

  const countdown = useMemo(() => getCountdownParts(CAAF_DEADLINE_ISO), [tick]);
  const isDeadlinePassed = useMemo(
    () => new Date(CAAF_DEADLINE_ISO).getTime() <= tick,
    [tick],
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
            <Tag color="processing" className={styles.mainTag}>
              {t('events.workshop')}
            </Tag>
            {badge}
          </div>
          <h2 className={styles.title}>{t('caafForum.card.title')}</h2>
          <p className={styles.desc}>{desc}</p>
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
          <span className={styles.deadlineText}>Deadline: May 2, 23:59</span>
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
    </section>
  );
}
