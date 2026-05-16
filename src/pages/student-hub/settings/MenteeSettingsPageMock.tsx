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
  Map as MapIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  useCreateUserPreferencesMutation,
  useUpdateUserPreferencesMutation,
  useGetUserPreferencesQuery,
} from 'src/app/services/student-hub/dashboardApi';
import { useInvalidateGetMeMutation } from 'src/app/services/users';
import { useTypedSelector } from 'src/app/store';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import {
  APPLICATION_GOAL_OPTIONS,
  EXAM_PREP_OPTIONS,
  FOCUS_AREA_OPTIONS,
  INTENDED_MAJOR_OPTIONS,
  EMPTY_STUDY_BUDDY_INTEREST_PROFILE,
  normalizeStudyBuddyInterestProfile,
  type StudyBuddyInterestProfile,
} from 'src/constants/studyBuddyInterests';
import { getLatestCreatedImg } from 'src/utils';
import { baseUrl } from 'src/app/services/api/const';
import { ACCESS_TOKEN } from 'src/constants/storage';
import SubscriptionTab from './subscription';
import { RoadmapTab } from './roadmap/RoadmapTab';
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
  const { data: rawPreferences } = useGetUserPreferencesQuery();
  const [createUserPreferences] = useCreateUserPreferencesMutation();
  const [updateUserPreferences, { isLoading: savingPreferences }] = useUpdateUserPreferencesMutation();
  const preferences = ((rawPreferences as any)?.data ?? rawPreferences ?? null) as any;
  const [displayName, setDisplayName] = useState(
    () => profile?.profile?.name || '',
  );
  const [username, setUsername] = useState<string>(
    () => normalizeUsernameInput((profile?.profile as any)?.username || ''),
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [studyBuddyInterests, setStudyBuddyInterests] = useState<StudyBuddyInterestProfile>(() =>
    ({ ...EMPTY_STUDY_BUDDY_INTEREST_PROFILE }),
  );

  /**
   * Editorial tab state. We expose Profile / Study buddy / Experience /
   * Notifications. Security is intentionally omitted — password resets
   * happen via email today and there's no UI to manage 2FA yet, so
   * surfacing an empty tab would feel broken.
   */
  type SettingsTabKey =
    | 'profile'
    | 'studyBuddy'
    | 'experience'
    | 'notifications'
    | 'subscription'
    | 'roadmap';

  // Read initial tab from URL `?tab=` so other pages can deep-link
  // (e.g. the Community lock popup → subscription tab).
  const initialTab: SettingsTabKey = (() => {
    if (typeof window === 'undefined') return 'profile';
    const fromUrl = new URLSearchParams(window.location.search).get('tab');
    const allowed: SettingsTabKey[] = [
      'profile',
      'studyBuddy',
      'experience',
      'notifications',
      'subscription',
      'roadmap',
    ];
    return allowed.includes(fromUrl as SettingsTabKey)
      ? (fromUrl as SettingsTabKey)
      : 'profile';
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
        'studyBuddy',
        'experience',
        'notifications',
        'subscription',
        'roadmap',
      ];
      if (allowed.includes(fromUrl as SettingsTabKey)) {
        setActiveTab(fromUrl as SettingsTabKey);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
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

  useEffect(() => {
    const persisted = preferences?.applicationSettings?.studyBuddyInterests;
    if (!persisted) return;
    setStudyBuddyInterests(normalizeStudyBuddyInterestProfile(persisted));
  }, [preferences?.applicationSettings?.studyBuddyInterests]);

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

  const upsertUserPreferences = async (patch: any) => {
    const updatePayload = {
      ...(preferences?.id ? { id: preferences.id } : {}),
      ...patch,
    };
    try {
      await updateUserPreferences(updatePayload).unwrap();
      return;
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || '';
      if (
        msg.includes('Resource id not provided') ||
        msg.includes('Resource not found')
      ) {
        await createUserPreferences(patch).unwrap();
        return;
      }
      throw error;
    }
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

      {/* Tab strip — Profile / Study buddy / Experience / Notifications.
          Security tab intentionally omitted (no UI to back it). */}
      <nav className={styles.tabs} aria-label="Settings sections">
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          {t('studentHub.settingsMock.profile', 'Profile')}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'studyBuddy' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('studyBuddy')}
        >
          {t('studentHub.settingsMock.studyBuddy', 'Study buddy')}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'experience' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          {t('studentHub.settingsMock.experience', 'Experience')}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'subscription' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          {t('settings.subscription.tab', 'Subscription & billing')}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'roadmap' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('roadmap')}
        >
          <MapIcon size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
          {t('settings.roadmap.tab', 'Roadmap')}
        </button>
        {/* Notifications tab hidden until the per-channel toggle backend
            ships — surfacing static text felt half-baked. The render
            block below stays in place so re-enabling is a one-line flip. */}
      </nav>

      {activeTab === 'profile' && (
      <Card className={styles.card} title={<><User size={18} style={{ marginRight: 8 }} />{t('studentHub.settingsMock.profile', 'Profile')}</>}>
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
      )}

      {/* The legacy "Subscription" card shown above used to live here; it
          has been removed. The new Phase 1B "Subscription & billing" tab
          (rendered below when activeTab === 'subscription') replaces it. */}

      {activeTab === 'studyBuddy' && (
      <Card
        className={styles.card}
        title={
          <>
            <UsersIcon size={18} style={{ marginRight: 8 }} />
            {t('studentHub.settingsMock.studyBuddyInterestsTitle', 'Study Buddy Interests')}
          </>
        }
      >
        <Paragraph type="secondary" className={styles.studyBuddyHelper}>
          {t(
            'studentHub.settingsMock.studyBuddyInterestsDesc',
            'Add your current exam prep, destinations, and major goals so buddy requests are based on alignment.',
          )}
        </Paragraph>
        <div className={styles.studyBuddyFields}>
          <div>
            <label className={styles.label}>
              {t('studentHub.settingsMock.currentPrep', 'What are you preparing now?')}
            </label>
            <Select
              mode="multiple"
              size="large"
              className={styles.studyBuddySelect}
              value={studyBuddyInterests.examPrep}
              onChange={(values) => setStudyBuddyInterests((prev) => ({ ...prev, examPrep: values }))}
              options={EXAM_PREP_OPTIONS}
              placeholder={t('studentHub.settingsMock.selectPrep', 'Select exam prep interests')}
            />
          </div>
          <div>
            <label className={styles.label}>
              {t('studentHub.settingsMock.applicationGoals', 'Application destination goals')}
            </label>
            <Select
              mode="multiple"
              size="large"
              className={styles.studyBuddySelect}
              value={studyBuddyInterests.applicationGoals}
              onChange={(values) =>
                setStudyBuddyInterests((prev) => ({ ...prev, applicationGoals: values }))
              }
              options={APPLICATION_GOAL_OPTIONS}
              placeholder={t('studentHub.settingsMock.selectDestinationGoals', 'Select destination goals')}
            />
          </div>
          <div>
            <label className={styles.label}>
              {t('studentHub.settingsMock.intendedMajors', 'Intended major(s)')}
            </label>
            <Select
              mode="multiple"
              size="large"
              className={styles.studyBuddySelect}
              value={studyBuddyInterests.intendedMajors}
              onChange={(values) =>
                setStudyBuddyInterests((prev) => ({ ...prev, intendedMajors: values }))
              }
              options={INTENDED_MAJOR_OPTIONS}
              placeholder={t('studentHub.settingsMock.selectMajors', 'Select intended majors')}
            />
          </div>
          <div>
            <label className={styles.label}>
              {t('studentHub.settingsMock.focusAreas', 'Support focus areas (optional)')}
            </label>
            <Select
              mode="multiple"
              size="large"
              className={styles.studyBuddySelect}
              value={studyBuddyInterests.focusAreas}
              onChange={(values) => setStudyBuddyInterests((prev) => ({ ...prev, focusAreas: values }))}
              options={FOCUS_AREA_OPTIONS}
              placeholder={t('studentHub.settingsMock.selectFocusAreas', 'Select support areas')}
            />
          </div>
        </div>
        <div className={styles.btnRow}>
          <Button
            type="primary"
            loading={savingPreferences}
            onClick={async () => {
              try {
                await upsertUserPreferences({
                  applicationSettings: {
                    ...(preferences?.applicationSettings || {}),
                    studyBuddyInterests: normalizeStudyBuddyInterestProfile(studyBuddyInterests),
                  },
                });
                message.success(
                  t(
                    'studentHub.settingsMock.studyBuddyInterestsSaved',
                    'Study buddy interests saved.',
                  ),
                );
              } catch (error: any) {
                message.error(error?.data?.message || t('common.error', 'Failed to save interests'));
              }
            }}
          >
            {t('studentHub.settingsMock.saveStudyBuddyInterests', 'Save study buddy interests')}
          </Button>
        </div>
      </Card>
      )}

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

      {/* Roadmap — same content as `/placement-test/roadmap`, but in
          the persistent settings surface. Handles the "I passed but
          haven't paid yet" returning-visitor state with a blurred
          preview + paywall. */}
      {activeTab === 'roadmap' && <RoadmapTab />}

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
