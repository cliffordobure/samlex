import LegalCase from "../models/LegalCase.js";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Payment from "../models/Payment.js";
import LawFirm from "../models/LawFirm.js"; // Added import for LawFirm
import RevenueTarget from "../models/RevenueTarget.js";
import { validateObjectId } from "../middleware/validation.js";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

/**
 * @desc    Get comprehensive case statistics for a law firm
 * @route   GET /api/reports/case-statistics/:lawFirmId
 * @access  Private (law_firm_admin)
 */
export const getCaseStatistics = async (req, res) => {
  try {
    // Add cache-busting headers
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    const { lawFirmId } = req.params;
    const { period = "30" } = req.query; // days

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      (req.user.role === "law_firm_admin" ||
        req.user.role === "debt_collector" ||
        req.user.role === "system_owner") &&
      lawFirmId !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Build query based on user role
    let creditCaseQuery = { lawFirm: lawFirmId };
    if (req.user.role === "debt_collector") {
      creditCaseQuery = { lawFirm: lawFirmId, assignedTo: req.user._id };
    }

    // Get credit cases statistics
    const creditCasesStats = await CreditCase.aggregate([
      { $match: creditCaseQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" },
        },
      },
    ]);

    // Get legal cases statistics
    const legalCasesStats = await LegalCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalFilingFees: { $sum: "$filingFee.amount" },
        },
      },
    ]);

    // Get cases created in the specified period
    const recentCreditCases = await CreditCase.countDocuments({
      ...creditCaseQuery,
      createdAt: { $gte: daysAgo },
    });

    const recentLegalCases = await LegalCase.countDocuments({
      lawFirm: lawFirmId,
      createdAt: { $gte: daysAgo },
    });

    // Get cases by priority
    const creditCasesByPriority = await CreditCase.aggregate([
      { $match: creditCaseQuery },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const legalCasesByPriority = await LegalCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get cases by type (for legal cases)
    const legalCasesByType = await LegalCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $group: {
          _id: "$caseType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get escalation statistics
    const escalatedCases = await CreditCase.countDocuments({
      lawFirm: lawFirmId,
      escalatedToLegal: true,
    });

    const totalCreditCases = await CreditCase.countDocuments({
      lawFirm: lawFirmId,
    });

    const totalLegalCases = await LegalCase.countDocuments({
      lawFirm: lawFirmId,
    });

    const escalationRate =
      totalCreditCases > 0 ? (escalatedCases / totalCreditCases) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCreditCases,
          totalLegalCases,
          totalCases: totalCreditCases + totalLegalCases,
          recentCreditCases,
          recentLegalCases,
          escalationRate: Math.round(escalationRate * 100) / 100,
        },
        creditCases: {
          byStatus: creditCasesStats,
          byPriority: creditCasesByPriority,
        },
        legalCases: {
          byStatus: legalCasesStats,
          byPriority: legalCasesByPriority,
          byType: legalCasesByType,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting case statistics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving case statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Get user activity reports for a law firm
 * @route   GET /api/reports/user-activity/:lawFirmId
 * @access  Private (law_firm_admin)
 */
export const getUserActivity = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query; // days

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      req.user.role === "law_firm_admin" &&
      lawFirmId !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get users by role
    const usersByRole = await User.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
        },
      },
    ]);

    // Get recent user activity (users who logged in recently)
    const recentActiveUsers = await User.countDocuments({
      lawFirm: lawFirmId,
      lastLogin: { $gte: daysAgo },
    });

    // Get users by department
    const usersByDepartment = await User.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "departmentInfo",
        },
      },
      {
        $group: {
          _id: "$department",
          departmentName: { $first: "$departmentInfo.name" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get case assignments by user
    const creditCaseAssignments = await CreditCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedUser",
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          userName: { $first: "$assignedUser.firstName" },
          lastName: { $first: "$assignedUser.lastName" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const legalCaseAssignments = await LegalCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedUser",
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          userName: { $first: "$assignedUser.firstName" },
          lastName: { $first: "$assignedUser.lastName" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get total users
    const totalUsers = await User.countDocuments({
      lawFirm: lawFirmId,
    });

    const activeUsers = await User.countDocuments({
      lawFirm: lawFirmId,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          recentActiveUsers,
        },
        usersByRole,
        usersByDepartment,
        topPerformers: {
          creditCollection: creditCaseAssignments,
          legal: legalCaseAssignments,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting user activity:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving user activity",
      error: error.message,
    });
  }
};

/**
 * @desc    Get department performance reports for a law firm
 * @route   GET /api/reports/department-performance/:lawFirmId
 * @access  Private (law_firm_admin)
 */
export const getDepartmentPerformance = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      (req.user.role === "law_firm_admin" || req.user.role === "accountant") &&
      lawFirmId !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get all departments for the law firm
    const departments = await Department.find({
      lawFirm: lawFirmId,
    });

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        console.log(`🔍 Processing department: ${dept.name} (${dept._id})`);
        
        // Get credit cases for this department
        const creditCases = await CreditCase.aggregate([
          { $match: { department: dept._id } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalAmount: { $sum: "$debtAmount" },
            },
          },
        ]);

        // Get legal cases for this department
        const legalCases = await LegalCase.aggregate([
          { $match: { department: dept._id } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalFilingFees: { $sum: "$filingFee.amount" },
            },
          },
        ]);

        // Get users in this department
        const departmentUsers = await User.countDocuments({
          department: dept._id,
          isActive: true,
        });

        // Debug: Check all cases without department filter
        const allCreditCases = await CreditCase.countDocuments({ lawFirm: lawFirmId });
        const allLegalCases = await LegalCase.countDocuments({ lawFirm: lawFirmId });
        const allUsers = await User.countDocuments({ lawFirm: lawFirmId });

        console.log(`📊 Department ${dept.name} stats:`);
        console.log(`  - Credit cases with this department: ${creditCases.reduce((sum, stat) => sum + stat.count, 0)}`);
        console.log(`  - Legal cases with this department: ${legalCases.reduce((sum, stat) => sum + stat.count, 0)}`);
        console.log(`  - Users in this department: ${departmentUsers}`);
        console.log(`  - Total credit cases in law firm: ${allCreditCases}`);
        console.log(`  - Total legal cases in law firm: ${allLegalCases}`);
        console.log(`  - Total users in law firm: ${allUsers}`);

        // Get recent cases (last 30 days)
        const recentCreditCases = await CreditCase.countDocuments({
          department: dept._id,
          createdAt: { $gte: daysAgo },
        });

        const recentLegalCases = await LegalCase.countDocuments({
          department: dept._id,
          createdAt: { $gte: daysAgo },
        });

        // Calculate resolution rates
        const totalCreditCases = creditCases.reduce(
          (sum, stat) => sum + stat.count,
          0
        );
        const resolvedCreditCases =
          creditCases.find((stat) => stat._id === "resolved")?.count || 0;
        const creditResolutionRate =
          totalCreditCases > 0
            ? (resolvedCreditCases / totalCreditCases) * 100
            : 0;

        const totalLegalCases = legalCases.reduce(
          (sum, stat) => sum + stat.count,
          0
        );
        const resolvedLegalCases =
          legalCases.find((stat) => stat._id === "resolved")?.count || 0;
        const legalResolutionRate =
          totalLegalCases > 0
            ? (resolvedLegalCases / totalLegalCases) * 100
            : 0;

        // Fallback: If no cases assigned to department, try to assign based on department type
        let fallbackCreditCases = 0;
        let fallbackLegalCases = 0;
        let fallbackUsers = 0;

        // Always try fallback logic for users if departmentUsers is 0
        if (departmentUsers === 0) {
          console.log(`⚠️ No users found for department ${dept.name}, trying fallback logic...`);
          
          // Assign users based on their roles and department type
          if (dept.departmentType === 'credit_collection') {
            // For credit collection department, get users with credit-related roles
            fallbackUsers = await User.countDocuments({
              lawFirm: lawFirmId,
              role: { $in: ['debt_collector', 'credit_head'] },
              isActive: true
            });
            console.log(`  - Fallback users (credit roles): ${fallbackUsers}`);
          } else if (dept.departmentType === 'legal') {
            // For legal department, get users with legal-related roles
            fallbackUsers = await User.countDocuments({
              lawFirm: lawFirmId,
              role: { $in: ['advocate', 'legal_head'] },
              isActive: true
            });
            console.log(`  - Fallback users (legal roles): ${fallbackUsers}`);
          }
        }

        // Fallback for cases if no cases are assigned to department
        if (totalCreditCases === 0 && totalLegalCases === 0) {
          console.log(`⚠️ No cases found for department ${dept.name}, trying fallback logic...`);
          
          if (dept.departmentType === 'credit_collection') {
            // For credit collection department, get all credit cases without department
            fallbackCreditCases = await CreditCase.countDocuments({
              lawFirm: lawFirmId,
              department: { $exists: false }
            });
            console.log(`  - Fallback credit cases: ${fallbackCreditCases}`);
          } else if (dept.departmentType === 'legal') {
            // For legal department, get all legal cases without department
            fallbackLegalCases = await LegalCase.countDocuments({
              lawFirm: lawFirmId,
              department: { $exists: false }
            });
            console.log(`  - Fallback legal cases: ${fallbackLegalCases}`);
          }
        }

        return {
          department: {
            _id: dept._id,
            name: dept.name,
            code: dept.code,
            departmentType: dept.departmentType,
          },
          stats: {
            totalUsers: departmentUsers || fallbackUsers,
            totalCreditCases: totalCreditCases || fallbackCreditCases,
            totalLegalCases: totalLegalCases || fallbackLegalCases,
            recentCreditCases,
            recentLegalCases,
            creditResolutionRate: Math.round(creditResolutionRate * 100) / 100,
            legalResolutionRate: Math.round(legalResolutionRate * 100) / 100,
            totalDebtAmount: creditCases.reduce(
              (sum, stat) => sum + (stat.totalAmount || 0),
              0
            ),
            totalFilingFees: legalCases.reduce(
              (sum, stat) => sum + (stat.totalFilingFees || 0),
              0
            ),
            // Calculate overall completion rate
            completionRate: (() => {
              const totalCases = (totalCreditCases || fallbackCreditCases) + (totalLegalCases || fallbackLegalCases);
              const totalResolved = resolvedCreditCases + resolvedLegalCases;
              return totalCases > 0 ? Math.round((totalResolved / totalCases) * 100) : 0;
            })(),
          },
          creditCases: creditCases,
          legalCases: legalCases,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: departmentStats,
    });
  } catch (error) {
    console.error("❌ Error getting department performance:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving department performance",
      error: error.message,
    });
  }
};

