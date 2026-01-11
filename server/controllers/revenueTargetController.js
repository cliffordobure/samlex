import RevenueTarget from "../models/RevenueTarget.js";
import Department from "../models/Department.js";
import Payment from "../models/Payment.js";
import LegalCase from "../models/LegalCase.js";
import CreditCase from "../models/CreditCase.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

/**
 * @desc    Create or update revenue target for a year
 * @route   POST /api/revenue-targets
 * @access  Private (law_firm_admin, credit_head, legal_head)
 */
export const createOrUpdateRevenueTarget = asyncHandler(async (req, res) => {
  const { year, departmentId, yearlyTarget } = req.body;
  const userId = req.user._id;
  const lawFirmId = req.user.lawFirm?._id || req.user.lawFirm;

  if (!lawFirmId) {
    return res.status(403).json({
      success: false,
      message: "User must be associated with a law firm",
    });
  }

  // Validate year (should be current year or future)
  const currentYear = new Date().getFullYear();
  if (year < currentYear) {
    return res.status(400).json({
      success: false,
      message: "Cannot set targets for past years",
    });
  }

  // Validate yearly target
  if (!yearlyTarget || yearlyTarget <= 0) {
    return res.status(400).json({
      success: false,
      message: "Yearly target must be greater than 0",
    });
  }

  // Check authorization
  // Department heads can only set targets for their own department
  if (req.user.role === "credit_head" || req.user.role === "legal_head") {
    if (!departmentId) {
      return res.status(403).json({
        success: false,
        message: "Department heads must specify a department",
      });
    }

    // Verify the department belongs to the user's law firm
    const department = await Department.findOne({
      _id: departmentId,
      lawFirm: lawFirmId,
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Verify user is head of this department
    // This assumes department heads have a department field
    // Adjust based on your user model structure
  }

  // Check if target already exists
  const existingTarget = await RevenueTarget.findOne({
    year,
    lawFirm: lawFirmId,
    department: departmentId || null,
  });

  // Create revenue target instance and calculate breakdowns
  const revenueTarget = existingTarget || new RevenueTarget({
    year,
    lawFirm: lawFirmId,
    department: departmentId || null,
    yearlyTarget,
    createdBy: userId,
  });

  revenueTarget.yearlyTarget = yearlyTarget;
  revenueTarget.updatedBy = userId;
  revenueTarget.calculateMonthlyTargets();

  await revenueTarget.save();

  res.status(existingTarget ? 200 : 201).json({
    success: true,
    message: existingTarget
      ? "Revenue target updated successfully"
      : "Revenue target created successfully",
    data: revenueTarget,
  });
});

/**
 * @desc    Get revenue targets
 * @route   GET /api/revenue-targets
 * @access  Private
 */
export const getRevenueTargets = asyncHandler(async (req, res) => {
  try {
    const { year, departmentId } = req.query;
    const lawFirmId = req.user.lawFirm?._id || req.user.lawFirm;

    if (!lawFirmId) {
      return res.status(403).json({
        success: false,
        message: "User must be associated with a law firm",
      });
    }

    // Ensure lawFirmId is an ObjectId
    const lawFirmObjectId = mongoose.Types.ObjectId.isValid(lawFirmId) 
      ? new mongoose.Types.ObjectId(lawFirmId) 
      : lawFirmId;
    
    const query = { lawFirm: lawFirmObjectId };

    // Filter by year if provided
    if (year) {
      query.year = parseInt(year);
    } else {
      // Default to current year
      query.year = new Date().getFullYear();
    }

    // Filter by department if provided
    if (departmentId) {
      query.department = departmentId;
    } else if (req.user.role === "credit_head" || req.user.role === "legal_head") {
      // Department heads only see their department's targets
      const userDept = req.user.department?._id || req.user.department;
      if (userDept) {
        query.department = userDept;
      }
    }

    const targets = await RevenueTarget.find(query)
      .populate("department", "name code departmentType")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ year: -1, department: 1 });

    res.json({
      success: true,
      count: targets.length,
      data: targets,
    });
  } catch (error) {
    console.error("Error in getRevenueTargets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching revenue targets",
      error: error.message,
    });
  }
});

/**
 * @desc    Get revenue target performance (actual vs target)
 * @route   GET /api/revenue-targets/performance
 * @access  Private
 */
