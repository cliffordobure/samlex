import express from "express";
import {
  getCaseStatistics,
  getUserActivity,
  getDepartmentPerformance,
  getRevenueAnalytics,
  getDashboardAnalytics,
  getCreditCollectionSummary,
  downloadCreditCasesCSV,
  getDebtCollectorStats,
  getDebtCollectorStatsById,
  getLawFirmAdminDashboard,
  downloadCreditCasesPDF,
  getAdminOwnCases,
  getLegalPerformance,
  getDebtCollectionPerformance,
  getEnhancedRevenueAnalytics,
  downloadComprehensivePDF,
  downloadComprehensiveExcel,
  getCreditCollectionPerformance,
  getCreditCollectionRevenue,
  getPromisedPaymentsAnalytics,
  getComprehensiveCreditCollectionSummary,
  getEnhancedCreditCollectionPerformance,
  getEnhancedCreditCollectionRevenue,
  getEnhancedPromisedPaymentsAnalytics,
  downloadCreditCollectionCSV,
  downloadCreditCollectionPDF,
} from "../controllers/reportsController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Per-route authorization
router.get(
  "/case-statistics/:lawFirmId",
  authorize("law_firm_admin", "debt_collector", "system_owner"),
  getCaseStatistics
);
router.get(
  "/user-activity/:lawFirmId",
  authorize("law_firm_admin"),
  getUserActivity
);
router.get(
  "/department-performance/:lawFirmId",
  authorize("law_firm_admin"),
  getDepartmentPerformance
);
router.get(
  "/revenue-analytics/:lawFirmId",
  authorize("law_firm_admin"),
  getRevenueAnalytics
);
router.get(
  "/dashboard/:lawFirmId",
  authorize("law_firm_admin"),
  getDashboardAnalytics
);
router.get(
  "/law-firm-admin-dashboard/:lawFirmId",
  authorize("law_firm_admin"),
  getLawFirmAdminDashboard
);

// New admin-specific reports
router.get(
  "/admin-own-cases",
  authorize("admin", "law_firm_admin"),
  getAdminOwnCases
);
router.get(
  "/legal-performance/:lawFirmId",
  authorize("admin", "law_firm_admin", "legal_head"),
  getLegalPerformance
);
router.get(
  "/debt-collection-performance/:lawFirmId",
  authorize("admin", "law_firm_admin", "credit_head"),
  getDebtCollectionPerformance
);
router.get(
  "/enhanced-revenue/:lawFirmId",
  authorize("admin", "law_firm_admin"),
  getEnhancedRevenueAnalytics
);

// Download reports with law firm branding
router.get(
  "/download-pdf/:lawFirmId",
  authorize("admin", "law_firm_admin"),
  downloadComprehensivePDF
);
router.get(
  "/download-excel/:lawFirmId",
  authorize("admin", "law_firm_admin"),
  downloadComprehensiveExcel
);

// Allow credit_head, law_firm_admin, and system_owner for these:
router.get(
  "/credit-collection/summary",
  authorize("law_firm_admin", "credit_head", "system_owner", "debt_collector"),
  getCreditCollectionSummary
);

router.get(
  "/credit-collection/cases-csv",
  authorize("law_firm_admin", "credit_head", "system_owner", "debt_collector"),
  downloadCreditCasesCSV
);

router.get(
  "/credit-collection/cases-pdf",
  authorize("law_firm_admin", "credit_head", "system_owner", "debt_collector"),
  downloadCreditCasesPDF
);

// Enhanced credit collection reports
router.get(
  "/credit-collection/debt-collector-stats",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  getDebtCollectorStats
);

router.get(
  "/credit-collection/performance/:lawFirmId",
  authorize("credit_head", "law_firm_admin", "system_owner", "debt_collector"),
  getCreditCollectionPerformance
);

router.get(
  "/credit-collection/revenue/:lawFirmId",
  authorize("credit_head", "law_firm_admin", "system_owner", "debt_collector"),
  getCreditCollectionRevenue
);

router.get(
  "/credit-collection/promised-payments/:lawFirmId",
  authorize("credit_head", "law_firm_admin", "system_owner", "debt_collector"),
  getPromisedPaymentsAnalytics
);

// Enhanced credit collection reports with real statistics
router.get(
  "/credit-collection/comprehensive-summary",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  getComprehensiveCreditCollectionSummary
);

router.get(
  "/credit-collection/enhanced-performance/:lawFirmId",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  getEnhancedCreditCollectionPerformance
);

router.get(
  "/credit-collection/enhanced-revenue/:lawFirmId",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  getEnhancedCreditCollectionRevenue
);

router.get(
  "/credit-collection/enhanced-promised-payments/:lawFirmId",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  getEnhancedPromisedPaymentsAnalytics
);

router.get(
  "/credit-collection/download-csv",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  downloadCreditCollectionCSV
);

router.get(
  "/credit-collection/download-pdf",
  authorize("debt_collector", "credit_head", "law_firm_admin", "system_owner"),
  downloadCreditCollectionPDF
);

// Debt collector stats endpoint
router.get(
  "/debt-collector/stats",
  authorize("debt_collector", "law_firm_admin", "credit_head"),
  getDebtCollectorStats
);

// Debt collector stats by ID endpoint
router.get(
  "/debt-collector/:debtCollectorId/stats",
  authorize("debt_collector", "law_firm_admin", "credit_head"),
  getDebtCollectorStatsById
);

export default router;
