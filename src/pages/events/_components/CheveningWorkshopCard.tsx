import React from 'react';
import { Button } from 'antd';
import { Calendar, GraduationCap, MonitorPlay, Video } from 'lucide-react';
import styles from './CheveningWorkshop.module.scss';
import {
  CHEVENING_WORKSHOP_BANNER_IMG,
  CHEVENING_WORKSHOP_DATE_LABEL,
  CHEVENING_WORKSHOP_MEET_URL,
  CHEVENING_WORKSHOP_ROLE,
  CHEVENING_WORKSHOP_SPEAKER,
  CHEVENING_WORKSHOP_TITLE,
  isCheveningWorkshopLive,
} from './cheveningWorkshop';

interface Props {
  archive?: boolean;
}

export default function CheveningWorkshopCard({ archive = false }: Props) {
  if (!archive && !isCheveningWorkshopLive()) return null;

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.media}>
          <img
            src={CHEVENING_WORKSHOP_BANNER_IMG}
            alt={`${CHEVENING_WORKSHOP_TITLE}, a live workshop with ${CHEVENING_WORKSHOP_SPEAKER}`}
            width={1080}
            height={1350}
          />
        </div>

        <div className={styles.body}>
          <span className={styles.eyebrow}>{archive ? 'Past workshop' : 'Live workshop'} · Study in the UK 🇬🇧</span>
          <h2 className={styles.title}>
            How to Build a Strong <span>Chevening Application</span>
          </h2>
          <p className={styles.tagline}>
            Planning to study in the UK on a fully funded scholarship? Learn how to approach your
            Chevening application with clarity and strategy.
          </p>
          <div className={styles.presenter}>
            <GraduationCap size={18} />
            <span>
              <b>{CHEVENING_WORKSHOP_SPEAKER}</b>
              <em>{CHEVENING_WORKSHOP_ROLE}</em>
            </span>
          </div>
          <div className={styles.facts}>
            <span><Calendar size={16} /> {CHEVENING_WORKSHOP_DATE_LABEL} · 2026</span>
            <span className={styles.timezone}>Tashkent time (UTC+5)</span>
            <span><MonitorPlay size={16} /> Online · TopCoach platform</span>
          </div>
          {!archive && (
            <div className={styles.foot}>
              <Button
                type="primary"
                size="large"
                className={styles.reserveButton}
                icon={<Video size={15} />}
                href={CHEVENING_WORKSHOP_MEET_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Join workshop
              </Button>
              <span className={styles.footNote}>Join a few minutes early.<br />Bring your questions.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
