import React from 'react';
import { Button } from 'antd';
import { CalendarClock, Clock, MonitorPlay, ArrowRight, GraduationCap } from 'lucide-react';
import styles from './PersonalStatementWorkshopCard.module.scss';

const JOIN_URL = 'https://meet.google.com/whk-ynpy-mbo';

/**
 * Events → Personal Statement Workshop with Nazira Davroni.
 *
 * Free live workshop promo card (crimson + serif, matching the ISC card's
 * design language). The full poster sits on the left; the session details and
 * the "Join" CTA sit on the right.
 */
export default function PersonalStatementWorkshopCard() {
  const join = () => window.open(JOIN_URL, '_blank', 'noopener,noreferrer');

  return (
    <section className={styles.wrapper}>
      <div
        className={styles.card}
        role="button"
        tabIndex={0}
        onClick={join}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            join();
          }
        }}
      >
        <div className={styles.media} aria-hidden>
          <img
            src="/img/workshop2.jpeg"
            alt="Personal Statement Workshop with Nazira Davroni"
            loading="lazy"
          />
        </div>

        <div className={styles.left}>
          <span className={styles.eyebrow}>Free workshop · Live online</span>

          <h3 className={styles.title}>
            How to Write a Strong <span>Personal Statement</span>
          </h3>

          <p className={styles.tagline}>
            Learn how to write a standout personal statement, avoid the common
            mistakes, and make your essay work in the admissions process.
          </p>

          <div className={styles.presenter}>
            <GraduationCap size={18} />
            <span>
              <b>Nazira Davroni</b>
              <em>Barnard College, Columbia University</em>
            </span>
          </div>

          <div className={styles.credentials}>
            <span>IELTS 9.0</span>
            <span>TOEFL 118</span>
            <span>CELTA Pass A</span>
            <span>Int&apos;l Student of the Year 2025</span>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <CalendarClock size={16} />
              <span><b>Thu, Jul 30</b></span>
            </div>
            <div className={styles.stat}>
              <Clock size={16} />
              <span><b>20:00</b></span>
            </div>
            <div className={styles.stat}>
              <MonitorPlay size={16} />
              <span>TopCoach Platform</span>
            </div>
          </div>

          <div className={styles.foot}>
            <Button
              type="primary"
              size="large"
              className={styles.joinButton}
              onClick={(e) => {
                e.stopPropagation();
                join();
              }}
            >
              Join the workshop <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
