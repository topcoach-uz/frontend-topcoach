import { App, message } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import {
  useGetRoadmapQuery,
  useRegenerateRoadmapMutation,
} from 'src/app/services/roadmapApi';
import { useGetPlacementTestStatusQuery } from 'src/app/services/placementTestApi';
import { useTypedSelector } from 'src/app/store';
import { COMMUNITY_FUNNEL_PATHS } from 'src/lib/communityAccess';

import { RoadmapBody } from './_components/RoadmapBody';
import styles from './Roadmap.module.scss';

void App;

/**
 * Funnel-page roadmap. Full-bleed editorial (cream backdrop, narrow
 * column). The same content is shared with the settings · Roadmap tab
 * via `<RoadmapBody>`.
 */
export default function RoadmapPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useTypedSelector((s) => s.auth);

  const { data: status, isLoading: statusLoading } =
    useGetPlacementTestStatusQuery(undefined, { skip: !isAuthenticated });

  const { data, isLoading } = useGetRoadmapQuery(undefined, {
    skip: !isAuthenticated || !status?.profile.completed,
  });

  const [regenerate, { isLoading: regenBusy }] =
    useRegenerateRoadmapMutation();

  const handleChoosePlan = useCallback(() => {
    navigate(COMMUNITY_FUNNEL_PATHS.subscriptionTab);
  }, [navigate]);

  const handleEditProfile = useCallback(() => {
    navigate(COMMUNITY_FUNNEL_PATHS.profileBase);
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

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth/signin?next=${encodeURIComponent(COMMUNITY_FUNNEL_PATHS.roadmap)}`}
        replace
      />
    );
  }

  if (!statusLoading && status && !status.passed) {
    return <Navigate to={COMMUNITY_FUNNEL_PATHS.placementTest} replace />;
  }

  if (!statusLoading && status && !status.profile.completed) {
    return <Navigate to={COMMUNITY_FUNNEL_PATHS.profileBase} replace />;
  }

  if (isLoading || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.centered}>Generating your roadmap…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => navigate(COMMUNITY_FUNNEL_PATHS.profileBase)}
        >
          <ArrowLeft size={16} />
          Edit profile
        </button>

        <RoadmapBody
          data={data}
          onChoosePlan={handleChoosePlan}
          onEditProfile={handleEditProfile}
          onOpenTopcoach={(path) => navigate(path)}
          onRegenerate={handleRegenerate}
          regenBusy={regenBusy}
        />
      </div>
    </div>
  );
}
