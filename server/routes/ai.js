import express from "express";
import {
  getAiInsights,
  getCaseRecommendations,
  getPaymentPredictions,
  getComprehensiveAnalysis,
  getLegalInsights,
  getComprehensiveLegalAnalysis,
} from "../controllers/aiController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// AI Insights for credit collection reports
router.post(
  "/insights",
  authorize("credit_head", "law_firm_admin", "system_owner", "debt_collector"),
  getAiInsights
);

// AI Case recommendations
router.post(
  "/case-recommendations",
  authorize("credit_head", "law_firm_admin", "system_owner", "debt_collector"),
  getCaseRecommendations
);

// AI Payment predictions
router.post(
  "/payment-predictions",
  authorize("credit_head", "law_firm_admin", "system_owner", "debt_collector"),
  getPaymentPredictions
);

// Comprehensive AI analysis
router.post(
  "/comprehensive-analysis",
  authorize("credit_head", "law_firm_admin", "system_owner", "debt_collector"),
  getComprehensiveAnalysis
);

// AI Legal insights
router.post(
  "/legal-insights",
  authorize("advocate", "legal_head", "law_firm_admin", "system_owner"),
  getLegalInsights
);

// Comprehensive legal analysis
router.post(
  "/comprehensive-legal-analysis",
  authorize("advocate", "legal_head", "law_firm_admin", "system_owner"),
  getComprehensiveLegalAnalysis
);

export default router;
