import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowRight, Globe2, CalendarClock, Users, Lock } from 'lucide-react';
import styles from './InternationalSummerCamp2026Card.module.scss';
import { useIscCardState } from './useIscCardState';
import IscPayNowButton from './IscPayNowButton';

const ISC_PATH = '/events/international-summer-camp-2026';

/**
 * Events → International Summer Camp 2026.
 *
 * Editorial promo card (crimson + serif) that opens the ISC application.
 * Copy reflects the confirmed programme: Aug 3–9, 2026, 250 students
 * (150 Bachelor's + 100 Master's) from across Central Asia.
 */
export default function InternationalSummerCamp2026Card() {
  const navigate = useNavigate();
  const { ctaLabel, statusLabel, statusTone, mode } = useIscCardState();
  const go = () => {
    if (mode === 'closed') return;
    navigate(ISC_PATH);
  };

  return (
    <section className={styles.wrapper}>
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
        <div className={styles.media} aria-hidden>
          <img src="/img/isc-banner.jpg" alt="" loading="lazy" />
        </div>

        <div className={styles.left}>
          <span className={styles.eyebrow}>
            Top Coach presents · {mode === 'closed' ? 'Applications closed' : 'Applications open'}
          </span>
          <h3 className={styles.title}>
            International Summer Camp <span>2026</span>
          </h3>
          <p className={styles.tagline}>
            A one-week academic camp for 250 students from across Central Asia — 150 Bachelor&apos;s
            and 100 Master&apos;s places — for learning, networking, and a head start on studying
            abroad.
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <CalendarClock size={16} />
              <span><b>Aug 3–9</b>, 2026</span>
            </div>
            <div className={styles.stat}>
              <Users size={16} />
              <span><b>250</b> students</span>
            </div>
            <div className={styles.stat}>
              <Globe2 size={16} />
              <span>Central Asia</span>
            </div>
          </div>

          <div className={styles.foot}>
            {mode === 'closed' ? (
              <span className={styles.closedBanner}>
                <Lock size={15} />
                <span>
                  <b>Applications closed</b>
                  <em>Closed July 11, 2026 · we&apos;ll announce results soon</em>
                </span>
              </span>
            ) : (
              <>
                {/* No status pill once an application is in — the outcome is
                    the applicant's to read on the status screen, not something
                    to surface on a public-facing card they may be scrolling
                    past in company. The CTA alone carries it. */}
                {mode !== 'status' && (
                  <span className={`${styles.deadline} ${styles[`tone_${statusTone}`]}`}>
                    {mode === 'apply' ? 'Apply by July 11, 2026' : statusLabel}
                  </span>
                )}
                <Button
                  type="primary"
                  size="large"
                  className={styles.applyButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    go();
                  }}
                >
                  {ctaLabel} <ArrowRight size={16} />
                </Button>
              </>
            )}
            {/* Shown only for invoiced (accepted) students, regardless of
                whether the application window is open or closed. */}
            <IscPayNowButton />
          </div>
        </div>
      </div>
    </section>
  );
}
