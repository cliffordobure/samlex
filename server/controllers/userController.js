// controllers/userController.js
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";
import crypto from "crypto";
import mongoose from "mongoose";
import emailService from "../utils/emailService.js";
// import { validateObjectId } from "../utils/validation.js";
// import AppError from "../utils/appError.js";
import { uploadToCloud, deleteFromCloud } from "../utils/cloudinary.js";
import { generatePassword } from "../utils/generatePassword.js";

/**
 * @desc    Get all users (with pagination, filtering, and sorting)
 * @route   GET /api/users
 * @access  Private (law_firm_admin, system_owner)
 */
export const getUsers = async (req, res) => {
  try {
    console.log("🔍 Getting users with query params:", req.query);

    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      isActive,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Build query
    const query = {};

    // Only show users from the same law firm unless system_owner
    if (req.user.role !== "system_owner") {
      query.lawFirm = req.user.lawFirm._id;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    console.log("🔍 Final query:", JSON.stringify(query));

    // Count total documents for pagination
    const total = await User.countDocuments(query);

    // Create sort object
    const sortObj = {};
    sortObj[sort] = order === "desc" ? -1 : 1;

    // Execute query with pagination and sorting
    const users = await User.find(query)
      .select("-password")
      .populate("lawFirm", "name firmName")
      .populate("department", "name departmentType")
      .populate("createdBy", "firstName lastName")
      .sort(sortObj)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    console.log(`✅ Found ${users.length} users`);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving users",
      error: error.message,
    });
  }
};

/**
 * @desc    Get a specific user by ID
 * @route   GET /api/users/:id
 * @access  Private (law_firm_admin, system_owner)
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 Getting user by ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Find user
    const user = await User.findById(id)
      .select("-password")
      .populate("lawFirm", "name firmName")
      .populate("department", "name departmentType")
      .populate("createdBy", "firstName lastName");

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user belongs to same law firm (unless system_owner)
    if (
      req.user.role !== "system_owner" &&
      user.lawFirm._id.toString() !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to user from different law firm",
      });
    }

    console.log("✅ User found:", user.email);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ Error getting user by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving user",
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Private (law_firm_admin, system_owner)
 */
export const createUser = async (req, res) => {
  try {
    console.log("➕ Creating new user");

    const {
      firstName,
      lastName,
      email,
      role,
      lawFirmId,
      departmentId,
      permissions,
      phoneNumber,
      address,
    } = req.body;

    // Generate a random password
    const temporaryPassword = generatePassword();
    console.log("🔐 [DEBUG] ===== USER CREATION DEBUG =====");
    console.log("🔐 [DEBUG] Generated temporary password:", temporaryPassword);
    console.log(
      "🔐 [DEBUG] Generated password length:",
      temporaryPassword.length
    );
    console.log(
      "🔐 [DEBUG] Generated password type:",
      typeof temporaryPassword
    );
    console.log("🔐 [DEBUG] ===== END USER CREATION DEBUG =====");

    // Determine the law firm ID based on user role and request
    let userLawFirmId;

    if (req.user.role === "system_owner") {
      // System owner can specify any law firm
      userLawFirmId = lawFirmId;
    } else {
      // Law firm admin can only create users in their own law firm
      userLawFirmId = req.user.lawFirm._id;
    }

    if (!userLawFirmId) {
      return res.status(400).json({
        success: false,
        message: "Law firm ID is required",
      });
    }

    // Check if email already exists in the same law firm
    const existingUser = await User.findOne({
      email,
      lawFirm: userLawFirmId,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use within this law firm",
      });
    }

    // Get the law firm details for the welcome email
    const lawFirm = await LawFirm.findById(userLawFirmId);

    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    console.log("🏢 Creating user for law firm:", lawFirm.firmName);

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: temporaryPassword,
      role,
      lawFirm: userLawFirmId,
      department: departmentId,
      permissions,
      phoneNumber,
      address,
      createdBy: req.user._id,
    });

    console.log("✅ User created successfully:", user.email);
    console.log(
      "🔍 User details - ID:",
      user._id,
      "Role:",
      user.role,
      "Law Firm:",
      user.lawFirm
    );

    // Test password comparison immediately after creation
    try {
      const testUser = await User.findById(user._id).select("+password");
      const passwordTest = await testUser.comparePassword(temporaryPassword);
      console.log("🔐 Password test after creation:", passwordTest);
      if (!passwordTest) {
        console.error("❌ WARNING: Password test failed after user creation!");
      }
    } catch (testError) {
      console.error("❌ Error testing password after creation:", testError);
    }

    // Send welcome email with temporary password
    try {
      console.log(
        "📧 About to send welcome email to:",
        user.email,
        "with password:",
        temporaryPassword
      );

      // Test email service connection first
      const emailServiceReady = await emailService.verifyConnection();
      console.log("📧 Email service ready:", emailServiceReady);

      if (!emailServiceReady) {
        console.error("❌ Email service is not ready - skipping welcome email");
        throw new Error("Email service not ready");
      }

      await emailService.sendWelcomeEmail(user, temporaryPassword, lawFirm);
      console.log("📧 Welcome email sent successfully to:", user.email);
    } catch (emailError) {
      console.error("❌ Error sending welcome email:", emailError);
      console.error("❌ Email error details:", {
        message: emailError.message,
        stack: emailError.stack,
        userEmail: user.email,
        lawFirmName: lawFirm?.firmName,
      });
      // Continue with the user creation even if email fails
    }

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: "User created successfully and welcome email sent",
      data: user,
    });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating user",
      error: error.message,
    });
  }
};

