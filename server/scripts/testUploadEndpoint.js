#!/usr/bin/env node

/**
 * Test script to verify upload endpoint functionality
 */

import fetch from 'node-fetch';

const API_BASE = 'https://samlex.onrender.com/api';

async function testUploadEndpoint() {
  console.log('🧪 Testing Upload Endpoint\n');
  
  try {
    // Test 1: Health check endpoint
    console.log('1️⃣ Testing health check endpoint...');
    const healthResponse = await fetch(`${API_BASE}/upload/health`);
    console.log(`Health check status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData.message);
    } else {
      console.log('❌ Health check failed');
    }
    
    // Test 2: Test endpoint
    console.log('\n2️⃣ Testing test endpoint...');
    const testResponse = await fetch(`${API_BASE}/upload/test`);
    console.log(`Test endpoint status: ${testResponse.status}`);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Test endpoint passed:', testData.message);
    } else {
      console.log('❌ Test endpoint failed');
    }
    
    // Test 3: Upload endpoint (without file - should return 400)
    console.log('\n3️⃣ Testing upload endpoint (no file)...');
    const uploadResponse = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token', // This will fail auth but should not be 405
      },
    });
    console.log(`Upload endpoint status: ${uploadResponse.status}`);
    
    if (uploadResponse.status === 401) {
      console.log('✅ Upload endpoint is accessible (authentication required as expected)');
    } else if (uploadResponse.status === 405) {
      console.log('❌ Upload endpoint returns 405 - Method Not Allowed');
      console.log('This indicates the endpoint is not properly configured or Cloudinary is not set up');
    } else {
      console.log(`Upload endpoint returned status: ${uploadResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

// Run the test
testUploadEndpoint();
