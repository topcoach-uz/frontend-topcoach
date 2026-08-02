import { useState } from 'react';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { CustomButton } from 'src/components/common';
import styles from '../onboarding.module.scss';

// Same enum values as the topcoach-launch-event registration form's
// referralSource field (src/pages/events/topcoach-launch-event/index.tsx
// REFERRAL_SOURCES) — reused here for consistency across the app.
export type ReferralSource = 'instagram' | 'telegram' | 'friend' | 'school' | 'other';
const OPTION_IDS: ReferralSource[] = ['instagram', 'telegram', 'friend', 'school', 'other'];

// "Why are you using TopCoach?" — multi-select, optional. Exact kebab-case
// keys as specified for onboarding analytics; persisted as
// `usageReasons: string[]` via patchOnboarding.
export type UsageReason =
  | 'get-into-university'
  | 'improve-sat'
  | 'find-mentor'
  | 'essay-help'
  | 'community'
  | 'other';
const REASON_IDS: UsageReason[] = [
  'get-into-university',
  'improve-sat',
  'find-mentor',
  'essay-help',
  'community',
  'other',
];

interface Props {
  initialValue?: string | null;
  initialReasons?: string[] | null;
  submitting?: boolean;
  onNext: (value?: string, reasons?: string[]) => void;
}

export default function StepSource({ initialValue, initialReasons, submitting, onNext }: Props) {
interface Props {
  initialValue?: string | null;
  submitting?: boolean;
  onNext: (value?: string) => void;
}

export default function StepSource({ initialValue, submitting, onNext }: Props) {
  const { t } = useTranslation();

  const initialIsKnownOption = OPTION_IDS.includes(initialValue as ReferralSource);
  const [selected, setSelected] = useState<ReferralSource | undefined>(
    initialIsKnownOption ? (initialValue as ReferralSource) : undefined,
  );
  const [otherText, setOtherText] = useState<string>(
    initialValue && !initialIsKnownOption ? initialValue : '',
  );
  const [reasons, setReasons] = useState<UsageReason[]>(() =>
    (initialReasons ?? []).filter((r): r is UsageReason => REASON_IDS.includes(r as UsageReason)),
  );

  const options: { id: ReferralSource; label: string }[] = [
    { id: 'instagram', label: t('onboarding.source.instagram', 'Instagram') },
    { id: 'telegram', label: t('onboarding.source.telegram', 'Telegram') },
    { id: 'friend', label: t('onboarding.source.friend', 'A friend') },
    { id: 'school', label: t('onboarding.source.school', 'School') },
    { id: 'other', label: t('onboarding.source.other', 'Other') },
  ];

  const reasonOptions: { id: UsageReason; label: string }[] = [
    { id: 'get-into-university', label: t('onboarding.source.reasonUniversity', 'Get into a top university') },
    { id: 'improve-sat', label: t('onboarding.source.reasonSat', 'Improve my SAT/ACT score') },
    { id: 'find-mentor', label: t('onboarding.source.reasonMentor', 'Find a mentor') },
    { id: 'essay-help', label: t('onboarding.source.reasonEssay', 'Get help with essays') },
    { id: 'community', label: t('onboarding.source.reasonCommunity', 'Join a community of applicants') },
    { id: 'other', label: t('onboarding.source.reasonOther', 'Other') },
  ];

  const toggleReason = (id: UsageReason) => {
    setReasons((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    if (!selected) return;
    const value = selected === 'other' ? otherText.trim() : selected;
    onNext(value || undefined, reasons.length ? reasons : undefined);
  const handleContinue = () => {
    if (!selected) return;
    const value = selected === 'other' ? otherText.trim() : selected;
    onNext(value || undefined);
  };

  return (
    <div className={styles.body}>
      <div className={styles.optionList}>
        {options.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`${styles.optionCard} ${active ? styles.optionCardActive : ''}`}
              onClick={() => setSelected(opt.id)}
            >
              <span>{opt.label}</span>
              {active && <Check size={16} />}
            </button>
          );
        })}
      </div>

      {selected === 'other' && (
        <Input
          size="large"
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          placeholder={t('onboarding.source.otherPlaceholder', 'Tell us where you heard about us')}
          maxLength={120}
        />
      )}

      <div className={styles.sectionLabel}>
        {t('onboarding.source.reasonsLabel', 'Why are you using TopCoach?')}
      </div>
      <div className={styles.chipGroup}>
        {reasonOptions.map((opt) => {
          const active = reasons.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              className={`${styles.chip} ${active ? styles.chipActive : ''}`}
              onClick={() => toggleReason(opt.id)}
            >
              {active && <Check size={14} />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      <CustomButton
        type="primary"
        width="100%"
        onClick={handleContinue}
        loading={submitting}
        disabled={!selected}
      >
        {t('btn.continue')}
      </CustomButton>

      <button
        type="button"
        className={styles.skipLink}
        onClick={() => onNext(undefined, reasons.length ? reasons : undefined)}
      >
      <button type="button" className={styles.skipLink} onClick={() => onNext(undefined)}>
        {t('onboarding.source.preferNotToSay', 'Prefer not to say')}
      </button>
    </div>
  );
}
