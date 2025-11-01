import type { Middleware, MiddlewareAPI } from '@reduxjs/toolkit';
import { isRejectedWithValue } from '@reduxjs/toolkit';
import { message } from 'antd';
import { refreshToken } from 'src/app/api/axiosInstance';
import { logout } from 'src/app/slices/authSlice';
import { show } from 'src/app/slices/profilePopupSlice';
import { store } from 'src/app/store';

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
        if (requestUrl.includes('topcoach.uz')) {
          originalRequestEndpoint = requestUrl.split('topcoach.uz')[1] || '';
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
        // Only show session expired messages for authenticated requests, not login attempts
        const isLoginAttempt = originalRequestEndpoint && (
          originalRequestEndpoint.includes('/auth/login') || 
          originalRequestEndpoint.includes('/auth/exchange') ||
          originalRequestEndpoint.includes('/auth/reset/password') ||
          originalRequestEndpoint.includes('/auth/reset/password/confirm')
        );
        
        if (!isLoginAttempt && originalRequestEndpoint) {
          message.warning('Your session has expired. Please log in again.');
          if (
            !originalRequestEndpoint.startsWith('/sessions') &&
            !originalRequestEndpoint.startsWith('/camps')
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
              message.error('Refresh failed. Please log in again.');
            });
        }
      }
    }

    return next(action);
  };
