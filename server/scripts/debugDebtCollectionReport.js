#!/usr/bin/env node

/**
 * Script to test debt collection report generation
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreditCase from '../models/CreditCase.js';
import User from '../models/User.js';
import LawFirm from '../models/LawFirm.js';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
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

const testDebtCollectionReport = async () => {
  try {
    console.log('🔍 Testing debt collection report generation...\n');

    // Get Martha law firm ID
    const lawFirm = await LawFirm.findOne({ firmName: /martha/i });
    if (!lawFirm) {
      console.log('❌ Martha law firm not found');
      return;
    }

    console.log(`🏢 Testing for law firm: ${lawFirm.firmName} (${lawFirm._id})`);

    // Get Romano Okinyi (debt collector)
    const debtCollector = await User.findOne({ 
      lawFirm: lawFirm._id, 
      firstName: /romano/i,
      lastName: /okinyi/i,
      role: 'debt_collector'
    });

    if (!debtCollector) {
      console.log('❌ Romano Okinyi (debt collector) not found');
      return;
    }

    console.log(`👤 Found debt collector: ${debtCollector.firstName} ${debtCollector.lastName} (${debtCollector._id})`);

    // Test the exact same logic as in the controller
    const lawFirmId = lawFirm._id;
    const user = debtCollector;
    
    // Build match condition based on user role
    let matchCondition = { lawFirm: lawFirmId };
    
    // If user is a debt collector, only show their assigned cases
    if (user && user.role === "debt_collector") {
      matchCondition.assignedTo = user._id;
      console.log('🔍 Match condition for debt collector:', JSON.stringify(matchCondition, null, 2));
    }

    // Use aggregation for better performance
    const [creditCasesAggregation, users] = await Promise.all([
      CreditCase.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: null,
            totalCases: { $sum: 1 },
            collectedCases: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
            },
            totalAmountCollected: {
              $sum: { $cond: [{ $eq: ["$status", "resolved"] }, "$debtAmount", 0] }
            },
            outstandingAmount: {
              $sum: { 
                $cond: [
                  { $not: { $in: ["$status", ["resolved", "closed"]] } }, 
                  "$debtAmount", 
                  0
                ] 
              }
            },
            escalatedToLegal: {
              $sum: { $cond: [{ $eq: ["$status", "escalated_to_legal"] }, 1, 0] }
            }
          }
        }
      ]),
      User.find({ lawFirm: lawFirmId, role: { $in: ['credit_head', 'debt_collector'] } })
        .select('firstName lastName role')
        .lean()
    ]);

    console.log('📊 Credit cases aggregation result:', JSON.stringify(creditCasesAggregation, null, 2));

    const stats = creditCasesAggregation[0] || {
      totalCases: 0,
      collectedCases: 0,
      totalAmountCollected: 0,
      outstandingAmount: 0,
      escalatedToLegal: 0
    };

    const collectionRate = stats.totalCases > 0 ? 
      Math.round((stats.collectedCases / stats.totalCases) * 100) : 0;

    console.log('🔍 Debt collection stats:', JSON.stringify(stats, null, 2));
    console.log('👤 User info:', user ? `${user.firstName} ${user.lastName} (${user.role})` : 'No user');
    console.log('🏢 Law firm ID:', lawFirmId);

    const result = {
      totalCreditCases: stats.totalCases,
      collectedCases: stats.collectedCases,
      collectionRate,
      totalAmountCollected: stats.totalAmountCollected,
      outstandingAmount: stats.outstandingAmount,
      escalatedToLegal: stats.escalatedToLegal,
      debtCollectorPerformance: users.map(user => ({
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        casesAssigned: 0,
        casesCollected: 0,
        amountCollected: 0
      })),
      collectionTrends: {
        monthlyCollections: [10, 12, 8, 15, 11, 13],
        collectionRate: [60, 65, 70, 68, 72, 75]
      },
      paymentAnalysis: {
        onTime: 0,
        overdue: 0,
        partial: 0
      }
    };

    console.log('📈 Final result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error testing debt collection report:', error);
  }
};

const main = async () => {
  await connectDB();
  await testDebtCollectionReport();
  await mongoose.connection.close();
  console.log('👋 Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
