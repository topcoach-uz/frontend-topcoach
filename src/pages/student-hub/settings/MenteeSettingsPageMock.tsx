import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Upload, Input, Typography, message, Avatar, Select } from 'antd';
import {
  User,
  Camera,
  CreditCard,
  Sparkles,
  Users as UsersIcon,
  Bell,
  Target,
  Send,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useInvalidateGetMeMutation, useGetTelegramStatusQuery } from 'src/app/services/users';
import TelegramConnectionModal from 'src/components/TelegramConnectionModal';
import { useTypedSelector } from 'src/app/store';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import { getLatestCreatedImg } from 'src/utils';
import { baseUrl } from 'src/app/services/api/const';
import { ACCESS_TOKEN } from 'src/constants/storage';
import SubscriptionTab from './subscription';
import ReferralsTab from './ReferralsTab';
import styles from './MenteeSettingsPageMock.module.scss';

const { Title, Text, Paragraph } = Typography;
const PROFILE_PHOTO_MAX_MB = 2;
const PROFILE_PHOTO_MAX_BYTES = PROFILE_PHOTO_MAX_MB * 1024 * 1024;
const PROFILE_PHOTO_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png']);

const normalizeUsernameInput = (value: string) =>
  (value || '')
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 32);

export interface MenteeSettingsPageMockProps {
  /** Renders inside Community Hub center column (premium) — no classic sidebar; tighter chrome. */
  embeddedInHub?: boolean;
}

/**
 * Mentee account settings page.
 */
