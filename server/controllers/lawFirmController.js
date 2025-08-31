import LawFirm from "../models/LawFirm.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { validateObjectId } from "../middleware/validation.js";
import emailService from "../utils/emailService.js";
import fs from "fs";
import path from "path";
import {
  uploadToCloud,
  deleteFromCloud,
  getPublicIdFromUrl,
} from "../utils/cloudinary.js";

/**
 * @desc    Get all law firms (with pagination, filtering, and sorting)
 * @route   GET /api/law-firms
 * @access  Private (system_owner)
 */
export const getLawFirms = async (req, res) => {
  try {
    console.log("🔍 Getting law firms with query params:", req.query);

    const {
      page = 1,
      limit = 10,
      search = "",
      subscriptionPlan,
      subscriptionStatus,
      isActive,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Build query
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { firmName: { $regex: search, $options: "i" } },
        { firmCode: { $regex: search, $options: "i" } },
        { firmEmail: { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } },
        { "address.state": { $regex: search, $options: "i" } },
      ];
    }

    // Filter by subscription plan if provided
    if (subscriptionPlan) {
      query["subscription.plan"] = subscriptionPlan;
    }

    // Filter by subscription status if provided
    if (subscriptionStatus) {
      query["subscription.status"] = subscriptionStatus;
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    console.log("🔍 Final query:", JSON.stringify(query));

    // Count total documents for pagination
    const total = await LawFirm.countDocuments(query);

    // Create sort object
    const sortObj = {};
    sortObj[sort] = order === "desc" ? -1 : 1;

    // Execute query with pagination and sorting
    const lawFirms = await LawFirm.find(query)
      .populate("createdBy", "firstName lastName email")
      .sort(sortObj)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    console.log(`✅ Found ${lawFirms.length} law firms`);

    res.status(200).json({
      success: true,
      data: {
        lawFirms,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting law firms:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving law firms",
      error: error.message,
    });
  }
};

/**
 * @desc    Get a specific law firm by ID
 * @route   GET /api/law-firms/:id
 * @access  Private (system_owner, law_firm_admin)
 */
export const getLawFirmById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 Getting law firm by ID:", id);

    // Validate object ID
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Find law firm
    const lawFirm = await LawFirm.findById(id).populate(
      "createdBy",
      "firstName lastName email"
    );

    // Check if law firm exists
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Check if user has access to this law firm
    if (
      req.user.role === "law_firm_admin" &&
      lawFirm._id.toString() !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    console.log("✅ Law firm found:", lawFirm.firmName);

    res.status(200).json({
      success: true,
      data: lawFirm,
    });
  } catch (error) {
    console.error("❌ Error getting law firm by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving law firm",
      error: error.message,
    });
  }
};

/**
 * @desc    Register a new law firm (public endpoint)
 * @route   POST /api/law-firms/register
 * @access  Public
 */
