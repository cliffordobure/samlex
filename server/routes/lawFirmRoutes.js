// routes/lawFirmRoutes.js
import express from "express";
import {
  getLawFirms,
  getLawFirmById,
  createLawFirm,
  registerLawFirm,
  updateLawFirm,
  deleteLawFirm,
  getLawFirmStats,
  updateLawFirmSubscription,
  getLawFirmSettings,
  updateLawFirmSettings,
  uploadLawFirmLogo,
  removeLogo,
  verifyPayment,
} from "../controllers/lawFirmController.js";
import { protect, authorize } from "../middleware/auth.js";
import {
  uploadSingle,
  uploadLogo,
  handleUploadError,
} from "../middleware/upload.js";

const router = express.Router();

// Public registration route (no authentication required)
router.post("/register", registerLawFirm);

// Public payment verification route (no authentication required)
router.post("/verify-payment", verifyPayment);

// Apply authentication middleware to all other law firm routes
router.use(protect);

// Routes accessible by system owners only
router
  .route("/")
  .get(authorize("system_owner"), getLawFirms)
  .post(authorize("system_owner"), createLawFirm);

// Routes for specific law firm operations
router
  .route("/:id")
  .get(authorize("system_owner", "law_firm_admin"), getLawFirmById)
  .put(authorize("system_owner", "law_firm_admin"), updateLawFirm)
  .delete(authorize("system_owner"), deleteLawFirm);

// Law firm statistics - accessible by system owners and law firm admins
router.get(
  "/:id/stats",
  authorize("system_owner", "law_firm_admin"),
  getLawFirmStats
);

// Subscription management - accessible by system owners only
router.put(
  "/:id/subscription",
  authorize("system_owner"),
  updateLawFirmSubscription
);

// Settings management - accessible by law firm admins
router
  .route("/:id/settings")
  .get(authorize("law_firm_admin"), getLawFirmSettings)
  .put(authorize("law_firm_admin"), updateLawFirmSettings);

// Logo management - accessible by law firm admins
router
  .route("/:id/logo")
  .post(
    authorize("law_firm_admin"),
    uploadLogo,
    handleUploadError,
    uploadLawFirmLogo
  )
  .delete(authorize("law_firm_admin"), removeLogo);

export default router;
