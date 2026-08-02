import React, { useState } from 'react';
import { Button } from 'antd';
import { Play, GraduationCap, ExternalLink } from 'lucide-react';
import styles from './PersonalStatementWorkshopCard.module.scss';
import {
  WORKSHOP_EMBED_URL,
  WORKSHOP_WATCH_URL,
  workshopHasVideo,
} from './workshopReplay';

/**
 * Events → Personal Statement Workshop with Nazira Davroni (recording).
 *
 * The session has run; this is now a "watch the replay" card. The branded
 * poster acts as the video thumbnail and the recording plays inline (a
 * youtube-nocookie iframe is only mounted once the user hits play).
 */
export default function PersonalStatementWorkshopCard() {
  const [playing, setPlaying] = useState(false);
  const play = () => workshopHasVideo && setPlaying(true);

  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.media}>
          {playing ? (
            <iframe
              className={styles.player}
              src={WORKSHOP_EMBED_URL}
              title="Personal Statement Workshop recording"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              className={styles.cover}
              onClick={play}
              aria-label="Play the workshop recording"
              disabled={!workshopHasVideo}
            >
              <img
                src="/img/workshop2.jpeg"
                alt="Personal Statement Workshop with Nazira Davroni"
                loading="lazy"
              />
              {workshopHasVideo && (
                <span className={styles.playBadge}>
                  <Play size={26} fill="currentColor" />
                </span>
              )}
              <span className={styles.replayTag}>Recording</span>
            </button>
          )}
        </div>

        <div className={styles.left}>
          <span className={styles.eyebrow}>Workshop replay · Watch anytime</span>

          <h3 className={styles.title}>
            How to Write a Strong <span>Personal Statement</span>
          </h3>

          <p className={styles.tagline}>
            Missed it live? Watch the full replay — how to write a standout
            personal statement, avoid the common mistakes, and make your essay
            work in the admissions process.
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

          <div className={styles.foot}>
            <Button
              type="primary"
              size="large"
              className={styles.joinButton}
              disabled={!workshopHasVideo}
              onClick={play}
              icon={<Play size={16} fill="currentColor" />}
            >
              Watch the replay
            </Button>
            {workshopHasVideo && (
              <a
                className={styles.ytLink}
                href={WORKSHOP_WATCH_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on YouTube <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
