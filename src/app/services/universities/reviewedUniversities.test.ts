import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reviewedIds from './reviewedUniversityIds.json';

const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../api', async () => {
  const { createApi } = await import('@reduxjs/toolkit/query/react');
  return { RtkApi: createApi({ reducerPath: 'reviewedTest', baseQuery: mocks.query, tagTypes: ['Universities'], endpoints: () => ({}) }) };
});
import { universityApi } from './index';
const store = () => configureStore({ reducer: { [universityApi.reducerPath]: universityApi.reducer }, middleware: (getDefault) => getDefault().concat(universityApi.middleware) });

describe('reviewed applicant university catalogue', () => {
  beforeEach(() => mocks.query.mockReset());
  it('keeps reviewed universities without subject data and excludes legacy duplicate IDs', async () => {
    mocks.query.mockResolvedValue({ data: { data: [{ id: reviewedIds[0], majors: [] }, { id: 'legacy-duplicate', majors: ['undergraduate'] }, { id: reviewedIds[1], majors: [] }], total: 3 } });
    const s = store();
    const result = await s.dispatch(universityApi.endpoints.getReviewedUniversities.initiate({}));
    expect(result.data?.data.map(row => row.id)).toEqual(reviewedIds.slice(0, 2));
    expect(result.data?.total).toBe(2);
    expect(mocks.query.mock.calls[0][0].params).not.toHaveProperty('majorType');
    s.dispatch(universityApi.util.resetApiState());
  });
  it('collects reviewed IDs beyond the first batch and preserves explicit filters', async () => {
    const filler = Array.from({ length: 399 }, (_, index) => ({ id: `legacy-${index}` }));
    mocks.query.mockResolvedValueOnce({ data: { data: [{ id: reviewedIds[0] }, ...filler], total: 401 } }).mockResolvedValueOnce({ data: { data: [{ id: reviewedIds[1] }], total: 401 } });
    const s = store();
    const result = await s.dispatch(universityApi.endpoints.getReviewedUniversities.initiate({ search: 'test', country: 'Canada', majorName: 'Science', majorType: 'undergraduate' }));
    expect(result.data?.data.map(row => row.id)).toEqual(reviewedIds.slice(0, 2));
    expect(mocks.query).toHaveBeenCalledTimes(2);
    expect(mocks.query.mock.calls[1][0].params).toMatchObject({ _start: 400, _end: 800, name: 'test', country: 'Canada', majorName: 'Science', majorType: 'undergraduate' });
    s.dispatch(universityApi.util.resetApiState());
  });
  it('reports a later batch failure instead of showing a partial catalogue', async () => {
    mocks.query.mockResolvedValueOnce({ data: { data: [{ id: reviewedIds[0] }], total: 401 } }).mockResolvedValueOnce({ error: { status: 503, data: 'Unavailable' } });
    const s = store();
    const result = await s.dispatch(universityApi.endpoints.getReviewedUniversities.initiate({}));
    expect(result.isError).toBe(true);
    expect(result.data).toBeUndefined();
    s.dispatch(universityApi.util.resetApiState());
  });
});
