import { Card } from 'antd';
import { ArrowRight, Lock, Map as MapIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useGetAdmissionsProfileQuery } from 'src/app/services/admissionsProfileApi';
import { useGetRoadmapQuery } from 'src/app/services/roadmapApi';
import { profilePath } from 'src/lib/communityAccess';

import { RoadmapBody } from 'src/pages/placement-test/roadmap/_components/RoadmapBody';
import roadmapStyles from 'src/pages/placement-test/roadmap/Roadmap.module.scss';

import styles from './RoadmapTab.module.scss';

const SUBSCRIPTION_TAB_PATH =
  '/student-hub?section=account&target=settings&tab=subscription';

// ── `freshSince` polling tuning ─────────────────────────────────────────
// See the big doc comment below for what this is guarding against. Kept as
// named constants (not magic numbers) so the tradeoff is easy to re-tune.
const FRESH_INITIAL_DELAY_MS = 9000; // give the background job a head start
const FRESH_POLL_INTERVAL_MS = 3000; // cadence while still within the fast window
const FRESH_SLOW_POLL_INTERVAL_MS = 8000; // cadence once we've waited a while
const FRESH_FAST_WINDOW_MS = 30000; // switch fast → slow cadence after this long

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
  /**
   * Server timestamp (backend clock — e.g. a Major Match result's
   * `createdAt`). When set, this component knows a NEW roadmap generation
   * was just kicked off server-side as of that moment (see
   * `RoadmapService.regenerateForMajorMatch`, fired fire-and-forget right
   * after a Major Match submit) and must not show whatever roadmap happens
   * to already be cached — that could be a STALE one from before this
   * event. Instead it polls `GET /roadmap/me` until the returned
   * `meta.generatedAt` postdates `freshSince`, showing a "personalizing…"
   * state meanwhile.
   *
   * Deliberately does NOT fetch instantly: `GET /roadmap/me` itself
   * auto-generates (`persistFallback`) if the student has never had a
   * roadmap before, and it only checks for an existing row ONCE, at the
   * very start of the request — before its own Gemini call, not after.
   * So an immediate (or too-short-delay) read here can find no row yet
   * even though the background job is already mid-flight, and go generate
   * a SECOND one itself; measured live, this is a real failure mode, not
   * theoretical (see the handoff report for the exact duplicate-row
   * evidence that motivated the number below). The background job doesn't
   * save until its Gemini call fully completes — measured at 7-8s wall
   * clock, submit to save — so `FRESH_INITIAL_DELAY_MS` waits past that
   * before our first attempt, with margin, rather than merely "some head
   * start". This does not *guarantee* zero extra generations (Gemini can
   * occasionally run past our delay), but bounds the risk to at most one
   * extra generation in an already-rare edge case, rather than a
   * hammering loop (see the poll cadence below, which slows down over
   * time and never stops on its own).
   *
   * Omit for the normal case — a plain single fetch + loading/error state,
   * same as before this prop existed.
   */
  freshSince?: string;
}

/**
 * Roadmap. Embedded inline on the Major Match v2 results screen
 * (`MM2Results`) — the roadmap is generated/regenerated from that result
 * the moment it's submitted, so results is where it's shown. Used to be
 * its own Settings tab, then its own tab inside the profile hub; both
 * addresses are gone now (old `?tab=roadmap` deep-links redirect to Major
 * Match — see `MenteeSettingsPageMock.tsx`).
 *
 * Visibility rules:
 *
 *   - readOnly (counselor embed)     → "not available in this view" card
 *   - profile not completed          → "Finish your profile" pointer
 *   - `freshSince` set, not yet fresh → "personalizing…" (polls, see above)
 *   - roadmap exists, no sub         → blurred preview + paywall (same as funnel)
 *   - roadmap exists, active sub     → full content + Regenerate
 */
