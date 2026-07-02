import { Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useGetCoinBalanceQuery } from 'src/app/services/coinsApi';
import { useTypedSelector } from 'src/app/store';
import { UserRole, RoleEnum } from 'src/app/api/Api';

import styles from './coinChip.module.scss';

/**
 * Persistent TopCoach-coin balance chip for the global header.
 *
 * Why it lives here: coins were only ever visible inside `/student-hub`
 * (the profile-card pill), so users never saw their balance anywhere
 * else — the discoverability gap the rewards research flagged. A single
 * always-on chip in the header (the Duolingo/Apple-Wallet convention:
 * the one status number gets the top-right) fixes that without scattering
 * coin chrome across every page.
 *
 * Gating: shown only to the population the rewards page is built for —
 * students, plus SuperAdmin / Owner (who use the student hub too). The
 * `JourneyExperienceProvider` (source of `isCommunityEnrolled`) is mounted
 * only inside the student-hub gate, so it isn't readable from the global
 * header; we gate on the globally-available auth role instead. The balance
 * query is skipped for everyone else so non-students never hit the endpoint.
 */
export default function CoinChip() {
  const navigate = useNavigate();
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const role = useTypedSelector((s) => s.auth.profile?.profile?.role);
  const managementRole = useTypedSelector((s) => s.auth.profile?.managementRole);

  const isPrivileged =
    managementRole === RoleEnum.SuperAdmin || managementRole === RoleEnum.Owner;
  const isEligible = isAuthenticated && (role === UserRole.Student || isPrivileged);

  const { data: balance } = useGetCoinBalanceQuery(undefined, {
    skip: !isEligible,
  });

  if (!isEligible) return null;

  const value = balance?.balance ?? 0;

  return (
    <button
      type="button"
      className={styles.coinChip}
      onClick={() => navigate('/student-hub?section=account&target=rewards')}
      aria-label={`View ${value.toLocaleString()} TopCoach coins`}
      title="My Rewards"
    >
      <Coins size={16} aria-hidden className={styles.coinIcon} />
      <span className={styles.coinValue}>{value.toLocaleString()}</span>
    </button>
  );
}