export const registerLawFirm = async (req, res) => {
  try {
    console.log("🏢 Registering new law firm");
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

    const {
      firmName,
      firmType,
      address,
      city,
      state,
      zipCode,
      country,
      phoneNumber,
      email,
      website,
      licenseNumber,
      plan,
      paymentStatus,
      paymentMethod,
      // Admin user data
      firstName,
      lastName,
      adminEmail,
      adminPhone,
      password,
    } = req.body;

    // Validate required fields
    if (
      !firmName ||
      !email ||
      !firstName ||
      !lastName ||
      !adminEmail ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: firmName, email, firstName, lastName, adminEmail, password",
        missing: {
          firmName: !firmName,
          email: !email,
          firstName: !firstName,
          lastName: !lastName,
          adminEmail: !adminEmail,
          password: !password,
        },
      });
    }

    // Validate plan and payment status
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Subscription plan is required",
      });
    }

    // Define plan configurations
    const planConfigs = {
      testing: {
        name: "Testing Package",
        price: 0,
        maxUsers: 3,
        maxCases: 50,
        features: ["basic_reporting", "email_support"],
        trialDays: 30,
        requiresPayment: false
      },
      basic: {
        name: "Basic",
        price: 99,
        maxUsers: 5,
        maxCases: 100,
        features: ["basic_reporting", "email_support", "standard_integrations"],
        trialDays: 0,
        requiresPayment: true
      },
      premium: {
        name: "Premium",
        price: 199,
        maxUsers: 25,
        maxCases: -1, // Unlimited
        features: ["advanced_analytics", "priority_support", "custom_integrations", "api_access"],
        trialDays: 0,
        requiresPayment: true
      },
      enterprise: {
        name: "Enterprise",
        price: "Custom",
        maxUsers: -1, // Unlimited
        maxCases: -1, // Unlimited
        features: ["custom_features", "dedicated_support", "on_premise_option", "white_label"],
        trialDays: 0,
        requiresPayment: true
      }
    };

    const selectedPlanConfig = planConfigs[plan];
    if (!selectedPlanConfig) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan selected",
      });
    }

    // Check payment requirements
    if (selectedPlanConfig.requiresPayment) {
      if (paymentStatus !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Payment is required for the selected plan. Please complete payment before proceeding.",
        });
      }
      
      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message: "Payment method is required for paid plans",
        });
      }
    }

    // Check if firm name already exists
    const existingFirm = await LawFirm.findOne({ firmName });
    if (existingFirm) {
      return res.status(400).json({
        success: false,
        message: "A law firm with this name already exists",
      });
    }

    // Check if firm email already exists
    const existingEmail = await LawFirm.findOne({ firmEmail: email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "A law firm with this email already exists",
      });
    }

    // Check if admin email already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "An account with this admin email already exists",
      });
    }

    // Calculate subscription dates
    const now = new Date();
    const trialEndsAt = selectedPlanConfig.trialDays > 0 
      ? new Date(now.getTime() + selectedPlanConfig.trialDays * 24 * 60 * 60 * 1000)
      : null;

    // Create new law firm
    const lawFirm = new LawFirm({
      firmName,
      firmType,
      firmEmail: email,
      firmPhone: phoneNumber,
      address: {
        street: address,
        city,
        state,
        zipCode,
        country,
      },
      website,
      licenseNumber,
      password: password || "LawFirm123!@#", // Set default password
      subscription: {
        plan: plan,
        planName: selectedPlanConfig.name,
        status: selectedPlanConfig.requiresPayment ? "active" : "trial",
        startDate: now,
        trialEndsAt: trialEndsAt,
        maxUsers: selectedPlanConfig.maxUsers,
        maxCases: selectedPlanConfig.maxCases,
        features: selectedPlanConfig.features,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        lastPaymentDate: selectedPlanConfig.requiresPayment ? now : null,
        nextPaymentDate: selectedPlanConfig.requiresPayment 
          ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          : null
      },
      settings: {
        escalationFees: {
          caseFilingFee: 5000,
          escalationFee: 2000,
        },
        notifications: {
          email: true,
          sms: true,
          inApp: true,
        },
      },
      isActive: true, // Active by default for immediate access
      registrationStatus: "approved", // Approved by default
      createdBy: null, // Will be set after system owner approval
    });

    const savedLawFirm = await lawFirm.save();

    // Create admin user
    const adminUser = new User({
      firstName,
      lastName,
      email: adminEmail,
      phoneNumber: adminPhone,
      password,
      role: "law_firm_admin",
      lawFirm: savedLawFirm._id,
      isActive: true, // Active by default for immediate access
    });

    const savedAdmin = await adminUser.save();

    // Send welcome email
    try {
      await emailService.sendLawFirmRegistrationEmail({
        to: adminEmail,
        firmName,
        adminName: `${firstName} ${lastName}`,
        plan: selectedPlanConfig.name,
        trialDays: selectedPlanConfig.trialDays,
        requiresPayment: selectedPlanConfig.requiresPayment
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the registration if email fails
    }

    console.log("✅ Law firm registered successfully:", savedLawFirm.firmName);
    console.log("📊 Plan details:", {
      plan: plan,
      planName: selectedPlanConfig.name,
      requiresPayment: selectedPlanConfig.requiresPayment,
      paymentStatus: paymentStatus,
      trialDays: selectedPlanConfig.trialDays
    });

    res.status(201).json({
      success: true,
      message: selectedPlanConfig.requiresPayment
        ? "Law firm registered successfully! Your account is now active and ready to use."
        : `Law firm registered successfully! You have ${selectedPlanConfig.trialDays} days free trial.`,
      data: {
        lawFirm: savedLawFirm,
        admin: {
          id: savedAdmin._id,
          email: savedAdmin.email,
          name: `${savedAdmin.firstName} ${savedAdmin.lastName}`,
        },
        subscription: {
          plan: plan,
          planName: selectedPlanConfig.name,
          status: selectedPlanConfig.requiresPayment ? "active" : "trial",
          trialDays: selectedPlanConfig.trialDays,
          requiresPayment: selectedPlanConfig.requiresPayment
        }
      },
    });
  } catch (error) {
    console.error("❌ Error registering law firm:", error);
    res.status(500).json({
      success: false,
      message: "Server error while registering law firm",
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new law firm
 * @route   POST /api/law-firms
 * @access  Private (system_owner)
 */
export const createLawFirm = async (req, res) => {
  try {
    console.log("➕ Creating new law firm");

    const {
      firmName,
      firmEmail,
      firmPhone,
      address,
      subscription,
      settings,
      password,
    } = req.body;

    // Check if firm name already exists
    const existingFirm = await LawFirm.findOne({ firmName });
    if (existingFirm) {
      return res.status(400).json({
        success: false,
        message: "A law firm with this name already exists",
      });
    }

    // Check if firm email already exists
    const existingEmail = await LawFirm.findOne({ firmEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "A law firm with this email already exists",
      });
    }

    // Generate default password if not provided
    const defaultPassword = password || "LawFirm123!@#";

    // Create new law firm
    const lawFirm = new LawFirm({
      firmName,
      firmEmail,
      firmPhone,
      address,
      password: defaultPassword,
      loginEmail: `254${firmEmail}`, // Generate 254-prefixed login email
      subscription: {
        ...subscription,
        startDate: new Date(),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      },
      settings,
      createdBy: req.user._id,
    });

    await lawFirm.save();

    console.log("✅ Law firm created:", lawFirm.firmName);

    // Send welcome email with login credentials
    try {
      await emailService.sendLawFirmWelcomeEmail({
        to: lawFirm.firmEmail,
        firmName: lawFirm.firmName,
        loginEmail: lawFirm.loginEmail,
        password: defaultPassword,
        firmCode: lawFirm.firmCode,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: "Law firm created successfully",
      data: {
        ...lawFirm.toObject(),
        password: undefined, // Don't send password in response
        loginCredentials: {
          email: lawFirm.firmEmail,
          loginEmail: lawFirm.loginEmail,
          password: defaultPassword,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error creating law firm:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating law firm",
      error: error.message,
    });
  }
};

/**
 * @desc    Update a law firm
 * @route   PUT /api/law-firms/:id
 * @access  Private (system_owner, law_firm_admin)
 */
export const updateLawFirm = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔄 Updating law firm:", id);

    // Validate object ID
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    const {
      firmName,
      firmEmail,
      firmPhone,
      address,
      subscription,
      settings,
      isActive,
    } = req.body;

    // Find law firm
    const lawFirm = await LawFirm.findById(id);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Check if user has access to update this law firm
    if (
      req.user.role === "law_firm_admin" &&
      lawFirm._id.toString() !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to update law firm",
      });
    }

    // Check for duplicate firm name if it's being changed
    if (firmName && firmName !== lawFirm.firmName) {
      const existingFirm = await LawFirm.findOne({ firmName });
      if (existingFirm) {
        return res.status(400).json({
          success: false,
          message: "A law firm with this name already exists",
        });
      }
    }

    // Check for duplicate firm email if it's being changed
    if (firmEmail && firmEmail !== lawFirm.firmEmail) {
      const existingEmail = await LawFirm.findOne({ firmEmail });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "A law firm with this email already exists",
        });
      }
    }

    // Update law firm
    const updatedLawFirm = await LawFirm.findByIdAndUpdate(
      id,
      {
        firmName,
        firmEmail,
        firmPhone,
        address,
        subscription,
        settings,
        isActive,
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName email");

    console.log("✅ Law firm updated:", updatedLawFirm.firmName);

    res.status(200).json({
      success: true,
      message: "Law firm updated successfully",
      data: updatedLawFirm,
    });
  } catch (error) {
    console.error("❌ Error updating law firm:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating law firm",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a law firm
 * @route   DELETE /api/law-firms/:id
 * @access  Private (system_owner)
 */
export const deleteLawFirm = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting law firm:", id);

    // Validate object ID
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Find law firm
    const lawFirm = await LawFirm.findById(id);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Check if law firm has active users
    const activeUsers = await User.countDocuments({
      lawFirm: id,
      isActive: true,
    });

    if (activeUsers > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete law firm with ${activeUsers} active users. Please deactivate users first.`,
      });
    }

    // Check if law firm has departments
    const departments = await Department.countDocuments({ lawFirm: id });
    if (departments > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete law firm with ${departments} departments. Please delete departments first.`,
      });
    }

    // Delete law firm
    await LawFirm.findByIdAndDelete(id);

    console.log("✅ Law firm deleted:", lawFirm.firmName);

    res.status(200).json({
      success: true,
      message: "Law firm deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting law firm:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting law firm",
      error: error.message,
    });
  }
};

