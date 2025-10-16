/**
 * Department Validation Middleware
 * Ensures all cases and users have proper department assignments
 */

import { validateCaseDepartment, validateUserDepartment } from '../utils/departmentAssignment.js';

/**
 * Middleware to validate that a case has a department assigned
 */
export const validateCaseHasDepartment = (req, res, next) => {
  try {
    // Skip validation for escalated cases (they don't need departments)
    if (req.body.escalatedFrom || req.body.escalatedFromCreditCase) {
      return next();
    }

    if (!req.body.department && req.method === 'POST') {
      // For new cases, the department will be auto-assigned by the controller
      return next();
    }

    if (req.body.department) {
      validateCaseDepartment(req.body);
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'Department validation failed'
    });
  }
};

/**
 * Middleware to validate that a user has a department assigned
 */
export const validateUserHasDepartment = (req, res, next) => {
  try {
    if (req.body.department) {
      validateUserDepartment(req.body);
    }
    // If no department provided, it will be auto-assigned by the controller
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'Department validation failed'
    });
  }
};

/**
 * Middleware to ensure law firm has required departments
 */
export const ensureRequiredDepartments = async (req, res, next) => {
  try {
    if (req.user && req.user.lawFirm) {
      const { getOrCreateDefaultDepartments } = await import('../utils/departmentAssignment.js');
      await getOrCreateDefaultDepartments(req.user.lawFirm._id);
    }
    next();
  } catch (error) {
    console.error('❌ Error ensuring required departments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to ensure required departments exist',
      error: error.message
    });
  }
};
