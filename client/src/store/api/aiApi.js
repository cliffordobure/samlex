import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? "/api" : "https://samlex.onrender.com/api");

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

const aiApi = {
  // Generate AI insights for credit collection reports
  getAiInsights: (data) => api.post("/ai/insights", data),

  // Generate AI case recommendations
  getCaseRecommendations: (caseData) =>
    api.post("/ai/case-recommendations", { caseData }),

  // Generate AI payment predictions
  getPaymentPredictions: (paymentHistory, debtorProfile) =>
    api.post("/ai/payment-predictions", { paymentHistory, debtorProfile }),

  // Generate comprehensive AI analysis
  getComprehensiveAnalysis: (data) =>
    api.post("/ai/comprehensive-analysis", data),

  // Generate AI insights for legal cases
  getLegalInsights: (legalData) => api.post("/ai/legal-insights", legalData),

  // Generate comprehensive legal analysis
  getComprehensiveLegalAnalysis: (legalData) =>
    api.post("/ai/comprehensive-legal-analysis", legalData),
};

export default aiApi;
