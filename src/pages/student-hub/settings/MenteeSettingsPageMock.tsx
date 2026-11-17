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
  Lock,
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

  const baselineName = sanitizeName(profile?.profile?.name);
  const baselineUsername = normalizeUsernameInput(
    (profile?.profile as any)?.username ||
      baselineName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32) ||
      '',
  );
  const profileDirty =
    displayName.trim() !== baselineName || username.trim() !== baselineUsername;
  const [savingProfile, setSavingProfile] = useState(false);
  const saveProfile = async () => {
    setSavingProfile(true);
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
    } finally {
      setSavingProfile(false);
    }
  };

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

  // Membership & billing is a standalone page: only billing, no settings chrome.
  if (activeTab === 'subscription') {
    return (
      // No page heading: the plan section opens the page.
      <ApplicantPage>
        <div className={`${styles.page} ${embeddedInHub ? styles.pageEmbedded : ''}`}>
          <SubscriptionTab />
        </div>
      </ApplicantPage>
    );
  }

  return (
    <ApplicantPage
      title={t('studentHub.settingsMock.title', 'Settings')}
      subtitle={t('studentHub.settingsMock.accountSubtitle', 'Manage your account and preferences.')}
    >
    <div className={`${styles.page} ${embeddedInHub ? styles.pageEmbedded : ''}`}>

      {/* URL-backed section links preserve deep links and browser history. */}
      <SettingsNavigation activeTab={activeTab} showExperience={isSuperAdmin} />

      {/* The two "this moved" pointers that used to sit here (profile hub,
          study buddy preferences) have been removed. Both surfaces are one
          click away in the sidebar, so the notes were permanent signposts
          for a move that is long finished. */}

      {activeTab === 'profile' && (
      <div className={styles.accountLayout}>
        {/* Identity: compact, stays in view. */}
        <aside className={styles.identity} aria-label={t('studentHub.settingsMock.account', 'Account')}>
          <div className={styles.avatarWrap}>
            <Avatar
              size={96}
              src={avatarSrc}
              icon={<User size={36} />}
              className={styles.identityAvatar}
              onError={() => {
                setProfileImageBroken(true);
                return true;
              }}
            />
            <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/jpeg,image/png">
              <button
                type="button"
                className={styles.avatarButton}
                aria-label={t('studentHub.settingsMock.uploadPhoto', 'Upload photo')}
              >
                <Camera size={15} strokeWidth={2} aria-hidden />
              </button>
            </Upload>
          </div>
          <h2 className={styles.identityName}>{displayName || t('applicant.yourWorkspace', 'Your account')}</h2>
          {username && <p className={styles.handle}>@{username}</p>}
          <p className={styles.identityEmail}>{email}</p>
          <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/jpeg,image/png">
            <button type="button" className={styles.photoLink}>
              {t('studentHub.settingsMock.changePhoto', 'Change photo')}
            </button>
          </Upload>
          <p className={styles.identityHint}>
            {t('studentHub.settingsMock.photoHint', `JPG or PNG, up to ${PROFILE_PHOTO_MAX_MB} MB`)}
          </p>
        </aside>

        <div className={styles.accountMain}>
          {/* Profile details */}
          <section className={styles.card2} aria-labelledby="settings-profile-title">
            <header className={styles.cardHead}>
              <h3 id="settings-profile-title">{t('studentHub.settingsMock.profileGroup', 'Profile')}</h3>
              <p>{t('studentHub.settingsMock.profileHint', 'How you appear to mentors and other students.')}</p>
            </header>
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>{t('studentHub.settingsMock.fullName', 'Full name')}</span>
                <Input
                  className={styles.fieldInput}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>{t('studentHub.settingsMock.username', 'Username')}</span>
                <Input
                  className={styles.fieldInput}
                  prefix={<span className={styles.at}>@</span>}
                  value={username}
                  onChange={(e) => setUsername(normalizeUsernameInput(e.target.value))}
                  placeholder="starboy"
                />
              </label>
              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>{t('studentHub.settingsMock.email', 'Email')}</span>
                <div className={styles.readonly}>
                  {email}
                  <Lock size={13} strokeWidth={2} aria-label={t('studentHub.settingsMock.emailLocked', 'Cannot be changed here')} />
                </div>
              </div>
            </div>
            <footer className={styles.cardFoot}>
              <span className={styles.footerHint}>
                {profileDirty
                  ? t('studentHub.settingsMock.unsaved', 'You have unsaved changes')
                  : t('studentHub.settingsMock.upToDate', 'Your profile is up to date')}
              </span>
              <Button
                type="primary"
                className={styles.saveButton}
                disabled={!profileDirty}
                loading={savingProfile}
                onClick={() => void saveProfile()}
              >
                {t('studentHub.settingsMock.saveChanges', 'Save changes')}
              </Button>
            </footer>
          </section>

          {/* Connected apps */}
          <section className={styles.card2} aria-labelledby="settings-connected-title">
            <header className={styles.cardHead}>
              <h3 id="settings-connected-title">{t('studentHub.settingsMock.connected', 'Connected apps')}</h3>
              <p>{t('studentHub.settingsMock.connectedHint', 'Get reminders where you already are.')}</p>
            </header>
            <div className={styles.appRow}>
              <span className={styles.appIcon} aria-hidden>
                <Send size={17} strokeWidth={1.9} />
              </span>
              <span className={styles.appText}>
                <strong>{t('studentHub.settingsMock.telegram', 'Telegram')}</strong>
                <small>
                  {tg?.status === 'connected'
                    ? tg.phoneNumber || t('studentHub.settingsMock.telegramConnected', 'Connected')
                    : t('studentHub.settingsMock.telegramNotConnectedShort', 'Session reminders on Telegram')}
                </small>
              </span>
              {tg?.status === 'connected' && (
                <span className={styles.connectedPill}>
                  <CheckCircle2 size={13} strokeWidth={2.2} aria-hidden />
                  {t('studentHub.settingsMock.telegramConnected', 'Connected')}
                </span>
              )}
              <Button
                className={tg?.status === 'connected' ? styles.quietButton : styles.saveButton}
                type={tg?.status === 'connected' ? 'default' : 'primary'}
                onClick={() => setTgModalOpen(true)}
              >
                {tg?.status === 'connected'
                  ? t('studentHub.settingsMock.telegramManage', 'Manage')
                  : t('studentHub.settingsMock.telegramConnectShort', 'Connect')}
              </Button>
            </div>
          </section>
        </div>
        <TelegramConnectionModal visible={tgModalOpen} onClose={() => setTgModalOpen(false)} />
      </div>
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

      {activeTab === 'referrals' && <ReferralsTab />}

      {/* Notifications — placeholder card. The toggle matrix
          (Email / Push / SMS × event types) ships alongside the
          notifications backend; we surface the section now so the
          editorial nav is complete. */}
      {activeTab === 'notifications' && (
        <div className={styles.stack}>
          <p className={styles.notice}>
            <Bell size={15} strokeWidth={2} aria-hidden />
            {t(
              'studentHub.settingsMock.notificationsComingSoon',
              'Per-channel toggles roll out with the upcoming notifications service.',
            )}
          </p>
          {[
            {
              key: 'sessions',
              Icon: Target,
              title: t('studentHub.settingsMock.notifSessions', 'Mentor sessions'),
              items: [
                ['Session reminders (24h before)', ['Email', 'Push', 'SMS']],
                ['New tasks & feedback', ['Email', 'Push']],
                ['Mentor messages', ['Push']],
              ],
            },
            {
              key: 'community',
              Icon: UsersIcon,
              title: t('studentHub.settingsMock.notifCommunity', 'Community'),
              items: [
                ['Study buddy requests', ['Email', 'Push']],
                ['Replies to your posts', ['Push']],
                ['Mentions', ['Email', 'Push']],
              ],
            },
            {
              key: 'billing',
              Icon: CreditCard,
              title: t('studentHub.settingsMock.notifBilling', 'Billing'),
              items: [
                ['Payment receipts', ['Email']],
                ['Renewal reminders', ['Email']],
                ['Card expiry warnings', ['Email', 'SMS']],
              ],
            },
          ].map((group) => (
            <section key={group.key} className={styles.card2} aria-labelledby={`notif-${group.key}`}>
              <header className={styles.cardHead}>
                <h3 id={`notif-${group.key}`}>
                  <span className={styles.headIcon} aria-hidden>
                    <group.Icon size={15} strokeWidth={2} />
                  </span>
                  {group.title}
                </h3>
              </header>
              <ul className={styles.notifRows}>
                {(group.items as [string, string[]][]).map(([label, channels]) => (
                  <li key={label} className={styles.notifRow}>
                    <span className={styles.rowLabelWide}>{label}</span>
                    <span className={styles.channels}>
                      {channels.map((channel) => (
                        <span key={channel} className={styles.channel}>
                          {channel}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
    </ApplicantPage>
  );
}