/**
 * @desc    Get revenue analytics for a law firm
 * @route   GET /api/reports/revenue-analytics/:lawFirmId
 * @access  Private (law_firm_admin)
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    // Add cache-busting headers
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    const { lawFirmId } = req.params;
    const { period = "30" } = req.query; // days

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      (req.user.role === "law_firm_admin" || req.user.role === "accountant") &&
      lawFirmId !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get filing fees from legal cases
    const filingFeesStats = await LegalCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalFilingFees: { $sum: "$filingFee.amount" },
          paidFilingFees: {
            $sum: {
              $cond: ["$filingFee.paid", "$filingFee.amount", 0],
            },
          },
          caseCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get escalation fees
    const escalationFeesStats = await Payment.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          purpose: "escalation_fee",
          case: { $exists: true },
        },
      },
      {
        $lookup: {
          from: "creditcases",
          localField: "case.caseId",
          foreignField: "_id",
          as: "creditCase",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalEscalationFees: { $sum: "$amount" },
          paidEscalationFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
          pendingEscalationFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
          escalationCount: { $sum: 1 },
          paidEscalationCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pendingEscalationCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get promised payments analytics
    const promisedPaymentsStats = await CreditCase.aggregate([
      { $match: { lawFirm: lawFirmId, "promisedPayments.0": { $exists: true } } },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: {
            year: { $year: "$promisedPayments.promisedDate" },
            month: { $month: "$promisedPayments.promisedDate" },
          },
          totalPromisedAmount: { $sum: "$promisedPayments.amount" },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          overdueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "overdue"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          totalPromisedCount: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "paid"] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "pending"] }, 1, 0] },
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "overdue"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get recent promised payments (last 30 days)
    const recentPromisedPayments = await CreditCase.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          "promisedPayments.0": { $exists: true },
        },
      },
      { $unwind: "$promisedPayments" },
      {
        $match: {
          "promisedPayments.promisedDate": { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalPromisedAmount: { $sum: "$promisedPayments.amount" },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          overdueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "overdue"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          totalPromisedCount: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "paid"] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "pending"] }, 1, 0] },
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "overdue"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get recent revenue (last 30 days)
    const recentFilingFees = await LegalCase.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          createdAt: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalFilingFees: { $sum: "$filingFee.amount" },
          paidFilingFees: {
            $sum: {
              $cond: ["$filingFee.paid", "$filingFee.amount", 0],
            },
          },
          caseCount: { $sum: 1 },
        },
      },
    ]);

    const recentEscalationFees = await Payment.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          purpose: "escalation_fee",
          createdAt: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalEscalationFees: { $sum: "$amount" },
          paidEscalationFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
          pendingEscalationFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
          escalationCount: { $sum: 1 },
          paidEscalationCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pendingEscalationCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    // Calculate total revenue
    const totalFilingFees = filingFeesStats.reduce(
      (sum, stat) => sum + stat.totalFilingFees,
      0
    );
    const totalPaidFilingFees = filingFeesStats.reduce(
      (sum, stat) => sum + stat.paidFilingFees,
      0
    );
    const totalEscalationFees = escalationFeesStats.reduce(
      (sum, stat) => sum + stat.totalEscalationFees,
      0
    );
    const totalPaidEscalationFees = escalationFeesStats.reduce(
      (sum, stat) => sum + stat.paidEscalationFees,
      0
    );
    const totalPendingEscalationFees = escalationFeesStats.reduce(
      (sum, stat) => sum + stat.pendingEscalationFees,
      0
    );

    // Calculate promised payments totals
    const totalPromisedAmount = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.totalPromisedAmount,
      0
    );
    const totalPaidPromisedAmount = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.paidAmount,
      0
    );
    const totalPendingPromisedAmount = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.pendingAmount,
      0
    );
    const totalOverduePromisedAmount = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.overdueAmount,
      0
    );

    const recentRevenue = {
      filingFees: recentFilingFees[0]?.totalFilingFees || 0,
      paidFilingFees: recentFilingFees[0]?.paidFilingFees || 0,
      escalationFees: recentEscalationFees[0]?.totalEscalationFees || 0,
      paidEscalationFees: recentEscalationFees[0]?.paidEscalationFees || 0,
      pendingEscalationFees:
        recentEscalationFees[0]?.pendingEscalationFees || 0,
      promisedPayments: recentPromisedPayments[0]?.totalPromisedAmount || 0,
      paidPromisedPayments: recentPromisedPayments[0]?.paidAmount || 0,
      pendingPromisedPayments: recentPromisedPayments[0]?.pendingAmount || 0,
      overduePromisedPayments: recentPromisedPayments[0]?.overdueAmount || 0,
      total:
        (recentFilingFees[0]?.totalFilingFees || 0) +
        (recentEscalationFees[0]?.totalEscalationFees || 0) +
        (recentPromisedPayments[0]?.paidAmount || 0),
    };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRevenue: totalFilingFees + totalEscalationFees + totalPaidPromisedAmount,
          totalFilingFees,
          totalPaidFilingFees,
          totalEscalationFees,
          totalPaidEscalationFees,
          totalPendingEscalationFees,
          totalPromisedAmount,
          totalPaidPromisedAmount,
          totalPendingPromisedAmount,
          totalOverduePromisedAmount,
          paymentRate:
            totalFilingFees > 0
              ? (totalPaidFilingFees / totalFilingFees) * 100
              : 0,
          escalationPaymentRate:
            totalEscalationFees > 0
              ? (totalPaidEscalationFees / totalEscalationFees) * 100
              : 0,
          promisedPaymentRate:
            totalPromisedAmount > 0
              ? (totalPaidPromisedAmount / totalPromisedAmount) * 100
              : 0,
        },
        recentRevenue,
        monthlyRevenue: {
          filingFees: filingFeesStats,
          escalationFees: escalationFeesStats,
          promisedPayments: promisedPaymentsStats,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting revenue analytics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving revenue analytics",
      error: error.message,
    });
  }
};

/**
 * @desc    Get comprehensive dashboard analytics for a law firm
 * @route   GET /api/reports/dashboard/:lawFirmId
 * @access  Private (law_firm_admin)
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { lawFirmId } = req.params;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      req.user.role === "law_firm_admin" &&
      lawFirmId !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    // Get all analytics in parallel
    const [caseStats, userActivity, departmentPerformance, revenueAnalytics] =
      await Promise.all([
        getCaseStatistics(req, { status: () => {}, json: () => {} }),
        getUserActivity(req, { status: () => {}, json: () => {} }),
        getDepartmentPerformance(req, { status: () => {}, json: () => {} }),
        getRevenueAnalytics(req, { status: () => {}, json: () => {} }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        caseStatistics: caseStats.data,
        userActivity: userActivity.data,
        departmentPerformance: departmentPerformance.data,
        revenueAnalytics: revenueAnalytics.data,
      },
    });
  } catch (error) {
    console.error("❌ Error getting dashboard analytics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving dashboard analytics",
      error: error.message,
    });
  }
};

// GET /api/reports/credit-collection/summary
export const getCreditCollectionSummary = async (req, res) => {
  try {
    let caseQuery = {};
    let officerStats = [];

    if (req.user.role === "debt_collector") {
      // Only show stats for this debt collector
      caseQuery = { assignedTo: req.user._id };
    } else if (
      req.user.role === "credit_head" ||
      req.user.role === "law_firm_admin"
    ) {
      // Only show stats for this law firm
      caseQuery = { lawFirm: req.user.lawFirm._id };
    }

    const totalCases = await CreditCase.countDocuments(caseQuery);
    const openCases = await CreditCase.countDocuments({
      ...caseQuery,
      status: "Open",
    });
    const closedCases = await CreditCase.countDocuments({
      ...caseQuery,
      status: "Closed",
    });
    const assignedCases = await CreditCase.countDocuments({
      ...caseQuery,
      assignedTo: { $ne: null },
    });
    const unassignedCases = await CreditCase.countDocuments({
      ...caseQuery,
      assignedTo: null,
    });

    if (req.user.role === "debt_collector") {
      // Only this officer's stats
      officerStats = [
        {
          officer: {
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
          },
          count: totalCases,
        },
      ];
    } else {
      // All officers' stats (existing logic)
      officerStats = await CreditCase.aggregate([
        { $match: { ...caseQuery, assignedTo: { $ne: null } } },
        { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "officer",
          },
        },
        { $unwind: "$officer" },
        {
          $project: {
            _id: 0,
            officer: { firstName: 1, lastName: 1, email: 1 },
            count: 1,
          },
        },
      ]);
    }

    res.json({
      success: true,
      data: {
        totalCases,
        openCases,
        closedCases,
        assignedCases,
        unassignedCases,
        officerStats,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch summary" });
  }
};

// GET /api/reports/credit-collection/cases-csv
export const downloadCreditCasesCSV = async (req, res) => {
  try {
    let caseQuery = {};
    if (req.user.role === "debt_collector") {
      caseQuery = { assignedTo: req.user._id };
    } else if (
      req.user.role === "credit_head" ||
      req.user.role === "law_firm_admin"
    ) {
      caseQuery = { lawFirm: req.user.lawFirm._id };
    }
    const cases = await CreditCase.find(caseQuery)
      .populate("assignedTo", "firstName lastName email")
      .lean();

    // Get law firm details for branding
    const lawFirm = await LawFirm.findById(req.user.lawFirm._id);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    const fields = [
      { label: "Case Number", value: "caseNumber" },
      { label: "Title", value: "title" },
      { label: "Status", value: "status" },
      { label: "Priority", value: "priority" },
      {
        label: "Assigned To",
        value: (row) =>
          row.assignedTo
            ? `${row.assignedTo.firstName || ""} ${
                row.assignedTo.lastName || ""
              } (${row.assignedTo.email || ""})`
            : "Unassigned",
      },
      {
        label: "Created At",
        value: (row) => new Date(row.createdAt).toLocaleString(),
      },
      {
        label: "Updated At",
        value: (row) => new Date(row.updatedAt).toLocaleString(),
      },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(cases);

    res.header("Content-Type", "text/csv");
    res.attachment(
      `${lawFirm.firmName.replace(/\s+/g, "_")}_credit_cases_report.csv`
    );
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate CSV" });
  }
};

// GET /api/reports/credit-collection/cases-pdf
export const downloadCreditCasesPDF = async (req, res) => {
  try {
    let caseQuery = {};
    if (req.user.role === "debt_collector") {
      caseQuery = { assignedTo: req.user._id };
    } else if (
      req.user.role === "credit_head" ||
      req.user.role === "law_firm_admin"
    ) {
      caseQuery = { lawFirm: req.user.lawFirm._id };
    }
    const cases = await CreditCase.find(caseQuery)
      .populate("assignedTo", "firstName lastName email")
      .lean();

    // Get law firm details for branding
    const lawFirm = await LawFirm.findById(req.user.lawFirm._id);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${lawFirm.firmName.replace(
        /\s+/g,
        "_"
      )}_credit_cases_report.pdf"`
    );
    doc.pipe(res);

    // Add law firm header with logo
    await addLawFirmHeader(doc, lawFirm, "Credit Collection Cases Report");

    // Professional table layout
    const startX = 30;
    let y = doc.y + 20;
    const rowHeight = 25;
    const tableWidth = doc.page.width - 60;

    // Table header background
    doc
      .rect(startX, y - 15, tableWidth, rowHeight)
      .fill("#1e293b")
      .stroke("#374151");

    // Table headers with professional styling
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("Case Number", startX + 10, y);
    doc.text("Title", startX + 100, y);
    doc.text("Status", startX + 200, y);
    doc.text("Priority", startX + 280, y);
    doc.text("Assigned To", startX + 350, y);
    doc.text("Created At", startX + 480, y);
    doc.text("Updated At", startX + 580, y);

    y += rowHeight;

    // Table rows with alternating colors
    cases.forEach((row, index) => {
      const isEven = index % 2 === 0;
      const rowColor = isEven ? "#f8fafc" : "#ffffff";

      // Row background
      doc
        .rect(startX, y - 15, tableWidth, rowHeight)
        .fill(rowColor)
        .stroke("#e2e8f0");

      // Row content
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#1e293b")
        .text(row.caseNumber || "", startX + 10, y);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#374151")
        .text(row.title || "", startX + 100, y, { width: 90 });

      // Status with color coding
      const statusColor = getStatusColor(row.status);
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(statusColor)
        .text(row.status || "", startX + 200, y);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#475569")
        .text(row.priority || "", startX + 280, y);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(
          row.assignedTo
            ? `${row.assignedTo.firstName || ""} ${
                row.assignedTo.lastName || ""
              }`
            : "Unassigned",
          startX + 350,
          y,
          { width: 120 }
        );

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text(
          new Date(row.createdAt).toLocaleDateString() || "",
          startX + 480,
          y
        );

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text(
          new Date(row.updatedAt).toLocaleDateString() || "",
          startX + 580,
          y
        );

      y += rowHeight;

      // Add new page if needed
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 50;
      }
    });

    // Add footer
    addFooter(doc);

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate PDF" });
  }
};

export const getDebtCollectorStats = async (req, res) => {
  try {
    if (req.user.role !== "debt_collector") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only debt collectors can view their stats.",
      });
    }

    // Get cases assigned to this debt collector
    const assignedCases = await CreditCase.find({ assignedTo: req.user._id });

    // Calculate statistics
    const totalCases = assignedCases.length;
    const resolvedCasesArray = assignedCases.filter((c) =>
      ["resolved", "closed"].includes(c.status)
    );
    const resolvedCases = resolvedCasesArray.length;
    const inProgressCases = assignedCases.filter((c) =>
      ["assigned", "in_progress", "follow_up_required"].includes(c.status)
    ).length;

    // Calculate total debt amount and collected amount
    const totalDebtAmount = assignedCases.reduce(
      (sum, c) => sum + (c.debtAmount || 0),
      0
    );
    const collectedAmount = resolvedCasesArray.reduce(
      (sum, c) => sum + (c.debtAmount || 0),
      0
    );

    // Calculate escalation revenue
    const escalationPayments = await Payment.find({
      purpose: "escalation_fee",
      "case.caseId": { $in: assignedCases.map((c) => c._id) },
    });
    const escalationRevenue = escalationPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    res.json({
      success: true,
      data: {
        totalCases,
        resolvedCases,
        inProgressCases,
        totalDebtAmount,
        collectedAmount,
        escalationRevenue,
        pendingAmount: totalDebtAmount - collectedAmount,
        resolutionRate: totalCases > 0 ? resolvedCases / totalCases : 0,
        collectionRate:
          totalDebtAmount > 0 ? collectedAmount / totalDebtAmount : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching debt collector stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch debt collector statistics",
    });
  }
};

/**
 * @desc    Get comprehensive statistics for a specific debt collector by ID
 * @route   GET /api/reports/debt-collector/:debtCollectorId/stats
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const getDebtCollectorStatsById = async (req, res) => {
  try {
    const { debtCollectorId } = req.params;
    const { period = "30" } = req.query;

    // Validate debt collector ID
    if (!validateObjectId(debtCollectorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid debt collector ID format",
      });
    }

    // Check if user has permission to view this debt collector's stats
    if (req.user.role === "debt_collector" && req.user._id.toString() !== debtCollectorId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own stats.",
      });
    }

    // Verify the debt collector exists and belongs to the same law firm
    const debtCollector = await User.findById(debtCollectorId);
    if (!debtCollector || debtCollector.role !== "debt_collector") {
      return res.status(404).json({
        success: false,
        message: "Debt collector not found",
      });
    }

    if (req.user.lawFirm._id.toString() !== debtCollector.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Debt collector belongs to different law firm.",
      });
    }

    // Calculate date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get cases assigned to this debt collector
    let assignedCasesQuery = { assignedTo: debtCollectorId };
    
    // Only apply date filtering if period is specified and not "all"
    if (period && period !== "all") {
      assignedCasesQuery.createdAt = { $gte: daysAgo };
    }
    
    const assignedCases = await CreditCase.find(assignedCasesQuery).populate("assignedTo", "firstName lastName email");

    // Calculate basic statistics
    const totalCases = assignedCases.length;
    const resolvedCasesArray = assignedCases.filter((c) =>
      ["resolved", "closed"].includes(c.status)
    );
    const resolvedCases = resolvedCasesArray.length;
    const inProgressCases = assignedCases.filter((c) =>
      ["assigned", "in_progress", "follow_up_required"].includes(c.status)
    ).length;

    // Calculate financial statistics
    const totalDebtAmount = assignedCases.reduce(
      (sum, c) => sum + (c.debtAmount || 0),
      0
    );
    
    // Get promised payments data first
    const casesWithPromisedPayments = await CreditCase.find({
      assignedTo: debtCollectorId,
      "promisedPayments.0": { $exists: true }
    }).populate("assignedTo", "firstName lastName");

    // Calculate promised payments statistics
    let totalPromisedAmount = 0;
    let totalPaidAmount = 0;
    let totalPendingAmount = 0;
    let totalOverdueAmount = 0;
    let totalPromisedCount = 0;
    let totalPaidCount = 0;
    let totalPendingCount = 0;
    let totalOverdueCount = 0;

    casesWithPromisedPayments.forEach(case_ => {
      if (case_.promisedPayments && case_.promisedPayments.length > 0) {
        case_.promisedPayments.forEach(payment => {
          totalPromisedAmount += payment.amount || 0;
          totalPromisedCount++;

          if (payment.status === "paid") {
            totalPaidAmount += payment.amount || 0;
            totalPaidCount++;
          } else if (payment.status === "pending") {
            totalPendingAmount += payment.amount || 0;
            totalPendingCount++;
          } else if (payment.status === "overdue") {
            totalOverdueAmount += payment.amount || 0;
            totalOverdueCount++;
          }
        });
      }
    });
    
    // Calculate collected amount from resolved cases PLUS paid promised payments
    let collectedAmount = resolvedCasesArray.reduce(
      (sum, c) => sum + (c.debtAmount || 0),
      0
    );
    
    // Add paid promised payments to collected amount
    collectedAmount += totalPaidAmount;
    
    // Calculate escalation revenue
    const escalationPayments = await Payment.find({
      purpose: "escalation_fee",
      "case.caseId": { $in: assignedCases.map((c) => c._id) },
    });
    const escalationRevenue = escalationPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );





    // Get recent activity (last 10 cases)
    const recentActivity = await CreditCase.find({ assignedTo: debtCollectorId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("assignedTo", "firstName lastName")
      .select("caseNumber status debtAmount priority updatedAt assignedTo debtorName");

    // Get cases by status
    const casesByStatus = await CreditCase.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(debtCollectorId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" }
        }
      }
    ]);

    // Get cases by priority
    const casesByPriority = await CreditCase.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(debtCollectorId) } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" }
        }
      }
    ]);

    // Get monthly trends for the last 6 months
    const monthlyTrends = await CreditCase.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(debtCollectorId) } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          newCases: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    // Get monthly promised payments trends
    const monthlyPromisedPaymentsTrends = await CreditCase.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(debtCollectorId), "promisedPayments.0": { $exists: true } } },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: {
            year: { $year: "$promisedPayments.promisedDate" },
            month: { $month: "$promisedPayments.promisedDate" }
          },
          totalPromisedAmount: { $sum: "$promisedPayments.amount" },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          overdueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "overdue"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          promisedCount: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "paid"] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "pending"] }, 1, 0] }
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "overdue"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      data: {
        debtCollector: {
          _id: debtCollector._id,
          firstName: debtCollector.firstName,
          lastName: debtCollector.lastName,
          email: debtCollector.email,
          role: debtCollector.role
        },
        period: parseInt(period),
        basicStats: {
          totalCases,
          resolvedCases,
          inProgressCases,
          successRate: totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0,
        },
        financialStats: {
          totalDebtAmount,
          collectedAmount,
          pendingAmount: totalDebtAmount - collectedAmount,
          escalationRevenue,
          collectionRate: totalDebtAmount > 0 ? Math.round((collectedAmount / totalDebtAmount) * 100) : 0,
        },
        promisedPayments: {
          totalPromisedAmount,
          totalPaidAmount,
          totalPendingAmount,
          totalOverdueAmount,
          totalPromisedCount,
          totalPaidCount,
          totalPendingCount,
          totalOverdueCount,
          paymentRate: totalPromisedCount > 0 ? Math.round((totalPaidCount / totalPromisedCount) * 100) : 0,
        },
        casesByStatus,
        casesByPriority,
        recentActivity: recentActivity.map(case_ => ({
          caseNumber: case_.caseNumber,
          status: case_.status,
          debtAmount: case_.debtAmount,
          priority: case_.priority,
          updatedAt: case_.updatedAt,
          assignedTo: case_.assignedTo ? `${case_.assignedTo.firstName} ${case_.assignedTo.lastName}` : 'Unassigned',
          debtor: case_.debtorName || 'Unknown'
        })),
        monthlyTrends: monthlyTrends.map(trend => ({
          month: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
          newCases: trend.newCases,
          totalAmount: trend.totalAmount
        })),
        monthlyPromisedPaymentsTrends: monthlyPromisedPaymentsTrends.map(trend => ({
          month: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
          totalPromisedAmount: trend.totalPromisedAmount,
          paidAmount: trend.paidAmount,
          pendingAmount: trend.pendingAmount,
          overdueAmount: trend.overdueAmount,
          promisedCount: trend.promisedCount,
          paidCount: trend.paidCount,
          pendingCount: trend.pendingCount,
          overdueCount: trend.overdueCount,
          paymentRate: trend.promisedCount > 0 ? Math.round((trend.paidCount / trend.promisedCount) * 100) : 0
        })),
        assignedCases: assignedCases // Include individual cases for frontend charts
      },
    });
  } catch (error) {
    console.error("Error fetching debt collector stats by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch debt collector statistics",
    });
  }
};

export const getLawFirmAdminDashboard = async (req, res) => {
  try {
    // Add cache-busting headers
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    const { lawFirmId } = req.params;

    // Total credit cases
    const totalCreditCases = await CreditCase.countDocuments({
      lawFirm: lawFirmId,
    });
    // Total legal cases
    const totalLegalCases = await LegalCase.countDocuments({
      lawFirm: lawFirmId,
    });
    // Total users
    const totalUsers = await User.countDocuments({ lawFirm: lawFirmId });
    // Active users
    const activeUsers = await User.countDocuments({
      lawFirm: lawFirmId,
      isActive: true,
    });
    // Escalated cases
    const escalatedCases = await CreditCase.countDocuments({
      lawFirm: lawFirmId,
      escalatedToLegal: true,
    });
    // Escalation rate
    const escalationRate =
      totalCreditCases > 0 ? (escalatedCases / totalCreditCases) * 100 : 0;
    // Comprehensive Revenue Calculation - LAW FIRM REVENUE ONLY
    // Note: Recovered money belongs to clients, not the law firm
    
    // 1. Filing Fees - from paid legal cases (LAW FIRM REVENUE)
    const allLegalCases = await LegalCase.find({ lawFirm: lawFirmId }).lean();
    const casesWithFilingFees = allLegalCases.filter(c => c.filingFee);
    const paidFilingFeeCases = casesWithFilingFees.filter(c => c.filingFee.paid === true);
    const totalFilingFees = paidFilingFeeCases.reduce((sum, c) => sum + (c.filingFee.amount || 0), 0);
    
    // 2. Escalation Fees - from payments (LAW FIRM REVENUE)
    const allPayments = await Payment.find({ lawFirm: lawFirmId }).lean();
    const escalationPayments = allPayments.filter(p => p.purpose === 'escalation_fee' && p.status === 'completed');
    const escalationRevenue = escalationPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // 3. Other Law Firm Payments - service charges, consultation, subscription (LAW FIRM REVENUE)
    const otherPayments = allPayments.filter(p => 
      ['service_charge', 'consultation', 'subscription'].includes(p.purpose) && 
      p.status === 'completed'
    );
    const totalOtherPayments = otherPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // TOTAL LAW FIRM REVENUE (excludes recovered money which belongs to clients)
    const totalRevenue = totalFilingFees + escalationRevenue + totalOtherPayments;
    
    // Additional metrics for reporting (not included in law firm revenue)
    const allCreditCases = await CreditCase.find({ lawFirm: lawFirmId }).lean();
    const resolvedCreditCases = allCreditCases.filter(c => c.status === 'resolved');
    const totalMoneyRecovered = resolvedCreditCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);

    // Debug logging
    console.log("=== REVENUE CALCULATION DEBUG ===");
    console.log("Law Firm ID:", lawFirmId);
    console.log("Total Legal Cases:", allLegalCases.length);
    console.log("Cases with Filing Fees:", casesWithFilingFees.length);
    console.log("Cases with Paid Filing Fees:", paidFilingFeeCases.length);
    
    paidFilingFeeCases.forEach((caseItem, index) => {
      console.log(`Case ${index + 1}:`, {
        title: caseItem.title,
        caseNumber: caseItem.caseNumber,
        filingFeeAmount: caseItem.filingFee.amount,
        filingFeePaid: caseItem.filingFee.paid,
        filingFeePaidAt: caseItem.filingFee.paidAt
      });
    });
    
    console.log("Filing Fees (Law Firm Revenue):", totalFilingFees);
    console.log("Escalation Revenue (Law Firm Revenue):", escalationRevenue);
    console.log("Other Payments (Law Firm Revenue):", totalOtherPayments);
    console.log("Total Law Firm Revenue:", totalRevenue);
    console.log("Money Recovered (Client Money - NOT Law Firm Revenue):", totalMoneyRecovered);
    console.log("================================");

    res.json({
      success: true,
      data: {
        totalCreditCases,
        totalLegalCases,
        totalUsers,
        activeUsers,
        totalRevenue, // Law firm revenue only (filing fees + escalation fees + other payments)
        escalationRevenue,
        escalationRate: Math.round(escalationRate),
        // Additional metrics (not law firm revenue)
        totalMoneyRecovered, // Money recovered for clients
        totalFilingFees, // Breakdown of law firm revenue
        totalOtherPayments, // Other law firm payments
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard data" });
  }
};

/**
 * @desc    Get admin's own cases report
 * @route   GET /api/reports/admin-own-cases
 * @access  Private (admin, law_firm_admin)
 */
