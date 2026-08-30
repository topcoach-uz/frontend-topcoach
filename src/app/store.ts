import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import layout from 'src/app/slices/layoutSlice';
import auth from 'src/app/slices/authSlice';
import mentor from 'src/app/slices/mentorSlice';
import { RtkApi } from './services/api';
import { rtkQueryErrorLogger } from './services/api/middlewares';
import { referralApi } from './services/referralApi';
import { contactApi } from './services/contactApi';
import { coinsApi } from './services/coinsApi';
import { communityFeedApi } from './services/communityFeedApi';
import './services/availability'; // Ensure availability endpoints are injected into RtkApi
import './services/caafForumApi';
import './services/student-hub/studyBuddyApi';

export const createStore = (
  options?: ConfigureStoreOptions['preloadedState'] | undefined
) =>
  configureStore({
    reducer: {
      [RtkApi.reducerPath]: RtkApi.reducer,
      [referralApi.reducerPath]: referralApi.reducer,
      [contactApi.reducerPath]: contactApi.reducer,
      [coinsApi.reducerPath]: coinsApi.reducer,
      [communityFeedApi.reducerPath]: communityFeedApi.reducer,
      auth,
      layout,
      mentor,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        RtkApi.middleware,
        referralApi.middleware,
        contactApi.middleware,
        coinsApi.middleware,
        communityFeedApi.middleware,
        rtkQueryErrorLogger,
      ),
    ...options,
  });

export const store = createStore();

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;

export type RootState = ReturnType<typeof store.getState>;
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;

export const getRootState = () => store.getState();
