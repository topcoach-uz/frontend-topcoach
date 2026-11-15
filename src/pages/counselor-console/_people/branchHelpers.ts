/* ── Counselor Console — branch helpers (pure) ────────────────────────────────
   Small, framework-free helpers shared by the invite modals, the CSV import and
   the roster so the "which branch does this land in" rule lives in one place. */
import type { OrgBranch } from 'src/app/services/counselorConsoleApi';

export const activeBranches = (branches: OrgBranch[]): OrgBranch[] =>
  branches.filter((b) => b.status === 'active');

/**
 * The branch a new member lands in when the user does not choose one: the
 * branch currently selected in the console, else the org's default branch,
 * else the first active branch. `undefined` when the org has no branches.
 */
export function defaultInviteBranchId(
  branches: OrgBranch[],
  selected: string,
): string | undefined {
  const active = activeBranches(branches);
  if (selected !== 'all' && active.some((b) => b.id === selected)) {
    return selected;
  }
  return (active.find((b) => b.isDefault) ?? active[0])?.id;
}

export interface ResolvedCsvBranch {
  /** Branch the row will land in (undefined when the org has no branches). */
  id: string | undefined;
  name: string | null;
  /** True when the cell named a branch that exists; false = fell back. */
  matched: boolean;
}

/** Case-insensitive match of a CSV `branch` cell against the org's branches. */
export function resolveCsvBranch(
  cell: string,
  branches: OrgBranch[],
  fallbackId: string | undefined,
): ResolvedCsvBranch {
  const active = activeBranches(branches);
  const wanted = cell.trim().toLowerCase();
  const hit = wanted
    ? active.find((b) => b.name.trim().toLowerCase() === wanted)
    : undefined;
  if (hit) return { id: hit.id, name: hit.name, matched: true };
  const fb = active.find((b) => b.id === fallbackId);
  return { id: fb?.id, name: fb?.name ?? null, matched: false };
}