export const getAdminOwnCases = async (req, res) => {
  try {
    const userId = req.user._id;
    const lawFirmId = req.user.lawFirm._id;

    // Get admin's assigned credit cases
    const adminCreditCases = await CreditCase.aggregate([
      { $match: { assignedTo: userId, lawFirm: lawFirmId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" },
          cases: { $push: "$$ROOT" },
        },
      },
    ]);

    // Get admin's assigned legal cases
    const adminLegalCases = await LegalCase.aggregate([
      { $match: { assignedTo: userId, lawFirm: lawFirmId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalFilingFees: { $sum: "$filingFee.amount" },
          cases: { $push: "$$ROOT" },
        },
      },
    ]);

    // Get performance metrics
    const totalCreditCases = adminCreditCases.reduce(
      (sum, stat) => sum + stat.count,
      0
    );
    const totalLegalCases = adminLegalCases.reduce(
      (sum, stat) => sum + stat.count,
      0
    );

    const resolvedCreditCases =
      adminCreditCases.find((stat) => stat._id === "resolved")?.count || 0;
    const resolvedLegalCases =
      adminLegalCases.find((stat) => stat._id === "resolved")?.count || 0;

    const creditResolutionRate =
      totalCreditCases > 0 ? (resolvedCreditCases / totalCreditCases) * 100 : 0;
    const legalResolutionRate =
      totalLegalCases > 0 ? (resolvedLegalCases / totalLegalCases) * 100 : 0;

    // Get monthly performance
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyCreditCases = await CreditCase.countDocuments({
      assignedTo: userId,
      lawFirm: lawFirmId,
      createdAt: { $gte: currentMonth },
    });

    const monthlyLegalCases = await LegalCase.countDocuments({
      assignedTo: userId,
      lawFirm: lawFirmId,
      createdAt: { $gte: currentMonth },
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCreditCases,
          totalLegalCases,
          totalCases: totalCreditCases + totalLegalCases,
          monthlyCreditCases,
          monthlyLegalCases,
          creditResolutionRate: Math.round(creditResolutionRate * 100) / 100,
          legalResolutionRate: Math.round(legalResolutionRate * 100) / 100,
        },
        creditCases: adminCreditCases,
        legalCases: adminLegalCases,
      },
    });
  } catch (error) {
    console.error("❌ Error getting admin own cases:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving admin cases",
      error: error.message,
    });
  }
};

/**
 * @desc    Get legal performance analytics
 * @route   GET /api/reports/legal-performance/:lawFirmId
 * @access  Private (admin, law_firm_admin, legal_head)
 */
export const getLegalPerformance = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query;
    const { user } = req;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Build match condition based on user role
    let matchCondition = { lawFirm: lawFirmId };
    
    // If user is an advocate, only show their assigned cases
    if (user.role === "advocate") {
      matchCondition.assignedTo = user._id;
    }

    // Get legal cases by status
    const casesByStatus = await LegalCase.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalFilingFees: { $sum: "$filingFee.amount" },
          avgProcessingTime: {
            $avg: { $subtract: ["$updatedAt", "$createdAt"] },
          },
        },
      },
    ]);

    // Get cases by advocate/legal head (only for legal_head and admin roles)
    let casesByAssignee = [];
    if (user.role === "legal_head" || user.role === "law_firm_admin" || user.role === "admin") {
      casesByAssignee = await LegalCase.aggregate([
        { $match: { lawFirm: lawFirmId, assignedTo: { $ne: null } } },
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            as: "assignee",
          },
        },
        {
          $group: {
            _id: "$assignedTo",
            assigneeName: { $first: "$assignee.firstName" },
            assigneeLastName: { $first: "$assignee.lastName" },
            assigneeRole: { $first: "$assignee.role" },
            count: { $sum: 1 },
            resolvedCount: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
            },
            totalFilingFees: { $sum: "$filingFee.amount" },
          },
        },
        { $sort: { count: -1 } },
      ]);
    }

    // Get monthly trends
    const monthlyTrends = await LegalCase.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          newCases: { $sum: 1 },
          resolvedCases: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          totalFilingFees: { $sum: "$filingFee.amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get case type distribution
    const casesByType = await LegalCase.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$caseType",
          count: { $sum: 1 },
          avgFilingFee: { $avg: "$filingFee.amount" },
        },
      },
    ]);

    // Calculate performance metrics
    const totalCases = casesByStatus.reduce((sum, stat) => sum + stat.count, 0);
    const resolvedCases =
      casesByStatus.find((stat) => stat._id === "resolved")?.count || 0;
    const resolutionRate =
      totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

    const totalFilingFees = casesByStatus.reduce(
      (sum, stat) => sum + (stat.totalFilingFees || 0),
      0
    );
    const avgProcessingTime =
      casesByStatus.reduce(
        (sum, stat) => sum + (stat.avgProcessingTime || 0),
        0
      ) / casesByStatus.length;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCases,
          resolvedCases,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          totalFilingFees,
          avgProcessingTime: Math.round(
            avgProcessingTime / (1000 * 60 * 60 * 24)
          ), // Convert to days
        },
        casesByStatus,
        casesByAssignee,
        monthlyTrends,
        casesByType,
      },
    });
  } catch (error) {
    console.error("❌ Error getting legal performance:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving legal performance",
      error: error.message,
    });
  }
};

/**
 * @desc    Get debt collection performance analytics
 * @route   GET /api/reports/debt-collection-performance/:lawFirmId
 * @access  Private (admin, law_firm_admin, credit_head)
 */
export const getDebtCollectionPerformance = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get credit cases by status
    const casesByStatus = await CreditCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" },
          avgProcessingTime: {
            $avg: { $subtract: ["$updatedAt", "$createdAt"] },
          },
        },
      },
    ]);

    // Get cases by debt collector/credit head
    const casesByAssignee = await CreditCase.aggregate([
      { $match: { lawFirm: lawFirmId, assignedTo: { $ne: null } } },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignee",
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          assigneeName: { $first: "$assignee.firstName" },
          assigneeLastName: { $first: "$assignee.lastName" },
          assigneeRole: { $first: "$assignee.role" },
          count: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          totalAmount: { $sum: "$debtAmount" },
          collectedAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "resolved"] }, "$debtAmount", 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get monthly trends
    const monthlyTrends = await CreditCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          newCases: { $sum: 1 },
          resolvedCases: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          totalAmount: { $sum: "$debtAmount" },
          collectedAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "resolved"] }, "$debtAmount", 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get escalation statistics
    const escalationStats = await CreditCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          escalatedCases: { $sum: { $cond: ["$escalatedToLegal", 1, 0] } },
          totalEscalationFees: { $sum: "$escalationPayment.amount" },
        },
      },
    ]);

    // Calculate performance metrics
    const totalCases = casesByStatus.reduce((sum, stat) => sum + stat.count, 0);
    const resolvedCases =
      casesByStatus.find((stat) => stat._id === "resolved")?.count || 0;
    const resolutionRate =
      totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

    const totalAmount = casesByStatus.reduce(
      (sum, stat) => sum + (stat.totalAmount || 0),
      0
    );
    const collectedAmount =
      casesByStatus.find((stat) => stat._id === "resolved")?.totalAmount || 0;
    const collectionRate =
      totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0;

    const escalationRate =
      escalationStats[0]?.totalCases > 0
        ? (escalationStats[0].escalatedCases / escalationStats[0].totalCases) *
          100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCases,
          resolvedCases,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          totalAmount,
          collectedAmount,
          collectionRate: Math.round(collectionRate * 100) / 100,
          escalationRate: Math.round(escalationRate * 100) / 100,
          totalEscalationFees: escalationStats[0]?.totalEscalationFees || 0,
        },
        casesByStatus,
        casesByAssignee,
        monthlyTrends,
        escalationStats: escalationStats[0] || {},
      },
    });
  } catch (error) {
    console.error("❌ Error getting debt collection performance:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving debt collection performance",
      error: error.message,
    });
  }
};

/**
 * @desc    Get enhanced revenue analytics with detailed breakdown
 * @route   GET /api/reports/enhanced-revenue/:lawFirmId
 * @access  Private (admin, law_firm_admin)
 */
export const getEnhancedRevenueAnalytics = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get detailed filing fees breakdown
    const filingFeesBreakdown = await LegalCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            caseType: "$caseType",
          },
          totalFilingFees: { $sum: "$filingFee.amount" },
          paidFilingFees: {
            $sum: { $cond: ["$filingFee.paid", "$filingFee.amount", 0] },
          },
          caseCount: { $sum: 1 },
          paidCaseCount: { $sum: { $cond: ["$filingFee.paid", 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get escalation fees breakdown
    const escalationFeesBreakdown = await Payment.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          purpose: "escalation_fee",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalEscalationFees: { $sum: "$amount" },
          paidEscalationFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
          escalationCount: { $sum: 1 },
          paidEscalationCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get promised payments breakdown
    const promisedPaymentsBreakdown = await CreditCase.aggregate([
      { $match: { lawFirm: lawFirmId, "promisedPayments.0": { $exists: true } } },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: {
            year: { $year: "$promisedPayments.promisedDate" },
            month: { $month: "$promisedPayments.promisedDate" },
          },
          totalPromisedAmount: { $sum: "$promisedPayments.amount" },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          overdueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "overdue"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          totalPromisedCount: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "paid"] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "pending"] }, 1, 0] },
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ["$promisedPayments.status", "overdue"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get revenue by department
    const revenueByDepartment = await LegalCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "departmentInfo",
        },
      },
      {
        $group: {
          _id: "$department",
          departmentName: { $first: "$departmentInfo.name" },
          totalFilingFees: { $sum: "$filingFee.amount" },
          paidFilingFees: {
            $sum: { $cond: ["$filingFee.paid", "$filingFee.amount", 0] },
          },
          caseCount: { $sum: 1 },
        },
      },
    ]);

    // Get recent revenue trends (last 12 months)
    const last12Months = new Date();
    last12Months.setMonth(last12Months.getMonth() - 12);

    const monthlyRevenue = await LegalCase.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          createdAt: { $gte: last12Months },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          filingFees: { $sum: "$filingFee.amount" },
          paidFilingFees: {
            $sum: { $cond: ["$filingFee.paid", "$filingFee.amount", 0] },
          },
          caseCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Calculate summary metrics
    const totalFilingFees = filingFeesBreakdown.reduce(
      (sum, stat) => sum + stat.totalFilingFees,
      0
    );
    const totalPaidFilingFees = filingFeesBreakdown.reduce(
      (sum, stat) => sum + stat.paidFilingFees,
      0
    );
    const totalEscalationFees = escalationFeesBreakdown.reduce(
      (sum, stat) => sum + stat.totalEscalationFees,
      0
    );
    const totalPaidEscalationFees = escalationFeesBreakdown.reduce(
      (sum, stat) => sum + stat.paidEscalationFees,
      0
    );

    // Calculate promised payments totals
    const totalPromisedAmount = promisedPaymentsBreakdown.reduce(
      (sum, stat) => sum + stat.totalPromisedAmount,
      0
    );
    const totalPaidPromisedAmount = promisedPaymentsBreakdown.reduce(
      (sum, stat) => sum + stat.paidAmount,
      0
    );
    const totalPendingPromisedAmount = promisedPaymentsBreakdown.reduce(
      (sum, stat) => sum + stat.pendingAmount,
      0
    );
    const totalOverduePromisedAmount = promisedPaymentsBreakdown.reduce(
      (sum, stat) => sum + stat.overdueAmount,
      0
    );

    const paymentRate =
      totalFilingFees > 0 ? (totalPaidFilingFees / totalFilingFees) * 100 : 0;
    const escalationPaymentRate =
      totalEscalationFees > 0
        ? (totalPaidEscalationFees / totalEscalationFees) * 100
        : 0;
    const promisedPaymentRate =
      totalPromisedAmount > 0
        ? (totalPaidPromisedAmount / totalPromisedAmount) * 100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRevenue: totalFilingFees + totalEscalationFees + totalPaidPromisedAmount,
          totalFilingFees,
          totalPaidFilingFees,
          totalEscalationFees,
          totalPaidEscalationFees,
          totalPromisedAmount,
          totalPaidPromisedAmount,
          totalPendingPromisedAmount,
          totalOverduePromisedAmount,
          paymentRate: Math.round(paymentRate * 100) / 100,
          escalationPaymentRate: Math.round(escalationPaymentRate * 100) / 100,
          promisedPaymentRate: Math.round(promisedPaymentRate * 100) / 100,
        },
        filingFeesBreakdown,
        escalationFeesBreakdown,
        promisedPaymentsBreakdown,
        revenueByDepartment,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error("❌ Error getting enhanced revenue analytics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving enhanced revenue analytics",
      error: error.message,
    });
  }
};

/**
 * @desc    Download comprehensive PDF report with law firm branding
 * @route   GET /api/reports/download-pdf/:lawFirmId
 * @access  Private (admin, law_firm_admin)
 */
export const downloadComprehensivePDF = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { reportType = "overview" } = req.query;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Get law firm details for branding
    const lawFirm = await LawFirm.findById(lawFirmId);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Get comprehensive data based on report type
    let reportData = {};
    let reportTitle = "";

    switch (reportType) {
      case "admin-cases":
        reportData = await getAdminOwnCasesData(req.user._id, lawFirmId);
        reportTitle = "Admin's Own Cases Report";
        break;
      case "legal-performance":
        reportData = await getLegalPerformanceData(lawFirmId);
        reportTitle = "Legal Performance Report";
        break;
      case "debt-collection":
        reportData = await getDebtCollectionData(lawFirmId);
        reportTitle = "Debt Collection Performance Report";
        break;
      case "revenue":
        reportData = await getRevenueData(lawFirmId);
        reportTitle = "Revenue Analytics Report";
        break;
      default:
        reportData = await getOverviewData(lawFirmId);
        reportTitle = "Comprehensive Law Firm Report";
    }

    // Create PDF document
    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      info: {
        Title: `${reportTitle} - ${lawFirm.firmName}`,
        Author: "Law Firm Management System",
        Subject: reportTitle,
        Keywords: "law firm, report, analytics",
        Creator: "Law Firm Management System",
        Producer: "PDFKit",
      },
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${lawFirm.firmName.replace(
        /\s+/g,
        "_"
      )}_${reportType}_report.pdf"`
    );
    doc.pipe(res);

    // Add law firm header
    await addLawFirmHeader(doc, lawFirm, reportTitle);

    // Add report content based on type
    switch (reportType) {
      case "admin-cases":
        addAdminCasesContent(doc, reportData);
        break;
      case "legal-performance":
        addLegalPerformanceContent(doc, reportData);
        break;
      case "debt-collection":
        addDebtCollectionContent(doc, reportData);
        break;
      case "enhanced-revenue":
        addRevenueContent(doc, reportData);
        break;
      default:
        addOverviewContent(doc, reportData);
    }

    // Add footer
    addFooter(doc);

    doc.end();
  } catch (error) {
    console.error("❌ Error generating PDF report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF report",
      error: error.message,
    });
  }
};

/**
 * @desc    Download Excel report with law firm branding
 * @route   GET /api/reports/download-excel/:lawFirmId
 * @access  Private (admin, law_firm_admin)
 */
export const downloadComprehensiveExcel = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { reportType = "overview" } = req.query;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Get law firm details for branding
    const lawFirm = await LawFirm.findById(lawFirmId);
    if (!lawFirm) {
      return res.status(404).json({
        success: false,
        message: "Law firm not found",
      });
    }

    // Get comprehensive data based on report type
    let reportData = {};
    let reportTitle = "";

    switch (reportType) {
      case "admin-cases":
        reportData = await getAdminOwnCasesData(req.user._id, lawFirmId);
        reportTitle = "Admin's Own Cases Report";
        break;
      case "legal-performance":
        reportData = await getLegalPerformanceData(lawFirmId);
        reportTitle = "Legal Performance Report";
        break;
      case "debt-collection":
        reportData = await getDebtCollectionData(lawFirmId);
        reportTitle = "Debt Collection Performance Report";
        break;
      case "enhanced-revenue":
        reportData = await getRevenueData(lawFirmId);
        reportTitle = "Revenue Analytics Report";
        break;
      default:
        reportData = await getOverviewData(lawFirmId);
        reportTitle = "Comprehensive Law Firm Report";
    }

    // Generate Excel data
    const excelData = await generateExcelData(
      reportType,
      reportData,
      lawFirm,
      reportTitle
    );

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${lawFirm.firmName.replace(
        /\s+/g,
        "_"
      )}_${reportType}_report.xlsx"`
    );

    // Send Excel file
    res.send(excelData);
  } catch (error) {
    console.error("❌ Error generating Excel report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Excel report",
      error: error.message,
    });
  }
};

// Helper function for status colors
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "resolved":
    case "closed":
      return "#059669"; // green
    case "in_progress":
    case "assigned":
      return "#2563eb"; // blue
    case "pending":
    case "new":
      return "#f59e0b"; // amber
    case "escalated":
    case "escalated_to_legal":
      return "#dc2626"; // red
    case "follow_up_required":
      return "#7c3aed"; // purple
    default:
      return "#64748b"; // gray
  }
};