/**
 * @desc    Get law firm statistics
 * @route   GET /api/law-firms/:id/stats
 * @access  Private (system_owner, law_firm_admin)
 */
export const getLawFirmStats = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📊 Getting law firm stats:", id);

    // Validate object ID
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Find law firm
    const lawFirm = await LawFirm.findById(id);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Check if user has access to this law firm
    if (
      req.user.role === "law_firm_admin" &&
      lawFirm._id.toString() !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    // Get user statistics
    const totalUsers = await User.countDocuments({ lawFirm: id });
    const activeUsers = await User.countDocuments({
      lawFirm: id,
      isActive: true,
    });
    const inactiveUsers = totalUsers - activeUsers;

    // Get users by role
    const usersByRole = await User.aggregate([
      { $match: { lawFirm: lawFirm._id } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    // Get department statistics
    const totalDepartments = await Department.countDocuments({ lawFirm: id });
    const departmentsByType = await Department.aggregate([
      { $match: { lawFirm: lawFirm._id } },
      { $group: { _id: "$departmentType", count: { $sum: 1 } } },
    ]);

    // Calculate subscription days remaining
    const now = new Date();
    const trialEndsAt = new Date(lawFirm.subscription.trialEndsAt);
    const daysRemaining = Math.ceil(
      (trialEndsAt - now) / (1000 * 60 * 60 * 24)
    );

    const stats = {
      firmInfo: {
        firmName: lawFirm.firmName,
        firmCode: lawFirm.firmCode,
        subscriptionPlan: lawFirm.subscription.plan,
        subscriptionStatus: lawFirm.subscription.status,
        trialDaysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: usersByRole,
      },
      departments: {
        total: totalDepartments,
        byType: departmentsByType,
      },
    };

    console.log("✅ Law firm stats retrieved");

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error getting law firm stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving law firm statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Update law firm subscription
 * @route   PUT /api/law-firms/:id/subscription
 * @access  Private (system_owner)
 */
export const updateLawFirmSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, status, endDate } = req.body;
    console.log("💳 Updating law firm subscription:", id);

    // Validate object ID
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Find law firm
    const lawFirm = await LawFirm.findById(id);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Update subscription
    const updatedLawFirm = await LawFirm.findByIdAndUpdate(
      id,
      {
        "subscription.plan": plan,
        "subscription.status": status,
        "subscription.endDate": endDate,
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName email");

    console.log("✅ Law firm subscription updated");

    res.status(200).json({
      success: true,
      message: "Law firm subscription updated successfully",
      data: updatedLawFirm,
    });
  } catch (error) {
    console.error("❌ Error updating law firm subscription:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating law firm subscription",
      error: error.message,
    });
  }
};

/**
 * @desc    Get law firm settings
 * @route   GET /api/law-firms/:id/settings
 * @access  Private (law_firm_admin)
 */
export const getLawFirmSettings = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("⚙️ Getting law firm settings:", id);

    // Validate object ID
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Find law firm
    const lawFirm = await LawFirm.findById(id).select("settings");
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Check if user has access to this law firm
    if (
      req.user.role === "law_firm_admin" &&
      lawFirm._id.toString() !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    console.log("✅ Law firm settings retrieved");

    res.status(200).json({
      success: true,
      data: lawFirm.settings,
    });
  } catch (error) {
    console.error("❌ Error getting law firm settings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving law firm settings",
      error: error.message,
    });
  }
};

