#!/usr/bin/env node

/**
 * Debug script to check debt collection data processing
 * This script helps debug why the specialized report is showing zeros
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreditCase from '../models/CreditCase.js';
import User from '../models/User.js';
import LawFirm from '../models/LawFirm.js';

// Load environment variables
dotenv.config();

async function debugDebtCollectionData() {
  try {
    console.log('🔍 Debugging Debt Collection Data Processing...\n');

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
      email: romano.email,
      lawFirm: romano.lawFirm
    });

    // Test the exact query used in getDebtCollectionData
    const lawFirmId = romano.lawFirm._id;
    const matchCondition = { 
      lawFirm: lawFirmId,
      assignedTo: romano._id 
    };

    console.log('\n🔍 Testing aggregation query...');
    console.log('Match condition:', JSON.stringify(matchCondition, null, 2));

    // Test the aggregation pipeline
    const creditCasesAggregation = await CreditCase.aggregate([
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
    ]);

    console.log('📊 Aggregation result:', JSON.stringify(creditCasesAggregation, null, 2));

    // Test regular find query
    console.log('\n🔍 Testing regular find query...');
    const individualCases = await CreditCase.find(matchCondition)
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    console.log('📋 Individual cases found:', individualCases.length);
    individualCases.forEach((case_, index) => {
      console.log(`  ${index + 1}. ${case_.title}`);
      console.log(`     Status: ${case_.status}`);
      console.log(`     Amount: KES ${case_.debtAmount?.toLocaleString() || 0}`);
      console.log(`     Assigned To: ${case_.assignedTo ? `${case_.assignedTo.firstName} ${case_.assignedTo.lastName}` : 'None'}`);
    });

    // Calculate stats manually
    const totalCases = individualCases.length;
    const resolvedCases = individualCases.filter(c => ['resolved', 'closed'].includes(c.status));
    const totalDebtAmount = individualCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
    const collectedAmount = resolvedCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
    const collectionRate = totalDebtAmount > 0 ? Math.round((collectedAmount / totalDebtAmount) * 100) : 0;

    console.log('\n📈 Manual calculation:');
    console.log(`   Total Cases: ${totalCases}`);
    console.log(`   Resolved Cases: ${resolvedCases.length}`);
    console.log(`   Collection Rate: ${collectionRate}%`);
    console.log(`   Total Debt Amount: KES ${totalDebtAmount.toLocaleString()}`);
    console.log(`   Collected Amount: KES ${collectedAmount.toLocaleString()}`);
    console.log(`   Outstanding Amount: KES ${(totalDebtAmount - collectedAmount).toLocaleString()}`);

    // Test the exact data structure that should be returned
    const result = {
      totalCreditCases: totalCases,
      collectedCases: resolvedCases.length,
      collectionRate,
      totalAmountCollected: collectedAmount,
      outstandingAmount: totalDebtAmount - collectedAmount,
      escalatedToLegal: individualCases.filter(c => c.status === 'escalated_to_legal').length,
      assignedCases: individualCases
    };

    console.log('\n📊 Final result structure:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the debug
debugDebtCollectionData();