// Helper functions for PDF generation
const addLawFirmHeader = async (doc, lawFirm, reportTitle) => {
  // Professional header design with enhanced styling
  const pageWidth = doc.page.width - 60; // 30px margin on each side
  const headerHeight = 140;
  const centerX = 30 + (pageWidth / 2); // Center point of header

  // Create a gradient-like effect with multiple rectangles
  const gradientColors = ["#1e293b", "#334155", "#475569", "#64748b"];
  gradientColors.forEach((color, index) => {
    const rectHeight = headerHeight / gradientColors.length;
    const y = 30 + (index * rectHeight);
    doc.rect(30, y, pageWidth, rectHeight).fill(color);
  });

  // Add a subtle border around the entire header
  doc.rect(30, 30, pageWidth, headerHeight).stroke("#0f172a").lineWidth(2);

  // Add logo if available (Cloudinary URL)
  if (lawFirm.logo) {
    try {
      const https = await import("https");
      const logoUrl = new URL(lawFirm.logo);
      const options = {
        hostname: logoUrl.hostname,
        path: logoUrl.pathname + logoUrl.search,
        method: "GET",
      };

      return new Promise((resolve, reject) => {
        const request = https.request(options, (response) => {
          if (response.statusCode === 200) {
            const chunks = [];
            response.on("data", (chunk) => chunks.push(chunk));
            response.on("end", () => {
              const buffer = Buffer.concat(chunks);
              try {
                // Create a white background rectangle for the logo to ensure it's visible
                doc.rect(40, 40, 100, 100).fill("#ffffff");
                
                // Position logo in top-left of header with professional styling
                doc.image(buffer, 45, 45, { width: 90, height: 90 });
                
                // Add a subtle border around the logo
                doc.rect(40, 40, 100, 100).stroke("#ffffff").lineWidth(3);
                
                resolve();
              } catch (imageError) {
                console.log("Failed to add logo to PDF:", imageError.message);
                resolve();
              }
            });
          } else {
            console.log("Failed to fetch logo, status:", response.statusCode);
            resolve();
          }
        });

        request.on("error", (error) => {
          console.log("Failed to fetch logo:", error.message);
          resolve();
        });

        request.end();
      });
    } catch (error) {
      console.log("Logo not found or invalid URL, using text only");
    }
  }

  // Calculate text positioning for centered alignment
  let textStartX, textWidth, textAlign;
  
  if (lawFirm.logo) {
    // If logo exists, position text to the right of logo but still center the text content
    textStartX = 160;
    textWidth = pageWidth - 130;
    textAlign = "left";
  } else {
    // If no logo, center everything in the header
    textStartX = centerX;
    textWidth = pageWidth - 60;
    textAlign = "center";
  }

  // Law firm name - centered in available space
  doc
    .fontSize(32)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text(lawFirm.firmName, textStartX, 55, {
      width: textWidth,
      align: textAlign,
    });

  // Report title with enhanced styling - centered
  doc
    .fontSize(22)
    .font("Helvetica")
    .fillColor("#e2e8f0")
    .text(reportTitle, textStartX, 95, {
      width: textWidth,
      align: textAlign,
    });

  // Date and time with professional formatting - centered
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  doc
    .fontSize(14)
    .font("Helvetica")
    .fillColor("#cbd5e1")
    .text(`Generated on: ${formattedDate} at ${formattedTime}`, textStartX, 120, {
      width: textWidth,
      align: textAlign,
    });

  // Move cursor below header
  doc.y = 190;
};

const addFooter = (doc) => {
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    // Enhanced footer with gradient background
    const footerHeight = 60;
    const footerY = doc.page.height - footerHeight;
    
    // Footer background with gradient effect
    const footerColors = ["#64748b", "#475569", "#334155"];
    footerColors.forEach((color, index) => {
      const rectHeight = footerHeight / footerColors.length;
      const y = footerY + (index * rectHeight);
      doc.rect(30, y, doc.page.width - 60, rectHeight).fill(color);
    });

    // Footer border
    doc
      .rect(30, footerY, doc.page.width - 60, footerHeight)
      .stroke("#1e293b")
      .lineWidth(2);

    // Footer line separator
    doc
      .moveTo(30, footerY)
      .lineTo(doc.page.width - 30, footerY)
      .strokeColor("#ffffff")
      .lineWidth(1)
      .stroke();

    // Footer text with enhanced styling
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("Law Firm Management System", 45, footerY + 15)
      .text(
        `Page ${i + 1} of ${pageCount}`,
        doc.page.width - 140,
        footerY + 15,
        { align: "right" }
      );

    // Add timestamp and additional info
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#e2e8f0")
      .text(
        `Generated: ${new Date().toLocaleString()}`,
        45,
        footerY + 35
      )
      .text(
        "Professional Legal Management Solutions",
        doc.page.width - 140,
        footerY + 35,
        { align: "right" }
      );
  }
};

// Data retrieval functions
const getAdminOwnCasesData = async (userId, lawFirmId) => {
  const [adminCreditCases, adminLegalCases] = await Promise.all([
    CreditCase.aggregate([
      {
        $match: {
          assignedTo: new mongoose.Types.ObjectId(userId),
          lawFirm: new mongoose.Types.ObjectId(lawFirmId),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" },
          cases: { $push: "$$ROOT" },
        },
      },
    ]),
    LegalCase.aggregate([
      {
        $match: {
          assignedTo: new mongoose.Types.ObjectId(userId),
          lawFirm: new mongoose.Types.ObjectId(lawFirmId),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalFilingFees: { $sum: "$filingFee.amount" },
          cases: { $push: "$$ROOT" },
        },
      },
    ]),
  ]);

  return { adminCreditCases, adminLegalCases };
};

const getLegalPerformanceData = async (lawFirmId) => {
  const [casesByStatus, casesByAssignee, monthlyTrends] = await Promise.all([
    LegalCase.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalFilingFees: { $sum: "$filingFee.amount" },
        },
      },
    ]),
    LegalCase.aggregate([
      {
        $match: {
          lawFirm: new mongoose.Types.ObjectId(lawFirmId),
          assignedTo: { $ne: null },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignee",
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          assigneeName: { $first: "$assignee.firstName" },
          assigneeLastName: { $first: "$assignee.lastName" },
          count: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
        },
      },
    ]),
    LegalCase.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          newCases: { $sum: 1 },
          resolvedCases: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  return { casesByStatus, casesByAssignee, monthlyTrends };
};

const getDebtCollectionData = async (lawFirmId) => {
  const [casesByStatus, casesByAssignee, monthlyTrends] = await Promise.all([
    CreditCase.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" },
        },
      },
    ]),
    CreditCase.aggregate([
      {
        $match: {
          lawFirm: new mongoose.Types.ObjectId(lawFirmId),
          assignedTo: { $ne: null },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignee",
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          assigneeName: { $first: "$assignee.firstName" },
          assigneeLastName: { $first: "$assignee.lastName" },
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" },
        },
      },
    ]),
    CreditCase.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          newCases: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  return { casesByStatus, casesByAssignee, monthlyTrends };
};

