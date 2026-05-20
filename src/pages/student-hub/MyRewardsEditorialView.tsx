/**
 * My Rewards (editorial) — TopCoach Coins, Missions, Marketplace.
 *
 * Editorial / magazine treatment that mirrors My Progress, Full Support,
 * and AI Major Match: cream surfaces, hairline borders, serif headlines,
 * brand-red accents.
 *
 * Behind the `MY_REWARDS_SHOW_ALL` flag — only SuperAdmin / Owner see
 * the live UI today. Wired into CommunityHubMockPage; the upstream
 * caller decides between this view and the "Coming soon" placeholder.
 *
 * The numbers below are *demo data* by design. Wire up to a real
 * `useGetMyCoinsQuery` once the backend `/me/coins` endpoint exists —
 * for now the structure is intentionally close to what the API will
 * shape (balance, lifetime earned, spent, rank, missions, history,
 * marketplace items) so the swap is mechanical.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Coffee,
  Compass,
  FlaskConical,
  GraduationCap,
  Headphones,
  History,
  MessageCircle,
  PenLine,
  Pencil,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import './MyRewardsEditorialView.scss';

/* ───────────────────────────────────────────────────────────────
   Demo data — keep in this file until the backend lands.
   The shapes are deliberately close to what `/me/coins` will
   return so the wiring is a mechanical swap.
   ─────────────────────────────────────────────────────────────── */

interface MissionRow {
  Icon: LucideIcon;
  title: string;
  reward: string;
}

const HOW_TO_EARN: MissionRow[] = [
  { Icon: CalendarCheck, title: 'Daily login streak', reward: '+5–50 / day' },
  { Icon: GraduationCap, title: 'Complete a SAT mock test', reward: '+120' },
  { Icon: PenLine, title: 'Submit a mentor task on time', reward: '+80' },
  { Icon: MessageCircle, title: 'Helpful answer in community', reward: '+10–80' },
  { Icon: Users, title: 'Match with a study buddy', reward: '+40' },
  { Icon: Target, title: 'Hit weekly study goal', reward: '+100' },
];

interface EarningRow {
  Icon: LucideIcon;
  title: string;
  date: string;
  amount: number;
}

const RECENT_EARNINGS: EarningRow[] = [
  { Icon: CalendarCheck, title: 'Daily streak · 14 days', date: 'May 6, 2026', amount: 50 },
  { Icon: Users, title: 'Replied to study buddy match', date: 'May 5, 2026', amount: 20 },
  { Icon: GraduationCap, title: 'Completed SAT mock test #3', date: 'May 3, 2026', amount: 120 },
  { Icon: MessageCircle, title: 'Posted helpful answer · +12 ❤', date: 'May 1, 2026', amount: 80 },
  { Icon: PenLine, title: 'Submitted Lumiere essay draft', date: 'Apr 28, 2026', amount: 150 },
  { Icon: Compass, title: 'Completed AI Major Match', date: 'Apr 22, 2026', amount: 60 },
];

type MarketplaceCategory = 'all' | 'apparel' | 'study' | 'home' | 'access';

interface MarketplaceItem {
  id: string;
  category: Exclude<MarketplaceCategory, 'all'>;
  Icon: LucideIcon;
  title: string;
  desc: string;
  cost: number;
  limited?: boolean;
  locked?: boolean;
}

