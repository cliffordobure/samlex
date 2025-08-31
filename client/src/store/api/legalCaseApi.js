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

const legalCaseApi = {
  getLegalCases: (params) => api.get("/legal-cases", { params }),
  createLegalCase: (data) => api.post("/legal-cases", data),
  getLegalCase: (id) => {
    console.log("=== DEBUG: legalCaseApi.getLegalCase ===");
    console.log("Fetching case with ID:", id);
    return api
      .get(`/legal-cases/${id}`)
      .then((response) => {
        console.log("API Response:", response);
        return response;
      })
      .catch((error) => {
        console.error("API Error:", error);
        throw error;
      });
  },
  updateLegalCase: (id, data) => api.put(`/legal-cases/${id}`, data),
  deleteLegalCase: (id) => api.delete(`/legal-cases/${id}`),
  assignCase: (id, userId) =>
    api.put(`/legal-cases/${id}/assign`, { assignedTo: userId }),
  updateStatus: (id, status) =>
    api.put(`/legal-cases/${id}/status`, { status }),
  addNote: (id, note) => api.post(`/legal-cases/${id}/notes`, note),
  addComment: (id, comment) =>
    api.post(`/legal-cases/${id}/notes`, {
      content: comment.comment,
      isInternal: false,
    }),
  addDocument: (id, documents) =>
    api.post(`/legal-cases/${id}/documents`, { documents }),
  updateCourtDates: (id, courtDates) =>
    api.put(`/legal-cases/${id}/court-dates`, courtDates),
  getPendingAssignmentCases: () => api.get("/legal-cases/pending-assignment"),
  getAssignedCases: (userId) => api.get(`/legal-cases/assigned/${userId}`),
  getStatistics: (params) => api.get("/legal-cases/statistics", { params }),
  notifyClient: (id, message) =>
    api.post(`/legal-cases/${id}/notify-client`, { message }),
  completeCaseInfo: (id, data) =>
    api.put(`/legal-cases/${id}/complete-info`, data),
};

export default legalCaseApi;
