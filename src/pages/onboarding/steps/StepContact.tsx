import { useState } from 'react';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { CustomButton } from 'src/components/common';
import styles from '../onboarding.module.scss';

interface Props {
  initialValue?: string | null;
  submitting?: boolean;
  onNext: (phoneNumber?: string) => void;
}

// Matches the phone pattern used by RequestSessionModal
// (src/pages/mentors/details/_components/RequestSessionModal/index.tsx).
const PHONE_PATTERN = /^[+]?[0-9\s\-()]{10,}$/;

export default function StepContact({ initialValue, submitting, onNext }: Props) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState(initialValue ?? '');
  const [error, setError] = useState('');

  const handleContinue = () => {
    const trimmed = phone.trim();
    if (trimmed && !PHONE_PATTERN.test(trimmed)) {
      setError(t('onboarding.contact.invalid', 'Enter a valid phone number.'));
      return;
    }
    onNext(trimmed || undefined);
  };

  return (
    <div className={styles.body}>
      <Input
        size="large"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          if (error) setError('');
        }}
        placeholder={t('onboarding.contact.placeholder', '+998 90 123 45 67')}
      />
      {error && <div className={styles.errorMsg}>{error}</div>}
      <CustomButton
        type="primary"
        width="100%"
        onClick={handleContinue}
        loading={submitting}
      >
        {t('btn.continue')}
      </CustomButton>
      <button type="button" className={styles.skipLink} onClick={() => onNext(undefined)}>
        {t('onboarding.contact.skip', 'Skip for now')}
      </button>
    </div>
  );
}
