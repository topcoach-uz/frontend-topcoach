import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import layout from 'src/app/slices/layoutSlice';
import auth from 'src/app/slices/authSlice';
import mentor from 'src/app/slices/mentorSlice';
import { RtkApi } from './services/api';
import { rtkQueryErrorLogger } from './services/api/middlewares';

export const createStore = (
  options?: ConfigureStoreOptions['preloadedState'] | undefined
) =>
  configureStore({
    reducer: {
      [RtkApi.reducerPath]: RtkApi.reducer,
      auth,
      layout,
      mentor,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(RtkApi.middleware, rtkQueryErrorLogger),
    ...options,
  });

export const store = createStore();

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;

export type RootState = ReturnType<typeof store.getState>;
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;

export const getRootState = () => store.getState();
