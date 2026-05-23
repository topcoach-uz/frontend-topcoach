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

import React, { useMemo } from 'react';
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
  type CoinEventType,
  type MarketplaceCategory,
  type MarketplaceItem,
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
};

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

  // Daily-login self-trigger fires from <DailyLoginCreditTracker /> at
  // the app root — see App.tsx. This page just renders the result.

  const currentBalance = balance?.balance ?? 0;
  const lifetimeEarned = balance?.lifetimeEarned ?? 0;

  // Marketplace launch date — pulled from the first locked item so the
  // copy stays in sync if we shift the date in the seed without
  // re-deploying the frontend.
  const launchDate = useMemo(() => {
    const locked = marketplace.find((m) => m.isLockedUntil);
    return formatUnlockDate(locked?.isLockedUntil ?? null) || 'July 1, 2026';
  }, [marketplace]);

  return (
    <div className="rewards">
      {/* Header ─────────────────────────────────────────────────── */}
      <header className="rewards__header">
        <div className="rewards__eyebrow">Account · Rewards</div>
        <h1 className="rewards__title">My Rewards</h1>
        <p className="rewards__subtitle">
          Earn TopCoach coins by completing lessons, modules, and daily check-ins.
          The marketplace opens {launchDate} — start stacking coins now.
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
              Opens {launchDate} · Preview the rewards you're earning toward.
            </div>
          </div>
        </div>

        <div className="rewards__grid">
          {marketplace.map((item) => {
            const Icon = itemIcon(item);
            return (
              <article key={item.id} className="rewards__item">
                <div className="rewards__item-thumb">
                  {!item.isUnlocked && (
                    <span className="rewards__limited">Coming soon</span>
                  )}
                  <Icon size={36} />
                </div>
                <div className="rewards__item-eyebrow">
                  {CATEGORY_LABEL[item.category].toUpperCase()}
                </div>
                <h3 className="rewards__item-title">{item.title}</h3>
                <p className="rewards__item-desc">{item.description}</p>
                <div className="rewards__item-foot">
                  <button
                    type="button"
                    className="rewards__btn rewards__btn--locked rewards__btn--small"
                    disabled
                    title={`Redemptions open ${launchDate}`}
                  >
                    {item.isUnlocked ? 'Available' : 'Locked'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="rewards__marketplace-note">
          More rewards land before {launchDate} — that's when redemptions open
          and you can start spending the coins you're stacking now.
        </div>
      </section>
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
