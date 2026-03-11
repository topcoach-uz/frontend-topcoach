import { useGoogleLogin } from '@react-oauth/google';
import { message } from 'antd';
import { useLinkCalendarMutation } from 'src/app/services/users';
import { useAppDispatch } from 'src/app/store';
import { setHasGoogleCredentials } from 'src/app/slices/authSlice';
import { sendErrorToTelegram } from 'src/utils/telegramLogger';
import { isProduction } from 'src/utils';

/** Calendar scopes for Connect/Reconnect Google Calendar (mentor-only). calendar.readonly is required for freeBusy. */
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

export const scopes = GOOGLE_CALENDAR_SCOPES.join(' ');

/**
 * Shared hook for "Connect / Reconnect Google Calendar" (mentor-only).
 * Use in profile checklist and in the "reconnect" banner on Availability & Sessions.
 */
export function useConnectGoogleCalendar() {
  const dispatch = useAppDispatch();
  const [linkCalendar, { isLoading }] = useLinkCalendarMutation();

  const connectCalendar = useGoogleLogin({
    scope: scopes,
    flow: 'auth-code',
    redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : 'http://localhost:3000/api/auth/google/callback',
    onSuccess: (tokenResponse) => {
      const code = tokenResponse.code;
      if (!code) return;
      linkCalendar({ authCode: code })
        .unwrap()
        .then(() => {
          message.success('Google Calendar connected successfully');
          dispatch(setHasGoogleCredentials(true));
          // linkCalendar invalidates GetMe so profile refetches and needsGoogleCalendarReconnect becomes false
        })
        .catch((err) => {
          message.error(err?.data?.message || 'Could not connect Google Calendar');
          if (isProduction()) {
            sendErrorToTelegram(err);
          }
        });
    },
    onError: (error: unknown) => {
      const err = error as { message?: string; error_description?: string };
      message.error(err?.message ?? err?.error_description ?? 'Google sign-in was cancelled');
    },
  });

  return { connectCalendar, isConnecting: isLoading };
}
