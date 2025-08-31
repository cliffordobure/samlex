import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? "/api" : "https://samlex.onrender.com/api");

const api = axios.create({
  baseURL: API_BASE,
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

const creditCaseApi = {
  getCreditCases: (params) => api.get(`/credit-cases`, { params }),
  createCreditCase: (data) => api.post(`/credit-cases`, data),
  getCreditCase: (id) => api.get(`/credit-cases/${id}`),
  updateCreditCase: (id, data) => api.put(`/credit-cases/${id}`, data),
  deleteCreditCase: (id) => api.delete(`/credit-cases/${id}`),
  assignCase: (id, userId) =>
    api.patch(`/credit-cases/${id}/assign`, { assignedTo: userId }),
  updateStatus: (id, status) =>
    api.patch(`/credit-cases/${id}/move`, { status }),
  addNote: (id, note) => api.post(`/credit-cases/${id}/notes`, note),
  escalateCase: (id, data) => api.patch(`/credit-cases/${id}/escalate`, data),
  getAssignedCases: (userId) => api.get(`/credit-cases/assigned/${userId}`),
  getCaseComments: (id) => api.get(`/credit-cases/${id}/comments`),
  addCaseComment: (id, data) => api.post(`/credit-cases/${id}/comments`, data),
  addDocument: (id, data) => api.post(`/credit-cases/${id}/documents`, data),
  // Follow-up endpoints
  addFollowUp: (id, data) => api.post(`/credit-cases/${id}/follow-up`, data),
  // Promised payment endpoints
  addPromisedPayment: (id, data) =>
    api.post(`/credit-cases/${id}/promised-payment`, data),
  updatePromisedPaymentStatus: (id, paymentId, data) =>
    api.patch(`/credit-cases/${id}/promised-payment/${paymentId}`, data),
  // Escalation endpoints
  getEscalationFee: (id) => api.get(`/credit-cases/${id}/escalation-fee`),
  initiateEscalation: (id) =>
    api.post(`/credit-cases/${id}/initiate-escalation`),
  confirmEscalationPayment: (id, paymentId) =>
    api.post(`/credit-cases/${id}/confirm-escalation`, { paymentId }),
  // Legal department endpoints
  getEscalatedCases: (params) => api.get(`/credit-cases/escalated`, { params }),
  updateEscalatedCaseStatus: (id, data) =>
    api.patch(`/credit-cases/${id}/escalated-status`, data),
};

export default creditCaseApi;
