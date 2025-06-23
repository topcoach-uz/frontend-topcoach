import { message } from 'antd';
import axios from 'axios';
import { access_token } from 'src/constants/storage';
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
});

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

const urlList = ['/auth/login', '/auth/exchange', '/auth/reset/password'];

// Response Interceptor: Handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response, // Pass successful responses
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized, attempt to refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !urlList.includes(originalRequest.url) // Use originalRequest.url here
    ) {
      originalRequest._retry = true; // Prevent infinite loops

      try {
        // Request a new access token, passing the original URL
        await refreshToken(originalRequest.url, error);

        // Retry the original request after successful refresh
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log user out (handled inside refreshToken now)
        if (
          originalRequest.url.startsWith('/sessions') ||
          originalRequest.url.startsWith('/camps')
        ) {
          // do nothing
        } else if (access_token) {
          message.error('Your session has expired. Please log in again.');
        } else {
          message.error(
            'Something went wrong. Please try again later, if the issue persists contact support.',
            10
          );
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

export default axiosInstance;
