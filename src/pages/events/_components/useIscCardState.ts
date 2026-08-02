import {
  useGetIscApplicationMeQuery,
  useGetIscConfigQuery,
  type IscApplicationStatus,
} from 'src/app/services/iscAdmissionsApi';
import { useTypedSelector } from 'src/app/store';
import { ISC_2026_ENABLED, isIscWindowClosed } from 'src/lib/iscAccess';

/** localStorage key for the in-progress draft — must match ApplicantSite.tsx. */
export const ISC_DRAFT_KEY = 'isc-2026-application-draft-v1';

export type IscCardMode = 'apply' | 'resume' | 'status' | 'closed';
export type IscStatusTone = 'open' | 'pending' | 'success' | 'danger';

export interface IscCardState {
  mode: IscCardMode;
  /** Button label: "Apply now" | "Resume application" | "View status". */
  ctaLabel: string;
  /** Short status line shown next to the CTA. */
  statusLabel: string;
  statusTone: IscStatusTone;
  /** True while the application query is still loading. */
  loading: boolean;
}

/** Backend lifecycle status → applicant-facing label + tone. */
const STATUS_MAP: Record<
  IscApplicationStatus,
  { label: string; tone: IscStatusTone } | null
> = {
  submitted: { label: 'Application submitted', tone: 'pending' },
  under_review: { label: 'Under review', tone: 'pending' },
  reviewed: { label: 'Under review', tone: 'pending' },
  interview_scheduled: { label: 'Interview scheduled', tone: 'pending' },
  interview_completed: { label: 'Interview completed', tone: 'pending' },
  waitlisted: { label: 'Waitlisted', tone: 'pending' },
  accepted: { label: 'Accepted', tone: 'success' },
  rejected: { label: 'Not selected', tone: 'danger' },
  withdrawn: null, // treated as "can re-apply"
};

/** True when a meaningful in-progress draft exists in localStorage. */
export function hasIscLocalDraft(): boolean {
  try {
    const raw = localStorage.getItem(ISC_DRAFT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      program?: unknown;
      applicantType?: unknown;
      draft?: Record<string, unknown>;
    };
    if (!parsed) return false;
    if (parsed.program || parsed.applicantType) return true;
    return !!parsed.draft && Object.values(parsed.draft).some(Boolean);
  } catch {
    return false;
  }
}

/**
 * Derives the Apply / Resume / Status state shown on the ISC event cards
 * (Workshops + Dashboard). A submitted application (live status from the
 * backend) wins; otherwise a saved local draft → Resume; otherwise Apply.
 */
export function useIscCardState(): IscCardState {
  const isAuthenticated = useTypedSelector((s) => s.auth.isAuthenticated);
  const { data, isLoading } = useGetIscApplicationMeQuery(undefined, {
    skip: !isAuthenticated || !ISC_2026_ENABLED,
    refetchOnMountOrArgChange: true,
  });
  const { data: config } = useGetIscConfigQuery(undefined, {
    skip: !ISC_2026_ENABLED,
  });
  const app = data?.application ?? null;
  const mapped = app ? STATUS_MAP[app.status] : null;

  // A submitted application always wins — the applicant can still view its
  // live status even after the window shuts.
  if (isAuthenticated && app && mapped) {
    return {
      mode: 'status',
      ctaLabel: 'View status',
      statusLabel: mapped.label,
      statusTone: mapped.tone,
      loading: isLoading,
    };
  }

  // Window closed (deadline passed or manually shut): no new / resumed
  // applications — the backend would 403 the submit anyway.
  if (isIscWindowClosed(config)) {
    return {
      mode: 'closed',
      ctaLabel: 'Applications closed',
      statusLabel: 'Applications closed',
      statusTone: 'danger',
      loading: isLoading,
    };
  }

  if (isAuthenticated && hasIscLocalDraft()) {
    return {
      mode: 'resume',
      ctaLabel: 'Resume application',
      statusLabel: 'Draft saved',
      statusTone: 'pending',
      loading: isLoading,
    };
  }

  return {
    mode: 'apply',
    ctaLabel: 'Apply now',
    statusLabel: 'Applications open',
    statusTone: 'open',
    loading: isLoading,
  };
}
