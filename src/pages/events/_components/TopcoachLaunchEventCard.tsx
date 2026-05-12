import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  MessageCircle,
  Star,
  Rocket,
} from 'lucide-react';

import { useTypedSelector } from 'src/app/store';
import { useGetTopcoachLaunchEventMeQuery } from 'src/app/services/topcoachLaunchEventApi';
import { useLaunchEventVisible } from 'src/lib/launchEventAccess';
import styles from './TopcoachLaunchEventCard.module.scss';

const EVENT_PATH = '/events/topcoach-launch-event';
const EVENT_DATE_LABEL = 'Sunday, May 24, 2026 · 11:00 AM';
const EVENT_TIME_LABEL = 'Registration 10:00–11:00 AM · Apply by May 22';
const EVENT_VENUE_LABEL = 'Youth Affairs Agency · Tashkent';

/**
 * Featured Top Coach Launch Event card on the public /events page.
 * Free event — no fee/countdown chrome. The visual mirrors the CAAF
 * featured card so the events page reads as a coherent set.
 */
const TopcoachLaunchEventCard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useTypedSelector((s) => s.auth);
  const visible = useLaunchEventVisible();
  const { data } = useGetTopcoachLaunchEventMeQuery(undefined, {
    skip: !isAuthenticated || !visible,
  });
  const alreadyRegistered = data?.registration?.status === 'confirmed';

  // Hidden from the public until the flag is flipped. SuperAdmin / Owner
  // accounts always see it so the team can preview + QA in prod.
  if (!visible) return null;

  return (
    <article className={styles.card}>
      <div className={styles.media} aria-hidden>
        {/* <div className={styles.media__placeholder}>
          <Sparkles size={28} />
        </div> */}
      </div>

      <div className={styles.body}>
        <span className={styles.eyebrow}>
          <Sparkles size={11} /> Top Coach · Featured event
        </span>
        <h2 className={styles.title}>
          Top 100 Uni <em>Launch Event</em>
        </h2>
        <p className={styles.lede}>
          Something big is about to change college admissions in Central
          Asia — networking, real conversations, and the live launch.
        </p>

        <ul className={styles.facts}>
          <li>
            <Calendar size={14} />
            <div>
              <strong>{EVENT_DATE_LABEL}</strong>
              <span>{EVENT_TIME_LABEL}</span>
            </div>
          </li>
          <li>
            <MapPin size={14} />
            <div>
              <strong>{EVENT_VENUE_LABEL}</strong>
            </div>
          </li>
          <li>
            <CheckCircle2 size={14} />
            <div>
              <strong>Free · entry closes 11:00 AM</strong>
            </div>
          </li>
        </ul>

        <div className={styles.expect}>
          <div className={styles.expectEyebrow}>What to expect</div>
          <ul className={styles.expectList}>
            <li>
              <Users size={13} />
              <span>Networking with students &amp; alumni from top universities</span>
            </li>
            <li>
              <MessageCircle size={13} />
              <span>Interactive talks on admissions, scholarships &amp; student life</span>
            </li>
            <li>
              <Star size={13} />
              <span>Special guests and experienced speakers</span>
            </li>
            <li>
              <Rocket size={13} />
              <span>The live launch of something big for Central Asian students</span>
            </li>
          </ul>
        </div>

        <div className={styles.actions}>
          {alreadyRegistered ? (
            <span className={styles.registeredPill}>
              <CheckCircle2 size={13} /> You're registered
            </span>
          ) : (
            <button
              type="button"
              className={styles.cta}
              onClick={() => navigate(EVENT_PATH)}
            >
              Register now <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default TopcoachLaunchEventCard;
