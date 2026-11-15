import { describe, expect, it } from 'vitest';
import type { OrgBranch } from 'src/app/services/counselorConsoleApi';
import { defaultInviteBranchId, resolveCsvBranch } from './branchHelpers';
import { buildPreviewRows } from './csvImport';

const b = (id: string, name: string, extra: Partial<OrgBranch> = {}): OrgBranch => ({
  id,
  name,
  slug: name.toLowerCase(),
  address: null,
  isDefault: false,
  status: 'active',
  studentCount: 0,
  counselorCount: 0,
  ...extra,
});
const BRANCHES = [
  b('m', 'Main', { isDefault: true }),
  b('n', 'North'),
  b('o', 'Old', { status: 'archived' }),
];

describe('defaultInviteBranchId', () => {
  it('uses the selected branch when specific and active', () => {
    expect(defaultInviteBranchId(BRANCHES, 'n')).toBe('n');
  });
  it('falls back to the default branch for "all" or archived/unknown', () => {
    expect(defaultInviteBranchId(BRANCHES, 'all')).toBe('m');
    expect(defaultInviteBranchId(BRANCHES, 'o')).toBe('m');
    expect(defaultInviteBranchId(BRANCHES, 'zzz')).toBe('m');
  });
  it('is undefined with no branches', () => {
    expect(defaultInviteBranchId([], 'all')).toBeUndefined();
  });
});

describe('resolveCsvBranch', () => {
  it('matches case-insensitively among active branches', () => {
    expect(resolveCsvBranch(' north ', BRANCHES, 'm')).toEqual({
      id: 'n',
      name: 'North',
      matched: true,
    });
  });
  it('falls back for blank, unknown and archived names', () => {
    for (const cell of ['', 'Nowhere', 'Old']) {
      expect(resolveCsvBranch(cell, BRANCHES, 'm')).toEqual({
        id: 'm',
        name: 'Main',
        matched: false,
      });
    }
  });
});

describe('csv branch column', () => {
  it('parses an optional branch column', () => {
    const rows = buildPreviewRows('name,email,branch\nAnn,ann@x.com,North\nBo,bo@x.com,');
    expect(rows.map((r) => r.branch)).toEqual(['North', '']);
  });
  it('defaults branch to empty without the column', () => {
    expect(buildPreviewRows('name,email\nAnn,ann@x.com')[0]!.branch).toBe('');
  });
});
