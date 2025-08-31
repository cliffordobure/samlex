import express from "express";
import { body } from "express-validator";
import {
  getLawFirms,
  createLawFirm,
  getLawFirm,
  updateLawFirm,
  deleteLawFirm,
  getSystemAnalytics,
  getSystemHealth,
  getAnalytics,
} from "../controllers/systemOwnerController.js";
import { protect, authorize } from "../middleware/auth.js";
import {
  handleValidationErrors,
  validateEmail,
  validateObjectId,
} from "../middleware/validation.js";

const router = express.Router();

// All routes require system owner authentication
router.use(protect);
router.use(authorize("system_owner"));

// Analytics and health routes
router.get("/analytics", getAnalytics);
router.get("/system-health", getSystemHealth);

// Law firm management routes
router
  .route("/law-firms")
  .get(getLawFirms)
  .post(
    [
      body("firmName")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Firm name must be between 2 and 100 characters"),
      body("firmEmail")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid firm email"),
      body("adminUser.firstName")
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Admin first name must be between 2 and 50 characters"),
      body("adminUser.lastName")
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Admin last name must be between 2 and 50 characters"),
      body("adminUser.email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid admin email"),
      handleValidationErrors,
    ],
    createLawFirm
  );

router
  .route("/law-firms/:id")
  .get(validateObjectId("id"), handleValidationErrors, getLawFirm)
  .put(validateObjectId("id"), handleValidationErrors, updateLawFirm)
  .delete(validateObjectId("id"), handleValidationErrors, deleteLawFirm);

export default router;
