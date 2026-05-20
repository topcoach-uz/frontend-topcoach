import { App } from 'antd';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { useGetRoadmapQuery } from 'src/app/services/roadmapApi';
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
 *
 * Editing-flow note: the in-page roadmap intentionally has no "Edit
 * profile" or "Regenerate" affordance anymore. Both were a recurring
 * source of UX bugs (resume-redirect loops, cooldown confusion) and
 * the simpler model — read-only report, profile lives elsewhere —
 * matches every real SaaS reporting page. Users land back in the hub
 * via the "Back to dashboard" link at the top.
 */
export default function RoadmapPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useTypedSelector((s) => s.auth);

  const { data: status, isLoading: statusLoading } =
    useGetPlacementTestStatusQuery(undefined, { skip: !isAuthenticated });

  const { data, isLoading } = useGetRoadmapQuery(undefined, {
    skip: !isAuthenticated || !status?.profile.completed,
  });

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
        <div className={styles.shell}>
          <GeneratingRoadmap />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => navigate('/student-hub')}
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        <RoadmapBody
          data={data}
          onChoosePlan={() => navigate(COMMUNITY_FUNNEL_PATHS.subscriptionTab)}
          onOpenTopcoach={(path) => navigate(path)}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// "Generating your roadmap…" view
//
// The roadmap request hits Gemini and routinely takes 8–15 seconds end-
// to-end (profile fetch → prompt build → API → parse → persist). A
// static "Generating…" line during that wait makes the page look like
// it broke. This component cycles through grounded status messages
// (each one describes a real step the backend goes through) and shows
// a step-pip strip so the user can see progress moving forward, even
// though we don't have a real percentage to report.
// ─────────────────────────────────────────────────────────────────────

const GENERATING_STEPS = [
  'Reading your profile…',
  'Cross-referencing your target universities…',
  'Building your timeline…',
  'Drafting your personalized action plan…',
  'Polishing your roadmap…',
];

function GeneratingRoadmap() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      // Cap on the final message instead of looping — if Gemini takes
      // a bit longer than expected, we hold on "Polishing…" rather
      // than restart from step 1 (which would look like a retry).
      setIndex((i) => Math.min(i + 1, GENERATING_STEPS.length - 1));
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className={styles.generating}>
      <div className={styles.generatingHalo} aria-hidden>
        <Sparkles size={26} strokeWidth={2} />
      </div>
      <div className={styles.generatingEyebrow}>Top Coach University</div>
      <h2 key={index} className={styles.generatingTitle}>
        {GENERATING_STEPS[index]}
      </h2>
      <p className={styles.generatingLede}>
        We're personalizing every section from the answers you just gave us.
        This usually takes ~10–15 seconds.
      </p>
      <ol className={styles.generatingSteps} aria-label="Roadmap generation progress">
        {GENERATING_STEPS.map((label, i) => (
          <li
            key={label}
            className={`${styles.generatingStep} ${
              i < index
                ? styles.generatingStepDone
                : i === index
                  ? styles.generatingStepActive
                  : ''
            }`}
          >
            <span className={styles.generatingStepDot} aria-hidden />
            <span className={styles.generatingStepLabel}>{label.replace(/…$/, '')}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
