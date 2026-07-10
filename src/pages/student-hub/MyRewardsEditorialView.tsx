/**
 * My Rewards (editorial) — TopCoach Coins + Marketplace preview.
 *
 * Earning is live; the marketplace opens 2026-07-01 and stays locked
 * until then. Wired into the backend coin ledger via the coinsApi RTK
 * Query slice; no mock data lives in this file.
 *
 * Layout (per docs/COIN_SYSTEM_PRD.md §7.2):
 *   1. Header with the July 1 callout
 *   2. Balance card — balance + lifetime earned + next-milestone nudge
 *   3. How to earn — the 4 confirmed earn paths
 *   4. Recent earnings — last 10 ledger rows, empty state on day one
 *   5. Marketplace preview — locked cards, no prices, "Opens July 1" CTA
 *
 * Spent / Rank are deliberately not shown in v1 (Spent is always 0
 * until the marketplace opens; Rank has no real signal yet).
 */

import React, { useMemo, useState } from 'react';
import { Modal, message } from 'antd';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarCheck,
  Compass,
  Flame,
  Headphones,
  History,
  PenLine,
  PlayCircle,
  Shirt,
  ShoppingBag,
  Sparkles,
  Target,
  Trophy,
  CheckCircle2,
  Layers,
  type LucideIcon,
} from 'lucide-react';

import {
  useGetCoinBalanceQuery,
  useGetCoinTransactionsQuery,
  useGetMarketplaceItemsQuery,
  useGetRedemptionsQuery,
  useRedeemItemMutation,
  type CoinEventType,
  type MarketplaceCategory,
  type MarketplaceItem,
  type Redemption,
  type RedemptionStatus,
} from 'src/app/services/coinsApi';

import './MyRewardsEditorialView.scss';

/* ───────────────────────────────────────────────────────────────
   Static config — these match the locked PRD rules. Update here
   when product locks new earn types or marketplace categories.
   ─────────────────────────────────────────────────────────────── */

interface EarnRule {
  Icon: LucideIcon;
  title: string;
  detail: string;
  reward: string;
}

const HOW_TO_EARN: EarnRule[] = [
  {
    Icon: Flame,
    title: 'Daily login',
    detail: 'One bonus every day you sign in.',
    reward: '+5',
  },
  {
    Icon: PlayCircle,
    title: 'Complete a lesson',
    detail: 'Admissions lessons and Research Prep videos.',
    reward: '+15',
  },
  {
    Icon: Award,
    title: 'Complete a module or week',
    detail: '4 Admissions modules · 8 Research Prep weeks.',
    reward: '+100 / +50',
  },
  {
    Icon: Sparkles,
    title: 'Complete AI Major Match',
    detail: '+50 for the first run, +10 each time after.',
    reward: '+50 / +10',
  },
];

const EVENT_LABEL: Record<CoinEventType, { title: string; Icon: LucideIcon }> = {
  daily_login: { title: 'Daily login', Icon: CalendarCheck },
  admissions_lesson: { title: 'Completed an Admissions lesson', Icon: BookOpen },
  admissions_module: { title: 'Completed an Admissions module', Icon: Layers },
  rp_video: { title: 'Watched a Research Prep video', Icon: PenLine },
  rp_week: { title: 'Completed a Research Prep week', Icon: Trophy },
  ai_match_first: { title: 'Completed AI Major Match', Icon: Compass },
  ai_match_repeat: { title: 'Ran AI Major Match again', Icon: Compass },
  community_post: { title: 'Posted in the community', Icon: PenLine },
  community_comment: { title: 'Commented in the community', Icon: PenLine },
  community_reply: { title: 'Replied in the community', Icon: PenLine },
  community_revoke: { title: 'Community reward reversed', Icon: PenLine },
  marketplace_redeem: { title: 'Redeemed a reward', Icon: ShoppingBag },
  marketplace_refund: { title: 'Reward refunded', Icon: ShoppingBag },
};

