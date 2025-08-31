import { LawFirm, User, SystemOwner } from "../models/index.js";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "../utils/responseUtils.js";
import { generatePassword } from "../utils/generatePassword.js";
import emailService from "../utils/emailService.js";
import CreditCase from "../models/CreditCase.js";
import LegalCase from "../models/LegalCase.js";

// @desc    Get all law firms
// @route   GET /api/system-owner/law-firms
// @access  Private (System Owner only)
export const getLawFirms = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    if (req.query.search) {
      query.$or = [
        { firmName: { $regex: req.query.search, $options: "i" } },
        { firmEmail: { $regex: req.query.search, $options: "i" } },
        { firmCode: { $regex: req.query.search, $options: "i" } },
      ];
    }

    if (req.query.status) {
      query["subscription.status"] = req.query.status;
    }

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === "true";
    }

    const lawFirms = await LawFirm.find(query)
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await LawFirm.countDocuments(query);

    paginatedResponse(
      res,
      lawFirms,
      totalCount,
      page,
      limit,
      "Law firms retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create new law firm
// @route   POST /api/system-owner/law-firms
// @access  Private (System Owner only)
export const createLawFirm = async (req, res, next) => {
  try {
    const { firmName, firmEmail, firmPhone, address, subscription, adminUser } =
      req.body;

    // Check if law firm already exists
    const existingFirm = await LawFirm.findOne({
      $or: [
        { firmName: { $regex: new RegExp(`^${firmName}$`, "i") } },
        { firmEmail: firmEmail.toLowerCase() },
      ],
    });

    if (existingFirm) {
      return errorResponse(
        res,
        "Law firm with this name or email already exists",
        400
      );
    }

    // Create law firm
    const lawFirm = await LawFirm.create({
      firmName,
      firmEmail: firmEmail.toLowerCase(),
      firmPhone,
      address,
      subscription,
      createdBy: req.user._id,
    });

    // Create admin user for the law firm
    const temporaryPassword = generatePassword();

    const admin = await User.create({
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      email: adminUser.email.toLowerCase(),
      password: temporaryPassword,
      role: "law_firm_admin",
      lawFirm: lawFirm._id,
      phoneNumber: adminUser.phoneNumber,
      address: adminUser.address,
      createdBy: req.user._id,
    });

    // Send welcome email to admin
    try {
      await emailService.sendWelcomeEmail(admin, temporaryPassword, lawFirm);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the entire operation if email fails
    }

    // Populate the created law firm
    const populatedLawFirm = await LawFirm.findById(lawFirm._id).populate(
      "createdBy",
      "firstName lastName email"
    );

    successResponse(
      res,
      {
        lawFirm: populatedLawFirm,
        admin: {
          _id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role,
        },
      },
      "Law firm created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single law firm
// @route   GET /api/system-owner/law-firms/:id
// @access  Private (System Owner only)
export const getLawFirm = async (req, res, next) => {
  try {
    const lawFirm = await LawFirm.findById(req.params.id).populate(
      "createdBy",
      "firstName lastName email"
    );

    if (!lawFirm) {
      return errorResponse(res, "Law firm not found", 404);
    }

    // Get law firm statistics
    const stats = await Promise.all([
      User.countDocuments({ lawFirm: lawFirm._id, isActive: true }),
      User.countDocuments({ lawFirm: lawFirm._id, role: "law_firm_admin" }),
      // Add more stats as needed
    ]);

    successResponse(
      res,
      {
        lawFirm,
        stats: {
          totalUsers: stats[0],
          admins: stats[1],
        },
      },
      "Law firm retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update law firm
// @route   PUT /api/system-owner/law-firms/:id
// @access  Private (System Owner only)
export const updateLawFirm = async (req, res, next) => {
  try {
    const {
      firmName,
      firmEmail,
      firmPhone,
      address,
      subscription,
      settings,
      isActive,
    } = req.body;

    const lawFirm = await LawFirm.findById(req.params.id);

    if (!lawFirm) {
      return errorResponse(res, "Law firm not found", 404);
    }

    // Check for duplicate name/email if being updated
    if (firmName || firmEmail) {
      const query = { _id: { $ne: lawFirm._id } };

      if (firmName) {
        query.firmName = { $regex: new RegExp(`^${firmName}$`, "i") };
      }

      if (firmEmail) {
        query.firmEmail = firmEmail.toLowerCase();
      }

      const existingFirm = await LawFirm.findOne(query);
      if (existingFirm) {
        return errorResponse(
          res,
          "Law firm with this name or email already exists",
          400
        );
      }
    }

    // Update fields
    const updateData = {};
    if (firmName) updateData.firmName = firmName;
    if (firmEmail) updateData.firmEmail = firmEmail.toLowerCase();
    if (firmPhone) updateData.firmPhone = firmPhone;
    if (address) updateData.address = address;
    if (subscription)
      updateData.subscription = { ...lawFirm.subscription, ...subscription };
    if (settings) updateData.settings = { ...lawFirm.settings, ...settings };
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedLawFirm = await LawFirm.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName email");

    successResponse(res, updatedLawFirm, "Law firm updated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Delete law firm
// @route   DELETE /api/system-owner/law-firms/:id
// @access  Private (System Owner only)
export const deleteLawFirm = async (req, res, next) => {
  try {
    const lawFirm = await LawFirm.findById(req.params.id);

    if (!lawFirm) {
      return errorResponse(res, "Law firm not found", 404);
    }

    // Soft delete - deactivate instead of removing
    lawFirm.isActive = false;
    await lawFirm.save();

    // Also deactivate all users
    await User.updateMany({ lawFirm: lawFirm._id }, { isActive: false });

    successResponse(res, null, "Law firm deactivated successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Get system analytics
// @route   GET /api/system-owner/analytics
// @access  Private (System Owner only)
export const getSystemAnalytics = async (req, res, next) => {
  try {
    const analytics = await Promise.all([
      LawFirm.countDocuments({ isActive: true }),
      LawFirm.countDocuments({ isActive: false }),
      User.countDocuments({ role: { $ne: "system_owner" }, isActive: true }),
      LawFirm.countDocuments({ "subscription.status": "trial" }),
      LawFirm.countDocuments({ "subscription.status": "active" }),
    ]);

    const [
      activeLawFirms,
      inactiveLawFirms,
      totalUsers,
      trialFirms,
      subscribedFirms,
    ] = analytics;

    // Get recent law firms
    const recentLawFirms = await LawFirm.find({ isActive: true })
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firmName firmEmail createdAt subscription.status");

    successResponse(
      res,
      {
        overview: {
          activeLawFirms,
          inactiveLawFirms,
          totalUsers,
          trialFirms,
          subscribedFirms,
        },
        recentLawFirms,
      },
      "System analytics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get system health
// @route   GET /api/system-owner/system-health
// @access  Private (System Owner only)
export const getSystemHealth = async (req, res, next) => {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        email: "configured",
        storage: "available",
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || "1.0.0",
    };

    successResponse(res, health, "System health retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    // Total law firms
    const totalLawFirms = await LawFirm.countDocuments();
    // Total users
    const totalUsers = await User.countDocuments();
    // Total credit cases
    const totalCreditCases = await CreditCase.countDocuments();
    // Total legal cases
    const totalLegalCases = await LegalCase.countDocuments();
    // Active subscriptions
    const activeSubscriptions = await LawFirm.countDocuments({
      "subscription.status": "active",
    });
    // Revenue (mocked for now)
    const revenue = 24500;

    // Law firm signups over time (mocked for now)
    const signupsOverTime = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      data: [2, 3, 1, 2, 1, 2, 1],
    };

    // Subscription plan distribution
    const plans = ["basic", "premium", "enterprise"];
    const planCounts = await Promise.all(
      plans.map((plan) => LawFirm.countDocuments({ "subscription.plan": plan }))
    );
    const subscriptionPlans = {
      labels: plans.map((p) => p.charAt(0).toUpperCase() + p.slice(1)),
      data: planCounts,
    };

    res.json({
      totalLawFirms,
      totalUsers,
      totalCreditCases,
      totalLegalCases,
      activeSubscriptions,
      revenue,
      signupsOverTime,
      subscriptionPlans,
    });
  } catch (error) {
    next(error);
  }
};
