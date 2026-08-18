import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Calendar, GraduationCap, LogIn, MonitorPlay, Users, Video } from 'lucide-react';
import { useTypedSelector } from 'src/app/store';
import styles from './EssayMasterclassCard.module.scss';
import {
  IVY_WORKSHOP_BANNER_IMG,
  IVY_WORKSHOP_MEET_URL,
  IVY_WORKSHOP_SPEAKER,
  IVY_WORKSHOP_SPEAKER_SCHOOL,
  isIvyWorkshopLive,
} from './ivyWorkshop';

/**
 * Events → featured announcement for the August 20 live workshop with
 * Komron Ergashev (Stanford). Shares the featured-card layout with the
 * essay masterclass: banner full-bleed in the left half, pitch beside it.
 *
 * The Google Meet link is members-only: anonymous visitors get a
 * "Log in to join" CTA (the URL is never rendered for them), logged-in
 * users get the join button. Auto-hides after the session has run
 * (see ivyWorkshop.ts).
 */
export default function IvyLeagueWorkshopCard() {
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((state) => state.auth.isAuthenticated);

  if (!isIvyWorkshopLive()) return null;

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.media}>
          {/* Portrait poster (1080x1350) in a full-bleed cover crop —
              biased upward so Komron's face and the date badge stay in
              frame while the bottom text block (repeated in the card
              body) is what gets cut. */}
          <img
            src={IVY_WORKSHOP_BANNER_IMG}
            alt="What do Ivy League & top universities actually look for in applicants? Live workshop with Komron Ergashev, Stanford University"
            style={{ objectPosition: 'center 25%' }}
          />
        </div>

        <div className={styles.body}>
          <span className={styles.eyebrow}>Live workshop · Thursday, August 20 · 20:00</span>

          <h2 className={styles.title}>
            What do Ivy League &amp; top universities{' '}
            <span>actually look for</span> in applicants?
          </h2>

          <p className={styles.tagline}>
            Many students focus mainly on GPA, IELTS, or SAT scores. But the
            admissions process goes far beyond test scores. In this workshop,
            Komron, a rising junior at Stanford, will share:
          </p>

          <ul className={styles.points}>
            <li>What top universities actually look for in applicants</li>
            <li>Common mistakes students make in their applications</li>
            <li>Key factors that can make your application stand out</li>
            <li>What to pay attention to throughout the application process</li>
          </ul>

          <div className={styles.presenter}>
            <GraduationCap size={18} />
            <span>
              <b>{IVY_WORKSHOP_SPEAKER}</b>
              <em>{IVY_WORKSHOP_SPEAKER_SCHOOL}</em>
            </span>
          </div>

          <div className={styles.facts}>
            <span>
              <Calendar size={14} /> Thursday, August 20 · 20:00
            </span>
            <span>
              <MonitorPlay size={14} /> TopCoach platform
            </span>
            <span>
              <Users size={14} /> Live · bring your questions
            </span>
          </div>

          <div className={styles.foot}>
            {isAuthenticated ? (
              <>
                <Button
                  type="primary"
                  size="large"
                  className={styles.reserveButton}
                  icon={<Video size={15} />}
                  href={IVY_WORKSHOP_MEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join
                </Button>
                <span className={styles.footNote}>
                  The session starts at 20:00, join a few minutes early
                </span>
              </>
            ) : (
              <>
                <Button
                  type="primary"
                  size="large"
                  className={styles.reserveButton}
                  icon={<LogIn size={15} />}
                  onClick={() => navigate('/auth/signin')}
                >
                  Log in to join
                </Button>
                <span className={styles.footNote}>
                  The join link is available to logged-in TopCoach users
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