/**
 * @desc    Update a user
 * @route   PUT /api/users/:id
 * @access  Private (law_firm_admin, system_owner)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔄 Updating user with ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Find user to update
    const user = await User.findById(id);

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Law firm admins can only update users in their own law firm
    if (
      req.user.role === "law_firm_admin" &&
      user.lawFirm.toString() !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update users in your own law firm",
      });
    }

    // Remove fields that should not be updated through this route
    const updateData = { ...req.body };
    delete updateData.password; // Password update has a separate route

    // Prevent changing law firm if not system_owner
    if (req.user.role !== "system_owner" && updateData.lawFirm) {
      delete updateData.lawFirm;
    }

    // If email is being updated, check if new email is already in use
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        lawFirm: user.lawFirm,
        _id: { $ne: id }, // Exclude current user
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use within this law firm",
        });
      }
    }

    console.log("🔄 Update data:", updateData);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    console.log("✅ User updated successfully:", updatedUser.email);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating user",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Private (law_firm_admin, system_owner)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("❌ Deleting user with ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Find user to delete
    const user = await User.findById(id);

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Law firm admins can only delete users in their own law firm
    if (
      req.user.role === "law_firm_admin" &&
      user.lawFirm.toString() !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete users in your own law firm",
      });
    }

    // Delete user's profile image from cloud storage if it exists
    if (user.profileImage) {
      try {
        await deleteFromCloud(user.profileImage);
        console.log("🖼️ User profile image deleted from cloud storage");
      } catch (cloudError) {
        console.error(
          "❌ Error deleting profile image from cloud:",
          cloudError
        );
        // Continue with user deletion even if image deletion fails
      }
    }

    // Delete user
    await User.findByIdAndDelete(id);

    console.log("✅ User deleted successfully:", user.email);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting user",
      error: error.message,
    });
  }
};

/**
 * @desc    Get users by role
 * @route   GET /api/users/by-role/:role
 * @access  Private (law_firm_admin, system_owner, department_heads)
 */
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    console.log("🔍 Getting users by role:", role);

    // Validate role
    const validRoles = [
      "law_firm_admin",
      "credit_head",
      "debt_collector",
      "legal_head",
      "advocate",
      "client",
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Build query
    const query = { role };

    // Restrict to same law firm unless system_owner
    if (req.user.role !== "system_owner") {
      query.lawFirm = req.user.lawFirm._id;
    }

    console.log("🔍 Role query:", JSON.stringify(query));

    const users = await User.find(query)
      .select("-password")
      .populate("lawFirm", "name firmName")
      .populate("department", "name departmentType");

    console.log(`✅ Found ${users.length} users with role: ${role}`);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("❌ Error getting users by role:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving users by role",
      error: error.message,
    });
  }
};

/**
 * @desc    Get users by department
 * @route   GET /api/users/by-department/:departmentId
 * @access  Private (law_firm_admin, system_owner, department_heads)
 */
export const getUsersByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    console.log("🔍 Getting users by department ID:", departmentId);

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID format",
      });
    }

    // Build query
    const query = { department: departmentId };

    // Restrict to same law firm unless system_owner
    if (req.user.role !== "system_owner") {
      query.lawFirm = req.user.lawFirm._id;
    }

    console.log("🔍 Department query:", JSON.stringify(query));

    const users = await User.find(query)
      .select("-password")
      .populate("lawFirm", "name firmName")
      .populate("department", "name departmentType");

    console.log(
      `✅ Found ${users.length} users in department: ${departmentId}`
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("❌ Error getting users by department:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving users by department",
      error: error.message,
    });
  }
};

/**
 * @desc    Update user profile (self)
 * @route   PUT /api/users/profile/update
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("🔄 User updating their own profile:", req.user.email);

    // Only allow specific fields to be updated
    const allowedFields = ["firstName", "lastName", "phoneNumber", "address"];

    const updateData = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    console.log("🔄 Profile update data:", updateData);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    console.log("✅ Profile updated successfully");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: error.message,
    });
  }
};

/**
 * @desc    Update user password (self)
 * @route   PUT /api/users/profile/password
 * @access  Private
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log("🔑 User changing password:", req.user.email);

    // Validate request body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log("✅ Password updated successfully");

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating password:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating password",
      error: error.message,
    });
  }
};

/**
 * @desc    Upload profile image
 * @route   POST /api/users/profile/image
 * @access  Private
 */
