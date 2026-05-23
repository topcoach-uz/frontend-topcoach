import { useEffect } from 'react';

import { useTypedSelector } from 'src/app/store';
import { useTriggerDailyLoginMutation } from 'src/app/services/coinsApi';

const STORAGE_KEY = 'topcoach:daily_login_credited';

const todayUtcKey = (): string => new Date().toISOString().slice(0, 10);

/**
 * Fires the daily-login coin credit once per UTC day per device.
 *
 * Mounted globally inside ReduxProvider (see App.tsx). Why here, not
 * in auth.service:
 *
 *   The backend hooks `creditDailyLogin()` into the explicit login
 *   path, but many users stay signed in via a long-lived refresh
 *   cookie — they never hit `login()`, so they'd never earn the +5.
 *   Firing from the frontend on profile resolution covers that case.
 *
 * The backend endpoint is idempotent (PG unique index on
 * `daily_login:{userId}:{YYYY-MM-DD}`); localStorage dedupes per
 * device so we don't even hit the network more than once a day.
 */
export const DailyLoginCreditTracker: React.FC = () => {
  const profileId = useTypedSelector((s) => s.auth.profile?.id);
  const [triggerDailyLogin] = useTriggerDailyLoginMutation();

  useEffect(() => {
    if (!profileId) return;
    const today = todayUtcKey();
    let lastFired: string | null = null;
    try {
      lastFired = localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage can throw in private-mode Safari — just always fire.
    }
    if (lastFired === today) return;

    triggerDailyLogin()
      .unwrap()
      .then(() => {
        try {
          localStorage.setItem(STORAGE_KEY, today);
        } catch {
          // Same story — silently skip dedupe if storage is unavailable.
        }
      })
      .catch(() => {
        // Backend swallows its own errors; nothing useful to do here.
      });
  }, [profileId, triggerDailyLogin]);

  return null;
};

export default DailyLoginCreditTracker;