const getRevenueData = async (lawFirmId) => {
  const [filingFees, escalationFees, revenueByDepartment] = await Promise.all([
    LegalCase.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalFilingFees: { $sum: "$filingFee.amount" },
          paidFilingFees: {
            $sum: { $cond: ["$filingFee.paid", "$filingFee.amount", 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Payment.aggregate([
      {
        $match: {
          lawFirm: new mongoose.Types.ObjectId(lawFirmId),
          purpose: "escalation_fee",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalEscalationFees: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    LegalCase.aggregate([
      { $match: { lawFirm: new mongoose.Types.ObjectId(lawFirmId) } },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "departmentInfo",
        },
      },
      {
        $group: {
          _id: "$department",
          departmentName: { $first: "$departmentInfo.name" },
          totalFilingFees: { $sum: "$filingFee.amount" },
        },
      },
    ]),
  ]);

  return { filingFees, escalationFees, revenueByDepartment };
};

const getOverviewData = async (lawFirmId) => {
  const [
    totalCreditCases,
    totalLegalCases,
    totalUsers,
    activeUsers,
    escalatedCases,
  ] = await Promise.all([
    CreditCase.countDocuments({
      lawFirm: new mongoose.Types.ObjectId(lawFirmId),
    }),
    LegalCase.countDocuments({
      lawFirm: new mongoose.Types.ObjectId(lawFirmId),
    }),
    User.countDocuments({ lawFirm: new mongoose.Types.ObjectId(lawFirmId) }),
    User.countDocuments({
      lawFirm: new mongoose.Types.ObjectId(lawFirmId),
      isActive: true,
    }),
    CreditCase.countDocuments({
      lawFirm: new mongoose.Types.ObjectId(lawFirmId),
      escalatedToLegal: true,
    }),
  ]);

  return {
    totalCreditCases,
    totalLegalCases,
    totalUsers,
    activeUsers,
    escalatedCases,
  };
};

// PDF content functions
const addAdminCasesContent = (doc, data) => {
  // Reset position to start content properly after header
  doc.x = 50; // Start from left margin with proper spacing
  
  // Section header with enhanced professional styling
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#1e293b")
    .text("Admin's Own Cases Summary", 50, doc.y);

  // Add decorative line with enhanced styling - span full page width
  const lineStartX = 50;
  const lineEndX = doc.page.width - 50; // Full page width minus margins
  doc
    .moveTo(lineStartX, doc.y + 8)
    .lineTo(lineEndX, doc.y + 8)
    .strokeColor("#3b82f6")
    .lineWidth(3)
    .stroke();

  // Add a subtle background rectangle for the entire section - full page width
  const sectionStartY = doc.y + 15;
  const sectionWidth = doc.page.width - 100; // Full page width minus margins
  doc
    .rect(50, sectionStartY, sectionWidth, 200)
    .fill("#f8fafc")
    .stroke("#e2e8f0")
    .lineWidth(1);

  doc.moveDown(2);

  // Credit Cases Section with enhanced styling
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#374151")
    .text("Credit Cases", 50, doc.y);

  // Add a colored background for the credit cases section - full page width
  const creditSectionY = doc.y + 15;
  doc
    .rect(50, creditSectionY, sectionWidth, 80)
    .fill("#dbeafe")
    .stroke("#3b82f6")
    .lineWidth(2);

  if (data.adminCreditCases && data.adminCreditCases.length > 0) {
    data.adminCreditCases.forEach((stat, index) => {
      const yPos = creditSectionY + 25 + index * 25;
      
      // Add a subtle background for each stat row - full width
      doc
        .rect(55, yPos - 5, sectionWidth - 10, 20)
        .fill(index % 2 === 0 ? "#eff6ff" : "#dbeafe")
        .stroke("#bfdbfe")
        .lineWidth(0.5);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#1e40af")
        .text(`${stat._id || "Unknown"}:`, 60, yPos);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#1e40af")
        .text(
          `${stat.count || 0} cases - Total Amount: KES ${(
            stat.totalAmount || 0
          ).toLocaleString()}`,
          200,
          yPos
        );
    });
  } else {
    // Enhanced "no data" message
    doc
      .fontSize(14)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("No credit cases found for this admin.", 60, creditSectionY + 25);
    
    // Add a subtle icon representation
    doc
      .fontSize(24)
      .fillColor("#94a3b8")
      .text("📋", 250, creditSectionY + 20);
  }

  doc.moveDown(3);

  // Legal Cases Section with enhanced styling
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#374151")
    .text("Legal Cases", 50, doc.y);

  // Add a colored background for the legal cases section - full page width
  const legalSectionY = doc.y + 15;
  doc
    .rect(50, legalSectionY, sectionWidth, 80)
    .fill("#fef3c7")
    .stroke("#f59e0b")
    .lineWidth(2);

  if (data.adminLegalCases && data.adminLegalCases.length > 0) {
    data.adminLegalCases.forEach((stat, index) => {
      const yPos = legalSectionY + 25 + index * 25;
      
      // Add a subtle background for each stat row
      doc
        .rect(doc.x - 5, yPos - 5, doc.page.width - 90, 20)
        .fill(index % 2 === 0 ? "#fefce8" : "#fef3c7")
        .stroke("#fde68a")
        .lineWidth(0.5);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#92400e")
        .text(`${stat._id || "Unknown"}:`, doc.x, yPos);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#92400e")
        .text(
          `${stat.count || 0} cases - Total Filing Fees: KES ${(
            stat.totalFilingFees || 0
          ).toLocaleString()}`,
          doc.x + 100,
          yPos
        );
    });
  } else {
    // Enhanced "no data" message
    doc
      .fontSize(14)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("No legal cases found for this admin.", doc.x, legalSectionY + 25);
    
    // Add a subtle icon representation
    doc
      .fontSize(24)
      .fillColor("#94a3b8")
      .text("⚖️", doc.x + 200, legalSectionY + 20);
  }
};

const addLegalPerformanceContent = (doc, data) => {
  // Section header with enhanced professional styling
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#1e293b")
    .text("Legal Performance Summary");

  // Add decorative line with enhanced styling
  doc
    .moveTo(doc.x, doc.y + 8)
    .lineTo(doc.x + 250, doc.y + 8)
    .strokeColor("#8b5cf6")
    .lineWidth(3)
    .stroke();

  doc.moveDown(1.5);

  // Cases by Status Section with enhanced styling
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#374151")
    .text("Cases by Status");

  // Add a colored background for the status section
  const statusSectionY = doc.y + 15;
  doc
    .rect(doc.x - 10, statusSectionY, doc.page.width - 80, 100)
    .fill("#f3e8ff")
    .stroke("#8b5cf6")
    .lineWidth(2);

  if (data.casesByStatus && data.casesByStatus.length > 0) {
    data.casesByStatus.forEach((stat, index) => {
      const yPos = statusSectionY + 25 + index * 25;
      
      // Add a subtle background for each stat row
      doc
        .rect(doc.x - 5, yPos - 5, doc.page.width - 90, 20)
        .fill(index % 2 === 0 ? "#faf5ff" : "#f3e8ff")
        .stroke("#c4b5fd")
        .lineWidth(0.5);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#581c87")
        .text(`${stat._id || "Unknown"}:`, doc.x, yPos);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#581c87")
        .text(
          `${stat.count || 0} cases - Filing Fees: KES ${(
            stat.totalFilingFees || 0
          ).toLocaleString()}`,
          doc.x + 100,
          yPos
        );
    });
  } else {
    // Enhanced "no data" message
    doc
      .fontSize(14)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("No legal cases found.", doc.x, statusSectionY + 25);
    
    // Add a subtle icon representation
    doc
      .fontSize(24)
      .fillColor("#94a3b8")
      .text("📊", doc.x + 200, statusSectionY + 20);
  }

  doc.moveDown(3);

  // Performance by Assignee Section with enhanced styling
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#374151")
    .text("Performance by Assignee");

  // Add a colored background for the assignee section
  const assigneeSectionY = doc.y + 15;
  doc
    .rect(doc.x - 10, assigneeSectionY, doc.page.width - 80, 100)
    .fill("#ecfdf5")
    .stroke("#10b981")
    .lineWidth(2);

  if (data.casesByAssignee && data.casesByAssignee.length > 0) {
    data.casesByAssignee.forEach((assignee, index) => {
      const yPos = assigneeSectionY + 25 + index * 25;
      const name =
        `${assignee.assigneeName || ""} ${
          assignee.assigneeLastName || ""
        }`.trim() || "Unknown";

      // Add a subtle background for each assignee row
      doc
        .rect(doc.x - 5, yPos - 5, doc.page.width - 90, 20)
        .fill(index % 2 === 0 ? "#f0fdf4" : "#ecfdf5")
        .stroke("#a7f3d0")
        .lineWidth(0.5);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#065f46")
        .text(`${name}:`, doc.x, yPos);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#065f46")
        .text(
          `${assignee.count || 0} cases (${
            assignee.resolvedCount || 0
          } resolved)`,
          doc.x + 100,
          yPos
        );
    });
  } else {
    // Enhanced "no data" message
    doc
      .fontSize(14)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("No assignee data available.", doc.x, assigneeSectionY + 25);
    
    // Add a subtle icon representation
    doc
      .fontSize(24)
      .fillColor("#94a3b8")
      .text("👥", doc.x + 200, assigneeSectionY + 20);
  }
};

const addDebtCollectionContent = (doc, data) => {
  // Section header with enhanced professional styling
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#1e293b")
    .text("Debt Collection Performance Summary");

  // Add decorative line with enhanced styling
  doc
    .moveTo(doc.x, doc.y + 8)
    .lineTo(doc.x + 250, doc.y + 8)
    .strokeColor("#f59e0b")
    .lineWidth(3)
    .stroke();

  doc.moveDown(1.5);

  // Cases by Status Section with enhanced styling
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#374151")
    .text("Cases by Status");

  // Add a colored background for the status section
  const statusSectionY = doc.y + 15;
  doc
    .rect(doc.x - 10, statusSectionY, doc.page.width - 80, 100)
    .fill("#fef3c7")
    .stroke("#f59e0b")
    .lineWidth(2);

  if (data.casesByStatus && data.casesByStatus.length > 0) {
    data.casesByStatus.forEach((stat, index) => {
      const yPos = statusSectionY + 25 + index * 25;
      
      // Add a subtle background for each stat row
      doc
        .rect(doc.x - 5, yPos - 5, doc.page.width - 90, 20)
        .fill(index % 2 === 0 ? "#fefce8" : "#fef3c7")
        .stroke("#fde68a")
        .lineWidth(0.5);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#92400e")
        .text(`${stat._id || "Unknown"}:`, doc.x, yPos);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#92400e")
        .text(
          `${stat.count || 0} cases - Total Amount: KES ${(
            stat.totalAmount || 0
          ).toLocaleString()}`,
          doc.x + 100,
          yPos
        );
    });
  } else {
    // Enhanced "no data" message
    doc
      .fontSize(14)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("No debt collection cases found.", doc.x, statusSectionY + 25);
    
    // Add a subtle icon representation
    doc
      .fontSize(24)
      .fillColor("#94a3b8")
      .text("💰", doc.x + 200, statusSectionY + 20);
  }

  doc.moveDown(3);

  // Performance by Assignee Section with enhanced styling
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#374151")
    .text("Performance by Assignee");

  // Add a colored background for the assignee section
  const assigneeSectionY = doc.y + 15;
  doc
    .rect(doc.x - 10, assigneeSectionY, doc.page.width - 80, 100)
    .fill("#fef3c7")
    .stroke("#f59e0b")
    .lineWidth(2);

  if (data.casesByAssignee && data.casesByAssignee.length > 0) {
    data.casesByAssignee.forEach((assignee, index) => {
      const yPos = assigneeSectionY + 25 + index * 25;
      const name =
        `${assignee.assigneeName || ""} ${
          assignee.assigneeLastName || ""
        }`.trim() || "Unknown";

      // Add a subtle background for each assignee row
      doc
        .rect(doc.x - 5, yPos - 5, doc.page.width - 90, 20)
        .fill(index % 2 === 0 ? "#fefce8" : "#fef3c7")
        .stroke("#fde68a")
        .lineWidth(0.5);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#92400e")
        .text(`${name}:`, doc.x, yPos);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#92400e")
        .text(
          `${assignee.count || 0} cases - Total Amount: KES ${(
            assignee.totalAmount || 0
          ).toLocaleString()}`,
          doc.x + 100,
          yPos
        );
    });
  } else {
    // Enhanced "no data" message
    doc
      .fontSize(14)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("No assignee data available.", doc.x, assigneeSectionY + 25);
    
    // Add a subtle icon representation
    doc
      .fontSize(24)
      .fillColor("#94a3b8")
      .text("👤", doc.x + 200, assigneeSectionY + 20);
  }
};

const addRevenueContent = (doc, data) => {
  // Reset position to start content properly after header
  doc.x = 50; // Start from left margin with proper spacing
  
  // Section header with enhanced professional styling
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#1e293b")
    .text("Revenue Analytics Summary", 50, doc.y);

  // Add decorative line with enhanced styling - span full page width
  const lineStartX = 50;
  const lineEndX = doc.page.width - 50; // Full page width minus margins
  doc
    .moveTo(lineStartX, doc.y + 8)
    .lineTo(lineEndX, doc.y + 8)
    .strokeColor("#10b981")
    .lineWidth(3)
    .stroke();

  doc.moveDown(1.5);

  // Filing Fees Section with enhanced styling
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#374151")
    .text("Monthly Filing Fees", 50, doc.y);

  // Add a colored background for the filing fees section - full page width
  const filingSectionY = doc.y + 15;
  const sectionWidth = doc.page.width - 100; // Full page width minus margins
  doc
    .rect(50, filingSectionY, sectionWidth, 120)
    .fill("#d1fae5")
    .stroke("#10b981")
    .lineWidth(2);

  if (data.filingFees && data.filingFees.length > 0) {
    data.filingFees.forEach((fee, index) => {
      const yPos = filingSectionY + 25 + index * 25;
      
      // Add a subtle background for each fee row - full width
      doc
        .rect(55, yPos - 5, sectionWidth - 10, 20)
        .fill(index % 2 === 0 ? "#ecfdf5" : "#d1fae5")
        .stroke("#a7f3d0")
        .lineWidth(0.5);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#065f46")
        .text(`${fee._id.month}/${fee._id.year}:`, 60, yPos);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#065f46")
        .text(
          `KES ${(fee.totalFilingFees || 0).toLocaleString()} (Paid: KES ${(
            fee.paidFilingFees || 0
          ).toLocaleString()})`,
          200,
          yPos
        );
    });
  } else {
    // Enhanced "no data" message with sample data visualization
    doc
      .fontSize(14)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("No filing fees data available.", 60, filingSectionY + 25);
    
    // Add sample data visualization with professional styling
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("Sample data would appear here:", 60, filingSectionY + 50);
    
    // Add sample data rows for demonstration
    const sampleData = [
      { month: "January", amount: 15000, paid: 12000 },
      { month: "February", amount: 18000, paid: 15000 },
      { month: "March", amount: 22000, paid: 20000 }
    ];
    
    sampleData.forEach((item, index) => {
      const yPos = filingSectionY + 70 + index * 20;
      
      // Add subtle background for sample data - full width
      doc
        .rect(55, yPos - 5, sectionWidth - 10, 20)
        .fill(index % 2 === 0 ? "#f8fafc" : "#f1f5f9")
        .stroke("#e2e8f0")
        .lineWidth(0.5);
      
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(`${item.month}:`, 60, yPos);
      
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(
          `KES ${item.amount.toLocaleString()} (Paid: KES ${item.paid.toLocaleString()})`,
          200,
          yPos
        );
    });
    
    // Add a sample chart representation - centered and wider
    const chartY = filingSectionY + 140;
    const chartWidth = Math.min(300, sectionWidth - 20);
    const chartX = 60 + (sectionWidth - chartWidth) / 2;
    doc
      .rect(chartX, chartY, chartWidth, 40)
      .fill("#f1f5f9")
      .stroke("#cbd5e1")
      .lineWidth(1);
    
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("📊 Chart: Monthly Revenue Trends", chartX + 10, chartY + 15);
  }

  doc.moveDown(3);

  // Revenue by Department Section with enhanced styling
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#374151")
    .text("Revenue by Department", 50, doc.y);

  // Add a colored background for the department section - full page width
  const deptSectionY = doc.y + 15;
  doc
    .rect(50, deptSectionY, sectionWidth, 100)
    .fill("#dbeafe")
    .stroke("#3b82f6")
    .lineWidth(2);

  if (data.revenueByDepartment && data.revenueByDepartment.length > 0) {
    data.revenueByDepartment.forEach((dept, index) => {
      const yPos = deptSectionY + 25 + index * 25;
      
      // Add a subtle background for each dept row - full width
      doc
        .rect(55, yPos - 5, sectionWidth - 10, 20)
        .fill(index % 2 === 0 ? "#eff6ff" : "#dbeafe")
        .stroke("#bfdbfe")
        .lineWidth(0.5);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#1e40af")
        .text(`${dept.departmentName || "Unknown"}:`, 60, yPos);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#1e40af")
        .text(
          `KES ${(dept.totalFilingFees || 0).toLocaleString()}`,
          250,
          yPos
        );
    });
  } else {
    // Enhanced "no data" message with sample data visualization
    doc
      .fontSize(14)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("No department revenue data available.", 60, deptSectionY + 25);
    
    // Add sample data visualization with professional styling
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("Sample data would appear here:", 60, deptSectionY + 50);
    
    // Add sample department data for demonstration
    const sampleDepts = [
      { name: "Legal Department", revenue: 45000 },
      { name: "Credit Collection", revenue: 32000 },
      { name: "Corporate Law", revenue: 28000 }
    ];
    
    sampleDepts.forEach((dept, index) => {
      const yPos = deptSectionY + 70 + index * 20;
      
      // Add subtle background for sample data - full width
      doc
        .rect(55, yPos - 5, sectionWidth - 10, 20)
        .fill(index % 2 === 0 ? "#f8fafc" : "#f1f5f9")
        .stroke("#e2e8f0")
        .lineWidth(0.5);
      
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(`${dept.name}:`, 60, yPos);
      
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(
          `KES ${dept.revenue.toLocaleString()}`,
          250,
          yPos
        );
    });
    
    // Add a sample chart representation - centered and wider
    const chartY = deptSectionY + 140;
    const chartWidth = Math.min(300, sectionWidth - 20);
    const chartX = 60 + (sectionWidth - chartWidth) / 2;
    doc
      .rect(chartX, chartY, chartWidth, 40)
      .fill("#f1f5f9")
      .stroke("#cbd5e1")
      .lineWidth(1);
    
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("📈 Chart: Department Revenue Distribution", chartX + 10, chartY + 15);
  }
  
  // Add a professional summary section
  doc.moveDown(2);
  
  // Summary section header
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor("#374151")
    .text("Revenue Summary & Insights", 50, doc.y);
  
  // Add a subtle background for the summary section - full page width
  const summaryY = doc.y + 15;
  doc
    .rect(50, summaryY, sectionWidth, 80)
    .fill("#f8fafc")
    .stroke("#e2e8f0")
    .lineWidth(1);
  
  // Summary content
  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#64748b")
    .text("• Total Revenue: KES 105,000 (Sample Data)", 60, summaryY + 20)
    .text("• Average Monthly Revenue: KES 35,000", 60, summaryY + 40)
    .text("• Top Performing Department: Legal Department", 60, summaryY + 60);
  
  // Add a professional note
  doc.moveDown(1);
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#94a3b8")
    .text("Note: This report shows sample data for demonstration purposes. ", 60, doc.y + 10)
    .text("Real data will appear when cases and payments are added to the system.", 60, doc.y + 25);
};

const addOverviewContent = (doc, data) => {
  // Reset position to start content properly after header
  doc.x = 50; // Start from left margin with proper spacing
  
  // Section header with enhanced professional styling
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#1e293b")
    .text("Law Firm Overview", 50, doc.y);

  // Add decorative line with enhanced styling - span full page width
  const lineStartX = 50;
  const lineEndX = doc.page.width - 50; // Full page width minus margins
  doc
    .moveTo(lineStartX, doc.y + 8)
    .lineTo(lineEndX, doc.y + 8)
    .strokeColor("#3b82f6")
    .lineWidth(3)
    .stroke();

  doc.moveDown(1.5);

  if (data) {
    // Create a professional stats grid with enhanced styling
    const stats = [
      {
        label: "Total Credit Cases",
        value: data.totalCreditCases || 0,
        color: "#3b82f6",
        bgColor: "#dbeafe",
        borderColor: "#3b82f6",
        icon: "📋"
      },
      {
        label: "Total Legal Cases",
        value: data.totalLegalCases || 0,
        color: "#8b5cf6",
        bgColor: "#e9d5ff",
        borderColor: "#8b5cf6",
        icon: "⚖️"
      },
      { 
        label: "Total Users", 
        value: data.totalUsers || 0, 
        color: "#10b981",
        bgColor: "#d1fae5",
        borderColor: "#10b981",
        icon: "👥"
      },
      { 
        label: "Active Users", 
        value: data.activeUsers || 0, 
        color: "#f59e0b",
        bgColor: "#fef3c7",
        borderColor: "#f59e0b",
        icon: "✅"
      },
      {
        label: "Escalated Cases",
        value: data.escalatedCases || 0,
        color: "#ef4444",
        bgColor: "#fee2e2",
        borderColor: "#ef4444",
        icon: "🚨"
      },
    ];

    const startX = 50; // Fixed starting position
    const startY = doc.y + 20;
    const boxWidth = 160;
    const boxHeight = 90;
    const margin = 25;

    stats.forEach((stat, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = startX + col * (boxWidth + margin);
      const y = startY + row * (boxHeight + margin);

      // Enhanced box background with gradient effect
      doc.rect(x, y, boxWidth, boxHeight).fill(stat.bgColor).stroke(stat.borderColor).lineWidth(2);

      // Add icon
      doc
        .fontSize(20)
        .fillColor(stat.color)
        .text(stat.icon, x + 10, y + 10);

      // Stat value with enhanced styling
      doc
        .fontSize(28)
        .font("Helvetica-Bold")
        .fillColor(stat.color)
        .text(stat.value.toString(), x + 10, y + 35);

      // Stat label with enhanced styling
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor("#374151")
        .text(stat.label, x + 10, y + 65, { width: boxWidth - 20 });
    });

    // Move cursor below stats
    doc.y = startY + Math.ceil(stats.length / 2) * (boxHeight + margin) + 40;

    // Add a summary section
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("Summary", 50, doc.y);

    // Add summary text with enhanced styling
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(
        "This overview provides a comprehensive snapshot of your law firm's current status, " +
        "including case counts, user activity, and operational metrics. Use these insights " +
        "to make informed decisions and track your firm's performance over time.",
        50,
        doc.y + 10,
        { width: doc.page.width - 100 }
      );

  } else {
    // Enhanced "no data" message
    doc
      .fontSize(14)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("No overview data available.", 50, doc.y);
    
    // Add a subtle icon representation
    doc
      .fontSize(24)
      .fillColor("#94a3b8")
      .text("📊", 250, doc.y - 20);
  }
};

// Excel generation function
const generateExcelData = async (
  reportType,
  reportData,
  lawFirm,
  reportTitle
) => {
  const workbook = new ExcelJS.Workbook();

  // Add law firm info
  workbook.creator = lawFirm.firmName;
  workbook.lastModifiedBy = "Law Firm Management System";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create main worksheet
  const worksheet = workbook.addWorksheet("Report");

  // Initialize currentRow variable
  let currentRow = 5;

  // Add logo to Excel if available
  if (lawFirm.logo) {
    try {
      const https = await import("https");
      const logoUrl = new URL(lawFirm.logo);
      const options = {
        hostname: logoUrl.hostname,
        path: logoUrl.pathname + logoUrl.search,
        method: "GET",
      };

      const logoBuffer = await new Promise((resolve, reject) => {
        const request = https.request(options, (response) => {
          if (response.statusCode === 200) {
            const chunks = [];
            response.on("data", (chunk) => chunks.push(chunk));
            response.on("end", () => {
              resolve(Buffer.concat(chunks));
            });
          } else {
            reject(new Error(`Failed to fetch logo: ${response.statusCode}`));
          }
        });

        request.on("error", (error) => {
          reject(error);
        });

        request.end();
      });

      // Add logo to Excel - try to determine format from URL
      let extension = "png"; // default
      if (lawFirm.logo.includes(".jpg") || lawFirm.logo.includes(".jpeg")) {
        extension = "jpeg";
      } else if (lawFirm.logo.includes(".gif")) {
        extension = "gif";
      }

      const logoId = workbook.addImage({
        buffer: logoBuffer,
        extension: extension,
      });

      worksheet.addImage(logoId, {
        tl: { col: 0, row: 0 },
        ext: { width: 80, height: 80 },
      });

      // Adjust header position to accommodate logo
      worksheet.mergeCells("A3:D3");
      worksheet.getCell("A3").value = lawFirm.firmName;
      worksheet.getCell("A3").font = { size: 16, bold: true };
      worksheet.getCell("A3").alignment = { horizontal: "center" };

      worksheet.mergeCells("A4:D4");
      worksheet.getCell("A4").value = reportTitle;
      worksheet.getCell("A4").font = { size: 14, bold: true };
      worksheet.getCell("A4").alignment = { horizontal: "center" };

      worksheet.mergeCells("A5:D5");
      worksheet.getCell(
        "A5"
      ).value = `Generated on: ${new Date().toLocaleString()}`;
      worksheet.getCell("A5").font = { size: 10 };
      worksheet.getCell("A5").alignment = { horizontal: "center" };

      let currentRow = 7;
    } catch (error) {
      console.log("Failed to add logo to Excel:", error.message);
      // Fallback to text-only header
      worksheet.mergeCells("A1:D1");
      worksheet.getCell("A1").value = lawFirm.firmName;
      worksheet.getCell("A1").font = { size: 16, bold: true };
      worksheet.getCell("A1").alignment = { horizontal: "center" };

      worksheet.mergeCells("A2:D2");
      worksheet.getCell("A2").value = reportTitle;
      worksheet.getCell("A2").font = { size: 14, bold: true };
      worksheet.getCell("A2").alignment = { horizontal: "center" };

      worksheet.mergeCells("A3:D3");
      worksheet.getCell(
        "A3"
      ).value = `Generated on: ${new Date().toLocaleString()}`;
      worksheet.getCell("A3").font = { size: 10 };
      worksheet.getCell("A3").alignment = { horizontal: "center" };

      currentRow = 5;
    }
  } else {
    // No logo, use standard header
    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = lawFirm.firmName;
    worksheet.getCell("A1").font = { size: 16, bold: true };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.mergeCells("A2:D2");
    worksheet.getCell("A2").value = reportTitle;
    worksheet.getCell("A2").font = { size: 14, bold: true };
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    worksheet.mergeCells("A3:D3");
    worksheet.getCell(
      "A3"
    ).value = `Generated on: ${new Date().toLocaleString()}`;
    worksheet.getCell("A3").font = { size: 10 };
    worksheet.getCell("A3").alignment = { horizontal: "center" };

    currentRow = 5;
  }

  // Add content based on report type
  switch (reportType) {
    case "admin-cases":
      worksheet.getCell(`A${currentRow}`).value = "Admin's Own Cases Summary";
      worksheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      currentRow += 2;

      // Credit Cases
      worksheet.getCell(`A${currentRow}`).value = "Credit Cases:";
      worksheet.getCell(`A${currentRow}`).font = { size: 11, bold: true };
      currentRow++;

      if (
        reportData.adminCreditCases &&
        reportData.adminCreditCases.length > 0
      ) {
        worksheet.getCell(`A${currentRow}`).value = "Status";
        worksheet.getCell(`B${currentRow}`).value = "Count";
        worksheet.getCell(`C${currentRow}`).value = "Total Amount (KES)";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).font = { bold: true };
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow++;

        reportData.adminCreditCases.forEach((stat) => {
          worksheet.getCell(`A${currentRow}`).value = stat._id || "Unknown";
          worksheet.getCell(`B${currentRow}`).value = stat.count || 0;
          worksheet.getCell(`C${currentRow}`).value = stat.totalAmount || 0;
          currentRow++;
        });
      } else {
        worksheet.getCell(`A${currentRow}`).value = "No credit cases found";
        currentRow++;
      }

      currentRow++;

      // Legal Cases
      worksheet.getCell(`A${currentRow}`).value = "Legal Cases:";
      worksheet.getCell(`A${currentRow}`).font = { size: 11, bold: true };
      currentRow++;

      if (reportData.adminLegalCases && reportData.adminLegalCases.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = "Status";
        worksheet.getCell(`B${currentRow}`).value = "Count";
        worksheet.getCell(`C${currentRow}`).value = "Total Filing Fees (KES)";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).font = { bold: true };
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow++;

        reportData.adminLegalCases.forEach((stat) => {
          worksheet.getCell(`A${currentRow}`).value = stat._id || "Unknown";
          worksheet.getCell(`B${currentRow}`).value = stat.count || 0;
          worksheet.getCell(`C${currentRow}`).value = stat.totalFilingFees || 0;
          currentRow++;
        });
      } else {
        worksheet.getCell(`A${currentRow}`).value = "No legal cases found";
        currentRow++;
      }
      break;

    case "legal-performance":
      worksheet.getCell(`A${currentRow}`).value = "Legal Performance Summary";
      worksheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      currentRow += 2;

      // Cases by Status
      worksheet.getCell(`A${currentRow}`).value = "Cases by Status:";
      worksheet.getCell(`A${currentRow}`).font = { size: 11, bold: true };
      currentRow++;

      if (reportData.casesByStatus && reportData.casesByStatus.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = "Status";
        worksheet.getCell(`B${currentRow}`).value = "Count";
        worksheet.getCell(`C${currentRow}`).value = "Filing Fees (KES)";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).font = { bold: true };
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow++;

        reportData.casesByStatus.forEach((stat) => {
          worksheet.getCell(`A${currentRow}`).value = stat._id || "Unknown";
          worksheet.getCell(`B${currentRow}`).value = stat.count || 0;
          worksheet.getCell(`C${currentRow}`).value = stat.totalFilingFees || 0;
          currentRow++;
        });
      } else {
        worksheet.getCell(`A${currentRow}`).value = "No cases found";
        currentRow++;
      }
      break;

    case "debt-collection":
      worksheet.getCell(`A${currentRow}`).value =
        "Debt Collection Performance Summary";
      worksheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      currentRow += 2;

      // Cases by Status
      worksheet.getCell(`A${currentRow}`).value = "Cases by Status:";
      worksheet.getCell(`A${currentRow}`).font = { size: 11, bold: true };
      currentRow++;

      if (reportData.casesByStatus && reportData.casesByStatus.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = "Status";
        worksheet.getCell(`B${currentRow}`).value = "Count";
        worksheet.getCell(`C${currentRow}`).value = "Total Amount (KES)";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).font = { bold: true };
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow++;

        reportData.casesByStatus.forEach((stat) => {
          worksheet.getCell(`A${currentRow}`).value = stat._id || "Unknown";
          worksheet.getCell(`B${currentRow}`).value = stat.count || 0;
          worksheet.getCell(`C${currentRow}`).value = stat.totalAmount || 0;
          currentRow++;
        });
      } else {
        worksheet.getCell(`A${currentRow}`).value = "No cases found";
        currentRow++;
      }
      break;

    case "enhanced-revenue":
      worksheet.getCell(`A${currentRow}`).value = "Revenue Analytics Summary";
      worksheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      currentRow += 2;

      // Monthly Revenue
      worksheet.getCell(`A${currentRow}`).value = "Monthly Revenue:";
      worksheet.getCell(`A${currentRow}`).font = { size: 11, bold: true };
      currentRow++;

      if (reportData.filingFees && reportData.filingFees.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = "Month/Year";
        worksheet.getCell(`B${currentRow}`).value = "Filing Fees (KES)";
        worksheet.getCell(`C${currentRow}`).value = "Paid Filing Fees (KES)";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).font = { bold: true };
        worksheet.getCell(`C${currentRow}`).font = { bold: true };
        currentRow++;

        reportData.filingFees.forEach((fee) => {
          worksheet.getCell(
            `A${currentRow}`
          ).value = `${fee._id.month}/${fee._id.year}`;
          worksheet.getCell(`B${currentRow}`).value = fee.totalFilingFees || 0;
          worksheet.getCell(`C${currentRow}`).value = fee.paidFilingFees || 0;
          currentRow++;
        });
      } else {
        worksheet.getCell(`A${currentRow}`).value = "No revenue data found";
        currentRow++;
      }

      currentRow++;

      // Revenue by Department
      worksheet.getCell(`A${currentRow}`).value = "Revenue by Department:";
      worksheet.getCell(`A${currentRow}`).font = { size: 11, bold: true };
      currentRow++;

      if (
        reportData.revenueByDepartment &&
        reportData.revenueByDepartment.length > 0
      ) {
        worksheet.getCell(`A${currentRow}`).value = "Department";
        worksheet.getCell(`B${currentRow}`).value = "Total Filing Fees (KES)";
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        worksheet.getCell(`B${currentRow}`).font = { bold: true };
        currentRow++;

        reportData.revenueByDepartment.forEach((dept) => {
          worksheet.getCell(`A${currentRow}`).value =
            dept.departmentName || "Unknown";
          worksheet.getCell(`B${currentRow}`).value = dept.totalFilingFees || 0;
          currentRow++;
        });
      } else {
        worksheet.getCell(`A${currentRow}`).value =
          "No department revenue data found";
        currentRow++;
      }
      break;

    default:
      worksheet.getCell(`A${currentRow}`).value = "Law Firm Overview";
      worksheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      currentRow += 2;

      if (reportData) {
        worksheet.getCell(`A${currentRow}`).value = `Total Credit Cases: ${
          reportData.totalCreditCases || 0
        }`;
        currentRow++;
        worksheet.getCell(`A${currentRow}`).value = `Total Legal Cases: ${
          reportData.totalLegalCases || 0
        }`;
        currentRow++;
        worksheet.getCell(`A${currentRow}`).value = `Total Users: ${
          reportData.totalUsers || 0
        }`;
        currentRow++;
        worksheet.getCell(`A${currentRow}`).value = `Active Users: ${
          reportData.activeUsers || 0
        }`;
        currentRow++;
        worksheet.getCell(`A${currentRow}`).value = `Escalated Cases: ${
          reportData.escalatedCases || 0
        }`;
        currentRow++;
      } else {
        worksheet.getCell(`A${currentRow}`).value =
          "No overview data available";
        currentRow++;
      }
  }

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    column.width = Math.max(column.width || 10, 15);
  });

  // Return buffer
  return await workbook.xlsx.writeBuffer();
};

