import { useEffect } from 'react';
import { Alert, Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  useGetSubscriptionPlansQuery,
  useGetCurrentSubscriptionQuery,
} from 'src/app/services/subscription';
import ClickCommunityCheckout from 'src/pages/student-hub/settings/subscription/_components/ClickCommunityCheckout';
import { posthog, posthogEnabled } from 'src/lib/posthog';
import styles from '../onboarding.module.scss';

export default function StepTrial({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  const plans = useGetSubscriptionPlansQuery();
  const subscription = useGetCurrentSubscriptionQuery();
  useEffect(() => {
    if (posthogEnabled)
      posthog.capture('onboarding_step_viewed', { step: 'trial' });
  }, []);
  return (
    <div className={styles.body}>
      {plans.isLoading || subscription.isLoading ? (
        <Skeleton active />
      ) : plans.error || subscription.error ? (
        <Alert
          type="error"
          message={t(
            'settings.subscription.error.description',
            'Please refresh the page or try again in a moment.',
          )}
        />
      ) : (
        <ClickCommunityCheckout
          plans={plans.data ?? []}
          subscription={subscription.data ?? null}
          onRefresh={subscription.refetch}
        />
      )}
      <button type="button" className={styles.skipLink} onClick={onNext}>
        {t('onboarding.trial.skip', 'Maybe later')}
      </button>
    </div>
  );
}
