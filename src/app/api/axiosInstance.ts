import { message } from 'antd';
import axios from 'axios';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { baseUrl } from '../services/api/const';
import { store } from '../store';
import { login, logout } from '../slices/authSlice';

// Function to get the current access token
const getAccessToken = () => store.getState().auth.access_token;
const getLanguage = () => {
  const language = store.getState().layout.language;
  return language;
};

// Create Axios instance with default settings
const axiosInstance = axios.create({
  baseURL: baseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 seconds timeout
});

// Create a separate instance for video uploads with longer timeout
const videoUploadInstance = axios.create({
  baseURL: baseUrl,
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 300000, // 5 minutes timeout for video uploads
});

// Add request interceptor to both instances
const addAuthInterceptor = (instance: any) => {
  instance.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
};

addAuthInterceptor(axiosInstance);
addAuthInterceptor(videoUploadInstance);

// Request Interceptor to add Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    const language = getLanguage();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers.language = language || 'ru';

    return config;
  },
  (error) => Promise.reject(error)
);

// Any of these endpoints returning 401 must NOT trigger a global
// logout/redirect — they're part of the auth handshake itself (wrong
// password, short-code exchange, Google callback, register) and are handled
// by the calling page. `/auth/google` covers `/auth/google/exchange-by-code`
// and `/auth/google/callback`, which previously slipped past `/auth/exchange`
// and bounced users back to the login page mid-sign-in.
const urlList = [
  '/auth/login',
  '/auth/exchange',
  '/auth/google',
  '/auth/register',
  '/auth/reset/password',
  '/auth/reset/password/confirm',
  '/auth/verify/email',
];

const isAuthUrl = (url: string) =>
  urlList.some((path) => (url || '').includes(path));

/** True while the user is on any /auth/* page (sign-in, sign-up, Google). */
const onAuthPage = () =>
  typeof window !== 'undefined' &&
  window.location.pathname.startsWith('/auth');

// Deduplicate error toasts to prevent "infinite" stacked messages
let lastErrorToast = '';
let lastErrorTime = 0;
const TOAST_DEBOUNCE_MS = 3000;

const showErrorToast = (msg: string, duration?: number) => {
  const now = Date.now();
  if (msg === lastErrorToast && now - lastErrorTime < TOAST_DEBOUNCE_MS) return;
  lastErrorToast = msg;
  lastErrorTime = now;
  message.error(msg, duration ?? 5);
};

// Response Interceptor: Handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response, // Pass successful responses
  async (error) => {
    const originalRequest = error.config;
    const backendMessage = error.response?.data?.message;

    // If 401 Unauthorized, attempt to refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthUrl(originalRequest?.url || '')
    ) {
      originalRequest._retry = true; // Prevent infinite loops

      try {
        await refreshToken(originalRequest.url, error);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        if (
          originalRequest?.url?.startsWith('/sessions') ||
          originalRequest?.url?.startsWith('/camps')
        ) {
          // do nothing
        } else {
          const hasToken = !!localStorage.getItem(ACCESS_TOKEN) || !!getAccessToken();
          if (hasToken) {
            showErrorToast('Your session has expired. Please log in again.');
          } else {
            // Use backend message when available for user-friendly errors
            const friendlyMsg =
              backendMessage ||
              'Please try again. If the issue persists, contact support.';
            showErrorToast(friendlyMsg, 5);
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Single-flight guard: while a refresh is in progress, every other 401 awaits
// the same round-trip instead of firing its own (which would race the backend
// and could rotate the refresh token out from under us).
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Ask the backend for a fresh access token. The refresh token lives in an
 * httpOnly `Refresh` cookie set at login; the frontend is same-origin with the
 * API (nginx proxies /api), so the browser sends that cookie automatically —
 * `withCredentials` covers the split-origin case too. A bare axios call is used
 * (not axiosInstance) so this request can't recurse through this interceptor.
 */
const requestNewAccessToken = async (): Promise<string | null> => {
  try {
    const res = await axios.post(
      `${baseUrl}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const access = res.data?.user?.access;
    const refresh = res.data?.user?.refresh;
    if (access && refresh) {
      // Updates both the store and localStorage, so the retried request (and
      // every later request) picks up the new token from the request interceptor.
      store.dispatch(login({ access, refresh }));
      return access;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Called by the 401 response interceptor. Attempts a real token refresh; on
 * success the caller retries the original request with the new token. Only when
 * refresh genuinely fails do we log the user out — and never for the auth
 * handshake endpoints or session/camps calls, nor while on an /auth/* page.
 */
export const refreshToken = async (originalUrl?: string, error?: Error) => {
  if (!refreshInFlight) {
    refreshInFlight = requestNewAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }

  const newToken = await refreshInFlight;
  if (newToken) {
    // Session recovered — let the interceptor retry the original request.
    return newToken;
  }

  // Refresh failed → the session is really dead. Log out, but keep the existing
  // exceptions so a 401 during sign-in / on session endpoints doesn't bounce.
  if (
    originalUrl &&
    !originalUrl.startsWith('/sessions') &&
    !originalUrl.startsWith('/camps') &&
    !isAuthUrl(originalUrl) &&
    !onAuthPage()
  ) {
    store.dispatch(logout());
  }
  return Promise.reject(error);
};

export { axiosInstance, videoUploadInstance };
