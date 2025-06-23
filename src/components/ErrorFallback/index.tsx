import { isProduction } from 'src/utils';
import { sendErrorToTelegram } from 'src/utils/telegramLogger';
import { CustomButton } from '../common';
import styles from './ErrorFallback.module.scss';

interface Props {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: Props) {
  if (isProduction()) {
    sendErrorToTelegram(error);
  }

  const handleTry = () => {
    window.location.reload();
    resetErrorBoundary();
  };

  return (
    <>
      <main className={styles.errorContainer}>
        <h1 className={styles.title}>Oops! Something went wrong.</h1>
        <p className={styles.description}>
          We are sorry for the inconvenience. Please try again later. If the
          issues persists, please contact the devs through telegram at{' '}
          <a href="https://t.me/topcoach_support_dev_bot">
            TopCoach Dev support{' '}
          </a>
        </p>
        <CustomButton mt={50} type="primary" onClick={handleTry}>
          Try Again
        </CustomButton>
      </main>
    </>
  );
}
