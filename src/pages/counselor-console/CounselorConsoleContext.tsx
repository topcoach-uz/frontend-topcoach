import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetOrgBranchesQuery } from 'src/app/services/counselorConsoleApi';
import type {
  BranchSelection,
  OrgBranch,
  OrgMembership,
  OrgMembershipRole,
  Organization,
} from 'src/app/services/counselorConsoleApi';

const CC_ORG_STORAGE_KEY = 'cc.orgId';
const ccBranchStorageKey = (orgId: string) => `cc.branchId.${orgId}`;

export interface CounselorConsoleValue {
  /** Every organization the signed-in user is a member of. */
  orgs: OrgMembership[];
  /** The active organization id (persisted to localStorage). */
  orgId: string | null;
  /** Switch the active organization. */
  setOrgId: (orgId: string) => void;
  /** The user's role in the active organization, or null. */
  role: OrgMembershipRole | null;
  /** The active organization record, or null. */
  org: Organization | null;
  /** Branches of the active org visible to the caller (active + archived). */
  branches: OrgBranch[];
  /** `'all'` or the selected branch id. Always valid for the current org. */
  branchId: BranchSelection;
  setBranchId: (branchId: BranchSelection) => void;
  /** The selected branch, or null when viewing "All branches". */
  branch: OrgBranch | null;
  /** True when the switcher/columns should show (more than one branch). */
  hasBranches: boolean;
}

const CounselorConsoleCtx = createContext<CounselorConsoleValue | null>(null);

function readStoredOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(CC_ORG_STORAGE_KEY);
  } catch {
    return null;
  }
}

function readStoredBranchId(orgId: string | null): string | null {
  if (!orgId || typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(ccBranchStorageKey(orgId));
  } catch {
    return null;
  }
}

export function CounselorConsoleProvider({
  orgs,
  children,
}: {
  orgs: OrgMembership[];
  children: ReactNode;
}) {
  const [orgId, setOrgIdState] = useState<string | null>(() => readStoredOrgId());
  const [searchParams] = useSearchParams();
  const deepLinkApplied = useRef<string | null>(null);

  const setOrgId = (next: string) => {
    setOrgIdState(next);
    try {
      window.localStorage.setItem(CC_ORG_STORAGE_KEY, next);
    } catch {
      /* ignore persistence failures (private mode, etc.) */
    }
  };

  // Resolve the active org once the membership list is available.
  // A `?org=<id>` deep-link (e.g. the SuperAdmin "Open console" action from the
  // admin org-management page) wins over the stored default the first time it
  // resolves — but only if that id is actually one of the user's orgs. Otherwise
  // we keep the selection valid by falling back to the first membership.
  useEffect(() => {
    if (orgs.length === 0) return;
    const ids = orgs.map((m) => m.organization.id);

    const requested = searchParams.get('org');
    if (requested && requested !== deepLinkApplied.current && ids.includes(requested)) {
      deepLinkApplied.current = requested;
      if (requested !== orgId) setOrgId(requested);
      return;
    }

    if (!orgId || !ids.includes(orgId)) {
      setOrgIdState(orgs[0]!.organization.id);
    }
  }, [orgs, orgId, searchParams]);

  // ── Branches ──────────────────────────────────────────────────────────────
  const { data: branchData } = useGetOrgBranchesQuery(orgId as string, {
    skip: !orgId,
  });
  const branches = useMemo(() => branchData ?? [], [branchData]);
  // The selection is tracked together with the org it belongs to so switching
  // org never leaks the previous org's branch id.
  const [branchState, setBranchState] = useState<{
    orgId: string | null;
    branchId: BranchSelection;
  }>({ orgId: null, branchId: 'all' });
  const branchDeepLinkApplied = useRef<string | null>(null);

  useEffect(() => {
    if (!orgId || !branchData) return;
    const validIds = branchData
      .filter((b) => b.status === 'active')
      .map((b) => b.id);
    const requested = searchParams.get('branch');
    let next: BranchSelection = 'all';
    if (
      requested &&
      requested !== branchDeepLinkApplied.current &&
      validIds.includes(requested)
    ) {
      branchDeepLinkApplied.current = requested;
      next = requested;
    } else if (branchState.orgId === orgId && (branchState.branchId === 'all' || validIds.includes(branchState.branchId))) {
      return; // current selection is still valid
    } else {
      const stored = readStoredBranchId(orgId);
      next = stored && validIds.includes(stored) ? stored : 'all';
    }
    setBranchState({ orgId, branchId: next });
  }, [orgId, branchData, searchParams, branchState]);

  const setBranchId = (next: BranchSelection) => {
    if (!orgId) return;
    setBranchState({ orgId, branchId: next });
    try {
      window.localStorage.setItem(ccBranchStorageKey(orgId), next);
    } catch {
      /* ignore persistence failures */
    }
  };

  const value = useMemo<CounselorConsoleValue>(() => {
    const membership = orgs.find((m) => m.organization.id === orgId) ?? null;
    // Until the effect above has validated the selection for this org, behave
    // as "All branches" so no query is sent with a stale / foreign branch id.
    const branchId: BranchSelection =
      branchState.orgId === orgId ? branchState.branchId : 'all';
    return {
      orgs,
      orgId,
      setOrgId,
      role: membership?.role ?? null,
      org: membership?.organization ?? null,
      branches,
      branchId,
      setBranchId,
      branch: branchId === 'all' ? null : (branches.find((b) => b.id === branchId) ?? null),
      hasBranches: branches.filter((b) => b.status === 'active').length > 1,
    };
  }, [orgs, orgId, branches, branchState]);

  return (
    <CounselorConsoleCtx.Provider value={value}>
      {children}
    </CounselorConsoleCtx.Provider>
  );
}

export function useCounselorConsole(): CounselorConsoleValue {
  const ctx = useContext(CounselorConsoleCtx);
  if (!ctx) {
    throw new Error(
      'useCounselorConsole must be used inside CounselorConsoleProvider',
    );
  }
  return ctx;
}
