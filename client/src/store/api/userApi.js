import axios from "axios";
import { API_URL } from "../../config/api.js";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const userApi = {
  getUsers: (params) => api.get("/users", { params }),
  createUser: (data) => api.post("/users", data),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUsersByRole: (role) => api.get(`/users/by-role/${role}`),
  getUsersByDepartment: (departmentId) =>
    api.get(`/users/by-department/${departmentId}`),
  createLawFirmAdmin: (data) => api.post("/users/create-law-firm-admin", data),
  deactivateUser: (id) => api.patch(`/users/${id}/deactivate`),
  resetUserPassword: (id) => api.post(`/users/${id}/reset-password`),
};

export default userApi;
