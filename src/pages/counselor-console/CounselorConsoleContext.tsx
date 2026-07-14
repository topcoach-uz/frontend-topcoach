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
import type {
  OrgMembership,
  OrgMembershipRole,
  Organization,
} from 'src/app/services/counselorConsoleApi';

const CC_ORG_STORAGE_KEY = 'cc.orgId';

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

export function CounselorConsoleProvider({
  orgs,
  children,
}: {
  orgs: OrgMembership[];
  children: ReactNode;
}) {
  const [orgId, setOrgIdState] = useState<string | null>(() => readStoredOrgId());
  const [searchParams] = useSearchParams();
  const deepLinkApplied = useRef(false);

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

    if (!deepLinkApplied.current) {
      deepLinkApplied.current = true;
      const requested = searchParams.get('org');
      if (requested && ids.includes(requested)) {
        if (requested !== orgId) setOrgId(requested);
        return;
      }
    }

    if (!orgId || !ids.includes(orgId)) {
      setOrgIdState(orgs[0]!.organization.id);
    }
  }, [orgs, orgId, searchParams]);

  const value = useMemo<CounselorConsoleValue>(() => {
    const membership = orgs.find((m) => m.organization.id === orgId) ?? null;
    return {
      orgs,
      orgId,
      setOrgId,
      role: membership?.role ?? null,
      org: membership?.organization ?? null,
    };
  }, [orgs, orgId]);

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
