import { describe, expect, it } from 'vitest';
import { mentorDisplay } from './mentorDisplay';

describe('admin-controlled mentor display', () => {
  it.each(['bachelor', 'master', 'both'] as const)('supports %s independently of price visibility', mentorshipType => {
    expect(mentorDisplay({ mentorshipType, showPrice: false }).type).toBe(mentorshipType);
    expect(mentorDisplay({ mentorshipType, showPrice: false }).showPrice).toBe(false);
    expect(mentorDisplay({ mentorshipType, showPrice: true }).showPrice).toBe(true);
  });
  it('saved settings override the former hardcoded Master roster', () => {
    expect(mentorDisplay({ mentorshipType: 'both', showPrice: true }, 'ahmadullayevarabboy@gmail.com')).toMatchObject({ type: 'both', showPrice: true });
  });
  it('preserves legacy defaults during migration', () => {
    expect(mentorDisplay({}, 'ahmadullayevarabboy@gmail.com')).toMatchObject({ type: 'master', showPrice: false });
    expect(mentorDisplay({})).toMatchObject({ type: 'bachelor', showPrice: true });
  });
});