export function RoadmapTab({ readOnly = false, studentId, freshSince }: RoadmapTabProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Silence the unused-var lint until a real read-only roadmap endpoint
  // exists — kept in the prop contract now so callers don't need a second
  // change later, matching every sibling profile-hub tab.
  void studentId;

  const { data: profile, isLoading: profileLoading } = useGetAdmissionsProfileQuery(
    undefined,
    { skip: readOnly },
  );

  const profileReady = !readOnly && !!profile?.completedAt;
  const awaitingFresh = !readOnly && !!freshSince;

  // Holds off the FIRST fetch attempt while `awaitingFresh` — see the prop
  // doc comment. Re-arms whenever `freshSince` changes (a retake produces a
  // new result → a new fresh-generation event to wait for).
  const [canFetch, setCanFetch] = useState(!awaitingFresh);
  const pollStartRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!awaitingFresh) {
      setCanFetch(true);
      return;
    }
    pollStartRef.current = Date.now();
    setCanFetch(false);
    const timer = setTimeout(() => setCanFetch(true), FRESH_INITIAL_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingFresh, freshSince]);

  // pollingInterval is state (not an inline expression) because it needs
  // to react to `data` *after* each poll resolves — see the effect below.
  const [pollingInterval, setPollingInterval] = useState(0);

  const { data, isLoading, isError } = useGetRoadmapQuery(undefined, {
    skip: readOnly || !profileReady || !canFetch,
    pollingInterval,
  });

  const isFresh =
    !awaitingFresh || (!!data && new Date(data.meta.generatedAt).getTime() > new Date(freshSince!).getTime());

  // Re-evaluate the poll cadence every time a fetch resolves (or the
  // preconditions change). Slows down after FRESH_FAST_WINDOW_MS rather
  // than ever fully stopping — there's no dead end if generation genuinely
  // takes longer than usual; it settles to 0 the moment `isFresh` flips.
  useEffect(() => {
    if (!awaitingFresh || !canFetch || isFresh) {
      setPollingInterval(0);
      return;
    }
    const elapsed = Date.now() - pollStartRef.current;
    setPollingInterval(elapsed < FRESH_FAST_WINDOW_MS ? FRESH_POLL_INTERVAL_MS : FRESH_SLOW_POLL_INTERVAL_MS);
  }, [awaitingFresh, canFetch, isFresh, data]);

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

  if (profileLoading) {
    return (
      <Card className={styles.card} title={titleEl(t)}>
        <div className={styles.centered}>Loading your roadmap…</div>
      </Card>
    );
  }

  if (!profile?.completedAt) {
    // `awaitingFresh` means this render is embedded on the Major Match
    // results page right after a fresh submission (see `freshSince` doc
    // comment above) — that's the cohort this ties back to: they just
    // took Major Match without ever going through the placement-test
    // admissions-profile wizard, so the backend's fire-and-forget
    // `regenerateForMajorMatch` had nothing to generate against (no
    // `student_admissions_profiles` row yet) and skipped silently.
    // Tell them exactly what unlocks the roadmap they were promised,
    // instead of the generic wizard-continuation copy below.
    if (awaitingFresh) {
      return (
        <LockedCard
          title={t(
            'studentHub.profile.roadmap.majorMatchLockedTitle',
            'Complete your profile to unlock your roadmap',
          )}
          body={t(
            'studentHub.profile.roadmap.majorMatchLockedBody',
            "Your Major Match result is saved. Finish a few quick profile questions and we'll turn it into your personalized admissions roadmap.",
          )}
          cta={t(
            'studentHub.profile.roadmap.majorMatchLockedCta',
            'Complete your profile',
          )}
          onCta={() => navigate(profilePath('basic'))}
        />
      );
    }
    return (
      <LockedCard
        title={t(
          'studentHub.profile.roadmap.profileLockedTitle',
          'Finish your admissions profile',
        )}
        body={t(
          'studentHub.profile.roadmap.profileLockedBody',
          'A few quick questions about your goals so we can personalize your roadmap.',
        )}
        cta={t('studentHub.profile.roadmap.profileLockedCta', 'Continue profile')}
        onCta={() => navigate(profilePath('basic'))}
      />
    );
  }

  if (awaitingFresh && !isFresh) {
    return (
      <Card className={styles.card} title={titleEl(t)}>
        <div className={styles.centered}>
          <span className={styles.spinner} />
          <p>
            {t(
              'studentHub.profile.roadmap.awaitingMajorMatch',
              "Personalizing your roadmap with your Major Match result…",
            )}
          </p>
        </div>
      </Card>
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

function titleEl(t?: (key: string, fallback: string) => string) {
  // `t` is optional — `LockedCard` renders this without a translation
  // function in scope (pre-existing; fixed incidentally here since this
  // path is now reachable from the embedded results-page context too).
  return (
    <>
      <MapIcon size={18} style={{ marginRight: 8 }} />
      {t ? t('settings.roadmap.tab', 'Roadmap') : 'Roadmap'}
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
