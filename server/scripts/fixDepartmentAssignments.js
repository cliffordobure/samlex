#!/usr/bin/env node

/**
 * Script to fix department assignments for cases and users
 * This script assigns cases and users to appropriate departments based on their type
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreditCase from '../models/CreditCase.js';
import LegalCase from '../models/LegalCase.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import LawFirm from '../models/LawFirm.js';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    // Try multiple connection strings
    const connectionStrings = [
      process.env.MONGO_URI,
      'mongodb://localhost:27017/law-firm-saas',
      'mongodb://127.0.0.1:27017/law-firm-saas',
      'mongodb://localhost:27017/samlex',
      'mongodb://127.0.0.1:27017/samlex'
    ];
    
    let connected = false;
    for (const uri of connectionStrings) {
      if (uri) {
        try {
          console.log(`🔄 Trying to connect to: ${uri}`);
          await mongoose.connect(uri);
          console.log('✅ Connected to MongoDB');
          connected = true;
          break;
        } catch (err) {
          console.log(`❌ Failed to connect to: ${uri}`);
          continue;
        }
      }
    }
    
    if (!connected) {
      throw new Error('Could not connect to any MongoDB instance');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixDepartmentAssignments = async () => {
  try {
    console.log('🔧 Starting department assignment fix...\n');

    // Get all law firms
    const lawFirms = await LawFirm.find({});
    console.log(`📊 Found ${lawFirms.length} law firms\n`);

    for (const lawFirm of lawFirms) {
      console.log(`🏢 Processing law firm: ${lawFirm.firmName} (${lawFirm._id})`);

      // Get departments for this law firm
      const departments = await Department.find({ lawFirm: lawFirm._id });
      console.log(`  📁 Found ${departments.length} departments`);

      if (departments.length === 0) {
        console.log('  ⚠️ No departments found, skipping...\n');
        continue;
      }

      // Find credit collection and legal departments
      const creditCollectionDept = departments.find(d => d.departmentType === 'credit_collection');
      const legalDept = departments.find(d => d.departmentType === 'legal');

      console.log(`  💳 Credit Collection Dept: ${creditCollectionDept ? creditCollectionDept.name : 'Not found'}`);
      console.log(`  ⚖️ Legal Dept: ${legalDept ? legalDept.name : 'Not found'}`);

      // Fix credit cases
      if (creditCollectionDept) {
        const unassignedCreditCases = await CreditCase.find({
          lawFirm: lawFirm._id,
          department: { $exists: false }
        });

        console.log(`  📋 Found ${unassignedCreditCases.length} unassigned credit cases`);

        if (unassignedCreditCases.length > 0) {
          await CreditCase.updateMany(
            { lawFirm: lawFirm._id, department: { $exists: false } },
            { department: creditCollectionDept._id }
          );
          console.log(`  ✅ Assigned ${unassignedCreditCases.length} credit cases to ${creditCollectionDept.name}`);
        }
      }

      // Fix legal cases
      if (legalDept) {
        const unassignedLegalCases = await LegalCase.find({
          lawFirm: lawFirm._id,
          department: { $exists: false }
        });

        console.log(`  📋 Found ${unassignedLegalCases.length} unassigned legal cases`);

        if (unassignedLegalCases.length > 0) {
          await LegalCase.updateMany(
            { lawFirm: lawFirm._id, department: { $exists: false } },
            { department: legalDept._id }
          );
          console.log(`  ✅ Assigned ${unassignedLegalCases.length} legal cases to ${legalDept.name}`);
        }
      }

      // Fix users - assign to first available department if no department assigned
      const unassignedUsers = await User.find({
        lawFirm: lawFirm._id,
        department: { $exists: false }
      });

      console.log(`  👥 Found ${unassignedUsers.length} unassigned users`);

      if (unassignedUsers.length > 0 && departments.length > 0) {
        // Assign users to the first department (usually credit collection)
        const defaultDept = departments[0];
        await User.updateMany(
          { lawFirm: lawFirm._id, department: { $exists: false } },
          { department: defaultDept._id }
        );
        console.log(`  ✅ Assigned ${unassignedUsers.length} users to ${defaultDept.name}`);
      }

      console.log(''); // Empty line for readability
    }

    console.log('🎉 Department assignment fix completed!');

  } catch (error) {
    console.error('❌ Error fixing department assignments:', error);
  }
};

const main = async () => {
  await connectDB();
  await fixDepartmentAssignments();
  await mongoose.connection.close();
  console.log('👋 Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

