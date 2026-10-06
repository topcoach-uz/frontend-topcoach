import { Button } from 'antd';
import { Calendar, GraduationCap, MonitorPlay, Video } from 'lucide-react';
import styles from './CheveningWorkshop.module.scss';

const TITLE = 'Master’s Abroad: What to Expect & How to Prepare';
// Keep the announcement visible through the workshop date in Tashkent.
const HIDE_AFTER = new Date('2026-10-09T00:00:00+05:00');

export default function MastersAbroadWorkshopCard() {
  if (new Date() >= HIDE_AFTER) return null;

  return (
    <section className={styles.wrapper} aria-labelledby="masters-abroad-workshop-title">
      <div className={styles.card}>
        <div className={styles.media}>
          <img
            src="/img/masters-abroad-workshop.png"
            alt={`${TITLE}, a live workshop with Shakhrizoda Barakaeva`}
            width={1080}
            height={1350}
          />
        </div>
        <div className={styles.body}>
          <span className={styles.eyebrow}>Live workshop · Master’s abroad</span>
          <h2 id="masters-abroad-workshop-title" className={styles.title}>
            Master’s Abroad: <span>What to Expect &amp; How to Prepare</span>
          </h2>
          <p className={styles.tagline}>
            Are you planning to do your Master’s abroad? This could be the chance you’ve been
            looking for!
          </p>
          <p className={styles.tagline}>
            Shakhrizoda Barakaeva, an El-Yurt Umidi (EYUF) scholar, will share her experience of
            preparing for and pursuing her Master’s abroad, including her journey to becoming a
            Dean’s List student and receiving international student scholarships throughout her studies.
          </p>
          <div className={styles.presenter}>
            <GraduationCap size={18} />
            <span><b>Shakhrizoda Barakaeva</b><em>El-Yurt Umidi (EYUF) scholar</em></span>
          </div>
          <div className={styles.facts}>
            <span><Calendar size={16} /> October 8 · 20:00 · 2026</span>
            <span className={styles.timezone}>Tashkent time (UTC+5)</span>
            <span><MonitorPlay size={16} /> Online · TopCoach platform</span>
          </div>
          <div className={styles.foot}>
            <Button
              type="primary"
              size="large"
              className={styles.reserveButton}
              icon={<Video size={15} />}
              href="https://meet.google.com/rke-vgkc-zbj"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join workshop
            </Button>
            <span className={styles.footNote}>Learn what to expect, how to prepare,<br />and get practical insights from her journey.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
