import { describe, expect, it } from 'vitest';
import { isTaskOverdue, latestDecidedExtension, pendingExtension, todayInTashkent } from './taskDeadline';

// 2026-11-16 03:00 Tashkent (UTC+5) = 2026-11-15 22:00 UTC.
const now = new Date('2026-11-15T22:00:00Z');

describe('task deadlines', () => {
  it('uses the Tashkent calendar day', () => {
    expect(todayInTashkent(now)).toBe('2026-11-16');
  });

  it('is overdue only after the deadline day, and only while the student owes work', () => {
    expect(isTaskOverdue({ deadline: '2026-11-15', status: 'assigned' }, now)).toBe(true);
    expect(isTaskOverdue({ deadline: '2026-11-16', status: 'assigned' }, now)).toBe(false);
    expect(isTaskOverdue({ deadline: '2026-11-13', status: 'revision_requested' }, now)).toBe(true);
    expect(isTaskOverdue({ deadline: '2026-11-13', status: 'submitted' }, now)).toBe(false);
    expect(isTaskOverdue({ deadline: '2026-11-13', status: 'approved' }, now)).toBe(false);
    expect(isTaskOverdue({ deadline: '', status: 'assigned' }, now)).toBe(false);
  });

  it('finds the pending and the latest decided extension request', () => {
    const base = { id: 'x', previousDeadline: '2026-11-10', requestedDeadline: '2026-11-20', reason: 'r', requestedAt: '' };
    expect(pendingExtension({ extensionRequests: [{ ...base, status: 'declined' }, { ...base, status: 'pending' }] })?.status).toBe('pending');
    expect(latestDecidedExtension({ extensionRequests: [{ ...base, status: 'approved' }] })?.status).toBe('approved');
    expect(latestDecidedExtension({ extensionRequests: [{ ...base, status: 'approved' }, { ...base, status: 'pending' }] })).toBeNull();
  });
});
