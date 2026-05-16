import React, { useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'antd';
import { Lock, Users, MessageCircle, Sparkles, BookOpen, FlaskConical, Presentation, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useCommunityAccessGate } from 'src/lib/communityAccess';

import styles from './CommunityLockedPage.module.scss';

export type CommunityLockVariant =
  | 'feed'
  | 'ai-major-match'
  | 'admissions-program'
  | 'sat-course'
  | 'research-program'
  | 'research-prep-coming-soon'
  | 'my-rewards'
  | 'study-buddies';

type CommunityLockedPageProps = {
  variant?: CommunityLockVariant;
  /**
   * If provided, dismiss closes the popup via this callback instead of
   * navigating back to the dashboard. Useful when the popup is opened
   * from inside a page that should stay mounted after dismiss
   * (e.g. the Admissions Program landing page).
   */
  onClose?: () => void;
};

type VariantCopy = {
  badge: string;
  title: string;
  lead: string;
  bullets: { icon: 'users' | 'message' | 'sparkles' | 'book' | 'flask' | 'presentation'; text: string }[];
};

function BulletIcon({ kind }: { kind: VariantCopy['bullets'][0]['icon'] }) {
  const common = { size: 16 as const, strokeWidth: 2 as const };
  switch (kind) {
    case 'users':
      return <Users {...common} />;
    case 'message':
      return <MessageCircle {...common} />;
    case 'sparkles':
      return <Sparkles {...common} />;
    case 'book':
      return <BookOpen {...common} />;
    case 'flask':
      return <FlaskConical {...common} />;
    case 'presentation':
      return <Presentation {...common} />;
    default:
      return <Sparkles {...common} />;
  }
}

/**
 * Community enrollment — compact modal overlay (TopCoach crimson, neutral grays).
 */
export default function CommunityLockedPage({ variant = 'feed', onClose }: CommunityLockedPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const copy = useMemo((): VariantCopy => {
    const defaults: Record<CommunityLockVariant, VariantCopy> = {
      feed: {
        badge: t('studentHub.communityLock.badgeCommunity', 'Community'),
        title: t('studentHub.communityLock.feedTitle', 'Connect with peers and mentors on TopCoach'),
        lead: t(
          'studentHub.communityLock.feedLead',
          'The Community hub includes the feed, study groups, study buddies, and mentor discovery — built for students in our full journey experience.',
        ),
        bullets: [
          { icon: 'users', text: t('studentHub.communityLock.bulletPartners', 'Join conversations and find accountability partners') },
          { icon: 'message', text: t('studentHub.communityLock.bulletMessages', 'Message threads and mentor office hours (where available)') },
          { icon: 'sparkles', text: t('studentHub.communityLock.bulletCoins', 'Earn coins from engagement and unlock rewards') },
        ],
      },
      'ai-major-match': {
        badge: t('studentHub.communityLock.badgeAiMajor', 'AI Major Match'),
        title: t('studentHub.communityLock.aiTitle', 'Match majors and college lists with Community'),
        lead: t(
          'studentHub.communityLock.aiLead',
          'AI Major Match and integrated college lists are part of the Community learning path — personalized recommendations, shortlists, and progress in one workspace.',
        ),
        bullets: [
          { icon: 'book', text: t('studentHub.communityLock.aiB1', 'Psychometric insights plus AI-guided major suggestions') },
          { icon: 'users', text: t('studentHub.communityLock.aiB2', 'Compare college lists with peers and mentor benchmarks') },
          { icon: 'sparkles', text: t('studentHub.communityLock.aiB3', 'Earn rewards as you complete discovery milestones') },
        ],
      },
      'admissions-program': {
        badge: t('studentHub.communityLock.badgeAdmissions', 'Admissions program'),
        title: t('studentHub.communityLock.admissionsTitle', 'Structured admissions lessons with Community'),
        lead: t(
          'studentHub.communityLock.admissionsLead',
          'The full admissions course track — essays, deadlines, and lesson progress — is bundled with Community so your learning stays connected to mentors and peers.',
        ),
        bullets: [
          { icon: 'book', text: t('studentHub.communityLock.admissionsB1', 'Sequential lessons with clear completion and pacing') },
          { icon: 'message', text: t('studentHub.communityLock.admissionsB2', 'Office hours and threads tied to your application timeline') },
          { icon: 'sparkles', text: t('studentHub.communityLock.admissionsB3', 'Rewards and checkpoints as you ship drafts and milestones') },
        ],
      },
      'sat-course': {
        badge: t('studentHub.communityLock.badgeSat', 'SAT Prep'),
        title: t('studentHub.communityLock.satTitle', 'SAT prep with Community support'),
        lead: t(
          'studentHub.communityLock.satLead',
          'ScholarHub SAT prep and cohort-style accountability — practice pacing, review sessions, and mentor touchpoints — unlock with Community enrollment.',
        ),
        bullets: [
          { icon: 'book', text: t('studentHub.communityLock.satB1', 'Full lesson library with Math and English tracks') },
          { icon: 'users', text: t('studentHub.communityLock.satB2', 'Study groups and buddy matching for test season') },
          { icon: 'sparkles', text: t('studentHub.communityLock.satB3', 'Coins and streaks for consistent practice') },
        ],
      },
      'research-program': {
        badge: t('studentHub.communityLock.badgeResearch', 'Research program'),
        title: t('studentHub.communityLock.researchTitle', 'Research narrative and opportunities with Community'),
        lead: t(
          'studentHub.communityLock.researchLead',
          'Build a credible research story: outreach templates, lab narratives, and opportunity tracking — available in the Community research track.',
        ),
        bullets: [
          { icon: 'flask', text: t('studentHub.communityLock.researchB1', 'Guided steps from cold emails to reflection write-ups') },
          { icon: 'users', text: t('studentHub.communityLock.researchB2', 'Peer and mentor feedback on your research arc') },
          { icon: 'sparkles', text: t('studentHub.communityLock.researchB3', 'Unlock rewards as you land roles and milestones') },
        ],
      },
      'research-prep-coming-soon': {
        badge: t('studentHub.communityLock.badgeComingSoon', 'Coming soon'),
        title: t('studentHub.communityLock.researchPrepSoonTitle', 'Research Prep is almost here'),
        lead: t(
          'studentHub.communityLock.researchPrepSoonLead',
          'We are finishing the 8-week Research Prep curriculum and mentor grading workflow. The hub entry stays in place — check back shortly.',
        ),
        bullets: [
          { icon: 'flask', text: t('studentHub.communityLock.researchSoonB1', 'Weekly lessons, knowledge checks, and assignments') },
          { icon: 'users', text: t('studentHub.communityLock.researchSoonB2', 'Mentor feedback on your research writing') },
          { icon: 'sparkles', text: t('studentHub.communityLock.researchSoonB3', 'Same workspace as Community when we open access') },
        ],
      },
      'my-rewards': {
        badge: t('studentHub.communityLock.badgeRewards', 'My Rewards'),
        title: t('studentHub.communityLock.rewardsTitle', 'Redeem coins and unlock perks with Community'),
        lead: t(
          'studentHub.communityLock.rewardsLead',
          'The rewards store, coin balance, and redemptions are part of the Community experience — earn through engagement on the feed and in groups, then spend on perks and boosts.',
        ),
        bullets: [
          { icon: 'sparkles', text: t('studentHub.communityLock.rewardsB1', 'Spend coins on essay reviews, mentor credits, and merch') },
          { icon: 'users', text: t('studentHub.communityLock.rewardsB2', 'Earn coins from posts, comments, and streaks in Community') },
          { icon: 'message', text: t('studentHub.communityLock.rewardsB3', 'Unlock higher tiers as you stay active with peers and mentors') },
        ],
      },
      'study-buddies': {
        badge: t('studentHub.communityLock.badgeStudyBuddies', 'Study buddies'),
        title: t('studentHub.communityLock.studyBuddiesTitle', 'Find a study buddy with Community'),
        lead: t(
          'studentHub.communityLock.studyBuddiesLead',
          'Match with peers on similar timelines and goals — accountability partners, essay swaps, and test-season pairs are part of Community.',
        ),
        bullets: [
          { icon: 'users', text: t('studentHub.communityLock.studyBuddiesB1', 'Request and accept buddy matches by goal and schedule') },
          { icon: 'message', text: t('studentHub.communityLock.studyBuddiesB2', 'Message and coordinate without leaving My Journey') },
          { icon: 'sparkles', text: t('studentHub.communityLock.studyBuddiesB3', 'Unlock matching after Community enrollment') },
        ],
      },
    };
    return defaults[variant];
  }, [t, variant]);

  const isResearchComingSoon = variant === 'research-prep-coming-soon';

  // Funnel-aware destination. The gate decides whether to send the user
  // to the placement test, the profile wizard, the roadmap preview, or
  // the subscription tab — based on how far they've made it through the
  // Community-membership funnel. Admin-granted users land back in
  // /student-hub (the gate's "eligible" branch).
  const gate = useCommunityAccessGate();

  const handleUpgrade = () => {
    if (isResearchComingSoon) return;
    navigate(gate.destination);
  };

  const backPath = '/student-hub?section=dashboard';

  const dismiss = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    navigate(backPath);
  }, [navigate, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dismiss]);

  /**
   * Portal to document.body: the hub wraps content in `.sectionSwap`, which uses a CSS
   * animation with `transform`. Transformed ancestors break `position: fixed` (modal
   * positions against the column, clips, overlaps). Rendering on body fixes it.
   */
  const modal = (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-lock-headline"
      onClick={dismiss}
    >
      <div
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className={styles.panelHeader}>
          <div className={styles.panelHeaderLeft}>
            <Lock className={styles.headerLock} size={16} strokeWidth={2.5} aria-hidden />
            <span className={styles.badgeLabel}>{copy.badge}</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={dismiss}
            aria-label={t('studentHub.communityLock.close', 'Close')}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <h2 id="community-lock-headline" className={styles.headline}>
          {copy.title}
        </h2>

        <p className={styles.lead}>{copy.lead}</p>

        <ul className={styles.points}>
          {copy.bullets.map((b) => (
            <li key={b.text}>
              <span className={styles.bulletIcon}>
                <BulletIcon kind={b.icon} />
              </span>
              <span>{b.text}</span>
            </li>
          ))}
        </ul>

        {!isResearchComingSoon && (
          <div className={styles.actions}>
            <Button type="primary" size="large" className={styles.primaryBtn} onClick={handleUpgrade}>
              {t('studentHub.communityLock.unlockCta', 'Unlock Community')}
            </Button>
          </div>
        )}

        {isResearchComingSoon && (
          <div className={styles.actions}>
            <Button type="primary" size="large" className={styles.primaryBtn} onClick={dismiss}>
              {t('studentHub.communityLock.backCta', 'Back to hub')}
            </Button>
          </div>
        )}

        {!isResearchComingSoon && (
          <p className={styles.finePrint}>
            {t(
              'studentHub.communityLock.modalDisclaimer',
              'Unlock switches your account view to the Community experience.',
            )}
          </p>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modal, document.body);
}
