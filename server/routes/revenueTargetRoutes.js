import express from "express";
import {
  createOrUpdateRevenueTarget,
  getRevenueTargets,
  getRevenueTargetPerformance,
  deleteRevenueTarget,
} from "../controllers/revenueTargetController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create or update revenue target
router.post(
  "/",
  authorize("law_firm_admin", "credit_head", "legal_head", "accountant"),
  createOrUpdateRevenueTarget
);

// Get revenue targets
router.get("/", getRevenueTargets);

// Get revenue target performance
router.get("/performance", getRevenueTargetPerformance);

// Delete revenue target (only admin)
router.delete(
  "/:id",
  authorize("law_firm_admin", "system_owner"),
  deleteRevenueTarget
);

export default router;


