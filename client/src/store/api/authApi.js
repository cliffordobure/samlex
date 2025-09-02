import axios from "axios";
import { API_URL } from "../../config/api.js";
import NetworkErrorHandler from "../../utils/networkErrorHandler.js";

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
  retry: 3,
  retryDelay: 1000,
});

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("🔑 Token from localStorage:", token ? "Token exists" : "No token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Authorization header set");
    } else {
      console.log("❌ No token found in localStorage");
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with retry logic
api.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`✅ API Response received: ${response.status} (${duration}ms)`);
    return response;
  },
  async (error) => {
    const duration = new Date() - error.config?.metadata?.startTime;
    console.error(`❌ API Error: ${error.response?.status} (${duration}ms)`, error.response?.data);

    // Handle network errors
    if (NetworkErrorHandler.isNetworkError(error)) {
      console.log("🌐 Network error detected, checking online status...");
      
      if (!NetworkErrorHandler.checkOnlineStatus()) {
        console.log("📡 User is offline");
        return Promise.reject({
          ...error,
          message: "You are currently offline. Please check your internet connection."
        });
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log("🚪 Unauthorized - clearing auth data");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userType");
      
      // Show user-friendly message
      return Promise.reject({
        ...error,
        message: "Your session has expired. Please log in again."
      });
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.log("🔧 Server error detected");
      return Promise.reject({
        ...error,
        message: "Server is temporarily unavailable. Please try again later."
      });
    }

    return Promise.reject(error);
  }
);

// Retry mechanism for failed requests
const retryRequest = async (config, retryCount = 0) => {
  try {
    return await api(config);
  } catch (error) {
    if (retryCount < config.retry && NetworkErrorHandler.isNetworkError(error)) {
      console.log(`🔄 Retrying request (${retryCount + 1}/${config.retry})...`);
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * (retryCount + 1)));
      return retryRequest(config, retryCount + 1);
    }
    throw error;
  }
};

// Enhanced API methods with retry logic
const authApi = {
  login: (credentials) => retryRequest({ method: 'post', url: '/auth/login', data: credentials }),
  registerUser: (userData) => retryRequest({ method: 'post', url: '/auth/register', data: userData }),
  getMe: () => retryRequest({ method: 'get', url: '/auth/me' }),
  updateProfile: (profileData) => retryRequest({ method: 'put', url: '/auth/profile', data: profileData }),
  changePassword: (passwordData) => retryRequest({ method: 'put', url: '/auth/change-password', data: passwordData }),
  logout: () => retryRequest({ method: 'post', url: '/auth/logout' }),
  forgotPassword: (email) => retryRequest({ method: 'post', url: '/auth/forgot-password', data: { email } }),
  resetPassword: (token, password) => retryRequest({ 
    method: 'put', 
    url: `/auth/reset-password/${token}`, 
    data: { newPassword: password } 
  }),
};

export default authApi;
