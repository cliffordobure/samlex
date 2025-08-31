import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://samlex.onrender.com/api";

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_BASE,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const notificationApi = {
  // Get user's notifications
  getNotifications: async (params = {}) => {
    const response = await api.get("/notifications", { params });
    return response.data;
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put("/notifications/mark-all-read");
    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationApi;
