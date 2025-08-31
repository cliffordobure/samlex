import crypto from "crypto";
import { SystemOwner, User, LawFirm } from "../models/index.js";
import { getSignedJwtToken } from "../middleware/auth.js";
import { successResponse, errorResponse } from "../utils/responseUtils.js";
import emailService from "../utils/emailService.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role, lawFirm } =
      req.body;

    console.log("👤 Registering new user:", email);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, "User with this email already exists", 400);
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role: role || "user",
      lawFirm,
      isActive: false, // Will be activated after verification
    });

    await user.save();

    // Remove password from response
    user.password = undefined;

    console.log("✅ User registered successfully:", email);

    successResponse(
      res,
      { user },
      "User registered successfully. Please complete verification to activate your account."
    );
  } catch (error) {
    console.error("❌ User registration error:", error);
    next(error);
  }
};

// @desc    Login user (System Owner, Regular User, or Law Firm)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for email:", email);

    // Validate email and password
    if (!email || !password) {
      return errorResponse(res, "Please provide email and password", 400);
    }

    let user = null;
    let userType = null;

    // Check for system owner first
    user = await SystemOwner.findOne({ email }).select("+password");
    if (user) {
      userType = "system_owner";
      console.log("✅ Found system owner:", user.email);
      // Ensure system owner has role field
      if (!user.role) {
        user.role = "system_owner";
      }
    }

    // Check regular users next (before law firms)
    if (!user) {
      user = await User.findOne({ email })
        .select("+password")
        .populate("lawFirm")
        .populate("department");
      if (user) {
        console.log("✅ Found user:", user.email, "Role:", user.role);
        // Set userType based on the actual role, not just that they're a User
        userType = user.role || "user";
        // Ensure user has role field
        if (!user.role) {
          user.role = "user";
          userType = "user";
        }
      }
    }

    // If not user, check law firms (including 254 prefix)
    if (!user) {
      user = await LawFirm.findOne({
        $or: [{ firmEmail: email }, { loginEmail: email }],
      }).select("+password");
      if (user) {
        userType = "law_firm";
        console.log("✅ Found law firm:", user.firmName);
        // Ensure law firm has role field
        if (!user.role) {
          user.role = "law_firm";
        }
      }
    }

    if (!user) {
      console.log("❌ No user found with email:", email);
      return errorResponse(res, "Invalid credentials", 401);
    }

    console.log("🔍 User found, checking password...");

    // Check if account is active
    if (!user.isActive) {
      console.log("❌ User account is inactive:", user.email);
      return errorResponse(res, "Account has been deactivated", 401);
    }

    // Check if law firm is active (for regular users and law firms)
    if (userType === "user" && user.lawFirm && !user.lawFirm.isActive) {
      console.log("❌ Law firm is inactive for user:", user.email);
      return errorResponse(res, "Law firm account has been suspended", 401);
    }

    if (userType === "law_firm" && !user.isActive) {
      console.log("❌ Law firm account is inactive:", user.firmName);
      return errorResponse(res, "Law firm account has been suspended", 401);
    }

    // Check password
    console.log("🔐 [DEBUG] ===== LOGIN AUTHENTICATION DEBUG =====");
    console.log("🔐 [DEBUG] Login attempt for email:", email);
    console.log("🔐 [DEBUG] Input password:", password);
    console.log("🔐 [DEBUG] Input password length:", password.length);
    console.log("🔐 [DEBUG] User found:", user.email);
    console.log("🔐 [DEBUG] User role:", user.role);
    console.log("🔐 [DEBUG] User active:", user.isActive);
    console.log("🔐 [DEBUG] Password field selected:", !!user.password);
    console.log("🔐 [DEBUG] Stored password hash:", user.password);
    console.log(
      "🔐 [DEBUG] Stored password hash length:",
      user.password ? user.password.length : "N/A"
    );
    console.log("🔐 [DEBUG] ===== END LOGIN AUTHENTICATION DEBUG =====");

    const isPasswordValid = await user.comparePassword(password);
    console.log("🔐 Password comparison result:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ Invalid password for user:", user.email);
      return errorResponse(res, "Invalid credentials", 401);
    }

    console.log("✅ Password is valid, generating token...");

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = getSignedJwtToken(user);

    // Remove password from response
    user.password = undefined;

    console.log("✅ Login successful for:", user.email);

    successResponse(
      res,
      {
        token,
        user,
        userType,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("❌ Login error:", error);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  console.log("Fetching user data for:", req.user._id);
  try {
    let user;

    if (req.user.role === "system_owner") {
      user = await SystemOwner.findById(req.user._id);
    } else if (req.user.role === "law_firm") {
      user = await LawFirm.findById(req.user._id);
    } else {
      user = await User.findById(req.user._id)
        .populate("lawFirm")
        .populate("department");
    }

    successResponse(res, user, "User data retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, address } = req.body;

    const fieldsToUpdate = {
      firstName,
      lastName,
      phoneNumber,
      address,
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    let user;
    if (req.user.role === "system_owner") {
      user = await SystemOwner.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
        new: true,
        runValidators: true,
      });
    } else {
      user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
        new: true,
        runValidators: true,
      })
        .populate("lawFirm")
        .populate("department");
    }

    successResponse(res, user, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, "Please provide current and new password", 400);
    }

    // Get user with password
    let user;
    if (req.user.role === "system_owner") {
      user = await SystemOwner.findById(req.user._id).select("+password");
    } else {
      user = await User.findById(req.user._id).select("+password");
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return errorResponse(res, "Current password is incorrect", 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    successResponse(res, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, "Please provide email address", 400);
    }

    // Find user
    let user = await SystemOwner.findOne({ email });
    let userType = "system_owner";

    if (!user) {
      user = await User.findOne({ email });
      userType = "user";
    }

    if (!user) {
      return errorResponse(res, "No user found with that email address", 404);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire time (1 hour)
    const resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    // Save hashed token and expiry
    user.passwordResetToken = resetPasswordToken;
    user.passwordResetExpires = resetPasswordExpire;
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendPasswordResetEmail(user, resetToken);

      successResponse(res, null, "Password reset email sent");
    } catch (error) {
      console.error("Email sending failed:", error);

      // Clear reset fields if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return errorResponse(res, "Email could not be sent", 500);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const { resettoken } = req.params;

    if (!newPassword) {
      return errorResponse(res, "Please provide new password", 400);
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resettoken)
      .digest("hex");

    // Find user by token and check if token hasn't expired
    let user = await SystemOwner.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      user = await User.findOne({
        passwordResetToken: resetPasswordToken,
        passwordResetExpires: { $gt: Date.now() },
      });
    }

    if (!user) {
      return errorResponse(res, "Invalid or expired reset token", 400);
    }

    // Set new password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate token for immediate login
    const token = getSignedJwtToken(user);

    // Remove password from response
    user.password = undefined;

    successResponse(
      res,
      {
        token,
        user,
      },
      "Password reset successful"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can track logout events or invalidate tokens if needed

    successResponse(res, null, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Verify tenant access
// @route   POST /api/auth/verify-tenant
// @access  Private
export const verifyTenant = async (req, res, next) => {
  try {
    const { lawFirmCode } = req.body;

    if (req.user.role === "system_owner") {
      return successResponse(
        res,
        { hasAccess: true },
        "System owner has full access"
      );
    }

    if (!req.user.lawFirm) {
      return errorResponse(res, "User not associated with any law firm", 403);
    }

    if (
      lawFirmCode &&
      req.user.lawFirm.firmCode !== lawFirmCode.toUpperCase()
    ) {
      return errorResponse(res, "Access denied to this law firm", 403);
    }

    successResponse(
      res,
      {
        hasAccess: true,
        lawFirm: req.user.lawFirm,
      },
      "Tenant access verified"
    );
  } catch (error) {
    next(error);
  }
};