export const getRevenueTargetPerformance = asyncHandler(async (req, res) => {
  try {
    const { year, departmentId, month, week, day } = req.query;
    const lawFirmId = req.user.lawFirm?._id || req.user.lawFirm;

    if (!lawFirmId) {
      return res.status(403).json({
        success: false,
        message: "User must be associated with a law firm",
      });
    }

    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : null; // Don't default to current month - only use if explicitly provided
    const targetWeek = week ? parseInt(week) : null;
    const targetDay = day ? parseInt(day) : null;

    // Ensure lawFirmId is an ObjectId
    const lawFirmObjectId = mongoose.Types.ObjectId.isValid(lawFirmId) 
      ? new mongoose.Types.ObjectId(lawFirmId) 
      : lawFirmId;
    
    // Build query for targets
    const targetQuery = {
      year: targetYear,
      lawFirm: lawFirmObjectId,
    };

    if (departmentId) {
      targetQuery.department = departmentId;
    } else if (req.user.role === "credit_head" || req.user.role === "legal_head") {
      const userDept = req.user.department?._id || req.user.department;
      if (userDept) {
        targetQuery.department = userDept;
      }
    }

    const targets = await RevenueTarget.find(targetQuery)
      .populate("department", "name code departmentType");

  // Calculate actual revenue
  const actualRevenue = await calculateActualRevenue(
    lawFirmId,
    targetYear,
    targetMonth,
    targetWeek,
    targetDay,
    departmentId || (req.user.role === "credit_head" || req.user.role === "legal_head" ? req.user.department : null)
  );

  // Match targets with actual revenue
  const performance = targets.map((target) => {
    const targetDeptId = target.department?._id?.toString() || target.department?.toString() || target.department || null;
    console.log(`\n🎯 Matching target for department ${targetDeptId || 'general'}:`);
    console.log(`   Target ID: ${targetDeptId} (type: ${typeof targetDeptId})`);
    console.log(`   Target: ${target.yearlyTarget}`);
    console.log(`   Available revenue departments: ${actualRevenue.map(r => (r.departmentId?.toString() || r.departmentId || 'null')).join(', ')}`);
    
    // Try to find matching revenue - compare both as strings for reliability
    const actual = actualRevenue.find((rev) => {
      const revDeptId = rev.departmentId?.toString() || rev.departmentId || null;
      console.log(`   Comparing with revenue department: ${revDeptId} (type: ${typeof revDeptId})`);
      
      // Match if both are null (general/law firm revenue)
      if (!targetDeptId && !revDeptId) {
        console.log(`   ✅ Match: Both are null/general`);
        return true;
      }
      
      // Match if both have same department ID (compare as strings)
      if (targetDeptId && revDeptId && targetDeptId.toString() === revDeptId.toString()) {
        console.log(`   ✅ Match: Department IDs match`);
        return true;
      }
      
      return false;
    }) || { total: 0 };
    
    console.log(`   Actual found: ${actual.total}`);

    // Get target for specific period
    let periodTarget = target.yearlyTarget;
    let periodActual = actual.total;

    if (targetMonth) {
      const monthlyTarget = target.monthlyTargets.find((m) => m.month === targetMonth);
      if (monthlyTarget) {
        periodTarget = monthlyTarget.target;

        if (targetDay && !targetWeek) {
          // Daily view without week specified - find the day across all weeks in the month
          for (const weeklyTarget of monthlyTarget.weeklyTargets) {
            const dailyTarget = weeklyTarget.dailyTargets.find((d) => d.day === targetDay);
            if (dailyTarget) {
              periodTarget = dailyTarget.target;
              break;
            }
          }
        } else if (targetWeek) {
          const weeklyTarget = monthlyTarget.weeklyTargets.find((w) => w.week === targetWeek);
          if (weeklyTarget) {
            periodTarget = weeklyTarget.target;

            if (targetDay) {
              const dailyTarget = weeklyTarget.dailyTargets.find((d) => d.day === targetDay);
              if (dailyTarget) {
                periodTarget = dailyTarget.target;
              }
            }
          }
        }
      }
    }

    const percentage = periodTarget > 0 ? (periodActual / periodTarget) * 100 : 0;
    const difference = periodActual - periodTarget;
    const isOnTrack = percentage >= 100;

    return {
      target: {
        _id: target._id,
        year: target.year,
        department: target.department,
        yearlyTarget: target.yearlyTarget,
        periodTarget,
      },
      actual: {
        total: periodActual,
      },
      performance: {
        percentage: Math.round(percentage * 100) / 100,
        difference: Math.round(difference * 100) / 100,
        isOnTrack,
        status: isOnTrack ? "on_track" : percentage >= 80 ? "at_risk" : "behind",
      },
    };
  });

  // If no targets exist, still return actual revenue
  if (targets.length === 0) {
    const actual = actualRevenue[0] || { total: 0 };
    return res.json({
      success: true,
      data: {
        performance: [
          {
            target: null,
            actual: {
              total: actual.total,
            },
            performance: {
              percentage: 0,
              difference: -actual.total,
              isOnTrack: false,
              status: "no_target",
            },
          },
        ],
        summary: {
          totalTarget: 0,
          totalActual: actual.total,
          overallPercentage: 0,
          overallStatus: "no_target",
        },
      },
    });
  }

  // Calculate summary
  const totalTarget = performance.reduce((sum, p) => sum + p.target.periodTarget, 0);
  const totalActual = performance.reduce((sum, p) => sum + p.actual.total, 0);
  const overallPercentage = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
  const overallStatus =
    overallPercentage >= 100
      ? "on_track"
      : overallPercentage >= 80
      ? "at_risk"
      : "behind";

  res.json({
    success: true,
    data: {
      performance,
      summary: {
        totalTarget: Math.round(totalTarget * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
        overallPercentage: Math.round(overallPercentage * 100) / 100,
        overallStatus,
        period: {
          year: targetYear,
          month: targetMonth || null,
          week: targetWeek || null,
          day: targetDay || null,
        },
      },
    },
  });
  } catch (error) {
    console.error("Error in getRevenueTargetPerformance:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching revenue target performance",
      error: error.message,
    });
  }
});

