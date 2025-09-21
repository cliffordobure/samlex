#!/usr/bin/env node

/**
 * Reset Romano Okinyi's password to 'password' for testing
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

async function resetPassword() {
  try {
    console.log('🔐 Resetting Romano Okinyi password...\n');

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

    // Reset password to 'password'
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password', salt);
    
    romano.password = hashedPassword;
    await romano.save();
    
    console.log('✅ Password reset successfully!');
    console.log('🔑 Login credentials:');
    console.log(`   Email: ${romano.email}`);
    console.log(`   Password: password`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
resetPassword();
