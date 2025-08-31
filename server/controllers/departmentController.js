import Department from "../models/Department.js";
import asyncHandler from "express-async-handler";
import { generatePassword } from "../utils/generatePassword.js";
import CreditCase from "../models/CreditCase.js";
import LegalCase from "../models/LegalCase.js";
import User from "../models/User.js";

/**
 * @desc    Get all departments
 * @route   GET /api/departments
 * @access  Private
 */
const getDepartments = asyncHandler(async (req, res) => {
  try {
    let query = {};

    // For system owner, can filter by lawFirm if provided
    if (req.user.role === "system_owner") {
      if (req.query.lawFirm) {
        query.lawFirm = req.query.lawFirm;
      }
    } else {
      // For law firm users, only see departments from their law firm
      if (!req.user.lawFirm) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access departments",
        });
      }
      query.lawFirm = req.user.lawFirm._id;
    }

    // Filter by department type if provided
    if (
      req.query.departmentType &&
      ["credit_collection", "legal", "custom"].includes(
        req.query.departmentType
      )
    ) {
      query.departmentType = req.query.departmentType;
    }

    // Filter by active status if provided
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === "true";
    }

    const departments = await Department.find(query)
      .sort({ name: 1 })
      .populate("lawFirm", "name")
      .populate("createdBy", "firstName lastName email");

    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching departments",
      error: error.message,
    });
  }
});

/**
 * @desc    Get single department
 * @route   GET /api/departments/:id
 * @access  Private
 */
const getDepartmentById = asyncHandler(async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("lawFirm", "name")
      .populate("createdBy", "firstName lastName email");

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Check if user has access to this department
    if (
      req.user.role !== "system_owner" &&
      (!req.user.lawFirm ||
        department.lawFirm._id.toString() !== req.user.lawFirm._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this department",
      });
    }

    res.status(200).json({
      success: true,
      data: department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching department",
      error: error.message,
    });
  }
});

/**
 * @desc    Create new department
 * @route   POST /api/departments
 * @access  Private/Admin
 */

const createDepartment = asyncHandler(async (req, res) => {
  try {
    const { name, description, departmentType, settings } = req.body;

    let lawFirmId;

    // Determine which law firm to use
    if (req.user.role === "system_owner" && req.body.lawFirm) {
      lawFirmId = req.body.lawFirm;
    } else if (req.user.lawFirm) {
      lawFirmId = req.user.lawFirm._id;
    } else {
      return res.status(400).json({
        success: false,
        message: "Law firm ID is required",
      });
    }

    // Validate department type
    if (
      !departmentType ||
      !["credit_collection", "legal", "custom"].includes(departmentType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid department type is required (credit_collection, legal, or custom)",
      });
    }

    // Generate unique department code
    let departmentCode;
    let codeExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (codeExists && attempts < maxAttempts) {
      // Generate base code from department type
      const codeMap = {
        credit_collection: "CC",
        legal: "LG",
        custom: "CU",
      };
      const baseCode = codeMap[departmentType] || "DP";

      // Generate random suffix (6 characters, alphanumeric only)
      const randomSuffix = generatePassword(6)
        .replace(/[!@#$%^&*]/g, "") // Remove symbols
        .toUpperCase()
        .substring(0, 6);

      departmentCode = `${baseCode}-${randomSuffix}`;

      // Check if this code already exists
      const existingDepartment = await Department.findOne({
        code: departmentCode,
        lawFirm: lawFirmId,
      });

      codeExists = !!existingDepartment;
      attempts++;
    }

    if (codeExists) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to generate unique department code after multiple attempts",
      });
    }

    // Create department
    const department = await Department.create({
      name,
      code: departmentCode,
      description,
      departmentType,
      lawFirm: lawFirmId,
      settings: settings || undefined,
      createdBy: req.user._id,
    });
    return res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    // Handle validation errors
    console.error("Error creating department:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Department with this code already exists in this law firm",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating department",
      error: error.message,
    });
  }
});

/**
 * @desc    Update department
 * @route   PUT /api/departments/:id
 * @access  Private/Admin
 */
