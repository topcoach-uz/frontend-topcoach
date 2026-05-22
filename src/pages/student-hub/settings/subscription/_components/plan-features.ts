/**
 * Canonical Community-plan feature list shown on every plan card across
 * the app (settings · subscription, roadmap paywall, landing pricing).
 *
 * Why hard-coded on the frontend: prices are admin-editable (and read
 * from the API), but the feature copy is fixed marketing language that
 * shouldn't drift across surfaces. Keeping it in one constant means
 * settings, roadmap, and landing always stay in sync.
 */
export interface PlanFeatureItem {
  /** Stable key — usable as i18n slot once translations land. */
  key: string;
  /** Bold lead-line of the bullet. */
  title: string;
  /** Editorial follow-up sentence under the title. */
  description: string;
}

export const COMMUNITY_PLAN_FEATURES: PlanFeatureItem[] = [
  {
    key: 'full_sat_prep_platform',
    title: 'Full SAT Prep Platform',
    description:
      'Math, Reading & Writing — lessons, practice tests, and score tracking.',
  },
  {
    key: 'research_prep_course',
    title: 'Research Prep — 8-Week Course',
    description:
      'Build your own research project from scratch — your strongest application edge.',
  },
  {
    key: 'admissions_foundation',
    title: 'Admissions Foundation Program',
    description:
      'A structured roadmap — from essays and extracurriculars to your final application.',
  },
  {
    key: 'unlimited_ai_major_tool',
    title: 'Unlimited AI Major Tool',
    description:
      'Explore majors, match your strengths, and discover best-fit programs with AI.',
  },
  {
    key: 'monthly_exclusive_workshops',
    title: 'Monthly Exclusive Workshops',
    description:
      'Live sessions on admissions strategy, grants, and scholarship opportunities.',
  },
  {
    key: 'study_buddy_matching',
    title: 'Study Buddy Matching',
    description:
      'AI pairs you with the right prep partner — study together, grow together.',
  },
  {
    key: 'unlimited_peer_messaging',
    title: 'Unlimited Peer Messaging',
    description:
      'Connect with fellow applicants — share tips, ask questions, no limits.',
  },
  {
    key: 'earn_coins_redeem_rewards',
    title: 'Earn Coins & Redeem Rewards',
    description:
      'Complete lessons, collect coins, and exchange them for real rewards.',
  },
];