export const uploadProfileImage = async (req, res) => {
  try {
    console.log("🖼️ User uploading profile image:", req.user.email);

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    // Get user
    const user = await User.findById(req.user._id);

    // Delete old profile image if exists
    if (user.profileImage) {
      try {
        await deleteFromCloud(user.profileImage);
        console.log("🗑️ Previous profile image deleted");
      } catch (cloudError) {
        console.error("❌ Error deleting previous profile image:", cloudError);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new image
    const result = await uploadToCloud(req.file.buffer, "profiles");

    console.log("☁️ Image uploaded to cloud storage:", result.secure_url);

    // Update user profile
    user.profileImage = result.secure_url;
    await user.save();

    console.log("✅ Profile image updated successfully");

    res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      data: {
        profileImage: result.secure_url,
      },
    });
  } catch (error) {
    console.error("❌ Error uploading profile image:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading profile image",
      error: error.message,
    });
  }
};

export const createLawFirmAdmin = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, lawFirmId } = req.body;

    // Only system owner can create law firm admins
    if (req.user.role !== "system_owner") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Check if law firm exists
    const lawFirm = await LawFirm.findById(lawFirmId);
    if (!lawFirm) {
      return res.status(404).json({ message: "Law firm not found" });
    }

    // Check if email already exists for this law firm
    const existingUser = await User.findOne({ email, lawFirm: lawFirmId });
    if (existingUser) {
      return res.status(409).json({
        message: "User with this email already exists for this law firm",
      });
    }

    // Create the admin user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: "law_firm_admin",
      lawFirm: lawFirmId,
      isActive: true,
    });

    // Optionally, send a welcome email here

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deactivated", user });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newPassword = generatePassword();
    console.log("🔐 [DEBUG] ===== PASSWORD RESET DEBUG =====");
    console.log("🔐 [DEBUG] User email:", user.email);
    console.log("🔐 [DEBUG] Generated new password:", newPassword);
    console.log("🔐 [DEBUG] Generated password length:", newPassword.length);
    console.log("🔐 [DEBUG] Generated password type:", typeof newPassword);
    console.log("🔐 [DEBUG] ===== END PASSWORD RESET DEBUG =====");

    user.password = newPassword;
    await user.save();

    // Send email with new password
    if (user.email) {
      try {
        // Get law firm details for the email
        const lawFirm = await LawFirm.findById(user.lawFirm);

        // Test email service connection first
        const emailServiceReady = await emailService.verifyConnection();
        console.log(
          "📧 Email service ready for password reset:",
          emailServiceReady
        );

        if (!emailServiceReady) {
          console.error(
            "❌ Email service is not ready - skipping password reset email"
          );
          throw new Error("Email service not ready");
        }

        await emailService.sendWelcomeEmail(user, newPassword, lawFirm);
        console.log(
          "✅ Password reset email sent successfully to:",
          user.email
        );
      } catch (emailError) {
        console.error("❌ Error sending password reset email:", emailError);
        console.error("❌ Password reset email error details:", {
          message: emailError.message,
          stack: emailError.stack,
          userEmail: user.email,
          lawFirmId: user.lawFirm,
        });
        // Continue even if email fails
      }
    }

    res.json({
      success: true,
      message: "Password reset successfully",
      newPassword,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Test password functionality (for debugging)
 * @route   POST /api/users/test-password
 * @access  Private (system_owner only)
 */
export const testPassword = async (req, res) => {
  try {
    // Only allow system owner to test passwords
    if (req.user.role !== "system_owner") {
      return res.status(403).json({
        success: false,
        message: "Only system owner can test passwords",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Test password comparison
    const isPasswordValid = await user.comparePassword(password);

    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        passwordValid: isPasswordValid,
        userActive: user.isActive,
        lawFirmActive: user.lawFirm ? user.lawFirm.isActive : true,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Error testing password:", error);
    res.status(500).json({
      success: false,
      message: "Server error while testing password",
      error: error.message,
    });
  }
};

/**
 * @desc    Test email service (for debugging)
 * @route   POST /api/users/test-email
 * @access  Private (system_owner only)
 */
export const testEmail = async (req, res) => {
  try {
    // Only allow system owner to test emails
    if (req.user.role !== "system_owner") {
      return res.status(403).json({
        success: false,
        message: "Only system owner can test emails",
      });
    }

    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: "Test email address is required",
      });
    }

    console.log("🧪 Testing email service with:", testEmail);

    // Test email service connection
    const emailServiceReady = await emailService.verifyConnection();
    console.log("📧 Email service ready:", emailServiceReady);

    if (!emailServiceReady) {
      return res.status(500).json({
        success: false,
        message: "Email service is not ready",
        details: "Email configuration may be incorrect",
      });
    }

    // Send a test email
    const testUser = {
      firstName: "Test",
      lastName: "User",
      email: testEmail,
      role: "test",
    };

    const testLawFirm = {
      firmName: "Test Law Firm",
    };

    await emailService.sendWelcomeEmail(
      testUser,
      "TestPassword123!",
      testLawFirm
    );

    console.log("✅ Test email sent successfully to:", testEmail);

    res.status(200).json({
      success: true,
      message: "Test email sent successfully",
      data: {
        recipient: testEmail,
        emailServiceReady: true,
      },
    });
  } catch (error) {
    console.error("❌ Error testing email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message,
      details: {
        emailServiceReady: false,
        errorType: error.constructor.name,
      },
    });
  }
};
