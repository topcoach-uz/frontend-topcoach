import { App, message } from 'antd';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
  PatchAdmissionsProfileBody,
  useCompleteAdmissionsProfileMutation,
  useGetAdmissionsProfileQuery,
  usePatchAdmissionsProfileMutation,
} from 'src/app/services/admissionsProfileApi';
import {
  ProfileStep,
  useGetPlacementTestStatusQuery,
} from 'src/app/services/placementTestApi';
import { useTypedSelector } from 'src/app/store';
import {
  COMMUNITY_FUNNEL_PATHS,
  profilePath,
} from 'src/lib/communityAccess';

import { SubStepper } from './_components/SubStepper';
import styles from './Profile.module.scss';
import { StepAcademic } from './steps/StepAcademic';
import { StepBasic } from './steps/StepBasic';
import { StepGoals } from './steps/StepGoals';
import { StepNeeds } from './steps/StepNeeds';

void App; // antd App context — required for `message` to render correctly

const STEP_ORDER: ProfileStep[] = ['basic', 'academic', 'goals', 'needs'];
const STEP_TITLES: Record<ProfileStep, string> = {
  basic: 'Tell us about you',
  academic: 'Academic profile',
  goals: 'Goals & interests',
  needs: 'Challenges & timing',
};
const STEP_LEDES: Record<ProfileStep, string> = {
  basic: 'A handful of basics so we can address you properly.',
  academic: 'SAT and activities — extras you already have on your résumé.',
  goals: 'What you’re aiming for and where you’d like to apply.',
  needs: 'A few constraints that help us keep your roadmap realistic.',
};

/**
 * Profile wizard. Four sub-steps; autosave on every "Next" PATCHes the
 * draft. The server is the source of truth — partial drafts persist
 * between visits, so refresh restores the user to their last step.
 *
 * Routed as `/placement-test/profile/:step`. Invalid `:step` redirects
 * to the resume target.
 */
export default function ProfileWizardPage() {
  const navigate = useNavigate();
  // Step source is dual: either a route-param (`/placement-test/profile/:step`,
  // legacy) or a URL search-param (`?section=placement-profile&step=basic`,
  // when mounted inside the hub). Search-params win when both are set.
  const { step: routeStepParam } = useParams<{ step?: string }>();
  const [searchParams] = useSearchParams();
  const stepParam = searchParams.get('step') ?? routeStepParam ?? undefined;

  const { isAuthenticated } = useTypedSelector((s) => s.auth);

  const { data: status, isLoading: statusLoading } =
    useGetPlacementTestStatusQuery(undefined, { skip: !isAuthenticated });
  const { data: profile } = useGetAdmissionsProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [patchProfile, { isLoading: patching }] =
    usePatchAdmissionsProfileMutation();
  const [completeProfile, { isLoading: completing }] =
    useCompleteAdmissionsProfileMutation();

  const [draft, setDraft] = useState<PatchAdmissionsProfileBody>({});

  // ── Guards ──────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth/signin?next=${encodeURIComponent(profilePath())}`}
        replace
      />
    );
  }

  if (!statusLoading && status && !status.passed) {
    return <Navigate to={COMMUNITY_FUNNEL_PATHS.placementTest} replace />;
  }

  // After the user completes the profile, send them to the roadmap step.
  if (status?.profile.completed) {
    return <Navigate to={COMMUNITY_FUNNEL_PATHS.roadmap} replace />;
  }

  // ── Step routing ────────────────────────────────────────────────────────

  const validStep = (s?: string): s is ProfileStep =>
    !!s && (STEP_ORDER as string[]).includes(s);

  if (!validStep(stepParam)) {
    const resume =
      status?.profile.lastEditedStep ??
      profile?.lastEditedStep ??
      'basic';
    return <Navigate to={profilePath(resume)} replace />;
  }

  return (
    <ProfileWizardInner
      step={stepParam}
      profile={profile ?? null}
      draft={draft}
      setDraft={setDraft}
      patching={patching}
      completing={completing}
      patch={async (body) => {
        try {
          await patchProfile(body).unwrap();
          setDraft({});
        } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message.error((err as any)?.data?.message ?? 'Couldn’t save your changes.');
          throw err;
        }
      }}
      complete={async () => {
        try {
          await completeProfile().unwrap();
          navigate(COMMUNITY_FUNNEL_PATHS.roadmap);
        } catch (err) {
          message.error(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (err as any)?.data?.message ??
              'Some required fields are still missing.',
          );
        }
      }}
      onStepChange={(next) => navigate(profilePath(next))}
      onExit={() => navigate(COMMUNITY_FUNNEL_PATHS.placementTest)}
      lastAttemptScore={status?.lastAttempt?.scorePercentage ?? null}
      lastAttemptLevel={status?.lastAttempt?.level ?? null}
    />
  );
}

