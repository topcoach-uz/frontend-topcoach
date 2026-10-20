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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useInvalidateGetMeMutation, useGetTelegramStatusQuery } from 'src/app/services/users';
import TelegramConnectionModal from 'src/components/TelegramConnectionModal';
import { useTypedSelector } from 'src/app/store';
import { useJourneyExperience } from 'src/contexts/JourneyExperienceContext';
import { getLatestCreatedImg } from 'src/utils';
import { baseUrl } from 'src/app/services/api/const';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { settingsSection } from 'src/lib/accountNavigation';
import SettingsNavigation from './SettingsNavigation';
import SubscriptionTab from './subscription';
import ReferralsTab from './ReferralsTab';
import { sanitizeName } from 'src/utils/displayName';
import { ApplicantPage } from '../applicant/ApplicantPage';
import styles from './MenteeSettingsPageMock.module.scss';

const { Text, Paragraph } = Typography;
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
  // sanitizeName, not the raw value: prefilling the input with a legacy
  // "Asila undefined" name would let a plain Save write it straight back.
  const [displayName, setDisplayName] = useState(
    () => sanitizeName(profile?.profile?.name),
  );
  const [username, setUsername] = useState<string>(
    () => normalizeUsernameInput((profile?.profile as any)?.username || ''),
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const activeTab = settingsSection(searchParams.get('tab'));

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
    const fullName = sanitizeName(profile?.profile?.name);
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
    <ApplicantPage
      title={t('studentHub.settingsMock.title', 'Settings')}
      subtitle={t('studentHub.settingsMock.subtitle', 'Manage your profile, subscription, and preferences.')}
    >
    <div className={`${styles.page} ${embeddedInHub ? styles.pageEmbedded : ''}`}>

      {/* URL-backed section links preserve deep links and browser history. */}
      <SettingsNavigation activeTab={activeTab} showExperience={isSuperAdmin} />

      {/* The two "this moved" pointers that used to sit here (profile hub,
          study buddy preferences) have been removed. Both surfaces are one
          click away in the sidebar, so the notes were permanent signposts
          for a move that is long finished. */}

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
              aria-label={t('studentHub.settingsMock.experienceModeAria', 'Choose My Journey experience mode')}
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
    </ApplicantPage>
  );
}
