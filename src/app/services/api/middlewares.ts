import type { Middleware, MiddlewareAPI } from '@reduxjs/toolkit';
import { isRejectedWithValue } from '@reduxjs/toolkit';
import { message } from 'antd';
import { refreshToken } from 'src/app/api/axiosInstance';
import { logout } from 'src/app/slices/authSlice';
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
      const originalRequestEndpoint =
        action.meta.baseQueryMeta.request.url.split('topcoach.uz')[1];
      error_message && error_message !== 'A validation error occurred.';

      const errors = payload?.data?.errors ?? '';
      if (errors.length > 0) {
        errors.forEach((item: string) => {
          item && message.warning(item);
        });
      }

      const status = payload?.status;

      if (status === 500) {
        message.warning(
          'There is a problem with the server. Please, contact the technical support.'
        );
      } else if (status === 401) {
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

    return next(action);
  };
