import { useTranslation } from 'react-i18next';
import TelegramConnectionContent from 'src/components/TelegramConnectionModal/TelegramConnectionContent';
import styles from '../onboarding.module.scss';

interface Props {
  onNext: () => void;
}

/**
 * Wizard Step 3 — Connect Telegram. Reuses the same content used inside
 * TelegramConnectionModal (extracted into TelegramConnectionContent) so the
 * connect flow/copy/status handling stays identical everywhere it appears.
 * Auto-advances via onConnected once the account is linked; otherwise the
 * user can skip and connect later from Settings.
 */
export default function StepTelegram({ onNext }: Props) {
  const { t } = useTranslation();

  return (
    <div className={styles.body}>
      <TelegramConnectionContent onConnected={onNext} />
      <button type="button" className={styles.skipLink} onClick={onNext}>
        {t('onboarding.telegram.skip', 'Skip for now')}
      </button>
    </div>
  );
}
