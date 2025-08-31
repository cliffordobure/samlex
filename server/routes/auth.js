import express from "express";
import { body } from "express-validator";
import {
  login,
  registerUser,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  verifyTenant,
} from "../controllers/authController.js";
import { protect, tenantIsolation } from "../middleware/auth.js";
import {
  authLimiter,
  passwordResetLimiter,
} from "../middleware/rateLimiter.js";
import {
  handleValidationErrors,
  validateEmail,
  validatePassword,
} from "../middleware/validation.js";

const router = express.Router();

// Public routes
router.post(
  "/login",
  authLimiter,
  [
    validateEmail,
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],
  login
);

router.post(
  "/register",
  [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    validateEmail,
    validatePassword,
    handleValidationErrors,
  ],
  registerUser
);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  [validateEmail, handleValidationErrors],
  forgotPassword
);

router.put(
  "/reset-password/:resettoken",
  [handleValidationErrors],
  resetPassword
);

// Protected routes
router.use(protect);

router.get("/me", getMe);

router.put(
  "/profile",
  [
    body("firstName").optional().trim().isLength({ min: 2, max: 50 }),
    body("lastName").optional().trim().isLength({ min: 2, max: 50 }),
    body("phoneNumber").optional().isMobilePhone(),
    handleValidationErrors,
  ],
  updateProfile
);

router.put(
  "/change-password",
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    validatePassword.withMessage(
      "New password must meet security requirements"
    ),
    handleValidationErrors,
  ],
  changePassword
);

router.post(
  "/verify-tenant",
  tenantIsolation,
  [
    body("lawFirmCode").optional().isLength({ min: 3, max: 10 }),
    handleValidationErrors,
  ],
  verifyTenant
);

export default router;