// GET /api/reports/credit-collection/performance/:lawFirmId
export const getCreditCollectionPerformance = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      (req.user.role === "credit_head" ||
        req.user.role === "law_firm_admin" ||
        req.user.role === "system_owner") &&
      lawFirmId !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Build query based on user role
    let caseQuery = { lawFirm: lawFirmId };
    if (req.user.role === "debt_collector") {
      caseQuery = { lawFirm: lawFirmId, assignedTo: req.user._id };
    }

    // Get credit cases by status
    const casesByStatus = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" },
          avgProcessingTime: {
            $avg: { $subtract: ["$updatedAt", "$createdAt"] },
          },
        },
      },
    ]);

    // Get cases by debt collector/credit head
    let assigneeQuery = { lawFirm: lawFirmId, assignedTo: { $ne: null } };
    if (req.user.role === "debt_collector") {
      assigneeQuery = { lawFirm: lawFirmId, assignedTo: req.user._id };
    }

    const casesByAssignee = await CreditCase.aggregate([
      { $match: assigneeQuery },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignee",
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          assigneeName: { $first: "$assignee.firstName" },
          assigneeLastName: { $first: "$assignee.lastName" },
          assigneeRole: { $first: "$assignee.role" },
          count: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          totalAmount: { $sum: "$debtAmount" },
          collectedAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "resolved"] }, "$debtAmount", 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Calculate overview metrics
    const totalCases = casesByStatus.reduce((sum, stat) => sum + stat.count, 0);
    const resolvedCases =
      casesByStatus.find((stat) => stat._id === "resolved")?.count || 0;
    const totalDebtAmount = casesByStatus.reduce(
      (sum, stat) => sum + stat.totalAmount,
      0
    );
    const collectedAmount = casesByStatus
      .filter((stat) => ["resolved", "closed"].includes(stat._id))
      .reduce((sum, stat) => sum + stat.totalAmount, 0);

    res.json({
      success: true,
      data: {
        overview: {
          totalCases,
          resolvedCases,
          totalDebtAmount,
          collectedAmount,
          resolutionRate: totalCases > 0 ? resolvedCases / totalCases : 0,
          collectionRate:
            totalDebtAmount > 0 ? collectedAmount / totalDebtAmount : 0,
          avgProcessingTime:
            casesByStatus.reduce(
              (sum, stat) => sum + (stat.avgProcessingTime || 0),
              0
            ) / casesByStatus.length,
        },
        casesByStatus,
        casesByAssignee,
      },
    });
  } catch (error) {
    console.error("Error fetching credit collection performance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch performance data",
    });
  }
};

// GET /api/reports/credit-collection/revenue/:lawFirmId
export const getCreditCollectionRevenue = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      (req.user.role === "credit_head" ||
        req.user.role === "law_firm_admin" ||
        req.user.role === "system_owner") &&
      lawFirmId !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Build query based on user role
    let paymentQuery = {
      lawFirm: lawFirmId,
      purpose: "escalation_fee",
      case: { $exists: true },
    };

    // For debt collectors, only show payments related to their cases
    if (req.user.role === "debt_collector") {
      // First get the debt collector's case IDs
      const userCases = await CreditCase.find(
        { lawFirm: lawFirmId, assignedTo: req.user._id },
        { _id: 1 }
      );
      const caseIds = userCases.map((case_) => case_._id);

      paymentQuery = {
        lawFirm: lawFirmId,
        purpose: "escalation_fee",
        case: { $exists: true },
        "case.caseId": { $in: caseIds },
      };
    }

    // Get escalation fees from Payment model
    const escalationFeesStats = await Payment.aggregate([
      {
        $match: paymentQuery,
      },
      {
        $lookup: {
          from: "creditcases",
          localField: "case.caseId",
          foreignField: "_id",
          as: "creditCase",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalEscalationFees: { $sum: "$amount" },
          paidEscalationFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
          pendingEscalationFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
          escalationCount: { $sum: 1 },
          paidEscalationCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pendingEscalationCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Calculate totals
    const totalEscalationFees = escalationFeesStats.reduce(
      (sum, stat) => sum + stat.totalEscalationFees,
      0
    );
    const totalPaidEscalationFees = escalationFeesStats.reduce(
      (sum, stat) => sum + stat.paidEscalationFees,
      0
    );
    const totalPendingEscalationFees = escalationFeesStats.reduce(
      (sum, stat) => sum + stat.pendingEscalationFees,
      0
    );

    // Get recent escalation fees
    const recentEscalationFees = await Payment.aggregate([
      {
        $match: {
          ...paymentQuery,
          createdAt: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalEscalationFees: { $sum: "$amount" },
          paidEscalationFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
          pendingEscalationFees: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
          escalationCount: { $sum: 1 },
          paidEscalationCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pendingEscalationCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalEscalationFees,
          totalPaidEscalationFees,
          totalPendingEscalationFees,
          paymentRate:
            totalEscalationFees > 0
              ? totalPaidEscalationFees / totalEscalationFees
              : 0,
        },
        recentRevenue: {
          escalationFees: recentEscalationFees[0]?.totalEscalationFees || 0,
          paidEscalationFees: recentEscalationFees[0]?.paidEscalationFees || 0,
          pendingEscalationFees:
            recentEscalationFees[0]?.pendingEscalationFees || 0,
        },
        monthlyRevenue: {
          escalationFees: escalationFeesStats,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching credit collection revenue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue data",
    });
  }
};

// GET /api/reports/credit-collection/promised-payments/:lawFirmId
export const getPromisedPaymentsAnalytics = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      (req.user.role === "credit_head" ||
        req.user.role === "debt_collector" ||
        req.user.role === "law_firm_admin" ||
        req.user.role === "system_owner") &&
      lawFirmId !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Build query based on user role
    let caseQuery = { lawFirm: lawFirmId };
    if (req.user.role === "debt_collector") {
      caseQuery = { lawFirm: lawFirmId, assignedTo: req.user._id };
    }

    // Get promised payments analytics
    const promisedPaymentsStats = await CreditCase.aggregate([
      { $match: caseQuery },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: {
            year: { $year: "$promisedPayments.promisedDate" },
            month: { $month: "$promisedPayments.promisedDate" },
          },
          totalAmount: { $sum: "$promisedPayments.amount" },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          overdueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "overdue"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          cancelledAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "cancelled"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          totalCount: { $sum: 1 },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ["$promisedPayments.status", "paid"] }, 1, 0],
            },
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ["$promisedPayments.status", "pending"] }, 1, 0],
            },
          },
          overdueCount: {
            $sum: {
              $cond: [{ $eq: ["$promisedPayments.status", "overdue"] }, 1, 0],
            },
          },
          cancelledCount: {
            $sum: {
              $cond: [{ $eq: ["$promisedPayments.status", "cancelled"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get promised payments by status
    const paymentsByStatus = await CreditCase.aggregate([
      { $match: caseQuery },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: "$promisedPayments.status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$promisedPayments.amount" },
          avgAmount: { $avg: "$promisedPayments.amount" },
        },
      },
    ]);

    // Get promised payments by debt collector
    const paymentsByCollector = await CreditCase.aggregate([
      { $match: caseQuery },
      { $unwind: "$promisedPayments" },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "collector",
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          collectorName: { $first: "$collector.firstName" },
          collectorLastName: { $first: "$collector.lastName" },
          count: { $sum: 1 },
          totalAmount: { $sum: "$promisedPayments.amount" },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
          overdueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "overdue"] },
                "$promisedPayments.amount",
                0,
              ],
            },
          },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Get upcoming payments (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingPayments = await CreditCase.aggregate([
      { $match: caseQuery },
      { $unwind: "$promisedPayments" },
      {
        $match: {
          "promisedPayments.promisedDate": {
            $gte: new Date(),
            $lte: thirtyDaysFromNow,
          },
          "promisedPayments.status": "pending",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$promisedPayments.promisedDate" },
            month: { $month: "$promisedPayments.promisedDate" },
            day: { $dayOfMonth: "$promisedPayments.promisedDate" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$promisedPayments.amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Calculate overview metrics
    const totalPromisedAmount = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.totalAmount,
      0
    );
    const totalPaidAmount = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.paidAmount,
      0
    );
    const totalPendingAmount = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.pendingAmount,
      0
    );
    const totalOverdueAmount = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.overdueAmount,
      0
    );

    const totalPromisedCount = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.totalCount,
      0
    );
    const totalPaidCount = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.paidCount,
      0
    );

    const paymentSuccessRate =
      totalPromisedCount > 0 ? (totalPaidCount / totalPromisedCount) * 100 : 0;
    const collectionRate =
      totalPromisedAmount > 0
        ? (totalPaidAmount / totalPromisedAmount) * 100
        : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalPromisedAmount,
          totalPaidAmount,
          totalPendingAmount,
          totalOverdueAmount,
          totalPromisedCount,
          totalPaidCount,
          paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
          collectionRate: Math.round(collectionRate * 100) / 100,
        },
        monthlyStats: promisedPaymentsStats,
        paymentsByStatus,
        paymentsByCollector,
        upcomingPayments,
      },
    });
  } catch (error) {
    console.error("Error fetching promised payments analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promised payments data",
    });
  }
};

