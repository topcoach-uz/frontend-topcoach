import React from 'react';
import { Button } from 'antd';
import { Calendar, GraduationCap, Video } from 'lucide-react';
import styles from './EssayMasterclassCard.module.scss';
import {
  IVY_ESSAY_WORKSHOP_BANNER_IMG,
  IVY_ESSAY_WORKSHOP_DATE_LABEL,
  IVY_ESSAY_WORKSHOP_JOIN_URL,
  IVY_ESSAY_WORKSHOP_SPEAKER,
  IVY_ESSAY_WORKSHOP_SPEAKER_SCHOOL,
  isIvyEssayWorkshopLive,
  ivyEssayWorkshopHasJoinLink,
} from './ivyEssayWorkshop';

/**
 * Featured announcement for the August 26 live workshop with Kenza
 * (Princeton). Shares the featured-card layout with the essay masterclass
 * and the Ivy League workshop: banner full-bleed in the left half, pitch
 * beside it.
 *
 * Two lives, like EssayMasterclassCard:
 *  - default (events page featured slot): auto-hides once the session has
 *    run (see ivyEssayWorkshop.ts);
 *  - `archive` (its own page at /events/ivy-essay-workshop, opened from
 *    the past-events grid): always renders and drops the join CTA.
 *
 * The Meet link is open to everyone — no login gate — so the Join button
 * renders the same for anonymous visitors and members alike.
 */
export default function IvyEssayWorkshopCard({ archive = false }: { archive?: boolean }) {
  if (!archive && !isIvyEssayWorkshopLive()) return null;

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.media}>
          {/* Portrait poster (1080x1350) in a full-bleed cover crop.
              Biased upward so the logo, date badge and Kenza's face stay
              in frame and the crop stops just above the poster's white
              "Topic:" panel — that panel's copy is repeated in the card
              body, and a sliver of it peeking in reads as a mistake. */}
          <img
            src={IVY_ESSAY_WORKSHOP_BANNER_IMG}
            alt="How to Craft an Ivy League-Worthy Personal Essay — live workshop with Kenza, Princeton University"
            style={{ objectPosition: 'center 14%' }}
          />
        </div>

        <div className={styles.body}>
          <span className={styles.eyebrow}>
            {archive
              ? 'Live workshop · Held August 26, 2026'
              : `Live workshop · ${IVY_ESSAY_WORKSHOP_DATE_LABEL}`}
          </span>

          <h2 className={styles.title}>
            How to Craft an{' '}
            {/* nowrap: the browser will happily break at the hyphen and
                split the phrase across two lines, which reads badly. */}
            <span style={{ whiteSpace: 'nowrap' }}>Ivy League-Worthy</span>{' '}
            Personal Essay
          </h2>

          <p className={styles.tagline}>
            An exclusive workshop with Kenza, a Princeton University graduate
            with a BA in Public and International Affairs and experience
            tutoring students throughout the college admissions process.
          </p>

          <ul className={styles.points}>
            <li>Crafting the personal essay</li>
            <li>Standing out with your application</li>
            <li>Writing prompts for Ivy League universities</li>
          </ul>

          <div className={styles.presenter}>
            <GraduationCap size={18} />
            <span>
              <b>{IVY_ESSAY_WORKSHOP_SPEAKER}</b>
              <em>{IVY_ESSAY_WORKSHOP_SPEAKER_SCHOOL}</em>
            </span>
          </div>

          <div className={styles.facts}>
            <span>
              <Calendar size={14} /> {IVY_ESSAY_WORKSHOP_DATE_LABEL}
            </span>
          </div>

          <div className={styles.foot}>
            {archive ? (
              <span className={styles.footNote}>
                This session ran live on the TopCoach platform on August 26
              </span>
            ) : ivyEssayWorkshopHasJoinLink ? (
              <>
                <Button
                  type="primary"
                  size="large"
                  className={styles.reserveButton}
                  icon={<Video size={15} />}
                  href={IVY_ESSAY_WORKSHOP_JOIN_URL}
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
              <span className={styles.footNote}>
                The join link will be published here before the session starts
                on August 26 at 20:00
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