const MARKETPLACE: MarketplaceItem[] = [
  {
    id: 'tc-tee',
    category: 'apparel',
    Icon: Sparkles,
    title: 'TopCoach Classic Tee',
    desc: 'Heavy cotton, crimson on cream.',
    cost: 850,
  },
  {
    id: 'tc-cap',
    category: 'apparel',
    Icon: Sparkles,
    title: 'Embroidered Shield Cap',
    desc: 'Six-panel · adjustable strap.',
    cost: 600,
  },
  {
    id: 'tc-mug',
    category: 'home',
    Icon: Coffee,
    title: 'Ceramic Mug — "Future Alum"',
    desc: '14oz · dishwasher-safe.',
    cost: 450,
  },
  {
    id: 'tc-notebook',
    category: 'study',
    Icon: PenLine,
    title: 'Notebook · Hardcover A5',
    desc: 'Dot grid · 192 pages.',
    cost: 520,
  },
  {
    id: 'tc-stickers',
    category: 'study',
    Icon: Star,
    title: 'Premium Stickers Pack',
    desc: '12 vinyl die-cut stickers.',
    cost: 120,
  },
  {
    id: 'tc-hoodie',
    category: 'apparel',
    Icon: Sparkles,
    title: 'Hoodie · Heavyweight',
    desc: '380gsm · cream / crimson.',
    cost: 1800,
    limited: true,
  },
  {
    id: 'tc-mentor-hour',
    category: 'access',
    Icon: Headphones,
    title: '1-on-1 Mentor Hour (Bonus)',
    desc: 'Extra session beyond your plan.',
    cost: 2500,
    limited: true,
    locked: true,
  },
  {
    id: 'tc-pen-set',
    category: 'study',
    Icon: Pencil,
    title: 'Pen & Pencil Set',
    desc: 'Brass · refillable.',
    cost: 350,
  },
  {
    id: 'tc-tote',
    category: 'apparel',
    Icon: ShoppingBag,
    title: 'Tote Bag · Canvas',
    desc: 'Heavy canvas · book pocket.',
    cost: 480,
  },
  {
    id: 'tc-mock-voucher',
    category: 'access',
    Icon: GraduationCap,
    title: 'Bluebook Mock Test Voucher',
    desc: 'Unlocks 1 extra mock retake.',
    cost: 900,
  },
  {
    id: 'tc-workshop',
    category: 'access',
    Icon: FlaskConical,
    title: 'Workshop Pass · Any topic',
    desc: 'Redeem for any 1 paid workshop.',
    cost: 1500,
    locked: true,
  },
  {
    id: 'tc-pin',
    category: 'home',
    Icon: Star,
    title: 'Enamel Pin Set (3)',
    desc: 'Shield · pen · book pins.',
    cost: 280,
  },
];

const CATEGORY_LABEL: Record<MarketplaceCategory, string> = {
  all: 'All',
  apparel: 'Apparel',
  study: 'Study gear',
  home: 'Home & lifestyle',
  access: 'Access perks',
};

