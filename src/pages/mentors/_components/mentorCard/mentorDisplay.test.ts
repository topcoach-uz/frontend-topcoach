import { describe, expect, it } from 'vitest';
import { mentorDisplay } from './mentorDisplay';

describe('public mentor display', () => {
  it.each(['bachelor', 'master', 'both'] as const)('supports %s independently of price visibility', mentorshipType => {
    expect(mentorDisplay({ mentorshipType, showPrice: false }).type).toBe(mentorshipType);
    expect(mentorDisplay({ mentorshipType, showPrice: false }).showPrice).toBe(false);
    expect(mentorDisplay({ mentorshipType, showPrice: true }).showPrice).toBe(false);
  });
  it('saved audience settings override the former hardcoded Master roster', () => {
    expect(mentorDisplay({ mentorshipType: 'both', showPrice: true }, 'ahmadullayevarabboy@gmail.com')).toMatchObject({ type: 'both', showPrice: false });
  });
  it('preserves legacy defaults during migration', () => {
    expect(mentorDisplay({}, 'ahmadullayevarabboy@gmail.com')).toMatchObject({ type: 'master', showPrice: false });
    expect(mentorDisplay({})).toMatchObject({ type: 'bachelor', showPrice: false });
  });
});
