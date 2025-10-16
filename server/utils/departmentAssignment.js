/**
 * Department Assignment Utility
 * Ensures all cases and users are properly assigned to departments
 */

import Department from '../models/Department.js';

/**
 * Get or create default departments for a law firm
 */
export const getOrCreateDefaultDepartments = async (lawFirmId) => {
  try {
    console.log(`🏢 Getting/creating default departments for law firm: ${lawFirmId}`);
    
    // Check if departments already exist
    const existingDepartments = await Department.find({ lawFirm: lawFirmId });
    console.log(`📋 Found ${existingDepartments.length} existing departments`);
    
    const departments = {
      creditCollection: existingDepartments.find(d => 
        d.departmentType === 'credit_collection' || 
        d.name.toLowerCase().includes('credit')
      ),
      legal: existingDepartments.find(d => 
        d.departmentType === 'legal' || 
        d.name.toLowerCase().includes('legal')
      ),
      realEstate: existingDepartments.find(d => 
        d.departmentType === 'real_estate' || 
        d.name.toLowerCase().includes('real estate')
      )
    };
    
    // Create missing departments
    const defaultDepartments = [
      {
        name: 'Credit Collection',
        code: 'CC',
        departmentType: 'credit_collection',
        description: 'Handles debt collection and credit recovery cases'
      },
      {
        name: 'Legal',
        code: 'LEG',
        departmentType: 'legal',
        description: 'Handles legal cases and court proceedings'
      },
      {
        name: 'Real Estate',
        code: 'RE',
        departmentType: 'real_estate',
        description: 'Handles real estate and property-related cases'
      }
    ];
    
    for (const deptConfig of defaultDepartments) {
      const deptType = deptConfig.departmentType;
      if (!departments[deptType.replace('_', '')]) {
        console.log(`➕ Creating missing department: ${deptConfig.name}`);
        const newDepartment = new Department({
          ...deptConfig,
          lawFirm: lawFirmId,
          createdBy: null // System created
        });
        
        const savedDept = await newDepartment.save();
        departments[deptType.replace('_', '')] = savedDept;
        console.log(`✅ Created department: ${savedDept.name} (${savedDept._id})`);
      }
    }
    
    return {
      creditCollection: departments.creditCollection,
      legal: departments.legal,
      realEstate: departments.realEstate
    };
    
  } catch (error) {
    console.error('❌ Error getting/creating default departments:', error);
    throw new Error(`Failed to get or create default departments: ${error.message}`);
  }
};

/**
 * Get appropriate department for a case based on case type or user role
 */
export const getDepartmentForCase = async (lawFirmId, caseType = null, userRole = null) => {
  try {
    const departments = await getOrCreateDefaultDepartments(lawFirmId);
    
    // Determine department based on case type or user role
    if (caseType === 'legal' || userRole === 'advocate' || userRole === 'legal_head') {
      return departments.legal;
    } else if (caseType === 'credit' || userRole === 'debt_collector' || userRole === 'credit_head') {
      return departments.creditCollection;
    } else if (caseType === 'real_estate') {
      return departments.realEstate;
    } else {
      // Default to credit collection for credit cases
      return departments.creditCollection;
    }
  } catch (error) {
    console.error('❌ Error getting department for case:', error);
    throw error;
  }
};

/**
 * Get appropriate department for a user based on their role
 */
export const getDepartmentForUser = async (lawFirmId, userRole) => {
  try {
    const departments = await getOrCreateDefaultDepartments(lawFirmId);
    
    switch (userRole) {
      case 'debt_collector':
      case 'credit_head':
        return departments.creditCollection;
      case 'advocate':
      case 'legal_head':
        return departments.legal;
      case 'law_firm_admin':
        // Admin can be assigned to any department, default to first available
        return departments.creditCollection || departments.legal || departments.realEstate;
      default:
        // Default to credit collection
        return departments.creditCollection;
    }
  } catch (error) {
    console.error('❌ Error getting department for user:', error);
    throw error;
  }
};

/**
 * Validate that a case has a department assigned
 */
export const validateCaseDepartment = (caseData) => {
  if (!caseData.department) {
    throw new Error('Case must be assigned to a department');
  }
  return true;
};

/**
 * Validate that a user has a department assigned
 */
export const validateUserDepartment = (userData) => {
  if (!userData.department) {
    throw new Error('User must be assigned to a department');
  }
  return true;
};
