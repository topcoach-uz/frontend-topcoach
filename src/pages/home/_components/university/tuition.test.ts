import { describe, expect, it } from 'vitest';
import { formatAnnualTuition } from './tuition';

describe('catalogue annual tuition display', () => {
  it.each([undefined, null, [], [undefined], [{ fee: null }]])('keeps absent fees unknown', fees => {
    expect(formatAnnualTuition(fees)).toBeUndefined();
  });
  it('uses the published annual amount without multiplying by a thousand', () => {
    expect(formatAnnualTuition([{ fee: 61990, currency: { symbol: '$' } }])).toBe('$61,990');
  });
  it('accepts numeric strings and missing currency without crashing', () => {
    expect(formatAnnualTuition([{ fee: '12500' }])).toBe('12,500');
  });
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 'unknown'])('rejects invalid amounts', fee => {
    expect(formatAnnualTuition([{ fee }])).toBeUndefined();
  });
});