const MyRewardsEditorialView: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory>('all');

  // Demo balance — wire to /me/coins once backend ships.
  const balance = 1240;
  const lifetimeEarned = 2090;
  const spent = 850;
  const rankLabel = 'Top 8%';

  const visibleMarketplace = useMemo(
    () =>
      activeCategory === 'all'
        ? MARKETPLACE
        : MARKETPLACE.filter((m) => m.category === activeCategory),
    [activeCategory],
  );

  const formatCoins = (n: number) =>
    n.toLocaleString('en-US');

  return (
    <div className="rewards">
      {/* Header ─────────────────────────────────────────────────── */}
      <header className="rewards__header">
        <div className="rewards__eyebrow">Account · Rewards</div>
        <h1 className="rewards__title">My Rewards</h1>
        <p className="rewards__subtitle">
          Earn TopCoach coins by studying, contributing, and hitting your goals. Redeem
          in the marketplace for swag, study gear, and bonus access.
        </p>
      </header>

      {/* Coin balance hero ──────────────────────────────────────── */}
      <section className="rewards__hero">
        <div className="rewards__hero-text">
          <div className="rewards__hero-eyebrow">
            <span className="rewards__coin-glyph" aria-hidden>
              ¢
            </span>
            TopCoach coins · Available balance
          </div>
          <div className="rewards__hero-balance">
            <span className="rewards__balance-num">{formatCoins(balance)}</span>
            <span className="rewards__balance-unit">coins</span>
          </div>
          <div className="rewards__hero-stats">
            <div className="rewards__hero-stat">
              <span className="rewards__hero-stat-label">Lifetime earned</span>
              <span className="rewards__hero-stat-value">{formatCoins(lifetimeEarned)}</span>
            </div>
            <div className="rewards__hero-stat">
              <span className="rewards__hero-stat-label">Spent</span>
              <span className="rewards__hero-stat-value">{formatCoins(spent)}</span>
            </div>
            <div className="rewards__hero-stat">
              <span className="rewards__hero-stat-label">Rank</span>
              <span className="rewards__hero-stat-value">{rankLabel}</span>
            </div>
          </div>
          <div className="rewards__hero-actions">
            <button
              type="button"
              className="rewards__btn rewards__btn--primary"
              onClick={() => {
                const el = document.querySelector('.rewards__marketplace');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Browse marketplace <ArrowUpRight size={14} />
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
        <section className="rewards__card">
          <div className="rewards__card-head">
            <div className="rewards__card-head-left">
              <Target size={16} />
              <h2 className="rewards__card-title">How to earn coins</h2>
            </div>
            <span className="rewards__card-meta">The more you engage, the faster you earn.</span>
          </div>
          <ul className="rewards__missions">
            {HOW_TO_EARN.map(({ Icon, title, reward }) => (
              <li key={title} className="rewards__mission">
                <span className="rewards__mission-icon">
                  <Icon size={14} />
                </span>
                <span className="rewards__mission-title">{title}</span>
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
            <button
              type="button"
              className="rewards__card-action"
              onClick={() => {
                /* hook into a future /coins/history page */
              }}
            >
              All <ArrowUpRight size={13} />
            </button>
          </div>
          <div className="rewards__earnings-meta">
            Last 7 days · +{formatCoins(
              RECENT_EARNINGS.filter((r) => true).reduce((acc, r) => acc + r.amount, 0),
            )}{' '}
            coins
          </div>
          <ul className="rewards__earnings-list">
            {RECENT_EARNINGS.map((r) => (
              <li key={r.title} className="rewards__earning">
                <span className="rewards__earning-icon">
                  <r.Icon size={14} />
                </span>
                <div className="rewards__earning-main">
                  <div className="rewards__earning-title">{r.title}</div>
                  <div className="rewards__earning-date">{r.date}</div>
                </div>
                <span className="rewards__earning-amount">
                  +{r.amount}
                  <span className="rewards__earning-coin">¢</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Marketplace ────────────────────────────────────────────── */}
      <section className="rewards__marketplace">
        <div className="rewards__marketplace-head">
          <div>
            <h2 className="rewards__marketplace-title">TopCoach Marketplace</h2>
            <div className="rewards__marketplace-meta">
              {MARKETPLACE.length} items available · ships to UZ + 14 countries
            </div>
          </div>
          <div className="rewards__chips" role="tablist" aria-label="Marketplace category">
            {(Object.keys(CATEGORY_LABEL) as MarketplaceCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={activeCategory === c}
                className={`rewards__chip ${activeCategory === c ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(c)}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="rewards__grid">
          {visibleMarketplace.map((item) => {
            const canAfford = balance >= item.cost && !item.locked;
            return (
              <article key={item.id} className="rewards__item">
                <div className="rewards__item-thumb">
                  {item.limited && <span className="rewards__limited">Limited</span>}
                  <item.Icon size={36} />
                </div>
                <div className="rewards__item-eyebrow">
                  {CATEGORY_LABEL[item.category].toUpperCase()}
                </div>
                <h3 className="rewards__item-title">{item.title}</h3>
                <p className="rewards__item-desc">{item.desc}</p>
                <div className="rewards__item-foot">
                  <span className="rewards__item-cost">
                    <span className="rewards__item-coin">¢</span>
                    {formatCoins(item.cost)}
                  </span>
                  <button
                    type="button"
                    className={`rewards__btn ${
                      canAfford ? 'rewards__btn--primary' : 'rewards__btn--locked'
                    } rewards__btn--small`}
                    disabled={!canAfford}
                  >
                    {item.locked ? 'Locked' : canAfford ? 'Redeem' : 'Locked'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="rewards__suggest">
          <div>
            <div className="rewards__suggest-title">Suggest a reward</div>
            <div className="rewards__suggest-desc">
              Got an idea for the marketplace? We add the most-requested items each month.
            </div>
          </div>
          <button
            type="button"
            className="rewards__btn rewards__btn--ghost"
            onClick={() => navigate('/student-hub?section=messages')}
          >
            Submit suggestion <ArrowUpRight size={13} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default MyRewardsEditorialView;

/* ──────────────────────────────────────────────────────────────
   Coming soon placeholder. Rendered for non-SuperAdmin users
   while `MY_REWARDS_SHOW_ALL` is false.
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
