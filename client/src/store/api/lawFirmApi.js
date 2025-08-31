import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userType");
      // Don't redirect here - let Redux state handle it
    }
    return Promise.reject(error);
  }
);

const lawFirmApi = {
  // Get all law firms
  getLawFirms: (params) => api.get("/law-firms", { params }),

  // Get law firm by ID
  getLawFirmById: (id) => api.get(`/law-firms/${id}`),

  // Create law firm
  createLawFirm: (lawFirmData) => api.post("/law-firms", lawFirmData),

  // Register law firm (public endpoint)
  registerLawFirm: (lawFirmData) =>
    api.post("/law-firms/register", lawFirmData),

  // Update law firm
  updateLawFirm: (id, lawFirmData) => api.put(`/law-firms/${id}`, lawFirmData),

  // Delete law firm
  deleteLawFirm: (id) => api.delete(`/law-firms/${id}`),

  // Get law firm statistics
  getLawFirmStats: (id) => api.get(`/law-firms/${id}/stats`),

  // Update law firm subscription
  updateLawFirmSubscription: (id, subscriptionData) =>
    api.put(`/law-firms/${id}/subscription`, subscriptionData),

  // Get law firm settings
  getLawFirmSettings: (id) => api.get(`/law-firms/${id}/settings`),

  // Update law firm settings
  updateSettings: (lawFirmId, settings) =>
    api.put(`/law-firms/${lawFirmId}/settings`, settings),

  // Logo management
  uploadLogo: (lawFirmId, formData) =>
    api.post(`/law-firms/${lawFirmId}/logo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  removeLogo: (lawFirmId) => api.delete(`/law-firms/${lawFirmId}/logo`),
};

export default lawFirmApi;
