#!/usr/bin/env node

/**
 * Script to assign users to departments based on their roles
 * This script assigns users to appropriate departments based on their roles
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

const assignUsersToDepartments = async () => {
  try {
    console.log('🔧 Starting user department assignment...\n');

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

      // Assign users based on their roles
      if (creditCollectionDept) {
        const creditUsers = await User.find({
          lawFirm: lawFirm._id,
          role: { $in: ['debt_collector', 'credit_head'] },
          $or: [
            { department: { $exists: false } },
            { department: null }
          ]
        });

        console.log(`  👥 Found ${creditUsers.length} credit users without department assignment`);

        if (creditUsers.length > 0) {
          await User.updateMany(
            {
              lawFirm: lawFirm._id,
              role: { $in: ['debt_collector', 'credit_head'] },
              $or: [
                { department: { $exists: false } },
                { department: null }
              ]
            },
            { department: creditCollectionDept._id }
          );
          console.log(`  ✅ Assigned ${creditUsers.length} credit users to ${creditCollectionDept.name}`);
        }
      }

      if (legalDept) {
        const legalUsers = await User.find({
          lawFirm: lawFirm._id,
          role: { $in: ['advocate', 'legal_head'] },
          $or: [
            { department: { $exists: false } },
            { department: null }
          ]
        });

        console.log(`  👥 Found ${legalUsers.length} legal users without department assignment`);

        if (legalUsers.length > 0) {
          await User.updateMany(
            {
              lawFirm: lawFirm._id,
              role: { $in: ['advocate', 'legal_head'] },
              $or: [
                { department: { $exists: false } },
                { department: null }
              ]
            },
            { department: legalDept._id }
          );
          console.log(`  ✅ Assigned ${legalUsers.length} legal users to ${legalDept.name}`);
        }
      }

      // Assign remaining users (law_firm_admin, client) to the first available department
      const remainingUsers = await User.find({
        lawFirm: lawFirm._id,
        role: { $in: ['law_firm_admin', 'client'] },
        $or: [
          { department: { $exists: false } },
          { department: null }
        ]
      });

      console.log(`  👥 Found ${remainingUsers.length} remaining users without department assignment`);

      if (remainingUsers.length > 0 && departments.length > 0) {
        // Assign to the first department (usually credit collection)
        const defaultDept = departments[0];
        await User.updateMany(
          {
            lawFirm: lawFirm._id,
            role: { $in: ['law_firm_admin', 'client'] },
            $or: [
              { department: { $exists: false } },
              { department: null }
            ]
          },
          { department: defaultDept._id }
        );
        console.log(`  ✅ Assigned ${remainingUsers.length} remaining users to ${defaultDept.name}`);
      }

      console.log(''); // Empty line for readability
    }

    console.log('🎉 User department assignment completed!');

  } catch (error) {
    console.error('❌ Error assigning users to departments:', error);
  }
};

const main = async () => {
  await connectDB();
  await assignUsersToDepartments();
  await mongoose.connection.close();
  console.log('👋 Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
