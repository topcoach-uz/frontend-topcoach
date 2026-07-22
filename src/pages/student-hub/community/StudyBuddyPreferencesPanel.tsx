import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Select, Tag, Typography, message } from 'antd';
import { Users as UsersIcon, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useCreateUserPreferencesMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
} from 'src/app/services/student-hub/dashboardApi';
import { useAppDispatch } from 'src/app/store';
import { RtkApi } from 'src/app/services/api';
import {
  APPLICATION_GOAL_OPTIONS,
  EMPTY_STUDY_BUDDY_INTEREST_PROFILE,
  EXAM_PREP_OPTIONS,
  FOCUS_AREA_OPTIONS,
  INTENDED_MAJOR_OPTIONS,
  getInterestLabel,
  hasStudyBuddyGoalsSet,
  normalizeStudyBuddyInterestProfile,
  type StudyBuddyInterestField,
  type StudyBuddyInterestProfile,
} from 'src/constants/studyBuddyInterests';
import styles from './communityHubMock.module.scss';

const { Paragraph } = Typography;

const FIELD_ORDER: StudyBuddyInterestField[] = [
  'examPrep',
  'applicationGoals',
  'intendedMajors',
  'focusAreas',
];
const MAX_SUMMARY_CHIPS = 6;

/**
 * Study Buddy matching preferences, surfaced directly inside the Find Study
 * Buddy hub (rather than buried in Settings) so students set them exactly
 * where they matter — right before browsing Discover. Two states:
 *  - no interests saved yet → open form (title + 4 multi-selects + Save)
 *  - interests saved → compact chip summary + "Edit preferences"
 * Saving invalidates the `StudyBuddy` RTK tag so Discover re-ranks against
 * the new preferences on next fetch/refetch.
 */
