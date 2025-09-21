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

  getAdminOwnCases: () => api.get("/reports/admin-own-cases"),

  getLegalPerformance: (lawFirmId, params = {}) =>
    api.get(`/reports/legal-performance/${lawFirmId}`, { params }),

  getDebtCollectionPerformance: (lawFirmId, params = {}) =>
    api.get(`/reports/debt-collection-performance/${lawFirmId}`, { params }),

  getEnhancedRevenue: (lawFirmId, params = {}) =>
    api.get(`/reports/enhanced-revenue/${lawFirmId}`, { params }),

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

  // NEW PROFESSIONAL PDF REPORTS
  downloadProfessionalPDF: (lawFirmId, reportType = "overview") =>
    api.get(`/reports/professional-pdf/${lawFirmId}`, {
      params: { reportType },
      responseType: "blob",
    }),

  downloadProfessionalDepartmentPDF: (lawFirmId, departmentId) =>
    api.get(`/reports/professional-pdf/${lawFirmId}/department/${departmentId}`, {
      responseType: "blob",
    }),

  // MODERN PROFESSIONAL PDF REPORTS - ULTIMATE QUALITY
  downloadModernPDF: (lawFirmId, reportType = "overview") =>
    api.get(`/reports/modern-pdf/${lawFirmId}`, {
      params: { reportType },
      responseType: "blob",
    }),

  downloadModernDepartmentPDF: (lawFirmId, departmentId) =>
    api.get(`/reports/modern-pdf/${lawFirmId}/department/${departmentId}`, {
      responseType: "blob",
    }),

  downloadExecutiveSummaryPDF: (lawFirmId) =>
    api.get(`/reports/modern-pdf/${lawFirmId}/executive`, {
      responseType: "blob",
    }),

  // CLEAN PROFESSIONAL PDF REPORTS - NO ENCODING ISSUES
  downloadCleanPDF: (lawFirmId) =>
    api.get(`/reports/clean-pdf/${lawFirmId}`, {
      responseType: "blob",
    }),

  // SIMPLE PROFESSIONAL HTML REPORTS - ABSOLUTELY NO ENCODING ISSUES
  downloadSimplePDF: (lawFirmId) =>
    api.get(`/reports/simple-pdf/${lawFirmId}`, {
      responseType: "blob",
    }),

  // SPECIALIZED PROFESSIONAL HTML REPORTS - DIFFERENT REPORTS FOR DIFFERENT SECTIONS
  downloadSpecializedReport: (lawFirmId, reportType) =>
    api.get(`/reports/specialized/${lawFirmId}/${reportType}`, {
      responseType: "blob",
    }),

  // DEBUG: Check revenue calculation
  debugRevenue: (lawFirmId) =>
    api.get(`/reports/debug-revenue/${lawFirmId}`),

  getCreditCollectionSummary: () =>
    api.get("/reports/credit-collection/summary"),
  downloadCreditCasesCSV: () =>
    api.get("/reports/credit-collection/cases-csv", { responseType: "blob" }),
  downloadCreditCasesPDF: () =>
    api.get("/reports/credit-collection/cases-pdf", { responseType: "blob" }),

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
    api.get(`/reports/law-firm-admin-dashboard/${lawFirmId}`, {
      params: { _t: Date.now() } // Cache busting
    }),

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
