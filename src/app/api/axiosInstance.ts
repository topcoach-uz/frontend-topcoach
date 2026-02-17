import { message } from 'antd';
import axios from 'axios';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { baseUrl } from '../services/api/const';
import { store } from '../store';
import { logout } from '../slices/authSlice';

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

const urlList = ['/auth/login', '/auth/exchange', '/auth/reset/password', '/auth/reset/password/confirm', '/auth/verify/email'];

const isAuthUrl = (url: string) =>
  urlList.some((path) => (url || '').includes(path));

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

// Modify refreshToken to accept the original URL
export const refreshToken = async (originalUrl?: string, error?: Error) => {
  // Only logout if the original request was not for a session endpoint
  if (
    originalUrl &&
    !originalUrl.startsWith('/sessions') &&
    !originalUrl.startsWith('/camps')
  ) {
    setTimeout(() => store.dispatch(logout()), 2000);
  }
  // The actual refresh logic seems commented out/missing,
  // but the conditional logout is implemented above.
  // If there was actual refresh logic, it would go here.
  // For now, it will likely reject as logout() is dispatched.
  // Example:
  // return await axios.post(`${baseUrl}/auth/refresh`, { ... });

  // If logout was dispatched, we might want to throw an error
  // to prevent retrying the original request.
  return Promise.reject(error);
};

export { axiosInstance, videoUploadInstance };
