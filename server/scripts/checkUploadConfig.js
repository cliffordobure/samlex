#!/usr/bin/env node

/**
 * Script to check upload configuration and diagnose 405 errors
 */

import dotenv from 'dotenv';
import config from '../config/config.js';

// Load environment variables
dotenv.config();

console.log('🔍 Upload Configuration Diagnostic\n');

console.log('📋 Environment Variables:');
console.log(`NODE_ENV: ${config.NODE_ENV}`);
console.log(`PORT: ${config.PORT}`);

console.log('\n☁️  Cloudinary Configuration:');
console.log(`CLOUDINARY_CLOUD_NAME: ${config.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing'}`);
console.log(`CLOUDINARY_API_KEY: ${config.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`CLOUDINARY_API_SECRET: ${config.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'}`);

console.log('\n📁 Upload Configuration:');
console.log(`MAX_FILE_SIZE: ${config.MAX_FILE_SIZE} bytes (${Math.round(config.MAX_FILE_SIZE / 1024 / 1024)}MB)`);
console.log(`UPLOAD_PATH: ${config.UPLOAD_PATH}`);

console.log('\n🌐 Client Configuration:');
console.log(`CLIENT_URL: ${config.CLIENT_URL}`);

// Check if all required variables are present
const missingVars = [];
if (!config.CLOUDINARY_CLOUD_NAME) missingVars.push('CLOUDINARY_CLOUD_NAME');
if (!config.CLOUDINARY_API_KEY) missingVars.push('CLOUDINARY_API_KEY');
if (!config.CLOUDINARY_API_SECRET) missingVars.push('CLOUDINARY_API_SECRET');

if (missingVars.length > 0) {
  console.log('\n❌ PROBLEM FOUND: Missing required environment variables!');
  console.log('Missing variables:', missingVars.join(', '));
  console.log('\n🔧 SOLUTION:');
  console.log('Set these environment variables in your production deployment:');
  
  missingVars.forEach(varName => {
    console.log(`   ${varName}=your_${varName.toLowerCase()}`);
  });
  
  console.log('\n📋 For different deployment platforms:');
  console.log('\n1. For Render:');
  console.log('   - Go to your service dashboard');
  console.log('   - Navigate to Environment tab');
  console.log('   - Add the missing variables');
  
  console.log('\n2. For Railway:');
  console.log('   - Go to your project dashboard');
  console.log('   - Navigate to Variables tab');
  console.log('   - Add the missing variables');
  
  console.log('\n3. For Heroku:');
  missingVars.forEach(varName => {
    console.log(`   heroku config:set ${varName}=your_${varName.toLowerCase()}`);
  });
  
  console.log('\n⚠️  IMPORTANT: After setting environment variables, restart your server!');
  
} else {
  console.log('\n✅ All required environment variables are configured!');
}

console.log('\n🧪 Upload Endpoint Test:');
console.log('POST /api/upload - Should work if Cloudinary vars are set');
console.log('GET /api/upload/test - Simple test endpoint');
console.log('GET /api/upload/health - Health check endpoint');

console.log('\n🔗 Test URLs:');
console.log(`Test endpoint: ${config.CLIENT_URL.replace('samlex-client.vercel.app', 'samlex.onrender.com')}/api/upload/test`);
console.log(`Health check: ${config.CLIENT_URL.replace('samlex-client.vercel.app', 'samlex.onrender.com')}/api/upload/health`);
