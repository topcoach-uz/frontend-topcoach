import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowRight, Globe2, CalendarClock, Users } from 'lucide-react';
import styles from './InternationalSummerCamp2026Card.module.scss';

const ISC_PATH = '/events/international-summer-camp-2026';

/**
 * Events → International Summer Camp 2026.
 *
 * Editorial promo card (crimson + serif) that opens the ISC application.
 * Standalone for now (points at the /isc-2026 preview); will read live
 * open/close + my-application status once the backend lands.
 */
export default function InternationalSummerCamp2026Card() {
  const navigate = useNavigate();
  const go = () => navigate(ISC_PATH);

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
        <div className={styles.left}>
          <span className={styles.eyebrow}>Top Coach presents · Applications open</span>
          <h3 className={styles.title}>
            International Summer Camp <span>2026</span>
          </h3>
          <p className={styles.tagline}>
            A six-week academic experience for ambitious students — build skills, connect
            with peers from 30+ countries, and take your future to the next level.
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <CalendarClock size={16} />
              <span><b>6</b> weeks</span>
            </div>
            <div className={styles.stat}>
              <Globe2 size={16} />
              <span><b>30+</b> countries</span>
            </div>
            <div className={styles.stat}>
              <Users size={16} />
              <span><b>150</b> spots</span>
            </div>
          </div>

          <div className={styles.foot}>
            <span className={styles.deadline}>Apply by March 15, 2026</span>
            <Button
              type="primary"
              size="large"
              className={styles.applyButton}
              onClick={(e) => {
                e.stopPropagation();
                go();
              }}
            >
              Apply now <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        <div className={styles.right} aria-hidden>
          <div className={styles.badgeYear}>2026</div>
          <div className={styles.programs}>
            <span>Bachelor&apos;s</span>
            <span>Master&apos;s</span>
            <span>Local &amp; International</span>
          </div>
        </div>
      </div>
    </section>
  );
}
