import type { Middleware, MiddlewareAPI } from '@reduxjs/toolkit';
import { isRejectedWithValue } from '@reduxjs/toolkit';
import { message } from 'antd';
import { refreshToken } from 'src/app/api/axiosInstance';
import { logout } from 'src/app/slices/authSlice';
import { show } from 'src/app/slices/profilePopupSlice';
import { store } from 'src/app/store';

// Deduplicate error toasts to prevent stacked/infinite messages
let last401ToastTime = 0;
const TOAST_DEBOUNCE_MS = 3000;

/**
 * Log a warning and show a toast!
 */
export const rtkQueryErrorLogger: Middleware =
  (api: MiddlewareAPI) => (next) => async (action) => {
    // RTK Query uses createAsyncThunk from redux-toolkit under the hood, so we're able to utilize these matchers!
    if (isRejectedWithValue(action)) {
      const payload: any = action.payload;
      const error_message =
        payload?.data?.message ??
        payload?.data?.msg ??
        payload?.data?.err?.message ??
        '';
      
      // Safely extract the endpoint URL
      let originalRequestEndpoint = '';
      try {
        const requestUrl = action.meta?.baseQueryMeta?.request?.url || '';
        if (requestUrl.includes('topcoachuni.com') || requestUrl.includes('topcoach.uz')) {
          originalRequestEndpoint = requestUrl.split('topcoachuni.com')[1] || requestUrl.split('topcoach.uz')[1] || '';
        } else if (requestUrl.includes('localhost') || requestUrl.includes('127.0.0.1')) {
          // Handle localhost URLs
          const urlParts = requestUrl.split('/api/');
          originalRequestEndpoint = urlParts.length > 1 ? '/' + urlParts[1] : '';
        } else {
          // Fallback: try to extract path from URL
          try {
            const url = new URL(requestUrl);
            originalRequestEndpoint = url.pathname;
          } catch {
            // If URL parsing fails, try to extract from the string directly
            const match = requestUrl.match(/\/(api|student-hub|auth|sessions|camps)[\/\w-]*/);
            originalRequestEndpoint = match ? match[0] : '';
          }
        }
      } catch (error) {
        // If extraction fails, set empty string
        originalRequestEndpoint = '';
      }
      
      error_message && error_message !== 'A validation error occurred.';

      const errors = payload?.data?.errors ?? '';
      if (errors.length > 0) {
        errors.forEach((item: string) => {
          item && message.warning(item);
        });
      }

      const status = payload?.status;
      const errorCode = payload?.data?.error;

      // Handle profile requirements error
      if (errorCode === 'PROFILE_REQUIREMENTS_NOT_MET') {
        // Show the profile requirements modal
        store.dispatch(show());
        
        // Also show a toast message for immediate feedback
        const errorMessage = payload?.data?.message || 'Please complete your profile requirements to continue.';
        message.warning(errorMessage);
        return;
      }

      if (status === 500) {
        message.warning(
          'There is a problem with the server. Please, contact the technical support.'
        );
      } else if (status === 401) {
        // Don't treat chat API 401 as session expiry – avoids logout and chat icon disappearing
        const isChatRequest = originalRequestEndpoint && originalRequestEndpoint.includes('/chat');
        if (isChatRequest) {
          // Chat API 401 (e.g. webhook/service issues): no logout, no toast. ChatIcon shows 0 unread.
          return next(action);
        }

        // A 401 from ANY auth endpoint is part of the sign-in handshake
        // (wrong password, Google short-code exchange, register, reset) — it
        // must never trigger a global logout/redirect. `/auth/` covers
        // `/auth/google/exchange-by-code`, which previously slipped through.
        const isLoginAttempt =
          !!originalRequestEndpoint &&
          originalRequestEndpoint.includes('/auth/');

        // Never bounce the user while they're ON an /auth/* page either — a
        // transient `users/me` 401 during the Google callback would otherwise
        // throw a new user straight back to the login page.
        const onAuthPage =
          typeof window !== 'undefined' &&
          window.location.pathname.startsWith('/auth');

        if (!isLoginAttempt && !onAuthPage && originalRequestEndpoint) {
          const now = Date.now();
          if (now - last401ToastTime > TOAST_DEBOUNCE_MS) {
            last401ToastTime = now;
            message.warning('Your session has expired. Please log in again.');
          }
          if (
            !originalRequestEndpoint.startsWith('/sessions') &&
            !originalRequestEndpoint.startsWith('/camps') &&
            !originalRequestEndpoint.includes('/chat')
          ) {
            setTimeout(() => {
              store.dispatch(logout());
            }, 2000);
          }
          await refreshToken()
            .then(() => {
              message.success('Refresh successful!');
            })
            .catch(() => {
              if (Date.now() - last401ToastTime > TOAST_DEBOUNCE_MS) {
                message.error('Refresh failed. Please log in again.');
              }
            });
        }
      }
    }

    return next(action);
  };
