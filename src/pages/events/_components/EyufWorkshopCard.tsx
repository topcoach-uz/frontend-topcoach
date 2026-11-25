import { Button } from 'antd';
import { Calendar, GraduationCap, MonitorPlay, Video } from 'lucide-react';
import styles from './CheveningWorkshop.module.scss';

const TITLE = 'El-Yurt Umidi: Who Gets Selected and Who Doesn’t?';
// Keep the announcement visible through the workshop date in Tashkent.
const HIDE_AFTER = new Date('2026-11-27T00:00:00+05:00');

export default function EyufWorkshopCard() {
  if (new Date() >= HIDE_AFTER) return null;

  return (
    <section className={styles.wrapper} aria-labelledby="eyuf-workshop-title">
      <div className={styles.card}>
        <div className={styles.media}>
          <img
            src="/img/eyuf-workshop-20261126.jpg"
            alt={`${TITLE}, a live workshop with Shahboz Nuriddinov`}
            width={1792}
            height={2400}
          />
        </div>
        <div className={styles.body}>
          <span className={styles.eyebrow}>Live workshop · El-Yurt Umidi</span>
          <h2 id="eyuf-workshop-title" className={styles.title}>
            El-Yurt Umidi: <span>Who Gets Selected and Who Doesn’t?</span>
          </h2>
          <p className={styles.tagline}>
            Planning to apply for El-Yurt Umidi this year? Have questions about the
            selection process or how to prepare for the interview?
          </p>
          <p className={styles.tagline}>
            This time, we’re inviting Shahboz Nuriddinov, an AI &amp; Computer Science
            student at the University of Birmingham, to share his experience and give
            some useful advice.
          </p>
          <div className={styles.presenter}>
            <GraduationCap size={18} aria-hidden="true" />
            <span>
              <b>Shahboz Nuriddinov</b>
              <em>IELTS: 8.0 · SAT Superscore: 1510</em>
              <em>A-levels: A, A, A in Mathematics, Physics and Computer Science</em>
            </span>
          </div>
          <p className={styles.tagline}>
            We’ll talk about who EYUF selects, what the committee expects from
            applicants, and how to prepare for the interview. You’ll also have a
            chance to hear his personal insights and ask questions.
          </p>
          <div className={styles.facts}>
            <span><Calendar size={16} aria-hidden="true" /> <time dateTime="2026-11-26T20:00:00+05:00">26 November 2026 · 20:00</time></span>
            <span className={styles.timezone}>Tashkent time (UTC+5)</span>
            <span><MonitorPlay size={16} aria-hidden="true" /> TopCoach platform</span>
          </div>
          <div className={styles.foot}>
            <Button
              type="primary"
              size="large"
              className={styles.reserveButton}
              icon={<Video size={15} aria-hidden="true" />}
              href="https://meet.google.com/fsn-bsqz-vha"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join workshop
            </Button>
          </div>
          <details className={styles.dialIn}>
            <summary>Join by phone</summary>
            <p>
              Dial <a href="tel:+12628641136">+1 262-864-1136</a> and enter PIN: 431 477 009#
            </p>
            <a href="https://tel.meet/fsn-bsqz-vha?hs=5" target="_blank" rel="noopener noreferrer">
              More phone numbers
            </a>
          </details>
          <p className={styles.footNote}>
            If you’re planning to apply for EYUF, don’t miss this session. See you there!
          </p>
        </div>
      </div>
    </section>
  );
}
