#!/usr/bin/env node

/**
 * Test script to verify debt collector API endpoints return correct data
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

async function testDebtCollectorAPIs() {
  console.log('🧪 Testing Debt Collector API Endpoints...\n');

  try {
    // Step 1: Login as Romano Okinyi
    console.log('1️⃣ Logging in as Romano Okinyi...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'ogachoroman@gmail.com',
      password: 'password'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log(`✅ Logged in as: ${user.firstName} ${user.lastName} (${user.role})`);

    // Set up axios instance with auth token
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test debt collector stats endpoint
    console.log('\n2️⃣ Testing getDebtCollectorStatsById endpoint...');
    try {
      const statsResponse = await api.get(`/reports/debt-collector/${user._id}/stats?period=30`);
      
      if (statsResponse.data.success) {
        console.log('✅ Debt collector stats retrieved successfully');
        const data = statsResponse.data.data;
        
        console.log('📊 Basic Stats:', JSON.stringify(data.basicStats, null, 2));
        console.log('💰 Financial Stats:', JSON.stringify(data.financialStats, null, 2));
        console.log('📋 Assigned Cases Count:', data.assignedCases?.length || 0);
        
        if (data.assignedCases && data.assignedCases.length > 0) {
          console.log('✅ Assigned cases are included in response');
          console.log('📋 Sample case:', {
            title: data.assignedCases[0].title,
            status: data.assignedCases[0].status,
            debtAmount: data.assignedCases[0].debtAmount
          });
        } else {
          console.log('❌ No assigned cases found in response');
        }
      } else {
        console.log('❌ Failed to retrieve debt collector stats');
        console.log('Error:', statsResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error testing debt collector stats:', error.response?.data?.message || error.message);
    }

    // Step 3: Test enhanced credit collection performance endpoint
    console.log('\n3️⃣ Testing getEnhancedCreditCollectionPerformance endpoint...');
    try {
      const performanceResponse = await api.get(`/reports/credit-collection/enhanced-performance/${user.lawFirm._id}?period=30`);
      
      if (performanceResponse.data.success) {
        console.log('✅ Enhanced credit collection performance retrieved successfully');
        const data = performanceResponse.data.data;
        
        console.log('📊 Overview:', JSON.stringify(data.overview, null, 2));
        console.log('📋 Assigned Cases Count:', data.assignedCases?.length || 0);
        
        if (data.assignedCases && data.assignedCases.length > 0) {
          console.log('✅ Assigned cases are included in response');
          console.log('📋 Sample case:', {
            title: data.assignedCases[0].title,
            status: data.assignedCases[0].status,
            debtAmount: data.assignedCases[0].debtAmount
          });
        } else {
          console.log('❌ No assigned cases found in response');
        }
      } else {
        console.log('❌ Failed to retrieve enhanced performance');
        console.log('Error:', performanceResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error testing enhanced performance:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 API endpoint testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testDebtCollectorAPIs();
