import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

type ProgressRequest = { items: Array<{ key: string; percent: number }>; expectedUpdatedAt: string | null };
const state = vi.hoisted(() => ({ calls: [] as Array<{ url: string; method: string; body?: ProgressRequest }>, percent: 10, updatedAt: '2026-11-25T10:00:00.000Z' }));
vi.mock('./api', async () => {
  const { createApi } = await import('@reduxjs/toolkit/query/react');
  return { RtkApi: createApi({
    reducerPath: 'programCacheTest',
    tagTypes: ['FullSupportCurriculumProgress'],
    baseQuery: async (arg: string | { url: string; method: string; body?: ProgressRequest }) => {
      const url = typeof arg === 'string' ? arg : arg.url;
      const method = typeof arg === 'string' ? 'GET' : arg.method;
      const body = typeof arg === 'string' ? undefined : arg.body;
      state.calls.push({ url, method, body });
      if (method === 'PUT') {
        if (body!.expectedUpdatedAt !== state.updatedAt) return { error: { status: 409, data: { message: 'Progress changed' } } };
        state.percent = body!.items[0].percent;
        state.updatedAt = '2026-11-25T11:00:00.000Z';
      }
      return { data: { data: url.endsWith('/workspace')
        ? { programs: [{ id: 'selected', progress: [{ key: 'Paper', percent: state.percent }] }], unscopedSessions: [], unscopedTasks: [] }
        : { items: [{ key: 'Paper', percent: state.percent }], updatedAt: state.updatedAt } } };
    },
    endpoints: () => ({}),
  }) };
});
import { studentProgramsApi } from './studentProgramsApi';
const createStore = () => configureStore({
  reducer: { [studentProgramsApi.reducerPath]: studentProgramsApi.reducer },
  middleware: getDefault => getDefault().concat(studentProgramsApi.middleware),
});

describe('enrollment progress cache boundaries', () => {
  it('sends the original edit version and refreshes only the edited enrollment and student workspace', async () => {
    state.calls = [];
    state.percent = 10;
    state.updatedAt = '2026-11-25T10:00:00.000Z';
    const store = createStore();
    const selected = store.dispatch(studentProgramsApi.endpoints.getProgramEnrollmentProgress.initiate('selected'));
    const other = store.dispatch(studentProgramsApi.endpoints.getProgramEnrollmentProgress.initiate('other'));
    const workspace = store.dispatch(studentProgramsApi.endpoints.getMyMentoringPrograms.initiate());
    const [original] = await Promise.all([selected.unwrap(), other.unwrap(), workspace.unwrap()]);
    await store.dispatch(studentProgramsApi.endpoints.setProgramEnrollmentProgress.initiate({ id: 'selected', expectedUpdatedAt: original.data.updatedAt!, items: [{ key: 'Paper', percent: 75 }] })).unwrap();
    const count = (suffix: string) => state.calls.filter(call => call.method === 'GET' && call.url.endsWith(suffix)).length;
    await vi.waitFor(() => {
      expect(count('/selected/progress')).toBe(2);
      expect(count('/workspace')).toBe(2);
      expect(studentProgramsApi.endpoints.getMyMentoringPrograms.select()(store.getState()).data?.data.programs[0].progress?.[0].percent).toBe(75);
    });
    expect(state.calls.find(call => call.method === 'PUT')?.body?.expectedUpdatedAt).toBe('2026-11-25T10:00:00.000Z');
    expect(count('/other/progress')).toBe(1);
    expect(studentProgramsApi.endpoints.getProgramEnrollmentProgress.select('other')(store.getState()).data?.data.items[0].percent).toBe(10);
    expect(studentProgramsApi.endpoints.getProgramEnrollmentProgress.select('selected')(store.getState()).data?.data.items[0].percent).toBe(75);
    store.dispatch(studentProgramsApi.util.resetApiState());
  });
  it('surfaces a stale-edit conflict without replaying the replacement over newer progress', async () => {
    state.calls = [];
    state.percent = 90;
    state.updatedAt = '2026-11-25T12:00:00.000Z';
    const store = createStore();
    await expect(store.dispatch(studentProgramsApi.endpoints.setProgramEnrollmentProgress.initiate({ id: 'selected', expectedUpdatedAt: '2026-11-25T10:00:00.000Z', items: [{ key: 'Paper', percent: 25 }] })).unwrap()).rejects.toMatchObject({ status: 409 });
    expect(state.percent).toBe(90);
    expect(state.calls.filter(call => call.method === 'PUT')).toHaveLength(1);
    store.dispatch(studentProgramsApi.util.resetApiState());
  });
});
