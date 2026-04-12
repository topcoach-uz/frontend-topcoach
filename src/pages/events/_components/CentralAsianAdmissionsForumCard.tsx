import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'antd';
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
    <div
      className={styles.card}
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
      <div className={styles.thumbWrap} aria-hidden>
        <img className={styles.thumb} src={CAAF_FORUM_CARD_IMAGE} alt="" />
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{t('caafForum.card.title')}</h2>
          {badge}
        </div>
        <p className={styles.desc}>{desc}</p>
        <span className={styles.cta}>
          {!isAuthenticated ? t('caafForum.card.cta.signIn') : cta} <ArrowRight size={18} aria-hidden />
        </span>
      </div>
    </div>
  );
}
