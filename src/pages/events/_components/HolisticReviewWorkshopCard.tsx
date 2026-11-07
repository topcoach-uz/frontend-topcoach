import { Button } from 'antd';
import { Calendar, GraduationCap, MonitorPlay, Video } from 'lucide-react';
import styles from './CheveningWorkshop.module.scss';

const TITLE = 'What ‘Holistic Review’ Actually Means at Canadian Universities';
// Keep the announcement visible through the workshop date in Tashkent.
const HIDE_AFTER = new Date('2026-10-24T00:00:00+05:00');

export default function HolisticReviewWorkshopCard() {
  if (new Date() >= HIDE_AFTER) return null;

  return (
    <section className={styles.wrapper} aria-labelledby="holistic-review-workshop-title">
      <div className={styles.card}>
        <div className={styles.media}>
          <img
            src="/img/holistic-review-workshop.png"
            alt={`${TITLE}, a live workshop with Marjonakhon Ibrokhimova`}
            width={1080}
            height={1350}
          />
        </div>
        <div className={styles.body}>
          <span className={styles.eyebrow}>Live workshop · Canadian admissions</span>
          <h2 id="holistic-review-workshop-title" className={styles.title}>
            What ‘Holistic Review’ Actually Means <span>at Canadian Universities</span>
          </h2>
          <p className={styles.tagline}>
            Planning to apply to universities in Canada? Learn how admissions committees look
            beyond grades and what makes an application stand out!
          </p>
          <p className={styles.tagline}>
            Marjonakhon Ibrokhimova, an Economics &amp; Public Policy student at the University of
            Toronto, will share her experience of receiving the International Scholar Award and
            the El-Yurt Umidi Foundation Scholarship.
          </p>
          <div className={styles.presenter}>
            <GraduationCap size={18} />
            <span><b>Marjonakhon Ibrokhimova</b><em>Economics &amp; Public Policy student · University of Toronto</em></span>
          </div>
          <div className={styles.facts}>
            <span><Calendar size={16} /> October 23 · 20:00 · 2026</span>
            <span className={styles.timezone}>Tashkent time (UTC+5)</span>
            <span><MonitorPlay size={16} /> Online · TopCoach platform</span>
          </div>
          <div className={styles.foot}>
            <Button
              type="primary"
              size="large"
              className={styles.reserveButton}
              icon={<Video size={15} />}
              href="https://meet.google.com/ggo-njuh-ggh"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join workshop
            </Button>
            <span className={styles.footNote}>Discover what Canadian universities look for<br />and how to strengthen your application.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