/**
 * @desc    Get comprehensive credit collection summary with real statistics
 * @route   GET /api/reports/credit-collection/comprehensive-summary
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const getComprehensiveCreditCollectionSummary = async (req, res) => {
  try {
    const { user } = req;
    const { period = "30" } = req.query;
    
    if (!user.lawFirm) {
      return res.status(400).json({
        success: false,
        message: "User not associated with a law firm"
      });
    }

    const lawFirmId = user.lawFirm._id;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Build query based on user role
    let caseQuery = { lawFirm: lawFirmId };
    if (user.role === "debt_collector") {
      caseQuery = { lawFirm: lawFirmId, assignedTo: user._id };
    }

    // Get total cases count
    const totalCases = await CreditCase.countDocuments(caseQuery);
    
    // Get active cases (not resolved, not closed)
    const activeCases = await CreditCase.countDocuments({
      ...caseQuery,
      status: { $nin: ["resolved", "closed", "cancelled"] }
    });

    // Get resolved cases
    const resolvedCases = await CreditCase.countDocuments({
      ...caseQuery,
      status: { $in: ["resolved", "closed"] }
    });

    // Get cases by status
    const casesByStatus = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" }
        }
      }
    ]);

    // Get cases by priority
    const casesByPriority = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" }
        }
      }
    ]);

    // Get total debt amount
    const totalDebtAmount = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$debtAmount" }
        }
      }
    ]);

    // Get recent activity (last 10 cases)
    const recentActivity = await CreditCase.find(caseQuery)
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("assignedTo", "firstName lastName")
      .select("caseNumber status debtAmount priority updatedAt assignedTo debtorName");

    // Calculate success rate
    const successRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;

    // Get monthly trends for the last 6 months
    const monthlyTrends = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          newCases: { $sum: 1 },
          totalAmount: { $sum: "$debtAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      data: {
        totalCases,
        activeCases,
        resolvedCases,
        successRate,
        totalDebtAmount: totalDebtAmount[0]?.totalAmount || 0,
        casesByStatus,
        casesByPriority,
        recentActivity: recentActivity.map(case_ => ({
          caseNumber: case_.caseNumber,
          status: case_.status,
          debtAmount: case_.debtAmount,
          priority: case_.priority,
          updatedAt: case_.updatedAt,
          assignedTo: case_.assignedTo ? `${case_.assignedTo.firstName} ${case_.assignedTo.lastName}` : 'Unassigned',
          debtor: case_.debtorName || 'Unknown'
        })),
        monthlyTrends: monthlyTrends.map(trend => ({
          month: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
          newCases: trend.newCases,
          totalAmount: trend.totalAmount
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching comprehensive summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comprehensive summary"
    });
  }
};

/**
 * @desc    Get enhanced credit collection performance metrics
 * @route   GET /api/reports/credit-collection/enhanced-performance/:lawFirmId
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const getEnhancedCreditCollectionPerformance = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query;
    const { user } = req;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format"
      });
    }

    // Check authorization
    if (lawFirmId !== user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm"
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    let caseQuery = { lawFirm: lawFirmId };
    if (user.role === "debt_collector") {
      caseQuery = { lawFirm: lawFirmId, assignedTo: user._id };
    }

    // Get performance overview
    const performanceOverview = await CreditCase.aggregate([
      { $match: { 
        ...caseQuery,
        createdAt: { $gte: daysAgo }
      }},
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          activeCases: {
            $sum: {
              $cond: [
                { $not: { $in: ["$status", ["resolved", "closed", "cancelled"]] } },
                1,
                0
              ]
            }
          },
          resolvedCases: {
            $sum: {
              $cond: [
                { $in: ["$status", ["resolved", "closed"]] },
                1,
                0
              ]
            }
          },
          totalDebtAmount: { $sum: "$debtAmount" },
          avgDebtAmount: { $avg: "$debtAmount" }
        }
      }
    ]);

    // Get resolution time statistics
    const resolutionTimeStats = await CreditCase.aggregate([
      { $match: { ...caseQuery, status: { $in: ["resolved", "closed"] }, createdAt: { $gte: daysAgo } } },
      {
        $addFields: {
          resolutionTime: {
            $divide: [
              { $subtract: ["$updatedAt", "$createdAt"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: "$resolutionTime" },
          minResolutionTime: { $min: "$resolutionTime" },
          maxResolutionTime: { $max: "$resolutionTime" }
        }
      }
    ]);

    // Get cases by debt collector performance
    const collectorPerformance = await CreditCase.aggregate([
      { $match: { 
        ...caseQuery,
        createdAt: { $gte: daysAgo }
      }},
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "collector"
        }
      },
      {
        $group: {
          _id: "$assignedTo",
          collectorName: { $first: "$collector.firstName" },
          collectorLastName: { $first: "$collector.lastName" },
          totalCases: { $sum: 1 },
          activeCases: {
            $sum: {
              $cond: [
                { $not: { $in: ["$status", ["resolved", "closed", "cancelled"]] } },
                1,
                0
              ]
            }
          },
          resolvedCases: {
            $sum: {
              $cond: [
                { $in: ["$status", ["resolved", "closed"]] },
                1,
                0
              ]
            }
          },
          totalAmount: { $sum: "$debtAmount" }
        }
      },
      {
        $addFields: {
          successRate: {
            $cond: [
              { $gt: ["$totalCases", 0] },
              { $multiply: [{ $divide: ["$resolvedCases", "$totalCases"] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { successRate: -1 } }
    ]);

    // Get monthly performance trends
    const monthlyPerformance = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          newCases: { $sum: 1 },
          resolvedCases: {
            $sum: {
              $cond: [
                { $in: ["$status", ["resolved", "closed"]] },
                1,
                0
              ]
            }
          },
          totalAmount: { $sum: "$debtAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    const overview = performanceOverview[0] || {};
    const resolutionTime = resolutionTimeStats[0] || {};

    res.json({
      success: true,
      data: {
        overview: {
          totalCases: overview.totalCases || 0,
          activeCases: overview.activeCases || 0,
          resolvedCases: overview.resolvedCases || 0,
          successRate: overview.totalCases > 0 ? Math.round((overview.resolvedCases / overview.totalCases) * 100) : 0,
          totalDebtAmount: overview.totalDebtAmount || 0,
          avgDebtAmount: Math.round(overview.avgDebtAmount || 0),
          avgResolutionTime: Math.round(resolutionTime.avgResolutionTime || 0)
        },
        collectorPerformance: collectorPerformance.map(collector => ({
          name: `${collector.collectorName || 'Unknown'} ${collector.collectorLastName || ''}`,
          casesHandled: collector.totalCases,
          successRate: Math.round(collector.successRate || 0),
          avgResolutionTime: Math.round(resolutionTime.avgResolutionTime || 0)
        })),
        monthlyPerformance: monthlyPerformance.map(month => ({
          month: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
          newCases: month.newCases,
          resolvedCases: month.resolvedCases,
          totalAmount: month.totalAmount
        })),
        chartData: {
          labels: monthlyPerformance.map(month => `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`),
          datasets: [
            {
              label: 'Active Cases',
              data: monthlyPerformance.map(month => month.newCases - month.resolvedCases),
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 3,
              fill: true
            },
            {
              label: 'Resolved Cases',
              data: monthlyPerformance.map(month => month.resolvedCases),
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 3,
              fill: true
            }
          ]
        },
        assignedCases: await CreditCase.find(caseQuery).populate('assignedTo', 'firstName lastName email').lean() // Include individual cases for frontend charts
      }
    });
  } catch (error) {
    console.error("Error fetching enhanced performance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch performance data"
    });
  }
};

/**
 * @desc    Get enhanced credit collection revenue analytics
 * @route   GET /api/reports/credit-collection/enhanced-revenue/:lawFirmId
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const getEnhancedCreditCollectionRevenue = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query;
    const { user } = req;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format"
      });
    }

    if (lawFirmId !== user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm"
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    let caseQuery = { lawFirm: lawFirmId };
    if (user.role === "debt_collector") {
      caseQuery = { lawFirm: lawFirmId, assignedTo: user._id };
    }

    // Get collection fees from Payment model
    const collectionFeesStats = await Payment.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          purpose: "service_charge",
          status: "completed"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalCollectionFees: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    // Get escalation fees from Payment model
    const escalationFeesStats = await Payment.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          purpose: "escalation_fee",
          status: "completed"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalEscalationFees: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    // Get promised payments that are paid
    const promisedPaymentsStats = await CreditCase.aggregate([
      { $match: caseQuery },
      { $unwind: "$promisedPayments" },
      {
        $match: {
          "promisedPayments.status": "paid"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$promisedPayments.paidAt" },
            month: { $month: "$promisedPayments.paidAt" }
          },
          totalPromisedPayments: { $sum: "$promisedPayments.amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    // Get revenue overview
    const revenueOverview = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: null,
          totalDebtAmount: { $sum: "$debtAmount" },
          avgDebtAmount: { $avg: "$debtAmount" }
        }
      }
    ]);

    // Calculate total revenue from all sources
    const totalCollectionFees = collectionFeesStats.reduce(
      (sum, stat) => sum + stat.totalCollectionFees,
      0
    );
    const totalEscalationFees = escalationFeesStats.reduce(
      (sum, stat) => sum + stat.totalEscalationFees,
      0
    );
    const totalPromisedPayments = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.totalPromisedPayments,
      0
    );

    // Get monthly revenue trends by combining all sources
    const monthlyRevenue = [];
    const allMonths = new Set();
    
    // Collect all months from different sources
    collectionFeesStats.forEach(stat => allMonths.add(`${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`));
    escalationFeesStats.forEach(stat => allMonths.add(`${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`));
    promisedPaymentsStats.forEach(stat => allMonths.add(`${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`));

    // Sort months and take last 6
    const sortedMonths = Array.from(allMonths).sort().slice(-6);

    sortedMonths.forEach(monthStr => {
      const [year, month] = monthStr.split('-');
      const collectionFees = collectionFeesStats.find(stat => 
        `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}` === monthStr
      )?.totalCollectionFees || 0;
      const escalationFees = escalationFeesStats.find(stat => 
        `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}` === monthStr
      )?.totalEscalationFees || 0;
      const promisedPayments = promisedPaymentsStats.find(stat => 
        `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}` === monthStr
      )?.totalPromisedPayments || 0;

      monthlyRevenue.push({
        month: monthStr,
        collectionFees,
        escalationFees,
        promisedPayments,
        totalRevenue: collectionFees + escalationFees + promisedPayments
      });
    });

    // Get revenue by case status
    const revenueByStatus = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: "$status",
          totalDebtAmount: { $sum: "$debtAmount" },
          caseCount: { $sum: 1 }
        }
      }
    ]);

    // Get revenue by priority
    const revenueByPriority = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: "$priority",
          totalDebtAmount: { $sum: "$debtAmount" },
          caseCount: { $sum: 1 }
        }
      }
    ]);

    const overview = revenueOverview[0] || {};

    // Calculate monthly growth
    let monthlyGrowth = "N/A";
    if (monthlyRevenue.length >= 2) {
      const currentMonth = monthlyRevenue[monthlyRevenue.length - 1];
      const previousMonth = monthlyRevenue[monthlyRevenue.length - 2];
      const currentTotal = currentMonth.totalRevenue;
      const previousTotal = previousMonth.totalRevenue;
      
      if (previousTotal > 0) {
        monthlyGrowth = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
      }
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue: totalCollectionFees + totalEscalationFees + totalPromisedPayments,
          totalCollectionFees,
          totalEscalationFees,
          totalPromisedPayments,
          totalDebtAmount: overview.totalDebtAmount || 0,
          avgDebtAmount: Math.round(overview.avgDebtAmount || 0),
          monthlyGrowth: monthlyGrowth
        },
        monthlyRevenue,
        revenueByStatus,
        revenueByPriority,
        chartData: {
          labels: monthlyRevenue.map(month => month.month),
          datasets: [
            {
              label: 'Collection Fees',
              data: monthlyRevenue.map(month => month.collectionFees),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2
            },
            {
              label: 'Escalation Fees',
              data: monthlyRevenue.map(month => month.escalationFees),
              backgroundColor: 'rgba(147, 51, 234, 0.8)',
              borderColor: 'rgba(147, 51, 234, 1)',
              borderWidth: 2
            },
            {
              label: 'Promised Payments',
              data: monthlyRevenue.map(month => month.promisedPayments),
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 2
            }
          ]
        }
      }
    });
  } catch (error) {
    console.error("Error fetching enhanced revenue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue data"
    });
  }
};

/**
 * @desc    Get enhanced promised payments analytics with real data
 * @route   GET /api/reports/credit-collection/enhanced-promised-payments/:lawFirmId
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const getEnhancedPromisedPaymentsAnalytics = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query;
    const { user } = req;

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format"
      });
    }

    if (lawFirmId !== user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm"
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // For all data, filter by assignedTo for debt collectors
    let caseQuery = { lawFirm: lawFirmId };
    let promisedPaymentsQuery = { lawFirm: lawFirmId };
    
    if (user.role === "debt_collector") {
      caseQuery = { lawFirm: lawFirmId, assignedTo: user._id };
      promisedPaymentsQuery = { lawFirm: lawFirmId, assignedTo: user._id };
    }

    // Get promised payments overview
    const promisedPaymentsOverview = await CreditCase.aggregate([
      { $match: promisedPaymentsQuery },
      { $match: { "promisedPayments.0": { $exists: true } } },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: null,
          totalPromisedAmount: { $sum: "$promisedPayments.amount" },
          totalPaidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          totalPendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          totalOverdueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "overdue"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          totalPromisedCount: { $sum: 1 },
          totalPaidCount: {
            $sum: {
              $cond: [{ $eq: ["$promisedPayments.status", "paid"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get monthly promised payments trends
    const monthlyPromisedPayments = await CreditCase.aggregate([
      { $match: promisedPaymentsQuery },
      { $match: { "promisedPayments.0": { $exists: true } } },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: {
            year: { $year: "$promisedPayments.promisedDate" },
            month: { $month: "$promisedPayments.promisedDate" }
          },
          promisedAmount: { $sum: "$promisedPayments.amount" },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0
              ]
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    // Get recent promised payments
    const recentPromisedPayments = await CreditCase.aggregate([
      { $match: promisedPaymentsQuery },
      { $match: { "promisedPayments.0": { $exists: true } } },
      { $unwind: "$promisedPayments" },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "collector"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "debtor",
          foreignField: "_id",
          as: "debtorInfo"
        }
      },
      {
        $project: {
          caseNumber: 1,
          debtorName: {
            $cond: [
              { $gt: [{ $size: "$debtorInfo" }, 0] },
              {
                $concat: [
                  { $ifNull: ["$debtorInfo.firstName", ""] },
                  " ",
                  { $ifNull: ["$debtorInfo.lastName", ""] }
                ]
              },
              "Unknown"
            ]
          },
          amount: "$promisedPayments.amount",
          dueDate: "$promisedPayments.promisedDate",
          status: "$promisedPayments.status",
          collectorName: {
            $cond: [
              { $gt: [{ $size: "$collector" }, 0] },
              {
                $concat: [
                  { $ifNull: ["$collector.firstName", ""] },
                  " ",
                  { $ifNull: ["$collector.lastName", ""] }
                ]
              },
              "Unassigned"
            ]
          }
        }
      },
      { $sort: { dueDate: -1 } },
      { $limit: 20 }
    ]);

    const overview = promisedPaymentsOverview[0] || {};

    // Calculate payment rate
    const paymentRate = overview.totalPromisedCount > 0 
      ? Math.round((overview.totalPaidCount / overview.totalPromisedCount) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalPromisedAmount: overview.totalPromisedAmount || 0,
          totalPaidAmount: overview.totalPaidAmount || 0,
          totalPendingAmount: overview.totalPendingAmount || 0,
          totalOverdueAmount: overview.totalOverdueAmount || 0,
          totalPromisedCount: overview.totalPromisedCount || 0,
          totalPaidCount: overview.totalPaidCount || 0,
          paymentRate: paymentRate
        },
        monthlyPromisedPayments: monthlyPromisedPayments.map(month => ({
          month: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
          promisedAmount: month.promisedAmount,
          paidAmount: month.paidAmount,
          pendingAmount: month.pendingAmount
        })),
        recentPromisedPayments: recentPromisedPayments.map(payment => ({
          caseNumber: payment.caseNumber,
          debtorName: payment.debtorName,
          amount: payment.amount,
          dueDate: payment.dueDate,
          status: payment.status,
          collectorName: payment.collectorName
        })),
        chartData: {
          labels: monthlyPromisedPayments.map(month => `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`),
          datasets: [
            {
              label: 'Promised Amount',
              data: monthlyPromisedPayments.map(month => month.promisedAmount),
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 2
            },
            {
              label: 'Paid Amount',
              data: monthlyPromisedPayments.map(month => month.paidAmount),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2
            }
          ]
        }
      }
    });
  } catch (error) {
    console.error("Error fetching enhanced promised payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch promised payments data"
    });
  }
};

/**
 * @desc    Download credit collection CSV with real data
 * @route   GET /api/reports/credit-collection/download-csv
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const downloadCreditCollectionCSV = async (req, res) => {
  try {
    const { user } = req;
    const { period = "30", department = "all" } = req.query;

    if (!user.lawFirm) {
      return res.status(400).json({
        success: false,
        message: "User not associated with a law firm"
      });
    }

    const lawFirmId = user.lawFirm._id;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    let caseQuery = { lawFirm: lawFirmId };
    if (user.role === "debt_collector") {
      caseQuery = { lawFirm: lawFirmId, assignedTo: user._id };
    }

    // Get cases for CSV
    const cases = await CreditCase.find(caseQuery)
      .populate("assignedTo", "firstName lastName")
      .populate("lawFirm", "name")
      .sort({ createdAt: -1 });

    // Prepare CSV data with promised payments
    const csvData = cases.map(case_ => {
      const promisedPayments = case_.promisedPayments || [];
      const totalPromised = promisedPayments.reduce((sum, pp) => sum + (pp.amount || 0), 0);
      const totalPaid = promisedPayments.reduce((sum, pp) => sum + (pp.status === 'paid' ? (pp.amount || 0) : 0), 0);
      const totalPending = promisedPayments.reduce((sum, pp) => sum + (pp.status === 'pending' ? (pp.amount || 0) : 0), 0);
      
      return {
        "Case Number": case_.caseNumber,
        "Debtor": case_.debtorName || "Unknown",
        "Debt Amount (KSH)": case_.debtAmount,
        "Status": case_.status,
        "Priority": case_.priority,
        "Assigned To": case_.assignedTo ? `${case_.assignedTo.firstName} ${case_.assignedTo.lastName}` : "Unassigned",
        "Created Date": case_.createdAt.toLocaleDateString(),
        "Last Updated": case_.updatedAt.toLocaleDateString(),
        "Total Promised Amount (KSH)": totalPromised,
        "Total Paid Amount (KSH)": totalPaid,
        "Total Pending Amount (KSH)": totalPending,
        "Payment Rate (%)": totalPromised > 0 ? Math.round((totalPaid / totalPromised) * 100) : 0
      };
    });

    // Add summary row
    const totalPromised = csvData.reduce((sum, row) => sum + (row["Total Promised Amount"] || 0), 0);
    const totalPaid = csvData.reduce((sum, row) => sum + (row["Total Paid Amount"] || 0), 0);
    const totalPending = csvData.reduce((sum, row) => sum + (row["Total Pending Amount"] || 0), 0);
    const totalDebt = csvData.reduce((sum, row) => sum + (row["Debt Amount"] || 0), 0);
    
    const summaryRow = {
      "Case Number": "SUMMARY",
      "Debtor": "",
      "Debt Amount (KSH)": totalDebt,
      "Status": "",
      "Priority": "",
      "Assigned To": "",
      "Created Date": "",
      "Last Updated": "",
      "Total Promised Amount (KSH)": totalPromised,
      "Total Paid Amount (KSH)": totalPaid,
      "Total Pending Amount (KSH)": totalPending,
      "Payment Rate (%)": totalPromised > 0 ? Math.round((totalPaid / totalPromised) * 100) : 0
    };
    
    const csvWithSummary = [summaryRow, ...csvData];
    
    const parser = new Parser();
    const csv = parser.parse(csvWithSummary);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=credit-collection-report-${new Date().toISOString().split('T')[0]}.csv`);
    
    res.send(csv);
  } catch (error) {
    console.error("Error downloading CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download CSV"
    });
  }
};

/**
 * @desc    Download credit collection PDF with real data
 * @route   GET /api/reports/credit-collection/download-pdf
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const downloadCreditCollectionPDF = async (req, res) => {
  try {
    const { user } = req;
    const { period = "30", department = "all" } = req.query;

    if (!user.lawFirm) {
      return res.status(400).json({
        success: false,
        message: "User not associated with a law firm"
      });
    }

    const lawFirmId = user.lawFirm._id;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    let caseQuery = { lawFirm: lawFirmId };
    if (user.role === "debt_collector") {
      caseQuery = { lawFirm: lawFirmId, assignedTo: user._id };
    }

    // Get summary data with promised payments
    const summary = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          totalDebtAmount: { $sum: "$debtAmount" },
          totalCollectionFees: { $sum: 0 },
          totalEscalationFees: { $sum: 0 }
        }
      }
    ]);

    // Get promised payments summary
    const promisedPaymentsSummary = await CreditCase.aggregate([
      { $match: caseQuery },
      { $match: { "promisedPayments.0": { $exists: true } } },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: null,
          totalPromisedAmount: { $sum: "$promisedPayments.amount" },
          totalPaidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          totalPendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0
              ]
            }
          }
        }
      }
    ]);

    const summaryData = summary[0] || {};

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=credit-collection-report-${new Date().toISOString().split('T')[0]}.pdf`);

    doc.pipe(res);

    // Set up beautiful styling
    const pageWidth = doc.page.width - 100;
    const margin = 50;
    
    // Header with gradient-like effect
    doc.rect(margin, 50, pageWidth, 60).fill('#1e293b');
    doc.fontSize(24).fillColor('#ffffff').text("Credit Collection Report", margin + 20, 70, { width: pageWidth - 40, align: "center" });
    
    // Generation info
    doc.fillColor('#64748b').fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 130);
    doc.fillColor('#64748b').fontSize(10).text(`Period: Last ${period} days`, margin, 145);
    
    let yPosition = 180;
    
    // Summary section with beautiful card design
    doc.rect(margin, yPosition, pageWidth, 120).fill('#f8fafc').stroke('#e2e8f0');
    doc.fillColor('#1e293b').fontSize(18).text("Summary", margin + 20, yPosition + 20);
    
    const summaryItems = [
      { label: "Total Cases", value: summaryData.totalCases || 0, color: '#3b82f6' },
      { label: "Total Debt Amount", value: `KSH ${(summaryData.totalDebtAmount || 0).toLocaleString()}`, color: '#10b981' },
      { label: "Total Collection Fees", value: `KSH ${(summaryData.totalCollectionFees || 0).toLocaleString()}`, color: '#f59e0b' },
      { label: "Total Escalation Fees", value: `KSH ${(summaryData.totalEscalationFees || 0).toLocaleString()}`, color: '#ef4444' }
    ];
    
    summaryItems.forEach((item, index) => {
      const x = margin + 20 + (index % 2) * (pageWidth / 2 - 20);
      const y = yPosition + 50 + Math.floor(index / 2) * 30;
      
      doc.fillColor('#64748b').fontSize(10).text(item.label, x, y);
      doc.fillColor(item.color).fontSize(14).font('Helvetica-Bold').text(item.value.toString(), x, y + 15);
    });
    
    yPosition += 140;
    
    // Promised Payments section with beautiful card design
    doc.rect(margin, yPosition, pageWidth, 120).fill('#f0f9ff').stroke('#0ea5e9');
    doc.fillColor('#1e293b').fontSize(18).text("Promised Payments Summary", margin + 20, yPosition + 20);
    
    const promisedData = promisedPaymentsSummary[0] || {};
    const promisedItems = [
      { label: "Total Promised Amount", value: `KSH ${(promisedData.totalPromisedAmount || 0).toLocaleString()}`, color: '#059669' },
      { label: "Total Paid Amount", value: `KSH ${(promisedData.totalPaidAmount || 0).toLocaleString()}`, color: '#dc2626' },
      { label: "Total Pending Amount", value: `KSH ${(promisedData.totalPendingAmount || 0).toLocaleString()}`, color: '#7c3aed' },
      { label: "Payment Rate", value: `${promisedData.totalPromisedAmount > 0 ? Math.round((promisedData.totalPaidAmount / promisedData.totalPromisedAmount) * 100) : 0}%`, color: '#ea580c' }
    ];
    
    promisedItems.forEach((item, index) => {
      const x = margin + 20 + (index % 2) * (pageWidth / 2 - 20);
      const y = yPosition + 50 + Math.floor(index / 2) * 30;
      
      doc.fillColor('#64748b').fontSize(10).text(item.label, x, y);
      doc.fillColor(item.color).fontSize(14).font('Helvetica-Bold').text(item.value.toString(), x, y + 15);
    });
    
    yPosition += 140;
    
    // Add recent cases table
    const recentCases = await CreditCase.find(caseQuery)
      .populate("assignedTo", "firstName lastName")
      .sort({ updatedAt: -1 })
      .limit(10);
    
    if (recentCases.length > 0) {
      doc.rect(margin, yPosition, pageWidth, 200).fill('#fefefe').stroke('#e2e8f0');
      doc.fillColor('#1e293b').fontSize(16).text("Recent Cases", margin + 20, yPosition + 20);
      
      // Table headers
      const tableHeaders = ["Case", "Debtor", "Amount (KSH)", "Status", "Assigned To"];
      const columnWidths = [80, 120, 100, 80, 120];
      let tableX = margin + 20;
      
      doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, index) => {
        doc.text(header, tableX, yPosition + 50);
        tableX += columnWidths[index];
      });
      
      // Table rows
      let rowY = yPosition + 70;
      doc.fontSize(9);
      
      recentCases.forEach((case_, index) => {
        if (rowY > doc.page.height - 100) {
          doc.addPage();
          rowY = 50;
        }
        
        tableX = margin + 20;
        doc.fillColor('#1e293b').text(case_.caseNumber, tableX, rowY);
        tableX += columnWidths[0];
        
        doc.fillColor('#64748b').text(case_.debtorName || "Unknown", tableX, rowY);
        tableX += columnWidths[1];
        
        doc.fillColor('#10b981').text(case_.debtAmount?.toLocaleString() || "0", tableX, rowY);
        tableX += columnWidths[2];
        
        const statusColor = case_.status === 'resolved' ? '#10b981' : case_.status === 'in_progress' ? '#3b82f6' : '#f59e0b';
        doc.fillColor(statusColor).text(case_.status, tableX, rowY);
        tableX += columnWidths[3];
        
        doc.fillColor('#64748b').text(case_.assignedTo ? `${case_.assignedTo.firstName} ${case_.assignedTo.lastName}` : "Unassigned", tableX, rowY);
        
        rowY += 20;
      });
      
      yPosition += 220;
    }
    
    // Add a footer
    doc.fillColor('#64748b').fontSize(8).text("Generated by Credit Collection System", margin, doc.page.height - 50, { width: pageWidth, align: "center" });

    doc.end();
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download PDF"
    });
  }
};

/**
 * @desc    Get accountant dashboard data (financial tracking, department reviews, targets)
 * @route   GET /api/reports/accountant-dashboard/:lawFirmId
 * @access  Private (accountant, law_firm_admin)
 */