/**
 * @desc    Update law firm settings
 * @route   PUT /api/law-firms/:id/settings
 * @access  Private (law_firm_admin)
 */
export const updateLawFirmSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { settings } = req.body;
    console.log("⚙️ Updating law firm settings:", id);

    // Validate object ID
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Find law firm
    const lawFirm = await LawFirm.findById(id);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Check if user has access to update this law firm
    if (
      req.user.role === "law_firm_admin" &&
      lawFirm._id.toString() !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to update law firm",
      });
    }

    // Update settings
    const updatedLawFirm = await LawFirm.findByIdAndUpdate(
      id,
      { settings },
      { new: true, runValidators: true }
    );

    console.log("✅ Law firm settings updated");

    res.status(200).json({
      success: true,
      message: "Law firm settings updated successfully",
      data: updatedLawFirm.settings,
    });
  } catch (error) {
    console.error("❌ Error updating law firm settings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating law firm settings",
      error: error.message,
    });
  }
};

/**
 * @desc    Upload law firm logo
 * @route   POST /api/law-firms/:id/logo
 * @access  Private (law_firm_admin)
 */
export const uploadLawFirmLogo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      req.user.role === "law_firm_admin" &&
      id !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    const lawFirm = await LawFirm.findById(id);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No logo file uploaded",
      });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only JPEG, PNG, and GIF are allowed",
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 5MB",
      });
    }

    // Delete old logo from Cloudinary if exists
    if (lawFirm.logo) {
      try {
        const publicId = getPublicIdFromUrl(lawFirm.logo);
        if (publicId) {
          await deleteFromCloud(publicId);
          console.log("🗑️ Previous logo deleted from Cloudinary");
        }
      } catch (cloudError) {
        console.error(
          "❌ Error deleting previous logo from Cloudinary:",
          cloudError
        );
        // Continue with upload even if deletion fails
      }
    }

    // Upload new logo to Cloudinary
    const uploadResult = await uploadToCloud(req.file.buffer, "logos");

    console.log("☁️ Logo uploaded to Cloudinary:", uploadResult.secure_url);

    // Update law firm with new logo URL
    lawFirm.logo = uploadResult.secure_url;
    await lawFirm.save();

    res.status(200).json({
      success: true,
      message: "Logo uploaded successfully",
      data: {
        logoUrl: uploadResult.secure_url,
        lawFirm: {
          _id: lawFirm._id,
          firmName: lawFirm.firmName,
          logo: lawFirm.logo,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error uploading logo:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading logo",
      error: error.message,
    });
  }
};

