#!/usr/bin/env node

/**
 * List all debt collector users to find the correct login credentials
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import LawFirm from '../models/LawFirm.js';

// Load environment variables
dotenv.config();

async function listDebtCollectors() {
  try {
    console.log('👥 Listing all debt collector users...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/law-firm-saas');
    console.log('✅ Connected to MongoDB\n');

    // Find all debt collectors
    const debtCollectors = await User.find({ role: 'debt_collector' })
      .select('firstName lastName email role lawFirm')
      .populate('lawFirm', 'firmName');
    
    console.log(`📋 Found ${debtCollectors.length} debt collector(s):\n`);
    
    debtCollectors.forEach((collector, index) => {
      console.log(`${index + 1}. ${collector.firstName} ${collector.lastName}`);
      console.log(`   Email: ${collector.email}`);
      console.log(`   Role: ${collector.role}`);
      console.log(`   Law Firm: ${collector.lawFirm?.firmName || 'Unknown'}`);
      console.log('');
    });

    // Also check if there are any users with the email we're trying to use
    const romano = await User.findOne({ email: 'ogachoroman@gmail.com' });
    if (romano) {
      console.log('🔍 Romano user details:');
      console.log(`   ID: ${romano._id}`);
      console.log(`   Name: ${romano.firstName} ${romano.lastName}`);
      console.log(`   Email: ${romano.email}`);
      console.log(`   Role: ${romano.role}`);
      console.log(`   Password field exists: ${!!romano.password}`);
      console.log(`   Password length: ${romano.password?.length || 0}`);
    } else {
      console.log('❌ No user found with email: ogachoroman@gmail.com');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
listDebtCollectors();
