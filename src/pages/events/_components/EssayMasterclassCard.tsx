import React from 'react';
import { Button } from 'antd';
import { Calendar, GraduationCap, Radio, Send, Ticket } from 'lucide-react';
import styles from './EssayMasterclassCard.module.scss';
import {
  MASTERCLASS_BANNER_IMG,
  MASTERCLASS_RESERVE_URL,
  MASTERCLASS_SPEAKER,
  MASTERCLASS_SPEAKER_SCHOOL,
  isEssayMasterclassLive,
} from './essayMasterclass';

/**
 * Featured announcement for the August 16 live essay masterclass with
 * Shakhnoza Salimjonova (Princeton SPIA).
 *
 * The banner artwork is the hero: it fills the left half of the card
 * edge to edge, with the pitch and the Telegram reserve CTA beside it.
 *
 * Two lives:
 *  - default (events page featured slot): auto-hides once the session
 *    has run (see essayMasterclass.ts);
 *  - `archive` (its own page at /events/essay-masterclass, opened from
 *    the past-events grid): always renders, drops the reserve CTA, and
 *    reads as a record of the session instead of an invitation.
 */
export default function EssayMasterclassCard({ archive = false }: { archive?: boolean }) {
  if (!archive && !isEssayMasterclassLive()) return null;

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.media}>
          <img
            src={MASTERCLASS_BANNER_IMG}
            alt="How to write the essay that gets in — live masterclass with Shakhnoza Salimjonova"
          />
        </div>

        <div className={styles.body}>
          <span className={styles.eyebrow}>
            {archive
              ? 'Live masterclass · Held August 16, 2026'
              : 'Live masterclass · August 16 · 20:00'}
          </span>

          <h2 className={styles.title}>
            How to write the <span>essay that gets in</span>
          </h2>

          <blockquote className={styles.quote}>
            &ldquo;He applied twice. Strong grades, good scores, real
            activities. Two rejections. When we asked what went wrong, he
            said: <b>I think it was my essays. But nobody ever told me.</b>&rdquo;
          </blockquote>

          <p className={styles.tagline}>
            You cannot fix what you cannot see. This is not a lecture, it is a
            live teardown: Shakhnoza opens real essays in front of you and
            takes them apart, line by line.
          </p>

          <ul className={styles.points}>
            <li>Why one opening pulls the reader in, and why the next one loses them</li>
            <li>The exact line where an essay stops being memorable</li>
            <li>What an admissions officer is actually doing while reading yours</li>
            <li>How a weak paragraph gets rebuilt, in real time</li>
          </ul>

          <div className={styles.presenter}>
            <GraduationCap size={18} />
            <span>
              <b>{MASTERCLASS_SPEAKER}</b>
              <em>{MASTERCLASS_SPEAKER_SCHOOL}</em>
            </span>
          </div>

          <div className={styles.facts}>
            <span>
              <Calendar size={14} /> August 16 · 20:00
            </span>
            <span>
              <Radio size={14} /> Live, not recorded
            </span>
            <span>
              <Ticket size={14} /> Paid · seats limited
            </span>
          </div>

          <div className={styles.foot}>
            {archive ? (
              <span className={styles.footNote}>
                This session ran live on August 16 and was not recorded
              </span>
            ) : (
              <>
                <Button
                  type="primary"
                  size="large"
                  className={styles.reserveButton}
                  icon={<Send size={15} />}
                  href={MASTERCLASS_RESERVE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reserve your seat
                </Button>
                <span className={styles.footNote}>Reservations close when seats run out</span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
