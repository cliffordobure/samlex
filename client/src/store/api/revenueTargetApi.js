import axios from "axios";
import { API_URL } from "../../config/api.js";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const revenueTargetApi = {
  // Create or update revenue target
  createOrUpdateTarget: (data) => api.post("/revenue-targets", data),
  
  // Get revenue targets
  getTargets: (params) => api.get("/revenue-targets", { params }),
  
  // Get revenue target performance
  getPerformance: (params) => api.get("/revenue-targets/performance", { params }),
  
  // Delete revenue target
  deleteTarget: (id) => api.delete(`/revenue-targets/${id}`),
};

export default revenueTargetApi;


