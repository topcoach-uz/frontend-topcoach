import { describe, expect, it } from 'vitest';
import { rosterHoursLabel, rosterProgramLabel } from './rosterDisplay';
describe('Imported roster summaries', () => {
  it('does not present missing durations and allocations as zero-hour balances', () => {
    expect(rosterHoursLabel({ used: 0, allocated: 0, usageKnown: false, allocationKnown: false })).toBe('Time not recorded · allocation unknown');
    expect(rosterProgramLabel({ programs: ['admissions'] })).toBe('Admissions');
  });
  it('retains known hours while marking partial duration coverage', () => {
    expect(rosterHoursLabel({ used: 2.5, allocated: 10, usageKnown: false, allocationKnown: true })).toBe('2.5h+ recorded · 10h allocated');
  });
});
