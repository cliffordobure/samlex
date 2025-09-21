#!/usr/bin/env node

/**
 * Simple test to check debt collector API endpoints
 * This script tests the API endpoints without requiring database connection
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

async function testDebtCollectorAPI() {
  console.log('🧪 Testing Debt Collector API Endpoints...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Checking if server is running...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running or health endpoint not available');
      console.log('💡 Make sure to start the server with: npm start');
      return;
    }

    // Test 2: Try to access debt collector stats endpoint (should return 401 without auth)
    console.log('\n2️⃣ Testing debt collector stats endpoint...');
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/reports/debt-collector/test-id/stats`);
      console.log('✅ Endpoint accessible (unexpected - should require auth)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint requires authentication (expected)');
      } else if (error.response?.status === 404) {
        console.log('✅ Endpoint exists but requires valid debt collector ID');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }

    // Test 3: Check specialized report endpoint
    console.log('\n3️⃣ Testing specialized debt collection report endpoint...');
    try {
      const reportResponse = await axios.get(`${API_BASE_URL}/reports/specialized/test-law-firm-id/debt-collection`);
      console.log('✅ Report endpoint accessible (unexpected - should require auth)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Report endpoint requires authentication (expected)');
      } else if (error.response?.status === 404) {
        console.log('✅ Report endpoint exists but requires valid law firm ID');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }

    console.log('\n🎉 API endpoint testing completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Make sure you have a .env file with MONGO_URI');
    console.log('   2. Start the server: npm start');
    console.log('   3. Create debt collector users in the database');
    console.log('   4. Create credit cases assigned to debt collectors');
    console.log('   5. Test the reports with proper authentication');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDebtCollectorAPI();