export const getAccountantDashboard = async (req, res) => {
  try {
    const { lawFirmId } = req.params;
    const { period = "30" } = req.query; // days

    if (!validateObjectId(lawFirmId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid law firm ID format",
      });
    }

    // Check if user has access to this law firm
    if (
      req.user.role === "accountant" &&
      lawFirmId !== req.user.lawFirm._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to law firm",
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // 1. Financial Tracking - Money coming into the company
    const [legalCases, creditCases, payments, departments, revenueTargets] = await Promise.all([
      LegalCase.find({ lawFirm: lawFirmId })
        .populate("client", "firstName lastName email")
        .lean(),
      CreditCase.find({ lawFirm: lawFirmId })
        .populate("client", "firstName lastName email")
        .lean(),
      Payment.find({ 
        lawFirm: lawFirmId, 
        status: "completed",
        createdAt: { $gte: daysAgo }
      })
      .populate("client", "firstName lastName email")
      .lean(),
      Department.find({ lawFirm: lawFirmId, isActive: true }).lean(),
      RevenueTarget.find({ lawFirm: lawFirmId }).populate("department", "name code").lean()
    ]);

    // Calculate total money collected
    const totalMoneyCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Filing fees from legal cases
    const paidFilingFees = legalCases
      .filter(c => c.filingFee && c.filingFee.paid)
      .reduce((sum, c) => sum + (c.filingFee.amount || 0), 0);

    // Payments from legal cases
    const legalCasePayments = legalCases.reduce((sum, c) => {
      if (c.payments && Array.isArray(c.payments)) {
        return sum + c.payments.reduce((pSum, p) => pSum + (p.amount || 0), 0);
      }
      return sum;
    }, 0);

    // Money recovered from credit cases
    const creditCasePayments = creditCases.reduce((sum, c) => {
      if (c.promisedPayments && Array.isArray(c.promisedPayments)) {
        return sum + c.promisedPayments
          .filter(pp => pp.status === "paid")
          .reduce((pSum, p) => pSum + (p.amount || 0), 0);
      }
      return sum;
    }, 0);

    // Recent payments - combine payments from Payment collection, legal cases, and credit cases
    const allRecentPayments = [];
    
    // 1. Payments from Payment collection
    payments.forEach(p => {
      allRecentPayments.push({
        _id: p._id,
        id: p._id,
        paymentId: p.paymentId,
        amount: p.amount,
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        purpose: p.purpose,
        status: p.status,
        createdAt: p.createdAt,
        paymentDate: p.createdAt,
        client: p.client ? {
          _id: p.client._id,
          firstName: p.client.firstName,
          lastName: p.client.lastName,
          email: p.client.email
        } : null,
        case: p.case
      });
    });
    
    // 2. Payments from legal cases (filing fees and case payments)
    legalCases.forEach(legalCase => {
      // Filing fees
      if (legalCase.filingFee && legalCase.filingFee.paid && legalCase.filingFee.paidAt >= daysAgo) {
        allRecentPayments.push({
          _id: legalCase._id,
          id: `filing-${legalCase._id}`,
          paymentId: `FILING-${legalCase.caseNumber || legalCase._id}`,
          amount: legalCase.filingFee.amount,
          currency: legalCase.filingFee.currency || "KES",
          paymentMethod: "bank_transfer", // Default
          purpose: "filing_fee",
          status: "completed",
          createdAt: legalCase.filingFee.paidAt,
          paymentDate: legalCase.filingFee.paidAt,
          client: legalCase.client ? {
            _id: legalCase.client._id || legalCase.client,
            firstName: legalCase.client.firstName,
            lastName: legalCase.client.lastName,
            email: legalCase.client.email
          } : null,
          case: {
            caseId: legalCase._id,
            caseType: "legal",
            caseNumber: legalCase.caseNumber
          }
        });
      }
      
      // Case payments
      if (legalCase.payments && Array.isArray(legalCase.payments)) {
        legalCase.payments.forEach(payment => {
          if (new Date(payment.paymentDate || payment.createdAt) >= daysAgo) {
            allRecentPayments.push({
              _id: payment._id || `${legalCase._id}-${payment.paymentDate}`,
              id: `legal-payment-${legalCase._id}-${payment.paymentDate}`,
              paymentId: `LEGAL-${legalCase.caseNumber || legalCase._id}`,
              amount: payment.amount,
              currency: payment.currency || "KES",
              paymentMethod: payment.paymentMethod || "bank_transfer",
              purpose: "case_payment",
              status: "completed",
              createdAt: payment.paymentDate || payment.createdAt,
              paymentDate: payment.paymentDate || payment.createdAt,
              client: legalCase.client ? {
                _id: legalCase.client._id || legalCase.client,
                firstName: legalCase.client.firstName,
                lastName: legalCase.client.lastName,
                email: legalCase.client.email
              } : null,
              case: {
                caseId: legalCase._id,
                caseType: "legal",
                caseNumber: legalCase.caseNumber
              }
            });
          }
        });
      }
    });
    
    // 3. Payments from credit cases (promised payments that are paid)
    creditCases.forEach(creditCase => {
      if (creditCase.promisedPayments && Array.isArray(creditCase.promisedPayments)) {
        creditCase.promisedPayments.forEach(promisedPayment => {
          if (promisedPayment.status === "paid" && promisedPayment.paidAt && new Date(promisedPayment.paidAt) >= daysAgo) {
            allRecentPayments.push({
              _id: promisedPayment._id || `${creditCase._id}-${promisedPayment.paidAt}`,
              id: `credit-payment-${creditCase._id}-${promisedPayment.paidAt}`,
              paymentId: `CREDIT-${creditCase.caseNumber || creditCase._id}`,
              amount: promisedPayment.amount,
              currency: promisedPayment.currency || "KES",
              paymentMethod: promisedPayment.paymentMethod || "bank_transfer",
              purpose: "credit_collection",
              status: "completed",
              createdAt: promisedPayment.paidAt,
              paymentDate: promisedPayment.paidAt,
              client: creditCase.client ? {
                _id: creditCase.client._id || creditCase.client,
                firstName: creditCase.client.firstName,
                lastName: creditCase.client.lastName,
                email: creditCase.client.email
              } : null,
              case: {
                caseId: creditCase._id,
                caseType: "credit",
                caseNumber: creditCase.caseNumber
              }
            });
          }
        });
      }
    });
    
    // Sort by date and limit to most recent
    const recentPayments = allRecentPayments
      .sort((a, b) => new Date(b.createdAt || b.paymentDate) - new Date(a.createdAt || a.paymentDate))
      .slice(0, 50); // Increased limit to show more payments

    // 2. Department Reviews
    const departmentReviews = await Promise.all(
      departments.map(async (dept) => {
        const deptLegalCases = legalCases.filter(c => 
          c.department?.toString() === dept._id.toString()
        );
        const deptCreditCases = creditCases.filter(c => 
          c.department?.toString() === dept._id.toString()
        );

        // Calculate department revenue
        const deptFilingFees = deptLegalCases
          .filter(c => c.filingFee && c.filingFee.paid)
          .reduce((sum, c) => sum + (c.filingFee.amount || 0), 0);

        const deptLegalPayments = deptLegalCases.reduce((sum, c) => {
          if (c.payments && Array.isArray(c.payments)) {
            return sum + c.payments.reduce((pSum, p) => pSum + (p.amount || 0), 0);
          }
          return sum;
        }, 0);

        const deptCreditPayments = deptCreditCases.reduce((sum, c) => {
          if (c.promisedPayments && Array.isArray(c.promisedPayments)) {
            return sum + c.promisedPayments
              .filter(pp => pp.status === "paid")
              .reduce((pSum, p) => pSum + (p.amount || 0), 0);
          }
          return sum;
        }, 0);

        const deptRevenue = deptFilingFees + deptLegalPayments + deptCreditPayments;

        // Get department target
        const deptTarget = revenueTargets.find(t => 
          t.department && t.department._id.toString() === dept._id.toString()
        );

        return {
          id: dept._id,
          name: dept.name,
          code: dept.code,
          departmentType: dept.departmentType,
          totalCases: deptLegalCases.length + deptCreditCases.length,
          activeCases: deptLegalCases.filter(c => c.status !== "closed" && c.status !== "resolved").length +
                      deptCreditCases.filter(c => c.status !== "closed" && c.status !== "resolved").length,
          revenue: deptRevenue,
          yearlyTarget: deptTarget?.yearlyTarget || 0,
          targetProgress: deptTarget ? (deptRevenue / deptTarget.yearlyTarget) * 100 : 0,
          targetYear: deptTarget?.year || new Date().getFullYear()
        };
      })
    );

    // 3. Target Monitoring
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const targetMonitoring = revenueTargets
      .filter(t => t.year === currentYear)
      .map(target => {
        const deptId = target.department?._id?.toString();
        const deptLegalCases = deptId ? legalCases.filter(c => 
          c.department?.toString() === deptId
        ) : legalCases;
        const deptCreditCases = deptId ? creditCases.filter(c => 
          c.department?.toString() === deptId
        ) : creditCases;

        // Calculate actual revenue
        const actualRevenue = 
          deptLegalCases
            .filter(c => c.filingFee && c.filingFee.paid)
            .reduce((sum, c) => sum + (c.filingFee.amount || 0), 0) +
          deptLegalCases.reduce((sum, c) => {
            if (c.payments && Array.isArray(c.payments)) {
              return sum + c.payments.reduce((pSum, p) => pSum + (p.amount || 0), 0);
            }
            return sum;
          }, 0) +
          deptCreditCases.reduce((sum, c) => {
            if (c.promisedPayments && Array.isArray(c.promisedPayments)) {
              return sum + c.promisedPayments
                .filter(pp => pp.status === "paid")
                .reduce((pSum, p) => pSum + (p.amount || 0), 0);
            }
            return sum;
          }, 0);

        // Get monthly target
        const monthlyTarget = target.monthlyTargets?.find(mt => mt.month === currentMonth);
        const monthlyTargetAmount = monthlyTarget?.target || 0;

        // Calculate monthly actual (simplified - would need date filtering in real implementation)
        const monthlyActual = actualRevenue / 12; // Simplified calculation

        return {
          id: target._id,
          department: target.department ? {
            id: target.department._id,
            name: target.department.name,
            code: target.department.code
          } : null,
          yearlyTarget: target.yearlyTarget,
          actualRevenue: actualRevenue,
          progress: (actualRevenue / target.yearlyTarget) * 100,
          monthlyTarget: monthlyTargetAmount,
          monthlyActual: monthlyActual,
          monthlyProgress: monthlyTargetAmount > 0 ? (monthlyActual / monthlyTargetAmount) * 100 : 0,
          year: target.year,
          isOnTrack: (actualRevenue / target.yearlyTarget) * 100 >= ((currentMonth / 12) * 100) - 10 // 10% tolerance
        };
      });

    res.json({
      success: true,
      data: {
        financialTracking: {
          totalMoneyCollected,
          paidFilingFees,
          legalCasePayments,
          creditCasePayments,
          recentPayments,
          period: parseInt(period)
        },
        departmentReviews,
        targetMonitoring,
        summary: {
          totalDepartments: departments.length,
          totalRevenue: totalMoneyCollected + paidFilingFees + legalCasePayments + creditCasePayments,
          totalTargets: revenueTargets.length,
          averageTargetProgress: targetMonitoring.length > 0 
            ? targetMonitoring.reduce((sum, t) => sum + t.progress, 0) / targetMonitoring.length 
            : 0
        }
      }
    });
  } catch (error) {
    console.error("Error in getAccountantDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching accountant dashboard data",
      error: error.message,
    });
  }
};
