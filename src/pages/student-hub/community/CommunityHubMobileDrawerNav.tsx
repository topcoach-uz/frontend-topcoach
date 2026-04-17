import React, { useMemo } from 'react';
import { Avatar, Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Home,
  User,
  PlayCircle,
  Trophy,
  Settings,
  Lock,
  FlaskConical,
  Presentation,
  MessageCircle,
  UserPlus,
} from 'lucide-react';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import { useTypedSelector } from 'src/app/store';
import UnifiedIcon from '../../../components/common/icons/UnifiedIcon';
import styles from './communityHubMock.module.scss';
import { getLatestCreatedImg } from 'src/utils';

const ENABLE_COMMUNITY_FEED =
  String(import.meta.env.VITE_ENABLE_COMMUNITY_FEED ?? 'false').toLowerCase() === 'true';

export interface CommunityHubMobileDrawerNavProps {
  onNavigate: () => void;
}

/**
 * Hub left column (profile + HOME / JOURNEY / PROGRAMS / ACCOUNT) for mobile drawer.
 * URL is the source of truth — matches CommunityHubMockPage navigation targets.
 */
export default function CommunityHubMobileDrawerNav({ onNavigate }: CommunityHubMobileDrawerNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isCommunityEnrolled } = useJourneyExperience();
  const profile = useTypedSelector((s) => s.auth.profile);
  const currentProfile = useMemo(() => {
    const fullName = profile?.profile?.name?.trim() || t('common.user', 'User');
    const username =
      (profile?.profile as any)?.username?.trim() ||
      `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}`;
    return {
      name: fullName,
      username: username.startsWith('@') ? username : `@${username}`,
      avatar: getLatestCreatedImg(profile?.profile?.media || []),
    };
  }, [profile?.profile, t]);

  const { section, target } = useMemo(() => {
    const p = new URLSearchParams(location.search);
    return { section: p.get('section') || '', target: p.get('target') };
  }, [location.search]);

  const go = (to: string) => {
    const nextTarget =
      !ENABLE_COMMUNITY_FEED && to.includes('section=feed')
        ? '/student-hub?section=my-learning'
        : to;
    navigate(nextTarget, { replace: true });
    onNavigate();
  };

  const isDashboard = !isCommunityEnrolled && section === 'dashboard';
  const isFeed = section === 'feed';
  const isMyLearning = section === 'my-learning';
  const isMessages = section === 'messages';
  const isBuddies = section === 'buddies';
  const isOthers = (targ: string) => section === 'others' && target === targ;
  const isAiMajor = section === 'ai-major-match';
  const isAdmissions = section === 'admissions-program';
  const isSat = section === 'sat-course';
  const isResearch = section === 'research-program';
  const isRewards = section === 'account' && target === 'rewards';
  const isSettings = section === 'account' && target === 'settings';

  return (
    <div className={styles.mobileDrawerNav}>
      {isCommunityEnrolled && (
        <Card
          className={styles.profileCard}
          bordered={false}
          role="button"
          tabIndex={0}
          aria-label={t('studentHub.settingsMock.title', 'Account & settings')}
          onClick={() => go('/student-hub?section=account&target=settings')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              go('/student-hub?section=account&target=settings');
            }
          }}
        >
          <div className={styles.profileTop}>
            <Avatar
              size={48}
              src={currentProfile.avatar || undefined}
              icon={<User size={16} />}
              className={styles.profileAvatar}
            />
            <div>
              <div className={styles.profileName}>{currentProfile.name}</div>
              <div className={styles.profileHandle}>
                {currentProfile.username}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className={styles.leftNav}>
        {!isCommunityEnrolled && (
          <button
            type="button"
            className={`${styles.navItem} ${isDashboard ? styles.navItemActive : ''}`}
            onClick={() => go('/student-hub?section=dashboard')}
          >
            <span className={styles.navIconCircle}>
              <Home size={20} color="#8b0000" />
            </span>
            <span className={styles.navLabel}>{t('studentHub.nav.dashboard', 'Dashboard')}</span>
          </button>
        )}

        {ENABLE_COMMUNITY_FEED && (
          <button
            type="button"
            className={`${styles.navItem} ${isFeed ? styles.navItemActive : ''}`}
            onClick={() => go('/student-hub?section=feed')}
          >
            <span className={styles.navIconCircle}>
              <Compass size={20} color="#8b0000" />
            </span>
            <span className={styles.navLabel}>{t('studentHub.hub.feed', 'Feed')}</span>
          </button>
        )}

        <div className={styles.leftNavHeader}>{t('studentHub.hub.navCommunity', 'COMMUNITY')}</div>
        <button
          type="button"
          className={`${styles.navItem} ${isMessages ? styles.navItemActive : ''}`}
          onClick={() => go('/student-hub?section=messages')}
        >
          <span className={styles.navIconCircle}>
            <MessageCircle size={20} color="#8b0000" />
          </span>
          <span className={styles.navLabel}>{t('studentHub.hub.messages', 'Messages')}</span>
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${isBuddies ? styles.navItemActive : ''}`}
          onClick={() => go('/student-hub?section=buddies')}
        >
          <span className={styles.navIconCircle}>
            <UserPlus size={20} color="#8b0000" />
          </span>
          <span className={styles.navLabel}>{t('studentHub.hub.findStudyBuddy', 'Find study buddy')}</span>
          {!isCommunityEnrolled && <Lock size={14} className={styles.navLockIcon} />}
        </button>
        <button type="button" className={styles.navItem} onClick={() => { onNavigate(); navigate('/mentors'); }}>
          <span className={styles.navIconCircle}>
            <UnifiedIcon name="mentors" size="md" color="primary" />
          </span>
          <span className={styles.navLabel}>{t('studentHub.hub.mentors', 'Mentors')}</span>
        </button>

        <div className={styles.leftNavHeader}>{t('studentHub.hub.navLearning', 'LEARNING')}</div>
        {isCommunityEnrolled && (
          <button
            type="button"
            className={`${styles.navItem} ${isMyLearning ? styles.navItemActive : ''}`}
            onClick={() => go('/student-hub?section=my-learning')}
          >
            <span className={styles.navIconCircle}>
              <PlayCircle size={20} color="#8b0000" />
            </span>
            <span className={styles.navLabel}>{t('studentHub.hub.myProgress', 'My progress')}</span>
          </button>
        )}
        <button
          type="button"
          className={`${styles.navItem} ${isOthers('full-support') ? styles.navItemActive : ''}`}
          onClick={() => go('/student-hub?section=others&target=full-support')}
        >
          <span className={styles.navIconCircle}>
            <UnifiedIcon name="full-support" size="md" color="primary" />
          </span>
          <span className={styles.navLabel}>{t('fullSupport.navLabel', 'Full Support')}</span>
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${isAiMajor ? styles.navItemActive : ''}`}
          onClick={() => go('/student-hub?section=ai-major-match')}
        >
          <span className={styles.navIconCircle}>
            <UnifiedIcon name="major-match" size="md" color="primary" />
          </span>
          <span className={styles.navLabel}>{t('studentHub.hub.aiMajorMatch', 'AI Major Match')}</span>
          {!isCommunityEnrolled && <Lock size={14} className={styles.navLockIcon} />}
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${isSat ? styles.navItemActive : ''}`}
          onClick={() => go('/student-hub?section=sat-course')}
        >
          <span className={styles.navIconCircle}>
            <UnifiedIcon name="sat" size="md" color="primary" />
          </span>
          <span className={styles.navLabel}>{t('studentHub.hub.satTestPrep', 'SAT test prep')}</span>
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${isAdmissions ? styles.navItemActive : ''}`}
          onClick={() => go('/student-hub?section=admissions-program')}
        >
          <span className={styles.navIconCircle}>
            <UnifiedIcon name="admissions" size="md" color="primary" />
          </span>
          <span className={styles.navLabel}>{t('studentHub.hub.admissions', 'Admissions')}</span>
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${isResearch ? styles.navItemActive : ''}`}
          onClick={() => go('/student-hub?section=research-program')}
        >
          <span className={styles.navIconCircle}>
            <FlaskConical size={20} color="#8b0000" />
          </span>
          <span className={styles.navLabel}>{t('studentHub.hub.researchPrep', 'Research Prep')}</span>
          {!isCommunityEnrolled && <Lock size={14} className={styles.navLockIcon} />}
        </button>
        <button
          type="button"
          className={styles.navItem}
          onClick={() => {
            onNavigate();
            navigate('/events');
          }}
        >
          <span className={styles.navIconCircle}>
            <Presentation size={20} color="#8b0000" />
          </span>
          <span className={styles.navLabel}>{t('studentHub.hub.opportunitiesNav', 'Opportunities')}</span>
        </button>

        <div className={styles.leftNavHeader}>{t('studentHub.hub.navAccount', 'ACCOUNT')}</div>
        <button
          type="button"
          className={`${styles.navItem} ${isRewards ? styles.navItemActive : ''}`}
          onClick={() => go('/student-hub?section=account&target=rewards')}
        >
          <span className={styles.navIconCircle}>
            <Trophy size={20} color="#8b0000" />
          </span>
          <span className={styles.navLabel}>{t('studentHub.hub.myRewards', 'My Rewards')}</span>
          {!isCommunityEnrolled && <Lock size={14} className={styles.navLockIcon} />}
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${isSettings ? styles.navItemActive : ''}`}
          onClick={() => go('/student-hub?section=account&target=settings')}
        >
          <span className={styles.navIconCircle}>
            <Settings size={20} color="#8b0000" />
          </span>
          <span className={styles.navLabel}>{t('studentHub.nav.settings', 'Settings')}</span>
        </button>
      </div>
    </div>
  );
}
