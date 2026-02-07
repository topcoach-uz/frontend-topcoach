import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import layout from 'src/app/slices/layoutSlice';
import auth from 'src/app/slices/authSlice';
import mentor from 'src/app/slices/mentorSlice';
import profilePopup from 'src/app/slices/profilePopupSlice';
import { RtkApi } from './services/api';
import { rtkQueryErrorLogger } from './services/api/middlewares';
import { referralApi } from './services/referralApi';
import { contactApi } from './services/contactApi';
import './services/availability'; // Ensure availability endpoints are injected into RtkApi

export const createStore = (
  options?: ConfigureStoreOptions['preloadedState'] | undefined
) =>
  configureStore({
    reducer: {
      [RtkApi.reducerPath]: RtkApi.reducer,
      [referralApi.reducerPath]: referralApi.reducer,
      [contactApi.reducerPath]: contactApi.reducer,
      auth,
      layout,
      mentor,
      profilePopup,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(RtkApi.middleware, referralApi.middleware, contactApi.middleware, rtkQueryErrorLogger),
    ...options,
  });

export const store = createStore();

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;

export type RootState = ReturnType<typeof store.getState>;
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;

export const getRootState = () => store.getState();
