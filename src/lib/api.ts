import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'current_user';

// A bare axios instance (no interceptors) used only by the refresh flow, to
// avoid recursing into the response interceptor while we're already trying
// to recover from a 401.
const refreshClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Single in-flight refresh: multiple concurrent 401s share one refresh call,
// so we don't burn the refresh token by issuing N parallel renewals.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (typeof window === 'undefined') throw new Error('No window');
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('No refresh token');
  const res = await refreshClient.post('/auth/refresh-token', { refreshToken });
  const data = res.data?.data;
  if (!data?.accessToken || !data?.refreshToken) throw new Error('Invalid refresh response');
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  return data.accessToken;
}

function clearSessionAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Only navigate if we're not already on /login (avoids a reload loop when
  // the login page itself surfaces a 401 from bad credentials).
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem(ACCESS_TOKEN_KEY);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const original = error.config as
          | (InternalAxiosRequestConfig & { _retry?: boolean })
          | undefined;
        const status = error.response?.status;
        const url = original?.url || '';

        // Real credential failures and refresh failures must not loop.
        const isAuthEndpoint =
          url.includes('/auth/login') || url.includes('/auth/refresh-token');

        if (status === 401 && original && !original._retry && !isAuthEndpoint) {
          original._retry = true;
          try {
            if (!refreshPromise) {
              refreshPromise = refreshAccessToken().finally(() => {
                refreshPromise = null;
              });
            }
            const newToken = await refreshPromise;
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${newToken}`;
            return this.client.request(original);
          } catch {
            clearSessionAndRedirect();
            return Promise.reject(error);
          }
        }

        if (status === 401 && isAuthEndpoint && url.includes('/auth/refresh-token')) {
          // Refresh itself failed — refresh token is dead, sign the user out.
          clearSessionAndRedirect();
        }

        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config).then((res) => res.data);
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config).then((res) => res.data);
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config).then((res) => res.data);
  }

  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config).then((res) => res.data);
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config).then((res) => res.data);
  }
}

export const api = new ApiClient();
