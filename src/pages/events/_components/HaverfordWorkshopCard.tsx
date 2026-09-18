import { Button } from 'antd';
import { Calendar, GraduationCap, MonitorPlay, Video } from 'lucide-react';
import styles from './CheveningWorkshop.module.scss';

const TITLE = 'Applying to U.S. Colleges from Uzbekistan: From Navoi to Haverford';
const HIDE_AFTER = new Date('2026-09-24T22:00:00+05:00');

export default function HaverfordWorkshopCard() {
  if (new Date() >= HIDE_AFTER) return null;

  return (
    <section className={styles.wrapper} aria-labelledby="haverford-workshop-title">
      <div className={styles.card}>
        <div className={styles.media}>
          <img
            src="/img/haverford-workshop.png"
            alt={`${TITLE}, a live workshop with Malika Salimova`}
            width={1080}
            height={1350}
          />
        </div>
        <div className={styles.body}>
          <span className={styles.eyebrow}>Live workshop · Study in the U.S. 🇺🇸</span>
          <h2 id="haverford-workshop-title" className={styles.title}>
            Applying to U.S. Colleges from Uzbekistan: <span>From Navoi to Haverford</span>
          </h2>
          <p className={styles.tagline}>
            What is it really like to apply to U.S. colleges from Uzbekistan?
          </p>
          <p className={styles.tagline}>
            In this workshop, Malika Salimova will share her journey from a specialized boarding
            school in Navoi to Haverford College, including how she approached the application
            process, why she chose a liberal arts college, and what she learned along the way.
          </p>
          <div className={styles.presenter}>
            <GraduationCap size={18} />
            <span><b>Malika Salimova</b><em>Haverford College</em></span>
          </div>
          <div className={styles.facts}>
            <span><Calendar size={16} /> September 24 · 20:00 · 2026</span>
            <span className={styles.timezone}>Tashkent time (UTC+5)</span>
            <span><MonitorPlay size={16} /> Online · TopCoach platform</span>
          </div>
          <div className={styles.foot}>
            <Button
              type="primary"
              size="large"
              className={styles.reserveButton}
              icon={<Video size={15} />}
              href="https://meet.google.com/rjf-gciq-edx"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join workshop
            </Button>
            <span className={styles.footNote}>Join us to hear the story behind<br />the journey, and learn from it.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