export default function MenteeSettingsPageMock({ embeddedInHub = false }: MenteeSettingsPageMockProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isCommunityEnrolled, setCommunityEnrolled } = useJourneyExperience();
  const profile = useTypedSelector((s) => s.auth.profile);
  const [invalidateGetMe] = useInvalidateGetMeMutation();
  const { data: tg } = useGetTelegramStatusQuery();
  const [tgModalOpen, setTgModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(
    () => profile?.profile?.name || '',
  );
  const [username, setUsername] = useState<string>(
    () => normalizeUsernameInput((profile?.profile as any)?.username || ''),
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  /**
   * Editorial tab state. We expose Profile / Experience / Notifications.
   * Security is intentionally omitted — password resets happen via email
   * today and there's no UI to manage 2FA yet, so surfacing an empty tab
   * would feel broken. Study buddy preferences moved into the Find Study
   * Buddy hub (see the `?tab=studyBuddy` redirect below).
   */
  type SettingsTabKey =
    | 'profile'
    | 'experience'
    | 'notifications'
    | 'subscription'
    | 'referrals';

  // Read initial tab from URL `?tab=` so other pages can deep-link
  // (e.g. the Community lock popup → subscription tab). When no tab is
  // specified we open on Subscription & billing — that's the most common
  // reason students land here.
  const initialTab: SettingsTabKey = (() => {
    if (typeof window === 'undefined') return 'subscription';
    const fromUrl = new URLSearchParams(window.location.search).get('tab');
    const allowed: SettingsTabKey[] = [
      'profile',
      'experience',
      'notifications',
      'subscription',
      'referrals',
    ];
    return allowed.includes(fromUrl as SettingsTabKey)
      ? (fromUrl as SettingsTabKey)
      : 'subscription';
  })();
  const [activeTab, setActiveTab] = useState<SettingsTabKey>(initialTab);

  // Re-sync on URL changes (in-app navigation between sections shares
  // the same component tree, so `popstate` / pushState updates need
  // to be reflected here).
  useEffect(() => {
    const onPop = () => {
      const fromUrl = new URLSearchParams(window.location.search).get('tab');
      const allowed: SettingsTabKey[] = [
        'profile',
        'experience',
        'notifications',
        'subscription',
        'referrals',
      ];
      if (allowed.includes(fromUrl as SettingsTabKey)) {
        setActiveTab(fromUrl as SettingsTabKey);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // The rich "Profile" tab (Personal / Academic / Activities) used to
  // live here as `?tab=studentProfile`, duplicating the profile hub at
  // `?section=others&target=profile`. It's been removed in favor of the
  // hub — old deep-links redirect there instead of rendering blank.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromUrl = new URLSearchParams(window.location.search).get('tab');
    if (fromUrl === 'studentProfile') {
      navigate('/student-hub?section=others&target=profile', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The "Study buddy" tab used to live here too — those preferences now
  // live directly inside Find Study Buddy (right where they're used to
  // rank Discover), so old `?tab=studyBuddy` deep-links redirect there.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromUrl = new URLSearchParams(window.location.search).get('tab');
    if (fromUrl === 'studyBuddy') {
      navigate('/student-hub?section=buddies', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The "Roadmap" tab used to live here, then briefly inside the profile
  // hub (`ProfilePage`) — it's now embedded inline on the Major Match v2
  // results screen instead of having its own address at all (it's
  // generated/regenerated the moment a Major Match is submitted, so
  // results is where it belongs). Old `?tab=roadmap` deep-links redirect
  // to Major Match rather than a tab that no longer exists.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromUrl = new URLSearchParams(window.location.search).get('tab');
    if (fromUrl === 'roadmap') {
      navigate('/student-hub?section=ai-major-match', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const email = profile?.email ?? 'you@example.com';
  const isSuperAdmin =
    profile?.managementRole === 'SuperAdmin' || (profile?.managementRole as string) === 'Owner';
  const profileImage = useMemo(
    () => getLatestCreatedImg(profile?.profile?.media || []),
    [profile?.profile?.media],
  );

  // Guard against stale media URLs that 404 on prod (file deleted from
  // /uploads/public but DB row still references it). Falls back to the
  // <User /> icon instead of leaving a broken-image circle.
  const [profileImageBroken, setProfileImageBroken] = useState(false);
  useEffect(() => {
    setProfileImageBroken(false);
  }, [profileImage, avatarUrl]);
  const avatarSrc =
    !profileImageBroken ? (avatarUrl || profileImage || undefined) : undefined;

  useEffect(() => {
    const fullName = profile?.profile?.name || '';
    const existingUsername = (profile?.profile as any)?.username;
    setDisplayName(fullName);
    const fallback = fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32) || '';
    setUsername(
      normalizeUsernameInput(existingUsername || fallback),
    );
  }, [profile?.profile?.name, (profile?.profile as any)?.username]);

  const beforeUpload = async (file: File) => {
    if (!PROFILE_PHOTO_ALLOWED_TYPES.has(file.type)) {
      message.error(t('studentHub.settingsMock.photoTypeError', 'Only JPG or PNG files are allowed.'));
      return Upload.LIST_IGNORE;
    }
    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      message.error(
        t('studentHub.settingsMock.photoSizeError', `Photo must be ${PROFILE_PHOTO_MAX_MB} MB or smaller.`),
      );
      return Upload.LIST_IGNORE;
    }

    const formData = new FormData();
    formData.append('profileImage', file);
    const url = URL.createObjectURL(file);
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      await axios.post(`${baseUrl}/users/update-profile-image`, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 30000,
      });
      setAvatarUrl(url);
      await invalidateGetMe();
      message.success(t('studentHub.settingsMock.avatarUpdated', 'Profile photo updated'));
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          t('common.error', 'Failed to upload profile photo'),
      );
    }
    return false;
  };

  return (
    <div className={`${styles.page} ${embeddedInHub ? styles.pageEmbedded : ''}`}>
      {/* Editorial header — single serif title + subtitle. The "Account"
          eyebrow was redundant with the tab strip below, and every
          per-tab body block has its own contextual heading, so a third
          layer of label was just noise. */}
      <div className={styles.editorialHeader}>
        <Title level={1} className={styles.editorialTitle}>
          {t('studentHub.settingsMock.title', 'Settings')}
        </Title>
        <Paragraph className={styles.editorialSubtitle}>
          {t(
            'studentHub.settingsMock.subtitle',
            'Manage your profile, subscription, and preferences.',
          )}
        </Paragraph>
      </div>

      {/* Tab strip — Subscription / Account / Experience / Notifications.
          Roadmap moved to the profile hub (see the redirect effect
          above). Security tab intentionally omitted (no UI to back it). */}
      <nav className={styles.tabs} aria-label="Settings sections">
        {/* Subscription first — it's the most common reason students open
            settings, and the default tab on a bare ?tab-less load. */}
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'subscription' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          {t('settings.subscription.tab', 'Subscription & billing')}
        </button>
        {/* "Account" = the basic identity card (name / username / email /
            photo). Key stays `profile` so existing ?tab=profile deep-links
            keep working. */}
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          {t('studentHub.settingsMock.account', 'Account')}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'referrals' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('referrals')}
        >
          <Gift size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
          {t('settings.referrals.tab', 'Referrals')}
        </button>
        {/* Experience tab is the SuperAdmin/Owner toggle between the
            standard and community experiences. Regular students never
            need it — their experience is driven by their actual
            subscription / Full Support enrollment — so we hide the tab
            button entirely for non-admin users. The render block below
            still has a friendly fallback for the rare case a non-admin
            lands on `?tab=experience` via a stale link. */}
        {isSuperAdmin && (
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'experience' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('experience')}
          >
            {t('studentHub.settingsMock.experience', 'Experience')}
          </button>
        )}
        {/* Notifications tab hidden until the per-channel toggle backend
            ships — surfacing static text felt half-baked. The render
            block below stays in place so re-enabling is a one-line flip. */}
      </nav>

      {/* Pointer to the rich profile hub (Personal / Academic /
          Activities) — that editing surface now lives at
          `?section=others&target=profile` on the My Journey side, not
          as a Settings tab, so students who came here looking for it
          aren't stranded. */}
      <div className={styles.profileHubHint}>
        {t(
          'studentHub.settingsMock.profileHubHintText',
          'Looking to edit your personal, academic & activities profile?',
        )}
        <a
          className={styles.profileHubHintLink}
          onClick={() => navigate('/student-hub?section=others&target=profile')}
        >
          {t('studentHub.settingsMock.profileHubHintLink', 'Edit your profile →')}
        </a>
      </div>

      {/* Pointer to Study Buddy preferences — that editing surface moved
          into the Find Study Buddy hub itself (right where matching
          happens), so it's no longer a Settings tab. */}
      <div className={styles.profileHubHint}>
        {t(
          'studentHub.settingsMock.studyBuddyMovedHintText',
          'Study buddy preferences moved to Find Study Buddy.',
        )}
        <a
          className={styles.profileHubHintLink}
          onClick={() => navigate('/student-hub?section=buddies')}
        >
          {t('studentHub.settingsMock.studyBuddyMovedHintLink', 'Find a study buddy →')}
        </a>
      </div>

      {activeTab === 'profile' && (
      <>
      <Card className={styles.card} title={<><User size={18} style={{ marginRight: 8 }} />{t('studentHub.settingsMock.account', 'Account')}</>}>
        <div className={styles.profileRow}>
          <div className={styles.avatarBlock}>
            <Avatar
              size={96}
              src={avatarSrc}
              icon={<User size={32} />}
              className={styles.avatar}
              onError={() => {
                setProfileImageBroken(true);
                return true;
              }}
            />
            <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/*">
              <Button icon={<Camera size={16} />} size="small" type="default">
                {t('studentHub.settingsMock.uploadPhoto', 'Upload photo')}
              </Button>
            </Upload>
            <Text type="secondary" className={styles.hint}>
              {t('studentHub.settingsMock.photoHint', `JPG or PNG, up to ${PROFILE_PHOTO_MAX_MB} MB`)}
            </Text>
          </div>
          <div className={styles.fields}>
            <label className={styles.label}>{t('studentHub.settingsMock.fullName', 'Full name')}</label>
            <Input size="large" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <label className={styles.label}>{t('studentHub.settingsMock.username', 'Username')}</label>
            <Input
              size="large"
              value={username}
              onChange={(e) => setUsername(normalizeUsernameInput(e.target.value))}
              placeholder="starboy"
              addonBefore="@"
            />
            <label className={styles.label}>{t('studentHub.settingsMock.email', 'Email')}</label>
            <Input size="large" value={email} disabled />
            <Button
              type="primary"
              onClick={async () => {
                try {
                  const token = localStorage.getItem(ACCESS_TOKEN);
                  await axios.put(
                    `${baseUrl}/users`,
                    {
                      profile: {
                        name: displayName.trim(),
                        username: normalizeUsernameInput(username.trim()),
                      },
                    },
                    {
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                      timeout: 30000,
                    },
                  );
                  await invalidateGetMe();
                  message.success(t('studentHub.settingsMock.saved', 'Profile saved'));
                } catch (error: any) {
                  message.error(
                    error?.response?.data?.message ||
                      error?.message ||
                      t('common.error', 'Failed to save profile'),
                  );
                }
              }}
            >
              {t('studentHub.settingsMock.saveProfile', 'Save profile')}
            </Button>
          </div>
        </div>
      </Card>

      <Card
        className={styles.card}
        title={<><Send size={18} style={{ marginRight: 8 }} />{t('studentHub.settingsMock.telegram', 'Telegram')}</>}
      >
        {tg?.status === 'connected' ? (
          <div className={styles.profileRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={20} color="#52c41a" />
              <div>
                <Text strong>{t('studentHub.settingsMock.telegramConnected', 'Connected')}</Text>
                {tg.phoneNumber && (
                  <div>
                    <Text type="secondary">{tg.phoneNumber}</Text>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={() => setTgModalOpen(true)}>
              {t('studentHub.settingsMock.telegramRelink', 'Re-link / Disconnect')}
            </Button>
          </div>
        ) : (
          <div className={styles.profileRow}>
            <Text type="secondary">
              {t(
                'studentHub.settingsMock.telegramNotConnected',
                'Not connected — get session reminders on Telegram',
              )}
            </Text>
            <Button type="primary" onClick={() => setTgModalOpen(true)}>
              {t('studentHub.settingsMock.telegramConnect', 'Connect Telegram')}
            </Button>
          </div>
        )}
      </Card>
      <TelegramConnectionModal visible={tgModalOpen} onClose={() => setTgModalOpen(false)} />
      </>
      )}

      {/* The legacy "Subscription" card shown above used to live here; it
          has been removed. The new Phase 1B "Subscription & billing" tab
          (rendered below when activeTab === 'subscription') replaces it. */}

      {activeTab === 'experience' && isSuperAdmin && (
        <Card
          className={`${styles.card} ${styles.mockJourneyCard}`}
          title={
            <>
              <Sparkles size={18} style={{ marginRight: 8 }} />
              {t('studentHub.settingsMock.mockJourneyTitle', 'My Journey experience mode')}
            </>
          }
        >
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {t(
              'studentHub.settingsMock.mockJourneyDesc',
              'Switch between the non-community hub and the Community hub. The hub title updates to reflect the mode.',
            )}
          </Paragraph>
          <div className={styles.mockJourneyRow}>
            <Text strong className={styles.mockJourneyLabel}>
              {t('studentHub.hub.mockView', 'Experience mode')}
            </Text>
            <Select
              className={styles.mockJourneySelect}
              value={isCommunityEnrolled ? 'in' : 'out'}
              onChange={(v) => {
                setCommunityEnrolled(v === 'in');
                navigate('/student-hub?section=account&target=settings', { replace: true });
              }}
              options={[
                { label: t('studentHub.hub.mockNotEnrolled', 'Standard experience'), value: 'out' },
                { label: t('studentHub.hub.mockEnrolled', 'Community experience'), value: 'in' },
              ]}
            />
          </div>
        </Card>
      )}

      {/* Non-SuperAdmin fallback for the Experience tab — the
          experience-mode toggle is dev-only, so regular users see a
          short explanatory card instead of an empty pane. */}
      {activeTab === 'experience' && !isSuperAdmin && (
        <Card className={styles.card} title={<><Sparkles size={18} style={{ marginRight: 8 }} />Experience mode</>}>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {t(
              'studentHub.settingsMock.experienceMenteeNote',
              'You are in the Community experience. New experience modes will appear here as they roll out.',
            )}
          </Paragraph>
        </Card>
      )}

      {/* Subscription & billing — Phase 1B scaffold. All data is
          mocked from `subscription/_mocks/subscription.fixtures.ts`;
          flip states with `?state=active|trialing|past_due|canceled|none`. */}
      {activeTab === 'subscription' && <SubscriptionTab />}

      {activeTab === 'referrals' && <ReferralsTab />}

      {/* Notifications — placeholder card. The toggle matrix
          (Email / Push / SMS × event types) ships alongside the
          notifications backend; we surface the section now so the
          editorial nav is complete. */}
      {activeTab === 'notifications' && (
        <Card className={styles.card} title={<><Bell size={18} style={{ marginRight: 8 }} />{t('studentHub.settingsMock.notifications', 'Notifications')}</>}>
          <Paragraph type="secondary">
            {t(
              'studentHub.settingsMock.notificationsDesc',
              'Choose how you want to be reached for each event. Email is on by default.',
            )}
          </Paragraph>
          <div className={styles.notifGroup}>
            <div className={styles.notifGroupTitle}>
              <Target size={14} /> Mentor sessions
            </div>
            <ul className={styles.notifList}>
              <li>Session reminders (24h before) · <span className={styles.notifMeta}>Email · Push · SMS</span></li>
              <li>New tasks &amp; feedback · <span className={styles.notifMeta}>Email · Push</span></li>
              <li>Mentor messages · <span className={styles.notifMeta}>Push</span></li>
            </ul>
          </div>
          <div className={styles.notifGroup}>
            <div className={styles.notifGroupTitle}>
              <UsersIcon size={14} /> Community
            </div>
            <ul className={styles.notifList}>
              <li>Study buddy requests · <span className={styles.notifMeta}>Email · Push</span></li>
              <li>Replies to your posts · <span className={styles.notifMeta}>Push</span></li>
              <li>Mentions · <span className={styles.notifMeta}>Email · Push</span></li>
            </ul>
          </div>
          <div className={styles.notifGroup}>
            <div className={styles.notifGroupTitle}>
              <CreditCard size={14} /> Billing
            </div>
            <ul className={styles.notifList}>
              <li>Payment receipts · <span className={styles.notifMeta}>Email</span></li>
              <li>Renewal reminders · <span className={styles.notifMeta}>Email</span></li>
              <li>Card expiry warnings · <span className={styles.notifMeta}>Email · SMS</span></li>
            </ul>
          </div>
          <Paragraph type="secondary" style={{ marginTop: 14, marginBottom: 0, fontSize: 12 }}>
            {t(
              'studentHub.settingsMock.notificationsComingSoon',
              'Per-channel toggles roll out with the upcoming notifications service.',
            )}
          </Paragraph>
        </Card>
      )}
    </div>
  );
}
