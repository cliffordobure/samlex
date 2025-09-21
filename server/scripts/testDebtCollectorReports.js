#!/usr/bin/env node

/**
 * Test script for debt collector reports functionality
 * This script tests the backend API endpoints for debt collector reports
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'debtcollector@test.com',
  password: 'password123'
};

const testLawFirm = {
  firmName: 'Test Law Firm',
  email: 'admin@testlawfirm.com'
};

async function testDebtCollectorReports() {
  console.log('🧪 Testing Debt Collector Reports API Endpoints...\n');

  try {
    // Step 1: Login as debt collector
    console.log('1️⃣ Logging in as debt collector...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log(`✅ Logged in as: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`🏢 Law Firm: ${user.lawFirm?.firmName}\n`);

    // Set up axios instance with auth token
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test debt collector stats endpoint
    console.log('2️⃣ Testing debt collector stats endpoint...');
    try {
      const statsResponse = await api.get(`/reports/debt-collector/${user._id}/stats?period=30`);
      
      if (statsResponse.data.success) {
        console.log('✅ Debt collector stats retrieved successfully');
        console.log(`📊 Total Cases: ${statsResponse.data.data.totalCases}`);
        console.log(`💰 Amount Collected: KES ${statsResponse.data.data.totalAmountCollected?.toLocaleString() || 0}`);
        console.log(`📈 Collection Rate: ${statsResponse.data.data.collectionRate || 0}%`);
      } else {
        console.log('❌ Failed to retrieve debt collector stats');
        console.log('Error:', statsResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error testing debt collector stats:', error.response?.data?.message || error.message);
    }

    // Step 3: Test enhanced credit collection performance
    console.log('\n3️⃣ Testing enhanced credit collection performance...');
    try {
      const performanceResponse = await api.get(`/reports/credit-collection/enhanced-performance/${user.lawFirm._id}?period=30`);
      
      if (performanceResponse.data.success) {
        console.log('✅ Enhanced credit collection performance retrieved successfully');
        console.log(`📊 Performance data:`, JSON.stringify(performanceResponse.data.data, null, 2));
      } else {
        console.log('❌ Failed to retrieve enhanced performance data');
        console.log('Error:', performanceResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error testing enhanced performance:', error.response?.data?.message || error.message);
    }

    // Step 4: Test specialized debt collection report
    console.log('\n4️⃣ Testing specialized debt collection report...');
    try {
      const reportResponse = await api.get(`/reports/specialized/${user.lawFirm._id}/debt-collection`);
      
      if (reportResponse.status === 200) {
        console.log('✅ Specialized debt collection report generated successfully');
        console.log(`📄 Report size: ${reportResponse.data.length} characters`);
      } else {
        console.log('❌ Failed to generate specialized report');
      }
    } catch (error) {
      console.log('❌ Error testing specialized report:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Debt collector reports testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

// Run the test
testDebtCollectorReports();
