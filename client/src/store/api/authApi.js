import axios from "axios";
import { API_URL } from "../../config/api.js";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("🔑 Token from localStorage:", token); // Debug log

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Authorization header set:", config.headers.Authorization); // Debug log
    } else {
      console.log("❌ No token found in localStorage"); // Debug log
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response received:", response.status); // Debug log
    return response;
  },
  (error) => {
    console.error(
      "❌ API Error:",
      error.response?.status,
      error.response?.data
    ); // Debug log

    if (error.response?.status === 401) {
      console.log("🚪 Unauthorized - removing token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userType");
      // Don't redirect here - let Redux state handle it
    }
    return Promise.reject(error);
  }
);

const authApi = {
  login: (credentials) => api.post("/auth/login", credentials),
  registerUser: (userData) => api.post("/auth/register", userData),
  getMe: () => api.get("/auth/me"),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
  changePassword: (passwordData) =>
    api.put("/auth/change-password", passwordData),
  logout: () => api.post("/auth/logout"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.put(`/auth/reset-password/${token}`, { newPassword: password }),
};

export default authApi;
