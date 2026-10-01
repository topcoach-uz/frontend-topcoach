import { App, message } from 'antd';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import {
  AdmissionsProfileDto,
  PatchAdmissionsProfileBody,
  ProfileStep,
  useCompleteAdmissionsProfileMutation,
  useGetAdmissionsProfileQuery,
  usePatchAdmissionsProfileMutation,
} from 'src/app/services/admissionsProfileApi';
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

  // After the user completes the profile, the default behavior is to
  // bounce them to the roadmap — there's no point landing them back on
  // a wizard they already finished. The exception is when they
  // intentionally clicked "Edit profile" from the roadmap, which adds
  // `?edit=1` to the URL; in that case we keep the wizard mounted so
  // they can refine their answers, and the roadmap's "profile changed"
  // banner picks up the change when they're done.
  const editIntent = searchParams.get('edit') === '1';
  if (profile?.completedAt && !editIntent) {
    return <Navigate to={COMMUNITY_FUNNEL_PATHS.roadmap} replace />;
  }

  // ── Step routing ────────────────────────────────────────────────────────

  const validStep = (s?: string): s is ProfileStep =>
    !!s && (STEP_ORDER as string[]).includes(s);

  if (!validStep(stepParam)) {
    const resume =
      profile?.lastEditedStep ??
      'basic';
    // Preserve every other search param (notably `edit=1` from the
    // roadmap's "Edit profile" CTA). Without this, the resume-redirect
    // strips `edit=1`, the wizard re-mounts with editIntent=false, the
    // `profile.completed` guard fires, and the user gets bounced back
    // to the roadmap — visually indistinguishable from a page reload.
    const merged = new URLSearchParams(searchParams);
    merged.set('section', 'placement-profile');
    merged.set('step', resume);
    return <Navigate to={`/student-hub?${merged.toString()}`} replace />;
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
      onExit={() => navigate(COMMUNITY_FUNNEL_PATHS.community)}
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
}: InnerProps) {
  const { t } = useTranslation();
  const stepIndex = STEP_ORDER.indexOf(step);
  const isLast = stepIndex === STEP_ORDER.length - 1;

  const doneSteps = useMemo<Set<ProfileStep>>(() => {
    const done = new Set<ProfileStep>();
    if (!profile) return done;
    if (profile.fullName && profile.targetDegree && profile.country &&
      (profile.targetDegree === 'master' ? profile.educationStatus && profile.previousInstitution : profile.gradeLevel != null)) {
      done.add('basic');
    }
    if (profile.targetDegree === 'master' ? profile.previousDegree && profile.previousField && profile.bachelorGraduationYear : profile.satPlan) done.add('academic');
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

  // Per-field error map, populated when the user clicks `Next` with
  // missing required fields and cleared as soon as they edit the
  // offending field. Reset between steps so prior-step errors don't
  // leak into the next form.
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset local draft + errors when the user changes step.
  useEffect(() => {
    setDraft({});
    setErrors({});
  }, [step, setDraft]);

  const mergeDraft = useCallback(
    (patch_: PatchAdmissionsProfileBody) => {
      setDraft({ ...draft, ...patch_ });
      // Clear errors on the fields the user just edited — they're
      // actively addressing the issue, no point keeping the red label.
      const touchedKeys = Object.keys(patch_);
      if (touchedKeys.length > 0) {
        setErrors((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const k of touchedKeys) {
            if (next[k]) {
              delete next[k];
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      }
    },
    [draft, setDraft],
  );

  /**
   * Required-field check for the current step. Returns a map keyed by
   * field name so the step components can highlight each missing input.
   * Empty result == OK to advance.
   */
  const validateCurrentStep = useCallback((): Record<string, string> => {
    const e: Record<string, string> = {};
    const valueOf = <K extends keyof PatchAdmissionsProfileBody>(key: K) =>
      (draft[key] ?? (profile?.[key as keyof AdmissionsProfileDto] as never)) as
        | PatchAdmissionsProfileBody[K]
        | undefined;

    if (step === 'basic') {
      const fullName = ((valueOf('fullName') as string | undefined) ?? '').trim();
      const gradeLevel = valueOf('gradeLevel') as number | undefined;
      const country = ((valueOf('country') as string | undefined) ?? '').trim();
      const currentSchool = ((valueOf('currentSchool') as string | undefined) ?? '').trim();
      const parentInvolvement = valueOf('parentInvolvement') ?? null;
      const targetDegree = valueOf('targetDegree') ?? null;
      if (!fullName) e.fullName = 'Please enter your full name.';
      if (!targetDegree) e.targetDegree = 'Choose the degree you plan to pursue.';
      if (targetDegree !== 'master' && gradeLevel == null) e.gradeLevel = 'Pick your grade level.';
      if (!country) e.country = 'Tell us which country you\'re applying from.';
      if (targetDegree !== 'master' && !currentSchool) e.currentSchool = 'Add the school you currently attend.';
      if (targetDegree !== 'master' && !parentInvolvement) e.parentInvolvement = 'Pick one option.';
      if (targetDegree === 'master') {
        if (!valueOf('educationStatus')) e.educationStatus = 'Select your bachelor’s status.';
        if (!String(valueOf('previousInstitution') ?? '').trim()) e.previousInstitution = 'Enter your university.';
      }
    }
    if (step === 'academic') {
      // SAT score stays optional ("if taken"). SAT plan is required so
      // the roadmap can slot prep into the timeline; extracurriculars
      // are required because Gemini personalizes the entire summary
      // and action plan off them — a blank field produces a generic
      // roadmap and defeats the point of running the wizard at all.
      const targetDegree = valueOf('targetDegree') ?? 'bachelor';
      const satPlan = valueOf('satPlan') ?? null;
      const extracurriculars = ((valueOf('extracurriculars') as string | undefined) ?? '').trim();
      if (targetDegree !== 'master' && !satPlan) e.satPlan = 'Pick your SAT plan.';
      if (targetDegree === 'master') {
        if (!String(valueOf('previousDegree') ?? '').trim()) e.previousDegree = 'Enter your bachelor’s degree.';
        if (!String(valueOf('previousField') ?? '').trim()) e.previousField = 'Enter your field of study.';
        const year = Number(valueOf('bachelorGraduationYear'));
        if (!Number.isInteger(year) || year < 1900 || year > 2100) e.bachelorGraduationYear = 'Enter a year from 1900 to 2100.';
      }
      if (targetDegree !== 'master' && extracurriculars.length < 20) {
        e.extracurriculars =
          'Add a few sentences — clubs, sports, awards, or volunteer work. We use this to personalize your roadmap.';
      }
    }
    if (step === 'goals') {
      const goals = (valueOf('goals') as string[] | undefined) ?? [];
      const interests = (valueOf('academicInterests') as string[] | undefined) ?? [];
      const targets = (valueOf('targetUniversities') as string[] | undefined) ?? [];
      if (goals.length === 0) e.goals = 'Pick at least one goal.';
      if (interests.length === 0)
        e.academicInterests = 'Pick at least one academic interest.';
      if (targets.length === 0)
        e.targetUniversities = 'Add at least one target university.';
    }
    if (step === 'needs') {
      // `challenges` stays optional — copy explicitly says so. Timeline
      // + budget are required because the roadmap can't be paced or
      // priced without them.
      const timeline = valueOf('applicationTimeline') ?? null;
      const budget = valueOf('budgetRange') ?? null;
      if (!timeline) e.applicationTimeline = 'Pick when you plan to apply.';
      if (!budget) e.budgetRange = 'Pick a monthly budget range.';
    }
    return e;
  }, [step, draft, profile]);

  const handleNext = async () => {
    // Block the advance if required fields are missing — surface red
    // labels on the offending inputs instead of silently sending a
    // half-baked PATCH or letting the user move past a broken form.
    const fieldErrors = validateCurrentStep();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

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
    const shared = { draft, onChange: mergeDraft, profile, errors };
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
          <div className={styles.card__eyebrow}>
            Step {stepIndex + 1} of {STEP_ORDER.length}
          </div>
          <h1 className={styles.card__title}>
            {STEP_TITLES[step]}
            {patching ? (
              <span className={styles.savingBadge}>· saving…</span>
            ) : null}
          </h1>
          <p className={styles.card__lede}>
            {step === 'academic' && (draft.targetDegree ?? profile?.targetDegree) === 'master'
              ? t('placementProfile.academicMasterLede', 'Your university education, graduate tests, and relevant experience.')
              : STEP_LEDES[step]}
          </p>

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
