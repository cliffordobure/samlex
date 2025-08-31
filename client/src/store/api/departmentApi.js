import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

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

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error("❌ Authentication error detected:", error.response);

      // Only clear token for specific authentication failures
      // Don't clear for authorization failures (403) or other 401 errors
      if (
        error.response?.data?.message === "User not authenticated" ||
        error.response?.data?.message === "Not authorized to access this route"
      ) {
        console.log("🚪 Clearing invalid token due to authentication failure");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userType");

        // Optionally redirect to login
        // window.location.href = '/login';
      } else {
        console.log("⚠️ 401 error but not clearing token - may be temporary");
      }
    }
    return Promise.reject(error);
  }
);

const departmentApi = {
  getDepartments: (params) => api.get("/departments", { params }),
  createDepartment: (data) => api.post("/departments", data),
  getDepartment: (id) => api.get(`/departments/${id}`),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
  getDepartmentDetails: (departmentId) =>
    api.get(`/departments/${departmentId}/details`),
};

export default departmentApi;
