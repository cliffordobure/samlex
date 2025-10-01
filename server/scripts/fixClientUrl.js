#!/usr/bin/env node

/**
 * Script to fix CLIENT_URL configuration for production emails
 */

import dotenv from 'dotenv';
import config from '../config/config.js';

// Load environment variables
dotenv.config();

console.log('🔧 CLIENT_URL Configuration Fix\n');

console.log('Current Configuration:');
console.log(`CLIENT_URL: ${config.CLIENT_URL}`);
console.log(`NODE_ENV: ${config.NODE_ENV}\n`);

if (config.CLIENT_URL.includes('localhost')) {
  console.log('❌ PROBLEM FOUND: CLIENT_URL contains localhost!');
  console.log('This is causing password reset emails to use localhost links.\n');
  
  console.log('🔧 SOLUTION:');
  console.log('Set the CLIENT_URL environment variable to: https://samlex-client.vercel.app\n');
  
  console.log('📋 For different deployment platforms:');
  console.log('\n1. For Vercel:');
  console.log('   - Go to your project dashboard');
  console.log('   - Navigate to Settings > Environment Variables');
  console.log('   - Add or update: CLIENT_URL = https://samlex-client.vercel.app');
  
  console.log('\n2. For Railway:');
  console.log('   - Go to your project dashboard');
  console.log('   - Navigate to Variables tab');
  console.log('   - Add or update: CLIENT_URL = https://samlex-client.vercel.app');
  
  console.log('\n3. For Heroku:');
  console.log('   heroku config:set CLIENT_URL=https://samlex-client.vercel.app');
  
  console.log('\n4. For local development (.env file):');
  console.log('   CLIENT_URL=https://samlex-client.vercel.app');
  
  console.log('\n5. For Docker:');
  console.log('   Add to your docker-compose.yml or Dockerfile:');
  console.log('   CLIENT_URL=https://samlex-client.vercel.app');
  
  console.log('\n⚠️  IMPORTANT: After setting the environment variable, restart your server!');
  
} else {
  console.log('✅ CLIENT_URL is correctly configured for production!');
  console.log(`Using: ${config.CLIENT_URL}`);
}

console.log('\n🧪 Test password reset URL:');
const testToken = 'test-token-123';
const resetUrl = `${config.CLIENT_URL}/reset-password/${testToken}`;
console.log(resetUrl);

if (resetUrl.includes('localhost')) {
  console.log('\n❌ This URL will not work in production emails!');
} else {
  console.log('\n✅ This URL will work correctly in production emails!');
}

