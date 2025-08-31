// routes/userRoutes.js
import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getUsersByDepartment,
  updatePassword,
  updateProfile,
  uploadProfileImage,
  createLawFirmAdmin,
  deactivateUser,
  resetUserPassword,
  testPassword,
  testEmail,
} from "../controllers/userController.js";
import { protect, authorize, tenantIsolation } from "../middleware/auth.js";
import {
  uploadProfileImage as uploadProfileImageMiddleware,
  handleUploadError,
} from "../middleware/upload.js";

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(protect);
router.use(tenantIsolation);

// Test routes (system owner only)
router.post("/test-password", authorize("system_owner"), testPassword);
router.post("/test-email", authorize("system_owner"), testEmail);

// Routes accessible by law firm admins and system owners
router
  .route("/")
  .get(
    authorize(
      "law_firm_admin",
      "system_owner",
      "credit_head",
      "debt_collector",
      "legal_head"
    ),
    getUsers
  )
  .post(authorize("law_firm_admin", "system_owner"), createUser);

// Get users by role - accessible by law firm admins and department heads
router.get(
  "/by-role/:role",
  authorize("law_firm_admin", "system_owner", "credit_head", "legal_head"),
  getUsersByRole
);

// Get users by department - accessible by law firm admins and department heads
router.get(
  "/by-department/:departmentId",
  authorize("law_firm_admin", "system_owner", "credit_head", "legal_head"),
  getUsersByDepartment
);

// Routes for specific user operations
router
  .route("/:id")
  .get(authorize("law_firm_admin", "system_owner"), getUserById)
  .put(authorize("law_firm_admin", "system_owner"), updateUser)
  .delete(authorize("law_firm_admin", "system_owner"), deleteUser);

// Profile routes - users can update their own profile
router.put("/profile/update", updateProfile);
router.put("/profile/password", updatePassword);

// File upload route with error handling
router.post("/profile/image", uploadProfileImageMiddleware, handleUploadError);

router.post(
  "/create-law-firm-admin",
  protect,
  authorize("system_owner"),
  createLawFirmAdmin
);

router.patch(
  "/:id/deactivate",
  protect,
  authorize("law_firm_admin", "system_owner"),
  deactivateUser
);
router.post(
  "/:id/reset-password",
  protect,
  authorize("law_firm_admin", "system_owner"),
  resetUserPassword
);

export default router;
