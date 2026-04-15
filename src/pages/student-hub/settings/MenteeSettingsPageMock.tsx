import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Upload, Input, Typography, message, Avatar, Tag, Select, Modal } from 'antd';
import { User, Camera, CreditCard, Sparkles } from 'lucide-react';
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
import BillingPlansModal from './BillingPlansModal';
import styles from './MenteeSettingsPageMock.module.scss';

const { Title, Text, Paragraph } = Typography;
const PROFILE_PHOTO_MAX_MB = 2;
const PROFILE_PHOTO_MAX_BYTES = PROFILE_PHOTO_MAX_MB * 1024 * 1024;
const PROFILE_PHOTO_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png']);

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
    () => (profile?.profile as any)?.username || '',
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [plan] = useState('Pro Plan');
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [billingManagerOpen, setBillingManagerOpen] = useState(false);
  const [studyBuddyInterests, setStudyBuddyInterests] = useState<StudyBuddyInterestProfile>(() =>
    ({ ...EMPTY_STUDY_BUDDY_INTEREST_PROFILE }),
  );

  const normalizedPlan = plan.toLowerCase();
  const subscriptionPlanClass =
    normalizedPlan.includes('pro') || normalizedPlan.includes('premium')
      ? styles.subscriptionSummaryPremium
      : normalizedPlan.includes('essential') || normalizedPlan.includes('free')
        ? styles.subscriptionSummaryEssential
        : normalizedPlan.includes('custom')
          ? styles.subscriptionSummaryCustomised
          : styles.subscriptionSummaryDefault;

  const email = profile?.email ?? 'you@example.com';
  const isSuperAdmin =
    profile?.managementRole === 'SuperAdmin' || (profile?.managementRole as string) === 'Owner';
  const profileImage = useMemo(
    () => getLatestCreatedImg(profile?.profile?.media || []),
    [profile?.profile?.media],
  );

  useEffect(() => {
    const fullName = profile?.profile?.name || '';
    const existingUsername = (profile?.profile as any)?.username;
    setDisplayName(fullName);
    setUsername(
      existingUsername ||
        `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32) || ''}`,
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
      <BillingPlansModal open={billingModalOpen} onClose={() => setBillingModalOpen(false)} />
      <Modal
        open={billingManagerOpen}
        onCancel={() => setBillingManagerOpen(false)}
        onOk={() => setBillingManagerOpen(false)}
        okText={t('common.done', 'Done')}
        cancelButtonProps={{ style: { display: 'none' } }}
        title={t('studentHub.settingsMock.manageBilling', 'Manage billing')}
        width={640}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <Text strong>{t('studentHub.settingsMock.paymentMethod', 'Payment method')}</Text>
            <div style={{ marginTop: 6, color: '#64748b' }}>Visa ending in 4242 · Expires 10/28</div>
          </div>
          <div>
            <Text strong>{t('studentHub.settingsMock.nextCharge', 'Next charge')}</Text>
            <div style={{ marginTop: 6, color: '#64748b' }}>$7.00 on Apr 28, 2026</div>
          </div>
          <div>
            <Text strong>{t('studentHub.settingsMock.recentInvoices', 'Recent invoices')}</Text>
            <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Mar 28, 2026</span>
                <span>Paid · $7.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Feb 28, 2026</span>
                <span>Paid · $7.00</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <Button onClick={() => message.info('Payment method update flow will be available soon.')}>
              Update payment method
            </Button>
            <Button onClick={() => message.info('Invoice export will be available soon.')}>
              Download invoices
            </Button>
          </div>
          <div
            style={{
              borderTop: '1px dashed #e5e7eb',
              paddingTop: 12,
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <Text type="secondary" style={{ fontSize: 12, maxWidth: 360 }}>
              {t(
                'studentHub.settingsMock.cancelInfo',
                'Need to cancel? This keeps your data until period end and you can reactivate anytime.',
              )}
            </Text>
            <Button
              danger
              type="default"
              onClick={() => message.warning(t('studentHub.settingsMock.cancelMock', 'Cancel plan flow is coming soon.'))}
            >
              {t('studentHub.settingsMock.cancelPlan', 'Cancel subscription')}
            </Button>
          </div>
        </div>
      </Modal>

      {!embeddedInHub && (
        <>
          <Title level={2} className={styles.pageTitle}>
            {t('studentHub.settingsMock.title', 'Account & settings')}
          </Title>
          <Paragraph type="secondary" className={styles.sub}>
            {t(
              'studentHub.settingsMock.subtitle',
              'Manage your profile, subscription, and preferences.',
            )}
          </Paragraph>
        </>
      )}

      <Card className={styles.card} title={<><User size={18} style={{ marginRight: 8 }} />{t('studentHub.settingsMock.profile', 'Profile')}</>}>
        <div className={styles.profileRow}>
          <div className={styles.avatarBlock}>
            <Avatar
              size={96}
              src={avatarUrl || profileImage || undefined}
              icon={<User size={32} />}
              className={styles.avatar}
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
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@alexj"
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
                        username: username.trim(),
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

      {/* Subscription section hidden for this release */}
      {false && (
        <Card
          className={styles.card}
          title={<><CreditCard size={18} style={{ marginRight: 8 }} />{t('studentHub.settingsMock.subscription', 'Subscription')}</>}
        >
          <div className={styles.subRow}>
            <div className={`${styles.subscriptionSummary} ${subscriptionPlanClass}`}>
              <div className={styles.subscriptionSummaryTop}>
                <Tag color="magenta" className={styles.planTag}>
                  {plan}
                </Tag>
                <Text strong>{t('studentHub.settingsMock.active', 'Active')}</Text>
              </div>
              <div className={styles.subscriptionMeta}>
                <Text type="secondary">
                  {t('studentHub.settingsMock.billingCycle', 'Billing cycle')}: Monthly
                </Text>
                <Text type="secondary">
                  {t('studentHub.settingsMock.nextRenewal', 'Next renewal')}: Apr 28, 2026
                </Text>
              </div>
            </div>
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              {t(
                'studentHub.settingsMock.subscriptionDesc',
                'View your current plan details and open dedicated flows to change plan or manage billing.',
              )}
            </Paragraph>

            <div className={styles.planTierActionsClean}>
              <Button
                type="primary"
                onClick={() => setBillingModalOpen(true)}
              >
                {t('studentHub.settingsMock.changePlan', 'Change plan')}
              </Button>
              <Button onClick={() => setBillingManagerOpen(true)}>
                {t('studentHub.settingsMock.manageBilling', 'Manage billing')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card
        className={styles.card}
        title={
          <>
            <User size={18} style={{ marginRight: 8 }} />
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

      {isSuperAdmin && (
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
    </div>
  );
}
