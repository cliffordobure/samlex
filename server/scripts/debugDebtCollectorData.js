#!/usr/bin/env node

/**
 * Debug script to check debt collector data
 * This script helps debug why debt collector reports are showing zeros
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreditCase from '../models/CreditCase.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

async function debugDebtCollectorData() {
  try {
    console.log('🔍 Debugging Debt Collector Data...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/law-firm-saas');
    console.log('✅ Connected to MongoDB\n');

    // Find all debt collectors
    const debtCollectors = await User.find({ role: 'debt_collector' });
    console.log(`👥 Found ${debtCollectors.length} debt collectors:`);
    
    debtCollectors.forEach((collector, index) => {
      console.log(`  ${index + 1}. ${collector.firstName} ${collector.lastName} (${collector.email})`);
      console.log(`     ID: ${collector._id}`);
      console.log(`     Law Firm: ${collector.lawFirm?.firmName || 'Unknown'}`);
    });

    if (debtCollectors.length === 0) {
      console.log('\n❌ No debt collectors found in the database!');
      console.log('💡 You need to create debt collector users first.');
      return;
    }

    console.log('\n📊 Checking credit cases for each debt collector:');

    for (const collector of debtCollectors) {
      console.log(`\n🔍 Checking cases for ${collector.firstName} ${collector.lastName}:`);
      
      // Find cases assigned to this debt collector
      const assignedCases = await CreditCase.find({ assignedTo: collector._id });
      console.log(`   Total assigned cases: ${assignedCases.length}`);
      
      if (assignedCases.length > 0) {
        console.log('   Case details:');
        assignedCases.forEach((case_, index) => {
          console.log(`     ${index + 1}. ${case_.title}`);
          console.log(`        Status: ${case_.status}`);
          console.log(`        Debt Amount: KES ${case_.debtAmount?.toLocaleString() || 0}`);
          console.log(`        Case Number: ${case_.caseNumber}`);
          console.log(`        Created: ${case_.createdAt.toLocaleDateString()}`);
        });

        // Calculate statistics
        const resolvedCases = assignedCases.filter(c => ['resolved', 'closed'].includes(c.status));
        const totalDebtAmount = assignedCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
        const collectedAmount = resolvedCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
        const collectionRate = totalDebtAmount > 0 ? (collectedAmount / totalDebtAmount) * 100 : 0;

        console.log(`   📈 Statistics:`);
        console.log(`     Resolved cases: ${resolvedCases.length}`);
        console.log(`     Total debt amount: KES ${totalDebtAmount.toLocaleString()}`);
        console.log(`     Collected amount: KES ${collectedAmount.toLocaleString()}`);
        console.log(`     Collection rate: ${collectionRate.toFixed(1)}%`);
      } else {
        console.log('   ❌ No cases assigned to this debt collector');
      }
    }

    // Check all credit cases in the system
    console.log('\n📋 All credit cases in the system:');
    const allCreditCases = await CreditCase.find().populate('assignedTo', 'firstName lastName email');
    console.log(`   Total credit cases: ${allCreditCases.length}`);
    
    if (allCreditCases.length > 0) {
      console.log('   Case summary:');
      allCreditCases.forEach((case_, index) => {
        const assignedTo = case_.assignedTo ? `${case_.assignedTo.firstName} ${case_.assignedTo.lastName}` : 'Unassigned';
        console.log(`     ${index + 1}. ${case_.title} - Assigned to: ${assignedTo} - Status: ${case_.status}`);
      });
    } else {
      console.log('   ❌ No credit cases found in the system!');
      console.log('   💡 You need to create credit cases first.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the debug
debugDebtCollectorData();
