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

const reportsApi = {
  // Get case statistics
  getCaseStatistics: (lawFirmId, params = {}) =>
    api.get(`/reports/case-statistics/${lawFirmId}`, { params }),

  // Get user activity reports
  getUserActivity: (lawFirmId, params = {}) =>
    api.get(`/reports/user-activity/${lawFirmId}`, { params }),

  // Get department performance reports
  getDepartmentPerformance: (lawFirmId, params = {}) =>
    api.get(`/reports/department-performance/${lawFirmId}`, { params }),

  // Get revenue analytics
  getRevenueAnalytics: (lawFirmId, params = {}) =>
    api.get(`/reports/revenue-analytics/${lawFirmId}`, { params }),

  // Get comprehensive dashboard analytics
  getDashboardAnalytics: (lawFirmId) =>
    api.get(`/reports/dashboard/${lawFirmId}`),

  // New enhanced reports APIs
  getAdminOwnCases: () => api.get("/reports/admin-own-cases"),

  getLegalPerformance: (lawFirmId, params = {}) =>
    api.get(`/reports/legal-performance/${lawFirmId}`, { params }),

  getDebtCollectionPerformance: (lawFirmId, params = {}) =>
    api.get(`/reports/debt-collection-performance/${lawFirmId}`, { params }),

  getEnhancedRevenue: (lawFirmId, params = {}) =>
    api.get(`/reports/enhanced-revenue/${lawFirmId}`, { params }),

  // Download reports with law firm branding
  downloadPDF: (lawFirmId, reportType = "overview") =>
    api.get(`/reports/download-pdf/${lawFirmId}`, {
      params: { reportType },
      responseType: "blob",
    }),

  downloadExcel: (lawFirmId, reportType = "overview") =>
    api.get(`/reports/download-excel/${lawFirmId}`, {
      params: { reportType },
      responseType: "blob",
    }),

  getCreditCollectionSummary: () =>
    api.get("/reports/credit-collection/summary"),
  downloadCreditCasesCSV: () =>
    api.get("/reports/credit-collection/cases-csv", { responseType: "blob" }),
  downloadCreditCasesPDF: () =>
    api.get("/reports/credit-collection/cases-pdf", { responseType: "blob" }),

  // Enhanced credit collection reports
  getDebtCollectorStats: () =>
    api.get("/reports/credit-collection/debt-collector-stats"),
  getDebtCollectorStatsById: (debtCollectorId, params = {}) =>
    api.get(`/reports/debt-collector/${debtCollectorId}/stats`, { params }),
  getCreditCollectionPerformance: (lawFirmId, params = {}) =>
    api.get(`/reports/credit-collection/performance/${lawFirmId}`, { params }),
  getCreditCollectionRevenue: (lawFirmId, params = {}) =>
    api.get(`/reports/credit-collection/revenue/${lawFirmId}`, { params }),
  getPromisedPaymentsAnalytics: (lawFirmId, params = {}) =>
    api.get(`/reports/credit-collection/promised-payments/${lawFirmId}`, {
      params,
    }),
  getCreditCollectionTrends: (lawFirmId, params = {}) =>
    api.get(`/reports/credit-collection/trends/${lawFirmId}`, { params }),
  getLawFirmAdminDashboard: (lawFirmId) =>
    api.get(`/reports/law-firm-admin-dashboard/${lawFirmId}`),

  // New enhanced credit collection reports with real statistics
  getComprehensiveCreditCollectionSummary: (params = {}) =>
    api.get("/reports/credit-collection/comprehensive-summary", { params }),

  getEnhancedCreditCollectionPerformance: (lawFirmId, params = {}) =>
    api.get(`/reports/credit-collection/enhanced-performance/${lawFirmId}`, { params }),

  getEnhancedCreditCollectionRevenue: (lawFirmId, params = {}) =>
    api.get(`/reports/credit-collection/enhanced-revenue/${lawFirmId}`, { params }),

  getEnhancedPromisedPaymentsAnalytics: (lawFirmId, params = {}) =>
    api.get(`/reports/credit-collection/enhanced-promised-payments/${lawFirmId}`, { params }),

  downloadCreditCollectionCSV: (params = {}) =>
    api.get("/reports/credit-collection/download-csv", { params, responseType: "blob" }),

  downloadCreditCollectionPDF: (params = {}) =>
    api.get("/reports/credit-collection/download-pdf", { params, responseType: "blob" }),
};

export default reportsApi;