const updateDepartment = asyncHandler(async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Check if user has access to update this department
    if (
      req.user.role !== "system_owner" &&
      (!req.user.lawFirm ||
        department.lawFirm.toString() !== req.user.lawFirm._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this department",
      });
    }

    // If code is being changed, check for duplicates
    if (req.body.code && req.body.code !== department.code) {
      const departmentExists = await Department.findOne({
        code: req.body.code.toUpperCase(),
        lawFirm: department.lawFirm,
        _id: { $ne: department._id },
      });

      if (departmentExists) {
        return res.status(400).json({
          success: false,
          message: `Department with code ${req.body.code.toUpperCase()} already exists in this law firm`,
        });
      }
    }

    // Update fields
    const updateData = {};

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.code) updateData.code = req.body.code;
    if (req.body.description !== undefined)
      updateData.description = req.body.description;
    if (req.body.departmentType)
      updateData.departmentType = req.body.departmentType;
    if (req.body.isActive !== undefined)
      updateData.isActive = req.body.isActive;

    // Handle nested settings updates
    if (req.body.settings) {
      updateData.settings = department.settings || {};

      if (req.body.settings.casePrefixes) {
        // Convert the object to a Map
        const prefixMap = new Map(
          Object.entries(req.body.settings.casePrefixes)
        );
        updateData.settings.casePrefixes = prefixMap;
      }

      if (req.body.settings.workflowStages) {
        updateData.settings.workflowStages = req.body.settings.workflowStages;
      }

      if (req.body.settings.autoAssignment !== undefined) {
        updateData.settings.autoAssignment = req.body.settings.autoAssignment;
      }

      if (req.body.settings.requireApproval !== undefined) {
        updateData.settings.requireApproval = req.body.settings.requireApproval;
      }
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("lawFirm", "name")
      .populate("createdBy", "firstName lastName email");

    res.status(200).json({
      success: true,
      data: updatedDepartment,
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Department with this code already exists in this law firm",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating department",
      error: error.message,
    });
  }
});

/**
 * @desc    Delete department
 * @route   DELETE /api/departments/:id
 * @access  Private/Admin
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Check if user has access to delete this department
    if (
      req.user.role !== "system_owner" &&
      (!req.user.lawFirm ||
        department.lawFirm.toString() !== req.user.lawFirm._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this department",
      });
    }

    // TODO: Check for dependencies (users, cases) before deleting
    // This would need additional logic to prevent deleting departments that are in use

    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: "Department deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting department",
      error: error.message,
    });
  }
});

export const getDepartmentDetails = async (req, res) => {
  try {
    console.log("🔍 getDepartmentDetails called with params:", req.params);
    const { departmentId } = req.params;
    console.log("📋 Department ID:", departmentId);

    // Get department info
    console.log("🔍 Looking for department with ID:", departmentId);
    const department = await Department.findById(departmentId).populate(
      "lawFirm",
      "name"
    );
    console.log("📋 Found department:", department ? "Yes" : "No");

    if (!department) {
      console.log("❌ Department not found");
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    // Check if user has access to this department
    console.log("🔐 Checking authorization...");
    console.log("👤 User role:", req.user.role);
    console.log("🏢 User law firm:", req.user.lawFirm?._id);
    console.log("🏢 Department law firm:", department.lawFirm?._id);

    if (
      req.user.role !== "system_owner" &&
      (!req.user.lawFirm ||
        department.lawFirm._id.toString() !== req.user.lawFirm._id.toString())
    ) {
      console.log("❌ Authorization failed");
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this department",
      });
    }
    console.log("✅ Authorization passed");

    // Get users in department
    const users = await User.find({ department: departmentId });
    // Get credit cases for department
    const creditCases = await CreditCase.find({ department: departmentId });
    // Get legal cases for department
    const legalCases = await LegalCase.find({ department: departmentId });
    // Stats
    const totalCreditCases = creditCases.length;
    const totalLegalCases = legalCases.length;
    const resolvedCreditCases = creditCases.filter((c) =>
      ["resolved", "closed"].includes(c.status)
    ).length;
    const resolvedLegalCases = legalCases.filter((c) =>
      ["resolved", "closed"].includes(c.status)
    ).length;
    const inProgressCreditCases = creditCases.filter((c) =>
      ["assigned", "in_progress"].includes(c.status)
    ).length;
    const inProgressLegalCases = legalCases.filter((c) =>
      ["assigned", "in_progress"].includes(c.status)
    ).length;
    const responseData = {
      success: true,
      data: {
        department,
        users,
        creditCases,
        legalCases,
        stats: {
          totalCreditCases,
          totalLegalCases,
          resolvedCreditCases,
          resolvedLegalCases,
          inProgressCreditCases,
          inProgressLegalCases,
        },
      },
    };
    console.log("✅ Sending response:", responseData);
    res.json(responseData);
  } catch (error) {
    console.error("Error in getDepartmentDetails:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch department details" });
  }
};

export {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
