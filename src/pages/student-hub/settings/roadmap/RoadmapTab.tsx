import { Card } from 'antd';
import { message } from 'antd';
import { ArrowRight, Lock, Map as MapIcon } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetPlacementTestStatusQuery } from 'src/app/services/placementTestApi';
import {
  useGetRoadmapQuery,
  useRegenerateRoadmapMutation,
} from 'src/app/services/roadmapApi';

import { RoadmapBody } from 'src/pages/placement-test/roadmap/_components/RoadmapBody';
import roadmapStyles from 'src/pages/placement-test/roadmap/Roadmap.module.scss';

import styles from './RoadmapTab.module.scss';

const SUBSCRIPTION_TAB_PATH =
  '/student-hub?section=account&target=settings&tab=subscription';

/**
 * Roadmap inside the settings page.
 *
 * Visibility rules (the parent only mounts this when `tab === 'roadmap'`,
 * so we only need to handle the "what to show" part here):
 *
 *   - placement test not passed     → "Take the test first" pointer
 *   - profile not completed          → "Finish your profile" pointer
 *   - roadmap exists, no sub         → blurred preview + paywall (same as funnel)
 *   - roadmap exists, active sub     → full content + Regenerate
 *
 * This is the "if user happens to exit and come back" surface — the
 * blurred preview lives here for as long as the user is in that state.
 */
export function RoadmapTab() {
  const navigate = useNavigate();

  const { data: status, isLoading: statusLoading } =
    useGetPlacementTestStatusQuery();

  const profileReady = !!status?.passed && !!status?.profile.completed;

  const { data, isLoading, isError } = useGetRoadmapQuery(undefined, {
    skip: !profileReady,
  });

  const [regenerate, { isLoading: regenBusy }] =
    useRegenerateRoadmapMutation();

  const handleChoosePlan = useCallback(() => {
    navigate(SUBSCRIPTION_TAB_PATH);
  }, [navigate]);

  const handleEditProfile = useCallback(() => {
    navigate('/placement-test/profile');
  }, [navigate]);

  const handleRegenerate = useCallback(async () => {
    try {
      await regenerate().unwrap();
      message.success('Roadmap regenerated.');
    } catch (err) {
      message.error(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.data?.message ?? 'Couldn’t regenerate. Please try again.',
      );
    }
  }, [regenerate]);

  // ── Gates before content ───────────────────────────────────────────────

  if (statusLoading) {
    return (
      <Card className={styles.card} title={titleEl()}>
        <div className={styles.centered}>Loading your roadmap…</div>
      </Card>
    );
  }

  if (!status?.passed) {
    return (
      <LockedCard
        title="Pass the English placement test first"
        body="The roadmap unlocks once you’ve passed the short English check. Takes 10 minutes."
        cta="Start the test"
        onCta={() => navigate('/placement-test')}
      />
    );
  }

  if (!status.profile.completed) {
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
      <Card className={styles.card} title={titleEl()}>
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
        onEditProfile={handleEditProfile}
        onOpenTopcoach={(path) => navigate(path)}
        onRegenerate={handleRegenerate}
        regenBusy={regenBusy}
      />
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────

function titleEl() {
  return (
    <>
      <MapIcon size={18} style={{ marginRight: 8 }} />
      Roadmap
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
