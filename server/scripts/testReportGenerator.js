#!/usr/bin/env node

/**
 * Direct test of the specialized report generator
 * This script tests the report generator directly without authentication
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import CreditCase from '../models/CreditCase.js';
import User from '../models/User.js';
import LawFirm from '../models/LawFirm.js';
import { specializedReportGenerator } from '../utils/specializedReportGenerator.js';

// Load environment variables
dotenv.config();

async function testReportGenerator() {
  try {
    console.log('🧪 Testing Specialized Report Generator Directly...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/law-firm-saas');
    console.log('✅ Connected to MongoDB\n');

    // Find Romano Okinyi
    const romano = await User.findOne({ 
      firstName: 'Romano', 
      lastName: 'Okinyi',
      role: 'debt_collector'
    });
    
    if (!romano) {
      console.log('❌ Romano Okinyi not found!');
      return;
    }
    
    console.log('👤 Found Romano Okinyi:', {
      id: romano._id,
      name: `${romano.firstName} ${romano.lastName}`,
      email: romano.email
    });

    // Find the law firm
    const lawFirm = await LawFirm.findById(romano.lawFirm);
    if (!lawFirm) {
      console.log('❌ Law firm not found!');
      return;
    }
    
    console.log('🏢 Found law firm:', lawFirm.firmName);

    // Get debt collection data using the same logic as the controller
    const lawFirmId = romano.lawFirm._id;
    const matchCondition = { 
      lawFirm: lawFirmId,
      assignedTo: romano._id 
    };

    console.log('\n🔍 Getting debt collection data...');
    
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

    const stats = creditCasesAggregation[0] || {
      totalCases: 0,
      collectedCases: 0,
      totalAmountCollected: 0,
      outstandingAmount: 0,
      escalatedToLegal: 0
    };

    const collectionRate = stats.totalCases > 0 ? 
      Math.round((stats.collectedCases / stats.totalCases) * 100) : 0;

    console.log('📊 Aggregation stats:', JSON.stringify(stats, null, 2));
    console.log('📈 Collection rate:', collectionRate);

    // Get individual cases for more detailed analysis
    const individualCases = await CreditCase.find(matchCondition)
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    const result = {
      totalCreditCases: stats.totalCases,
      collectedCases: stats.collectedCases,
      collectionRate,
      totalAmountCollected: stats.totalAmountCollected,
      outstandingAmount: stats.outstandingAmount,
      escalatedToLegal: stats.escalatedToLegal,
      assignedCases: individualCases,
      debtCollectorPerformance: users.map(user => ({
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        casesAssigned: individualCases.filter(c => c.assignedTo && c.assignedTo._id.toString() === user._id.toString()).length,
        casesCollected: individualCases.filter(c => c.assignedTo && c.assignedTo._id.toString() === user._id.toString() && ['resolved', 'closed'].includes(c.status)).length,
        amountCollected: individualCases
          .filter(c => c.assignedTo && c.assignedTo._id.toString() === user._id.toString() && ['resolved', 'closed'].includes(c.status))
          .reduce((sum, c) => sum + (c.debtAmount || 0), 0)
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

    console.log('\n📊 Final report data:');
    console.log(JSON.stringify(result, null, 2));

    // Generate the report
    console.log('\n📄 Generating specialized report...');
    const htmlContent = await specializedReportGenerator.generateSpecializedReport(
      lawFirm, 
      result, 
      'debt-collection',
      romano
    );

    console.log(`✅ Report generated successfully, length: ${htmlContent.length} characters`);

    // Check if the report contains the expected values
    console.log('\n🔍 Checking report content...');
    
    const expectedValues = [
      { label: 'Total Credit Cases', value: result.totalCreditCases },
      { label: 'Cases Collected', value: result.collectedCases },
      { label: 'Collection Rate', value: result.collectionRate },
      { label: 'Total Amount Collected', value: result.totalAmountCollected },
      { label: 'Outstanding Amount', value: result.outstandingAmount },
      { label: 'Escalated to Legal', value: result.escalatedToLegal }
    ];

    expectedValues.forEach(({ label, value }) => {
      if (htmlContent.includes(`>${value}<`)) {
        console.log(`✅ ${label}: ${value} found in report`);
      } else {
        console.log(`❌ ${label}: ${value} NOT found in report`);
      }
    });

    // Save report to file for inspection
    fs.writeFileSync('test_debt_collection_report.html', htmlContent);
    console.log('\n💾 Report saved to test_debt_collection_report.html for inspection');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testReportGenerator();
