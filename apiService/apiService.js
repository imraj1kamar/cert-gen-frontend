// api/apiService.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ,
  withCredentials: true, // ⭐️ Sabse zaroori: Cookies ko automatically request ke sath bhejta hai
});

// Flag to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token expiration (401 Unauthorized) & Auto-Refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Agar token expire ho gaya ho (401 error) aur request pehle retry na hui ho
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // Agar refresh ya login route khud fail ho raha hai, toh loop se bachne ke liye direct reject karein
      if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Background mein refresh token endpoint hit karein taaki naya access token mil jaye
        await axiosInstance.post('/api/auth/refresh');
        
        isRefreshing = false;
        processQueue(null);
        
        // Rukhi hui purani request ko dobara chala dein
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Agar refresh token bhi expire ho gaya ho, toh user ko login page par bhej sakte hain
        if (typeof window !== 'undefined') {
          // window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ── In-flight GET deduplication map ──────────────────────────────────────────
// Agar ek hi waqt 2 components same URL maangein, toh sirf 1 network request
// jaayegi — dono ko same Promise milegi. Request settle hone par entry delete
// ho jaati hai taaki future intentional refetches properly kaam kar sakein.
const inflightRequests = new Map();

// Unified apiService object containing HTTP methods
export const apiService = {
  get: async (url, config = {}) => {
    // Deduplication sirf plain GET calls ke liye (no custom signal/params)
    const dedupKey = url;
    if (inflightRequests.has(dedupKey)) {
      return inflightRequests.get(dedupKey);
    }

    const promise = axiosInstance
      .get(url, config)
      .then((res) => res.data)
      .finally(() => {
        inflightRequests.delete(dedupKey);
      });

    inflightRequests.set(dedupKey, promise);
    return promise;
  },
  post: async (url, data, config = {}) => {
    const response = await axiosInstance.post(url, data, config);
    return response.data;
  },
  put: async (url, data, config = {}) => {
    const response = await axiosInstance.put(url, data, config);
    return response.data;
  },
  delete: async (url, config = {}) => {
    const response = await axiosInstance.delete(url, config);
    return response.data;
  },
};

export default axiosInstance;