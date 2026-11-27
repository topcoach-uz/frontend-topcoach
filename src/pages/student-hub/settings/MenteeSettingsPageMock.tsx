import React, { useEffect, useMemo, useState } from 'react';
import { Button, Upload, Input, message, Avatar } from 'antd';
import {
  User,
  Camera,
  CreditCard,
  Users as UsersIcon,
  Bell,
  Target,
  Send,
  CheckCircle2,
  Check,
  Compass,
  Lock,
  Mail,
  MessageSquare,
  Smartphone,
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
import OrgMembershipSidebar from '../components/OrgMembershipSidebar';
import SettingsNavigation from './SettingsNavigation';
import SubscriptionTab from './subscription';
import ReferralsTab from './ReferralsTab';
import { sanitizeName } from 'src/utils/displayName';
import { ApplicantPage } from '../applicant/ApplicantPage';
import styles from './MenteeSettingsPageMock.module.scss';

const PROFILE_PHOTO_MAX_MB = 2;
const PROFILE_PHOTO_MAX_BYTES = PROFILE_PHOTO_MAX_MB * 1024 * 1024;
const PROFILE_PHOTO_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png']);
const CHANNEL_ICONS = { Email: Mail, Push: Smartphone, SMS: MessageSquare } as const;

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

  // Notifications is a standalone page reached from the sidebar, so it gets
  // its own heading and no Settings switcher.
  const isNotifications = activeTab === 'notifications';

  return (
    <ApplicantPage
      title={
        isNotifications
          ? t('applicant.nav.notifications', 'Notifications')
          : t('studentHub.settingsMock.title', 'Settings')
      }
      subtitle={
        isNotifications
          ? t('studentHub.settingsMock.notificationsSubtitle', 'What TopCoach tells you about, and where.')
          : t('studentHub.settingsMock.accountSubtitle', 'Manage your account and preferences.')
      }
    >
    <div className={`${styles.page} ${embeddedInHub ? styles.pageEmbedded : ''}`}>

      {/* URL-backed section links preserve deep links and browser history. */}
      {!isNotifications && (
        <SettingsNavigation activeTab={activeTab} showExperience={isSuperAdmin} />
      )}

      {/* The two "this moved" pointers that used to sit here (profile hub,
          study buddy preferences) have been removed. Both surfaces are one
          click away in the sidebar, so the notes were permanent signposts
          for a move that is long finished. */}

      {activeTab === 'school' && (
        <section aria-label={t('studentHub.orgMembership.settingsTitle', 'School & counselors')}>
          <OrgMembershipSidebar details />
        </section>
      )}

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

      {/* Experience mode: two selectable option cards instead of a
          dropdown, so both modes and what they mean are visible at once.
          Only super admins can switch; everyone else sees their mode. */}
      {activeTab === 'experience' && (
        <section className={styles.card2} aria-labelledby="settings-experience-title">
          <header className={styles.cardHead}>
            <h3 id="settings-experience-title">
              {t('studentHub.settingsMock.mockJourneyTitle', 'My Journey experience mode')}
            </h3>
            <p>
              {isSuperAdmin
                ? t(
                    'studentHub.settingsMock.mockJourneyDescShort',
                    'Preview the hub as a standard or a Community student.',
                  )
                : t(
                    'studentHub.settingsMock.experienceMenteeNote',
                    'You are in the Community experience. New experience modes will appear here as they roll out.',
                  )}
            </p>
          </header>
          <div
            className={styles.modeGrid}
            role="radiogroup"
            aria-label={t('studentHub.settingsMock.experienceModeAria', 'Choose My Journey experience mode')}
          >
            {[
              {
                value: 'out' as const,
                Icon: Compass,
                title: t('studentHub.hub.mockNotEnrolled', 'Standard experience'),
                desc: t(
                  'studentHub.settingsMock.modeStandardDesc',
                  'Major Match first, with programs and mentors to explore.',
                ),
              },
              {
                value: 'in' as const,
                Icon: UsersIcon,
                title: t('studentHub.hub.mockEnrolled', 'Community experience'),
                desc: t(
                  'studentHub.settingsMock.modeCommunityDesc',
                  'Learning progress, study buddies and the community feed.',
                ),
              },
            ].map((mode) => {
              const selected = (isCommunityEnrolled ? 'in' : 'out') === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!isSuperAdmin && !selected}
                  className={`${styles.modeOption} ${selected ? styles.modeOptionActive : ''}`}
                  onClick={() => {
                    if (!isSuperAdmin || selected) return;
                    setCommunityEnrolled(mode.value === 'in');
                    navigate('/student-hub?section=account&target=settings&tab=experience', { replace: true });
                  }}
                >
                  <span className={styles.modeIcon} aria-hidden>
                    <mode.Icon size={18} strokeWidth={1.9} />
                  </span>
                  <span className={styles.modeText}>
                    <strong>{mode.title}</strong>
                    <small>{mode.desc}</small>
                  </span>
                  <span className={styles.modeCheck} aria-hidden>
                    {selected && <Check size={13} strokeWidth={2.8} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
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
            /* iOS Settings pattern: a small group title above an inset
               grouped list; each row names the event and lists where it is
               delivered as quiet trailing text. */
            <section key={group.key} className={styles.notifGroup2} aria-labelledby={`notif-${group.key}`}>
              <h3 id={`notif-${group.key}`} className={styles.groupTitle}>
                <group.Icon size={14} strokeWidth={2} aria-hidden />
                {group.title}
              </h3>
              <ul className={styles.notifList2}>
                {(group.items as [string, string[]][]).map(([label, channels]) => (
                  <li key={label} className={styles.notifItem}>
                    <span className={styles.notifItemLabel}>{label}</span>
                    <span className={styles.notifItemChannels}>
                      {channels.map((channel) => {
                        const ChannelIcon = CHANNEL_ICONS[channel as keyof typeof CHANNEL_ICONS];
                        return (
                          <span key={channel} className={styles.notifItemChannel}>
                            {ChannelIcon && <ChannelIcon size={14} strokeWidth={1.9} aria-hidden />}
                            {channel}
                          </span>
                        );
                      })}
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