/**
 * @desc    Remove law firm logo
 * @route   DELETE /api/law-firms/:id/logo
 * @access  Private (law_firm_admin)
 */
export const removeLogo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      req.user.role === "law_firm_admin" &&
      id !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    const lawFirm = await LawFirm.findById(id);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Remove old logo from Cloudinary if it exists
    if (lawFirm.logo) {
      try {
        const publicId = getPublicIdFromUrl(lawFirm.logo);
        if (publicId) {
          await deleteFromCloud(publicId);
          console.log("🗑️ Logo deleted from Cloudinary");
        }
      } catch (cloudError) {
        console.error("❌ Error deleting logo from Cloudinary:", cloudError);
        // Continue with removal even if deletion fails
      }
    }

    // Clear logo URL
    lawFirm.logo = null;
    await lawFirm.save();

    res.status(200).json({
      success: true,
      message: "Logo removed successfully",
      data: {
        lawFirm: {
          _id: lawFirm._id,
          firmName: lawFirm.firmName,
          logo: lawFirm.logo,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error removing logo:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing logo",
      error: error.message,
    });
  }
};

/**
 * @desc    Verify payment for law firm registration
 * @route   POST /api/law-firms/verify-payment
 * @access  Public
 */
export const verifyPayment = async (req, res) => {
  try {
    console.log("💳 Verifying payment for law firm registration");
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

    const { paymentMethod, amount, transactionId, phoneNumber } = req.body;

    // Validate required fields
    if (!paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: "Payment method and amount are required",
      });
    }

    // Simulate payment verification (in real implementation, integrate with payment gateway)
    let paymentStatus = "pending";
    let verificationMessage = "";

    switch (paymentMethod) {
      case "mpesa":
        // Simulate M-Pesa verification
        if (transactionId && phoneNumber) {
          // In real implementation, verify with M-Pesa API
          paymentStatus = "completed";
          verificationMessage = "M-Pesa payment verified successfully";
        } else {
          paymentStatus = "failed";
          verificationMessage = "M-Pesa verification failed - missing transaction details";
        }
        break;

      case "card":
        // Simulate card payment verification
        paymentStatus = "completed";
        verificationMessage = "Card payment verified successfully";
        break;

      case "bank":
        // Simulate bank transfer verification
        if (transactionId) {
          paymentStatus = "completed";
          verificationMessage = "Bank transfer verified successfully";
        } else {
          paymentStatus = "failed";
          verificationMessage = "Bank transfer verification failed - missing reference";
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        });
    }

    console.log("✅ Payment verification result:", {
      paymentMethod,
      amount,
      status: paymentStatus,
      message: verificationMessage
    });

    res.status(200).json({
      success: true,
      message: verificationMessage,
      data: {
        paymentStatus,
        paymentMethod,
        amount,
        transactionId,
        verifiedAt: new Date(),
        verificationMessage
      },
    });

  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying payment",
      error: error.message,
    });
  }
};