// Backend RedemptionStatus lifecycle (src/modules/coins/coins.service.ts):
// pending -> fulfilled -> completed, or pending -> rejected / refunded / cancelled.
const REDEMPTION_STATUS_LABEL: Record<RedemptionStatus, string> = {
  pending: 'Pending',
  fulfilled: 'Fulfilled',
  completed: 'Completed',
  rejected: 'Rejected',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

// Backend error codes thrown from CoinsService.redeem — see
// src/modules/coins/coins.service.ts. Body shape is `{ code, message }`.
const REDEEM_ERROR_COPY: Record<string, string> = {
  INSUFFICIENT_COINS: "You don't have enough coins for this yet. Keep earning and come back.",
  OUT_OF_STOCK: 'This item just sold out. Check back soon for restock.',
  REDEMPTION_CAP_REACHED: "You've reached the monthly redemption limit for this item.",
  ITEM_LOCKED: 'This item is not available for redemption yet.',
  ITEM_NOT_PRICED: 'This item is not yet available for redemption.',
  ITEM_INACTIVE: 'This item is no longer available.',
  ITEM_NOT_FOUND: 'This item could not be found.',
  SERVICE_UNAVAILABLE: 'Redemptions are temporarily paused. Please try again later.',
};

const mintIdempotencyKey = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `redeem-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const CATEGORY_LABEL: Record<MarketplaceCategory, string> = {
  academic: 'Academic',
  coaching: 'Coaching',
  apparel: 'Apparel',
  study_gear: 'Study gear',
  access_perks: 'Access perks',
};

const CATEGORY_ICON: Record<MarketplaceCategory, LucideIcon> = {
  academic: PenLine,
  coaching: Headphones,
  apparel: Shirt,
  study_gear: BookOpen,
  access_perks: Sparkles,
};

const SKU_ICON: Partial<Record<string, LucideIcon>> = {
  'essay-expert-review': PenLine,
  'mentor-session-1on1': Headphones,
  'topcoach-classic-tee': Shirt,
  'topcoach-shield-cap': Shirt,
};

/* ───────────────────────────────────────────────────────────────── */

const formatCoins = (n: number) => n.toLocaleString('en-US');

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatUnlockDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const itemIcon = (item: MarketplaceItem): LucideIcon =>
  SKU_ICON[item.sku] ?? CATEGORY_ICON[item.category] ?? Sparkles;

/* ───────────────────────────────────────────────────────────────── */

const MyRewardsEditorialView: React.FC = () => {
  const { data: balance } = useGetCoinBalanceQuery();
  const { data: transactions = [] } = useGetCoinTransactionsQuery(10);
  const { data: marketplace = [] } = useGetMarketplaceItemsQuery();
  const { data: redemptions = [] } = useGetRedemptionsQuery(20);
  const [redeemItem, { isLoading: isRedeeming }] = useRedeemItemMutation();

  // Daily-login self-trigger fires from <DailyLoginCreditTracker /> at
  // the app root — see App.tsx. This page just renders the result.

  const currentBalance = balance?.balance ?? 0;
  const lifetimeEarned = balance?.lifetimeEarned ?? 0;

  // Whether the marketplace has actually opened — driven off real item
  // state (isUnlocked) rather than a hardcoded date, so this stays correct
  // once items are unlocked without needing a frontend redeploy.
  const marketplaceOpen = useMemo(() => marketplace.some((m) => m.isUnlocked), [marketplace]);

  // Fallback launch date for the still-locked items' copy — pulled from
  // the first locked item so it stays in sync with the seed.
  const launchDate = useMemo(() => {
    const locked = marketplace.find((m) => m.isLockedUntil);
    return formatUnlockDate(locked?.isLockedUntil ?? null) || 'soon';
  }, [marketplace]);

  // ── Redeem flow ──────────────────────────────────────────────────────
  const [redeemTarget, setRedeemTarget] = useState<MarketplaceItem | null>(null);
  const [redeemKey, setRedeemKey] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const openRedeemConfirm = (item: MarketplaceItem) => {
    setRedeemTarget(item);
    // Mint ONCE per confirm attempt and reuse across retries — a retry with
    // the same key hits the backend's idempotent path instead of
    // double-spending if the first attempt actually succeeded server-side.
    setRedeemKey(mintIdempotencyKey());
    setRedeemError(null);
  };

  const closeRedeemConfirm = () => {
    setRedeemTarget(null);
    setRedeemKey(null);
    setRedeemError(null);
  };

  const handleConfirmRedeem = async () => {
    if (!redeemTarget || !redeemKey) return;
    setRedeemError(null);
    try {
      await redeemItem({ itemId: redeemTarget.id, idempotencyKey: redeemKey }).unwrap();
      message.success(`Redeemed "${redeemTarget.title}". Your order is now pending fulfillment.`);
      closeRedeemConfirm();
    } catch (err: any) {
      const code: string | undefined = err?.data?.code;
      const friendly = (code && REDEEM_ERROR_COPY[code]) || err?.data?.message || 'Failed to redeem. Please try again.';
      setRedeemError(friendly);
      // Keep the modal open so the user can retry with the same idempotency key.
    }
  };

  const itemButtonState = (
    item: MarketplaceItem,
  ): { label: string; disabled: boolean; variant: 'redeem' | 'locked' } => {
    if (!item.isUnlocked) return { label: 'Locked', disabled: true, variant: 'locked' };
    if (item.costCoins == null) return { label: 'Coming soon', disabled: true, variant: 'locked' };
    if (currentBalance < item.costCoins) return { label: 'Not enough coins', disabled: true, variant: 'locked' };
    return { label: 'Redeem', disabled: false, variant: 'redeem' };
  };

  return (
    <div className="rewards">
      {/* Header ─────────────────────────────────────────────────── */}
      <header className="rewards__header">
        <div className="rewards__eyebrow">Account · Rewards</div>
        <h1 className="rewards__title">My Rewards</h1>
        <p className="rewards__subtitle">
          Earn TopCoach coins by completing lessons, modules, and daily check-ins.
          {marketplaceOpen
            ? ' The marketplace is open — redeem your coins for real rewards below.'
            : ` The marketplace opens ${launchDate} — start stacking coins now.`}
        </p>
      </header>

      {/* Coin balance hero ──────────────────────────────────────── */}
      <section className="rewards__hero">
        <div className="rewards__hero-text">
          <div className="rewards__hero-eyebrow">
            <span className="rewards__coin-glyph" aria-hidden>¢</span>
            TopCoach coins · Available balance
          </div>
          <div className="rewards__hero-balance">
            <span className="rewards__balance-num">{formatCoins(currentBalance)}</span>
            <span className="rewards__balance-unit">coins</span>
          </div>
          <div className="rewards__hero-stats">
            <div className="rewards__hero-stat">
              <span className="rewards__hero-stat-label">Lifetime earned</span>
              <span className="rewards__hero-stat-value">{formatCoins(lifetimeEarned)}</span>
            </div>
            <div className="rewards__hero-stat">
              <span className="rewards__hero-stat-label">Next milestone</span>
              <span className="rewards__hero-stat-value">Complete a lesson · +15</span>
            </div>
          </div>
          <div className="rewards__hero-actions">
            <button
              type="button"
              className="rewards__btn rewards__btn--primary"
              onClick={() => {
                const el = document.querySelector('.rewards__missions-card');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              See how to earn <ArrowUpRight size={14} />
            </button>
            <button
              type="button"
              className="rewards__btn rewards__btn--ghost"
              onClick={() => {
                const el = document.querySelector('.rewards__earnings');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <History size={14} /> Earning history
            </button>
          </div>
        </div>
        <div className="rewards__hero-coin" aria-hidden>
          <div className="rewards__coin">
            <span className="rewards__coin-mark">¢</span>
            <span className="rewards__coin-brand">TOP COACH</span>
          </div>
        </div>
      </section>

      {/* Two-up: How to earn + Recent earnings ──────────────────── */}
      <div className="rewards__row rewards__row--two">
        <section className="rewards__card rewards__missions-card">
          <div className="rewards__card-head">
            <div className="rewards__card-head-left">
              <Target size={16} />
              <h2 className="rewards__card-title">How to earn coins</h2>
            </div>
            <span className="rewards__card-meta">Four ways to earn while you study.</span>
          </div>
          <ul className="rewards__missions">
            {HOW_TO_EARN.map(({ Icon, title, detail, reward }) => (
              <li key={title} className="rewards__mission">
                <span className="rewards__mission-icon">
                  <Icon size={14} />
                </span>
                <div className="rewards__mission-main">
                  <div className="rewards__mission-title">{title}</div>
                  <div className="rewards__mission-detail">{detail}</div>
                </div>
                <span className="rewards__mission-reward">
                  {reward}
                  <span className="rewards__mission-coin">¢</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rewards__card rewards__earnings">
          <div className="rewards__card-head">
            <div className="rewards__card-head-left">
              <History size={16} />
              <h2 className="rewards__card-title">Recent earnings</h2>
            </div>
            <span className="rewards__card-meta">
              {transactions.length === 0
                ? 'No activity yet'
                : `Last ${transactions.length} event${transactions.length === 1 ? '' : 's'}`}
            </span>
          </div>
          {transactions.length === 0 ? (
            <div className="rewards__empty">
              No earnings yet. Log in tomorrow to start your streak (+5).
            </div>
          ) : (
            <ul className="rewards__earnings-list">
              {transactions.map((t) => {
                const label = EVENT_LABEL[t.eventType] ?? {
                  title: t.eventType,
                  Icon: Trophy,
                };
                return (
                  <li key={t.id} className="rewards__earning">
                    <span className="rewards__earning-icon">
                      <label.Icon size={14} />
                    </span>
                    <div className="rewards__earning-main">
                      <div className="rewards__earning-title">{label.title}</div>
                      <div className="rewards__earning-date">{formatDate(t.createdAt)}</div>
                    </div>
                    <span className="rewards__earning-amount">
                      {t.amount >= 0 ? `+${t.amount}` : t.amount}
                      <span className="rewards__earning-coin">¢</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Marketplace preview ────────────────────────────────────── */}
      <section className="rewards__marketplace">
        <div className="rewards__marketplace-head">
          <div>
            <h2 className="rewards__marketplace-title">TopCoach Marketplace</h2>
            <div className="rewards__marketplace-meta">
              {marketplaceOpen
                ? 'Redeem your coins for real rewards.'
                : `Opens ${launchDate} · Preview the rewards you're earning toward.`}
            </div>
          </div>
        </div>

        <div className="rewards__grid">
          {marketplace.map((item) => {
            const Icon = itemIcon(item);
            const btn = itemButtonState(item);
            return (
              <article key={item.id} className="rewards__item">
                <div
                  className={`rewards__item-thumb ${
                    !item.isUnlocked ? 'rewards__item-thumb--locked' : ''
                  }`}
                >
                  <Icon size={36} className="rewards__item-thumb-icon" />
                  {!item.isUnlocked && (
                    <div className="rewards__item-thumb-overlay">
                      <span className="rewards__item-thumb-overlay-text">
                        {item.isLockedUntil ? `Unlocks ${formatUnlockDate(item.isLockedUntil)}` : 'Coming soon'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="rewards__item-eyebrow">
                  {CATEGORY_LABEL[item.category].toUpperCase()}
                </div>
                <h3 className="rewards__item-title">{item.title}</h3>
                <p className="rewards__item-desc">{item.description}</p>
                <div className="rewards__item-foot">
                  <span className="rewards__item-cost">
                    {item.costCoins != null ? (
                      <>
                        {formatCoins(item.costCoins)}
                        <span className="rewards__item-coin" aria-hidden>¢</span>
                      </>
                    ) : (
                      <span className="rewards__item-cost-pending">Coming soon</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className={`rewards__btn rewards__btn--small ${
                      btn.variant === 'redeem' ? 'rewards__btn--primary' : 'rewards__btn--locked'
                    }`}
                    disabled={btn.disabled}
                    onClick={() => btn.variant === 'redeem' && openRedeemConfirm(item)}
                  >
                    {btn.label}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {!marketplaceOpen && (
          <div className="rewards__marketplace-note">
            More rewards land before {launchDate} — that's when redemptions open
            and you can start spending the coins you're stacking now.
          </div>
        )}
      </section>

      {/* Your redemptions ───────────────────────────────────────── */}
      <section className="rewards__card rewards__redemptions">
        <div className="rewards__card-head">
          <div className="rewards__card-head-left">
            <ShoppingBag size={16} />
            <h2 className="rewards__card-title">Your redemptions</h2>
          </div>
          <span className="rewards__card-meta">
            {redemptions.length === 0
              ? 'No redemptions yet'
              : `Last ${redemptions.length} order${redemptions.length === 1 ? '' : 's'}`}
          </span>
        </div>
        {redemptions.length === 0 ? (
          <div className="rewards__empty">
            You haven't redeemed anything yet. Once you do, your orders will show up here.
          </div>
        ) : (
          <ul className="rewards__redemptions-list">
            {redemptions.map((r: Redemption) => (
              <li key={r.id} className="rewards__redemption">
                <div className="rewards__redemption-main">
                  <div className="rewards__redemption-title">{r.title}</div>
                  <div className="rewards__redemption-date">{formatDate(r.createdAt)}</div>
                </div>
                <span className={`rewards__redemption-status rewards__redemption-status--${r.status}`}>
                  {REDEMPTION_STATUS_LABEL[r.status] ?? r.status}
                </span>
                <span className="rewards__redemption-amount">
                  -{formatCoins(r.costCoins)}
                  <span className="rewards__redemption-coin" aria-hidden>¢</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Redeem confirmation modal ─────────────────────────────────── */}
      <Modal
        title="Redeem this reward?"
        open={!!redeemTarget}
        onCancel={closeRedeemConfirm}
        onOk={handleConfirmRedeem}
        okText="Confirm redeem"
        okButtonProps={{ loading: isRedeeming, disabled: isRedeeming }}
        cancelButtonProps={{ disabled: isRedeeming }}
        maskClosable={!isRedeeming}
        closable={!isRedeeming}
      >
        {redeemTarget && (
          <div className="rewards__redeem-modal">
            <p className="rewards__redeem-modal-item">
              <strong>{redeemTarget.title}</strong>
            </p>
            <p className="rewards__redeem-modal-cost">
              This will cost{' '}
              <strong>
                {formatCoins(redeemTarget.costCoins ?? 0)} <span aria-hidden>¢</span>
              </strong>
              . Your current balance is {formatCoins(currentBalance)} coins.
            </p>
            {redeemError && <div className="rewards__redeem-modal-error">{redeemError}</div>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyRewardsEditorialView;

/* ──────────────────────────────────────────────────────────────
   Coming-soon placeholder. Once MY_REWARDS_SHOW_ALL is flipped on
   (and all community-enrolled users see the live view), this is
   rendered only for non-enrolled users. Kept for that fallback.
   ────────────────────────────────────────────────────────────── */

export const MyRewardsComingSoon: React.FC = () => (
  <div className="rewards rewards--coming-soon">
    <div className="rewards__coming">
      <div className="rewards__eyebrow">Account · Rewards</div>
      <div className="rewards__coming-mark" aria-hidden>
        <Trophy size={28} />
      </div>
      <h1 className="rewards__title">My Rewards is coming soon.</h1>
      <p className="rewards__subtitle">
        We're building a coin-based rewards system so the work you put into
        TopCoach actually pays off — earn for the habits that move your
        journey forward, then redeem for perks that help you go further.
      </p>
      <div className="rewards__coming-list">
        <div className="rewards__coming-row">
          <CheckCircle2 size={14} /> Earn coins for studying, completing lessons, and hitting milestones.
        </div>
        <div className="rewards__coming-row">
          <CheckCircle2 size={14} /> Redeem for essay reviews, bonus mentor sessions, and prep credits.
        </div>
        <div className="rewards__coming-row">
          <CheckCircle2 size={14} /> Streaks and seasonal challenges to keep momentum through application season.
        </div>
      </div>
    </div>
  </div>
);