/**
 * Helper function to calculate actual revenue
 */
async function calculateActualRevenue(lawFirmId, year, month, week, day, departmentId) {
  try {
    // Ensure lawFirmId is an ObjectId
    const lawFirmObjectId = mongoose.Types.ObjectId.isValid(lawFirmId) 
      ? new mongoose.Types.ObjectId(lawFirmId) 
      : lawFirmId;
    
    // Set proper start and end dates based on the period
    let startDate, endDate;
    
    if (day && month) {
      // Daily view - specific day
      startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else if (week && month) {
      // Weekly view - calculate week as sequential 7-day periods from 1st of month
      // Week 1 = days 1-7, Week 2 = days 8-14, etc. (matches RevenueTarget model)
      const daysInMonth = new Date(year, month, 0).getDate(); // Last day of month
      const weekStartDay = (week - 1) * 7 + 1; // First day of the week
      const weekEndDay = Math.min(weekStartDay + 6, daysInMonth); // Last day of the week (don't exceed month)
      
      // Create dates in local timezone to avoid timezone issues
      startDate = new Date(year, month - 1, weekStartDay, 0, 0, 0, 0);
      endDate = new Date(year, month - 1, weekEndDay, 23, 59, 59, 999);
      
      // Ensure we're working with UTC midnight to avoid timezone shifts
      const startDateUTC = new Date(Date.UTC(year, month - 1, weekStartDay, 0, 0, 0, 0));
      const endDateUTC = new Date(Date.UTC(year, month - 1, weekEndDay, 23, 59, 59, 999));
      
      console.log(`\n   📅 Weekly calculation: Week ${week} of Month ${month}, Year ${year}`);
      console.log(`   - Days in month: ${daysInMonth}`);
      console.log(`   - Week ${week} covers days: ${weekStartDay} to ${weekEndDay}`);
      console.log(`   - Local date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`   - UTC date range: ${startDateUTC.toISOString()} to ${endDateUTC.toISOString()}`);
      
      // Use UTC dates for consistency
      startDate = startDateUTC;
      endDate = endDateUTC;
    } else if (month) {
      // Monthly view - entire month
      startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
    } else {
      // Yearly view - entire year
      startDate = new Date(year, 0, 1, 0, 0, 0, 0); // January 1st
      endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st
    }

    // Query for payments (escalation fees, service charges, consultation, subscription)
    const paymentQuery = {
      lawFirm: lawFirmObjectId,
      status: "completed",
      purpose: { $in: ["escalation_fee", "service_charge", "consultation", "subscription"] },
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Query for filing fees from legal cases
    const legalCaseQuery = {
      lawFirm: lawFirmObjectId,
      "filingFee.paid": true,
      "filingFee.paidAt": { $gte: startDate, $lte: endDate },
    };

    if (departmentId) {
      legalCaseQuery.department = new mongoose.Types.ObjectId(departmentId);
    }

    // Query for resolved credit cases (money recovered)
    // We'll query all resolved cases and filter by date in code to handle both resolvedAt and updatedAt
    const creditCaseQuery = {
      lawFirm: lawFirmObjectId,
      status: "resolved",
    };

    if (departmentId) {
      // Handle both string and ObjectId formats
      const deptObjectId = mongoose.Types.ObjectId.isValid(departmentId) 
        ? new mongoose.Types.ObjectId(departmentId) 
        : departmentId;
      creditCaseQuery.department = deptObjectId;
      console.log(`   Filtering credit cases by department: ${deptObjectId}`);
    } else {
      console.log(`   No department filter - will include all departments`);
    }

    // Query for cases with promised payments (we'll filter paid ones by date in code)
    const promisedPaymentQuery = {
      lawFirm: lawFirmObjectId,
      "promisedPayments.0": { $exists: true }, // Has at least one promised payment
    };

    if (departmentId) {
      // Handle both string and ObjectId formats
      const deptObjectId = mongoose.Types.ObjectId.isValid(departmentId) 
        ? new mongoose.Types.ObjectId(departmentId) 
        : departmentId;
      promisedPaymentQuery.department = deptObjectId;
    }

    const [payments, legalCases, allResolvedCreditCases, casesWithPromisedPayments] = await Promise.all([
      Payment.find(paymentQuery).lean(),
      LegalCase.find(legalCaseQuery).populate("department").lean(),
      CreditCase.find(creditCaseQuery).populate("department").lean(),
      CreditCase.find(promisedPaymentQuery).populate("department").lean(),
    ]);

    // Filter credit cases by resolved date (use resolvedAt if available, otherwise updatedAt)
    const creditCases = allResolvedCreditCases.filter((creditCase) => {
      const resolvedDate = creditCase.resolvedAt || creditCase.updatedAt;
      if (!resolvedDate) {
        console.log(`⚠️  Excluding resolved credit case ${creditCase.caseNumber}: No resolvedAt or updatedAt`);
        return false;
      }
      
      const resolvedDateObj = new Date(resolvedDate);
      // Compare dates by day/month/year only, ignoring time (to handle timezone issues)
      const resolvedDateOnly = new Date(resolvedDateObj.getFullYear(), resolvedDateObj.getMonth(), resolvedDateObj.getDate());
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      const isInRange = resolvedDateOnly >= startDateOnly && resolvedDateOnly <= endDateOnly;
      
      if (isInRange) {
        console.log(`✅ Including resolved credit case: ${creditCase.caseNumber || creditCase._id}`);
        console.log(`   - resolvedAt: ${creditCase.resolvedAt ? new Date(creditCase.resolvedAt).toISOString() : 'N/A'}`);
        console.log(`   - updatedAt: ${creditCase.updatedAt ? new Date(creditCase.updatedAt).toISOString() : 'N/A'}`);
        console.log(`   - Resolved date (day only): ${resolvedDateOnly.toISOString().split('T')[0]}`);
        console.log(`   - Period range: ${startDateOnly.toISOString().split('T')[0]} to ${endDateOnly.toISOString().split('T')[0]}`);
        console.log(`   - debtAmount: ${creditCase.debtAmount || 0}`);
        const caseDeptId = creditCase.department?._id?.toString() || creditCase.department?.toString() || 'N/A';
        console.log(`   - department: ${caseDeptId}`);
      } else {
        console.log(`❌ Excluding resolved credit case ${creditCase.caseNumber || creditCase._id}: Date out of range`);
        console.log(`   - Resolved date (full): ${resolvedDateObj.toISOString()}`);
        console.log(`   - Resolved date (day only): ${resolvedDateOnly.toISOString().split('T')[0]}`);
        console.log(`   - Period range: ${startDateOnly.toISOString().split('T')[0]} to ${endDateOnly.toISOString().split('T')[0]}`);
        console.log(`   - debtAmount: ${creditCase.debtAmount || 0} (will not be counted)`);
      }
      return isInRange;
    });
    
    console.log(`\n📊 Revenue Calculation Summary for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`   Filtering by department: ${departmentId || 'ALL'}`);
    console.log(`   Payments found: ${payments.length}`);
    console.log(`   Legal cases with filing fees: ${legalCases.length}`);
    console.log(`   Resolved credit cases: ${creditCases.length} (out of ${allResolvedCreditCases.length} total resolved)`);
    if (creditCases.length > 0) {
      const totalResolvedRevenue = creditCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
      console.log(`   Total revenue from resolved cases: ${totalResolvedRevenue}`);
      // Log each case's department for debugging
      creditCases.forEach(c => {
        const deptId = c.department?._id?.toString() || c.department?.toString() || 'null';
        console.log(`     - Case ${c.caseNumber || c._id}: ${c.debtAmount || 0}, Dept: ${deptId}`);
      });
    }
    console.log(`   Cases with promised payments: ${casesWithPromisedPayments.length}`);

    // Calculate revenue by department
    const revenueByDepartment = {};

    // Process payments (escalation fees, service charges, etc.)
    payments.forEach((payment) => {
      // Payments don't have department, so they go to "general" or law firm revenue
      const key = "general";
      if (!revenueByDepartment[key]) {
        revenueByDepartment[key] = { departmentId: null, total: 0 };
      }
      revenueByDepartment[key].total += payment.amount || 0;
    });

    // Process filing fees from legal cases
    legalCases.forEach((legalCase) => {
      const deptId = legalCase.department?._id?.toString() || "general";
      if (!revenueByDepartment[deptId]) {
        revenueByDepartment[deptId] = {
          departmentId: legalCase.department?._id || null,
          total: 0,
        };
      }
      revenueByDepartment[deptId].total += legalCase.filingFee?.amount || 0;
    });

    // Process resolved credit cases (money recovered)
    // Cases are already filtered by date above
    creditCases.forEach((creditCase) => {
      // Get department ID - handle both populated and non-populated cases
      let deptId = null;
      let deptIdStr = "general";
      
      if (creditCase.department) {
        if (creditCase.department._id) {
          // Populated department object
          deptId = creditCase.department._id;
          deptIdStr = deptId.toString();
        } else if (mongoose.Types.ObjectId.isValid(creditCase.department)) {
          // Direct ObjectId
          deptId = creditCase.department;
          deptIdStr = deptId.toString();
        } else {
          // String ID
          deptIdStr = creditCase.department.toString();
          deptId = mongoose.Types.ObjectId.isValid(deptIdStr) ? new mongoose.Types.ObjectId(deptIdStr) : null;
        }
      }
      
      const debtAmount = creditCase.debtAmount || 0;
      
      if (!revenueByDepartment[deptIdStr]) {
        revenueByDepartment[deptIdStr] = {
          departmentId: deptId, // Store actual ObjectId or null
          total: 0,
        };
      }
      revenueByDepartment[deptIdStr].total += debtAmount;
      console.log(`   💰 Adding ${debtAmount} from resolved case ${creditCase.caseNumber || creditCase._id} to department ${deptIdStr} (Total now: ${revenueByDepartment[deptIdStr].total})`);
    });

    // Process paid promised payments
    casesWithPromisedPayments.forEach((creditCase) => {
      const deptId = creditCase.department?._id?.toString() || "general";
      
      // Sum all paid promised payments within the date range
      if (creditCase.promisedPayments && creditCase.promisedPayments.length > 0) {
        creditCase.promisedPayments.forEach((promisedPayment) => {
          if (
            promisedPayment.status === "paid" &&
            promisedPayment.paidAt &&
            new Date(promisedPayment.paidAt) >= startDate &&
            new Date(promisedPayment.paidAt) <= endDate
          ) {
            if (!revenueByDepartment[deptId]) {
              revenueByDepartment[deptId] = {
                departmentId: creditCase.department?._id || null,
                total: 0,
              };
            }
            revenueByDepartment[deptId].total += promisedPayment.amount || 0;
          }
        });
      }
    });

    const revenueArray = Object.values(revenueByDepartment);
    console.log(`💰 Total revenue calculated: ${JSON.stringify(revenueArray, null, 2)}`);
    return revenueArray;
  } catch (error) {
    console.error("Error in calculateActualRevenue:", error);
    console.error("Error stack:", error.stack);
    // Return empty array on error to prevent breaking the performance endpoint
    return [];
  }
}

/**
 * @desc    Delete revenue target
 * @route   DELETE /api/revenue-targets/:id
 * @access  Private (law_firm_admin)
 */
export const deleteRevenueTarget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lawFirmId = req.user.lawFirm?._id || req.user.lawFirm;

  if (!lawFirmId) {
    return res.status(403).json({
      success: false,
      message: "User must be associated with a law firm",
    });
  }

  // Only law_firm_admin can delete
  if (req.user.role !== "law_firm_admin" && req.user.role !== "system_owner") {
    return res.status(403).json({
      success: false,
      message: "Only law firm admins can delete revenue targets",
    });
  }

  const target = await RevenueTarget.findOne({
    _id: id,
    lawFirm: lawFirmId,
  });

  if (!target) {
    return res.status(404).json({
      success: false,
      message: "Revenue target not found",
    });
  }

  await RevenueTarget.deleteOne({ _id: id });

  res.json({
    success: true,
    message: "Revenue target deleted successfully",
  });
});

