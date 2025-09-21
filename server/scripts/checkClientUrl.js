#!/usr/bin/env node

/**
 * Check what CLIENT_URL is being used in the email service
 */

import dotenv from 'dotenv';
import config from '../config/config.js';

// Load environment variables
dotenv.config();

console.log('🔍 Checking CLIENT_URL configuration...\n');

console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CLIENT_URL from env:', process.env.CLIENT_URL);
console.log('CLIENT_URL from config:', config.CLIENT_URL);

console.log('\n📧 Email service would use:', config.CLIENT_URL);

// Test the password reset URL construction
const resetToken = 'test-token-123';
const resetUrl = `${config.CLIENT_URL}/reset-password/${resetToken}`;
console.log('🔗 Sample reset URL:', resetUrl);

if (config.CLIENT_URL.includes('localhost')) {
  console.log('\n❌ WARNING: CLIENT_URL contains localhost!');
  console.log('This means password reset emails will have localhost links.');
  console.log('Make sure CLIENT_URL environment variable is set to your hosted frontend URL.');
} else {
  console.log('\n✅ CLIENT_URL looks correct - using hosted URL');
}
