import { Card } from 'antd';
import { ArrowRight, Lock, Map as MapIcon } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useGetPlacementTestStatusQuery } from 'src/app/services/placementTestApi';
import { useGetRoadmapQuery } from 'src/app/services/roadmapApi';

import { RoadmapBody } from 'src/pages/placement-test/roadmap/_components/RoadmapBody';
import roadmapStyles from 'src/pages/placement-test/roadmap/Roadmap.module.scss';

import styles from './RoadmapTab.module.scss';

const SUBSCRIPTION_TAB_PATH =
  '/student-hub?section=account&target=settings&tab=subscription';

export interface RoadmapTabProps {
  /** Counselor read-only embed (see ProfilePage's other tabs for the same
   *  contract). There is currently no read-only backend endpoint for a
   *  counselor to fetch ANOTHER student's roadmap (`GET /roadmap/me` is
   *  hard-scoped to the caller's own JWT, and the
   *  `student-journey-readonly` controller family has no roadmap route)
   *  — so instead of silently calling `/roadmap/me` under the counselor's
   *  OWN account (which would show the wrong person's roadmap, or 403
   *  since counselors have no admissions profile), this renders a plain
   *  "not available in this view yet" card. See PATTERNS note in the
   *  handoff report for the follow-up if a real read-only view is wanted. */
  readOnly?: boolean;
  studentId?: string;
}

/**
 * Roadmap — a tab inside the student profile hub (`ProfilePage`), reached
 * at `?section=others&target=profile&tab=roadmap`. Used to live inside
 * Settings; moved here so it sits alongside the rest of the student's
 * profile instead of account/billing settings. Old `?tab=roadmap`
 * Settings deep-links redirect to the new location — see
 * `MenteeSettingsPageMock.tsx`.
 *
 * Visibility rules (the parent only mounts this when its own tab is
 * active, so we only need to handle the "what to show" part here):
 *
 *   - readOnly (counselor embed)     → "not available in this view" card
 *   - profile not completed          → "Finish your profile" pointer
 *   - roadmap exists, no sub         → blurred preview + paywall (same as funnel)
 *   - roadmap exists, active sub     → full content + Regenerate
 *
 * This is the "if user happens to exit and come back" surface — the
 * blurred preview lives here for as long as the user is in that state.
 */
export function RoadmapTab({ readOnly = false, studentId }: RoadmapTabProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Silence the unused-var lint until a real read-only roadmap endpoint
  // exists — kept in the prop contract now so callers don't need a second
  // change later, matching every sibling profile-hub tab.
  void studentId;

  const { data: status, isLoading: statusLoading } = useGetPlacementTestStatusQuery(
    undefined,
    { skip: readOnly },
  );

  const profileReady = !readOnly && !!status?.profile.completed;

  const { data, isLoading, isError } = useGetRoadmapQuery(undefined, {
    skip: readOnly || !profileReady,
  });

  const handleChoosePlan = useCallback(() => {
    navigate(SUBSCRIPTION_TAB_PATH);
  }, [navigate]);

  // ── Gates before content ───────────────────────────────────────────────

  if (readOnly) {
    return (
      <Card className={styles.card} title={titleEl(t)}>
        <div className={styles.centered}>
          {t(
            'studentHub.profile.roadmap.readOnlyUnavailable',
            "Roadmap isn't available in this read-only view yet.",
          )}
        </div>
      </Card>
    );
  }

  if (statusLoading) {
    return (
      <Card className={styles.card} title={titleEl(t)}>
        <div className={styles.centered}>Loading your roadmap…</div>
      </Card>
    );
  }

  if (!status?.profile.completed) {
    return (
      <LockedCard
        title="Finish your admissions profile"
        body="A few quick questions about your goals so we can personalize your roadmap."
        cta="Continue profile"
        onCta={() => navigate('/placement-test/profile')}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <Card className={styles.card} title={titleEl(t)}>
        <div className={styles.centered}>
          {isError
            ? 'Roadmap not available right now.'
            : 'Generating your roadmap…'}
        </div>
      </Card>
    );
  }

  // ── Full content ───────────────────────────────────────────────────────

  return (
    <div className={`${styles.host} ${roadmapStyles.shell}`}>
      <RoadmapBody
        data={data}
        onChoosePlan={handleChoosePlan}
        onOpenTopcoach={(path) => navigate(path)}
      />
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────

function titleEl(t: (key: string, fallback: string) => string) {
  return (
    <>
      <MapIcon size={18} style={{ marginRight: 8 }} />
      {t('settings.roadmap.tab', 'Roadmap')}
    </>
  );
}

function LockedCard({
  title,
  body,
  cta,
  onCta,
}: {
  title: string;
  body: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <Card className={styles.card} title={titleEl()}>
      <div className={styles.gate}>
        <span className={styles.gate__icon}>
          <Lock size={18} />
        </span>
        <h3 className={styles.gate__title}>{title}</h3>
        <p className={styles.gate__body}>{body}</p>
        <button type="button" className={styles.gate__cta} onClick={onCta}>
          {cta}
          <ArrowRight size={14} />
        </button>
      </div>
    </Card>
  );
}