// ── Inner shell (no hooks above guards) ─────────────────────────────────────

type InnerProps = {
  step: ProfileStep;
  profile: Parameters<typeof StepBasic>[0]['profile'];
  draft: PatchAdmissionsProfileBody;
  setDraft: (next: PatchAdmissionsProfileBody) => void;
  patching: boolean;
  completing: boolean;
  patch: (body: PatchAdmissionsProfileBody) => Promise<void>;
  complete: () => Promise<void>;
  onStepChange: (next: ProfileStep) => void;
  onExit: () => void;
  lastAttemptScore: number | null;
  lastAttemptLevel: string | null;
};

function ProfileWizardInner({
  step,
  profile,
  draft,
  setDraft,
  patching,
  completing,
  patch,
  complete,
  onStepChange,
  onExit,
  lastAttemptScore,
  lastAttemptLevel,
}: InnerProps) {
  const stepIndex = STEP_ORDER.indexOf(step);
  const isLast = stepIndex === STEP_ORDER.length - 1;

  const doneSteps = useMemo<Set<ProfileStep>>(() => {
    const done = new Set<ProfileStep>();
    if (!profile) return done;
    if (profile.fullName && profile.gradeLevel != null && profile.country) {
      done.add('basic');
    }
    if (profile.satPlan) done.add('academic');
    if (
      profile.goals.length &&
      profile.academicInterests.length &&
      profile.targetUniversities.length
    ) {
      done.add('goals');
    }
    if (profile.applicationTimeline && profile.budgetRange) {
      done.add('needs');
    }
    return done;
  }, [profile]);

  // Reset local draft when the user changes step.
  useEffect(() => {
    setDraft({});
  }, [step, setDraft]);

  const mergeDraft = useCallback(
    (patch_: PatchAdmissionsProfileBody) => {
      setDraft({ ...draft, ...patch_ });
    },
    [draft, setDraft],
  );

  const handleNext = async () => {
    // Autosave whatever's pending + advance the lastEditedStep marker
    // to the next step so resume routing picks the right page.
    const payload: PatchAdmissionsProfileBody = {
      ...draft,
      lastEditedStep: isLast ? step : STEP_ORDER[stepIndex + 1],
    };
    if (Object.keys(draft).length === 0 && !isLast) {
      // Nothing to save — just navigate.
      onStepChange(STEP_ORDER[stepIndex + 1]);
      return;
    }
    try {
      await patch(payload);
    } catch {
      return;
    }
    if (isLast) {
      await complete();
    } else {
      onStepChange(STEP_ORDER[stepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      onExit();
      return;
    }
    onStepChange(STEP_ORDER[stepIndex - 1]);
  };

  const stepNode = (() => {
    const shared = { draft, onChange: mergeDraft, profile };
    if (step === 'basic') return <StepBasic {...shared} />;
    if (step === 'academic') return <StepAcademic {...shared} />;
    if (step === 'goals') return <StepGoals {...shared} />;
    return <StepNeeds {...shared} />;
  })();

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => onExit()}
        >
          <ArrowLeft size={16} />
          Exit profile
        </button>

        <SubStepper current={step} done={doneSteps} />

        <section className={styles.card}>
          {lastAttemptScore !== null ? (
            <span className={styles.placementChip}>
              ✓ Placement <strong>{lastAttemptScore}%</strong>
              {lastAttemptLevel ? <> · <strong>{lastAttemptLevel}</strong></> : null}
            </span>
          ) : null}
          <div className={styles.card__eyebrow}>
            Step {stepIndex + 1} of {STEP_ORDER.length}
          </div>
          <h1 className={styles.card__title}>
            {STEP_TITLES[step]}
            {patching ? (
              <span className={styles.savingBadge}>· saving…</span>
            ) : null}
          </h1>
          <p className={styles.card__lede}>{STEP_LEDES[step]}</p>

          {stepNode}

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={handleBack}
              disabled={patching || completing}
            >
              <ArrowLeft size={14} />
              {stepIndex === 0 ? 'Exit' : 'Back'}
            </button>

            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleNext}
              disabled={patching || completing}
            >
              {isLast ? (
                <>
                  {completing ? 'Generating…' : 'Generate roadmap'}
                  <Sparkles size={14} />
                </>
              ) : (
                <>
                  {patching ? 'Saving…' : 'Next'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
