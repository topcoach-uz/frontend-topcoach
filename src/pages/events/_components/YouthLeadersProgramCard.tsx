import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import { ArrowRight, Globe2 } from 'lucide-react';
import { useYouthLeadersCardSnapshot } from '../youth-leaders-application/useYouthLeadersCardSnapshot';
import styles from './YouthLeadersProgramCard.module.scss';

/**
 * Entry point from Events → multi-step international youth forum / WYDF-style registration (user flow).
 * Reflects local draft / submission state (mock until backend).
 */
export default function YouthLeadersProgramCard() {
  const navigate = useNavigate();
  const snapshot = useYouthLeadersCardSnapshot();

  const go = () => navigate('/events/youth-leaders-application');

  const statusTagColor = (s: string) => {
    if (s === 'approved') return 'green';
    if (s === 'rejected') return 'red';
    return 'gold';
  };

  let desc =
    'Multi-step registration: personal details, ID & passport, thematic forum, contact & bio, and arrival / departure information. Submit for admin review (backend integration next).';
  let cta = 'Start application';
  let badge: React.ReactNode = null;

  if (snapshot.kind === 'submitted') {
    const { submission } = snapshot;
    const st = submission.status;
    const dateLabel = dayjs(submission.submittedAt).format('MMM D, YYYY');
    const statusPhrase =
      st === 'pending' ? 'Under review' : st === 'approved' ? 'Approved' : 'Not approved';
    desc = `Submitted on ${dateLabel}. Status: ${statusPhrase}. Open this page anytime to see updates (saved on this device until backend sync).`;
    cta = 'View application status';
    badge = (
      <Tag color={statusTagColor(st)} className={styles.statusTag}>
        {st === 'pending' ? 'Pending review' : st === 'approved' ? 'Approved' : 'Not approved'}
      </Tag>
    );
  } else if (snapshot.kind === 'resume') {
    desc =
      snapshot.uiPhase === 'review'
        ? 'You reached the final review. You can submit or go back to edit any section — progress is saved on this device.'
        : `Draft in progress — last step: ${snapshot.stepLabel}. Continue where you left off.`;
    cta = snapshot.uiPhase === 'review' ? 'Continue to review' : 'Resume application';
    badge = (
      <Tag color="blue" className={styles.statusTag}>
        Draft saved
      </Tag>
    );
  }

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      }}
    >
      <div className={styles.iconWrap} aria-hidden>
        <Globe2 size={28} strokeWidth={1.75} />
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>International Youth Leaders Program</h2>
          {badge}
        </div>
        <p className={styles.desc}>{desc}</p>
        <span className={styles.cta}>
          {cta} <ArrowRight size={18} aria-hidden />
        </span>
      </div>
    </div>
  );
}