export default function StudyBuddyPreferencesPanel() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data: rawPreferences } = useGetUserPreferencesQuery();
  const [createUserPreferences] = useCreateUserPreferencesMutation();
  const [updateUserPreferences, { isLoading: saving }] = useUpdateUserPreferencesMutation();
  const preferences = ((rawPreferences as any)?.data ?? rawPreferences ?? null) as any;

  const persistedInterests = useMemo(
    () => normalizeStudyBuddyInterestProfile(preferences?.applicationSettings?.studyBuddyInterests),
    [preferences?.applicationSettings?.studyBuddyInterests],
  );
  const hasSavedGoals = hasStudyBuddyGoalsSet(persistedInterests);

  const [draft, setDraft] = useState<StudyBuddyInterestProfile>(() => ({
    ...EMPTY_STUDY_BUDDY_INTEREST_PROFILE,
  }));
  const [editing, setEditing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the draft from persisted preferences once they load, and default
  // the panel to "open" only the first time (if nothing was saved yet).
  // After that, the user's open/collapsed choice is left alone so a
  // background refetch doesn't yank the form shut mid-edit.
  useEffect(() => {
    if (rawPreferences == null) return;
    setDraft(persistedInterests);
    if (!hydrated) {
      setEditing(!hasStudyBuddyGoalsSet(persistedInterests));
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPreferences]);

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
      if (msg.includes('Resource id not provided') || msg.includes('Resource not found')) {
        await createUserPreferences(patch).unwrap();
        return;
      }
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      await upsertUserPreferences({
        applicationSettings: {
          ...(preferences?.applicationSettings || {}),
          studyBuddyInterests: normalizeStudyBuddyInterestProfile(draft),
        },
      });
      message.success(
        t('studentHub.settingsMock.studyBuddyInterestsSaved', 'Study buddy interests saved.'),
      );
      // Discover ranks candidates server-side off these interests — make
      // sure the next Discover fetch/refetch picks up the new values.
      dispatch(RtkApi.util.invalidateTags(['StudyBuddy']));
      setEditing(false);
    } catch (error: any) {
      message.error(error?.data?.message || t('common.error', 'Failed to save interests'));
    }
  };

  const handleCancel = () => {
    setDraft(persistedInterests);
    setEditing(false);
  };

  // Avoid a flash of the wrong state before the first preferences fetch
  // resolves (we don't yet know whether to default open or collapsed).
  if (rawPreferences == null) {
    return null;
  }

  const summaryChips = FIELD_ORDER.flatMap((field) =>
    persistedInterests[field].map((value) => ({
      key: `${field}-${value}`,
      label: getInterestLabel(field, value),
    })),
  );
  const visibleChips = summaryChips.slice(0, MAX_SUMMARY_CHIPS);
  const hiddenCount = summaryChips.length - visibleChips.length;

  return (
    <Card
      className={styles.buddyPrefsCard}
      title={
        <>
          <UsersIcon size={18} style={{ marginRight: 8 }} />
          {t('studentHub.buddyPrefs.title', 'Your matching preferences')}
        </>
      }
    >
      {!editing ? (
        <div className={styles.buddyPrefsSummary}>
          <div className={styles.buddyPrefsChipRow}>
            {visibleChips.map((chip) => (
              <Tag color="processing" key={chip.key} className={styles.buddyPrefsChip}>
                {chip.label}
              </Tag>
            ))}
            {hiddenCount > 0 && (
              <Tag className={styles.buddyPrefsChip}>
                {t('studentHub.buddyPrefs.moreChips', '+{{count}} more', { count: hiddenCount })}
              </Tag>
            )}
          </div>
          <Button icon={<Pencil size={14} />} onClick={() => setEditing(true)}>
            {t('studentHub.buddyPrefs.editButton', 'Edit preferences')}
          </Button>
        </div>
      ) : (
        <>
          <Paragraph type="secondary" className={styles.buddyPrefsHelper}>
            {t('studentHub.buddyPrefs.descHelper', 'We use these to find aligned buddies.')}
          </Paragraph>
          <div className={styles.buddyPrefsFields}>
            <div>
              <label className={styles.buddyPrefsFieldLabel}>
                {t('studentHub.settingsMock.currentPrep', 'What are you preparing now?')}
              </label>
              <Select
                mode="multiple"
                size="large"
                className={styles.buddyPrefsSelect}
                value={draft.examPrep}
                onChange={(values) => setDraft((prev) => ({ ...prev, examPrep: values }))}
                options={EXAM_PREP_OPTIONS}
                placeholder={t('studentHub.settingsMock.selectPrep', 'Select exam prep interests')}
              />
            </div>
            <div>
              <label className={styles.buddyPrefsFieldLabel}>
                {t('studentHub.settingsMock.applicationGoals', 'Application destination goals')}
              </label>
              <Select
                mode="multiple"
                size="large"
                className={styles.buddyPrefsSelect}
                value={draft.applicationGoals}
                onChange={(values) => setDraft((prev) => ({ ...prev, applicationGoals: values }))}
                options={APPLICATION_GOAL_OPTIONS}
                placeholder={t('studentHub.settingsMock.selectDestinationGoals', 'Select destination goals')}
              />
            </div>
            <div>
              <label className={styles.buddyPrefsFieldLabel}>
                {t('studentHub.settingsMock.intendedMajors', 'Intended major(s)')}
              </label>
              <Select
                mode="multiple"
                size="large"
                className={styles.buddyPrefsSelect}
                value={draft.intendedMajors}
                onChange={(values) => setDraft((prev) => ({ ...prev, intendedMajors: values }))}
                options={INTENDED_MAJOR_OPTIONS}
                placeholder={t('studentHub.settingsMock.selectMajors', 'Select intended majors')}
              />
            </div>
            <div>
              <label className={styles.buddyPrefsFieldLabel}>
                {t('studentHub.settingsMock.focusAreas', 'Support focus areas (optional)')}
              </label>
              <Select
                mode="multiple"
                size="large"
                className={styles.buddyPrefsSelect}
                value={draft.focusAreas}
                onChange={(values) => setDraft((prev) => ({ ...prev, focusAreas: values }))}
                options={FOCUS_AREA_OPTIONS}
                placeholder={t('studentHub.settingsMock.selectFocusAreas', 'Select support areas')}
              />
            </div>
          </div>
          <div className={styles.buddyPrefsActions}>
            <Button type="primary" loading={saving} onClick={() => void handleSave()}>
              {t('studentHub.buddyPrefs.saveButton', 'Save preferences')}
            </Button>
            {hasSavedGoals && (
              <Button onClick={handleCancel}>
                {t('studentHub.buddyPrefs.cancelButton', 'Cancel')}
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
