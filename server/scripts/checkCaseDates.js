#!/usr/bin/env node

/**
 * Script to check actual case creation dates in the database
 * This will help us understand why monthly trends are showing wrong months
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LegalCase from '../models/LegalCase.js';
import CreditCase from '../models/CreditCase.js';

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

const checkCaseDates = async () => {
  try {
    console.log('🔍 Checking case creation dates...\n');

    // Get current date info
    const now = new Date();
    console.log(`📅 Current date: ${now.toISOString()}`);
    console.log(`📅 Current year: ${now.getFullYear()}`);
    console.log(`📅 Current month: ${now.getMonth() + 1} (${now.toLocaleString('default', { month: 'long' })})`);
    console.log('');

    // Check Legal Cases
    console.log('⚖️ LEGAL CASES:');
    const legalCases = await LegalCase.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`Found ${legalCases.length} recent legal cases:`);
    
    legalCases.forEach((case_, index) => {
      const createdAt = new Date(case_.createdAt);
      console.log(`  ${index + 1}. Case ID: ${case_.caseNumber || case_._id}`);
      console.log(`     Created: ${createdAt.toISOString()}`);
      console.log(`     Year: ${createdAt.getFullYear()}, Month: ${createdAt.getMonth() + 1} (${createdAt.toLocaleString('default', { month: 'long' })})`);
      console.log(`     Filing Fee: ${case_.filingFee?.amount || 0}`);
      console.log('');
    });

    // Check Credit Cases
    console.log('💳 CREDIT CASES:');
    const creditCases = await CreditCase.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`Found ${creditCases.length} recent credit cases:`);
    
    creditCases.forEach((case_, index) => {
      const createdAt = new Date(case_.createdAt);
      console.log(`  ${index + 1}. Case ID: ${case_.caseNumber || case_._id}`);
      console.log(`     Created: ${createdAt.toISOString()}`);
      console.log(`     Year: ${createdAt.getFullYear()}, Month: ${createdAt.getMonth() + 1} (${createdAt.toLocaleString('default', { month: 'long' })})`);
      console.log(`     Debt Amount: ${case_.debtAmount || 0}`);
      console.log('');
    });

    // Test MongoDB aggregation
    console.log('🔬 Testing MongoDB aggregation:');
    const aggregationTest = await LegalCase.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          totalFilingFees: { $sum: "$filingFee.amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    console.log('Aggregation results:');
    aggregationTest.forEach((stat, index) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[stat._id.month - 1];
      console.log(`  ${index + 1}. ${stat._id.year}-${stat._id.month.toString().padStart(2, '0')} (${monthName} ${stat._id.year})`);
      console.log(`     Cases: ${stat.count}, Filing Fees: ${stat.totalFilingFees}`);
    });

  } catch (error) {
    console.error('❌ Error checking case dates:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkCaseDates();
  await mongoose.connection.close();
  console.log('👋 Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
