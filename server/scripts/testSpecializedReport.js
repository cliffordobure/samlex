#!/usr/bin/env node

/**
 * Test script to simulate the specialized debt collection report generation
 * This script tests the exact API call that generates the report
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

async function testSpecializedReport() {
  console.log('🧪 Testing Specialized Debt Collection Report Generation...\n');

  try {
    // Step 1: Login as Romano Okinyi
    console.log('1️⃣ Logging in as Romano Okinyi...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'ogachoroman@gmail.com', // Use the actual email from the debug
      password: 'password'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log(`✅ Logged in as: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`🏢 Law Firm: ${user.lawFirm?.firmName}`);

    // Set up axios instance with auth token
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test debt collector stats endpoint
    console.log('\n2️⃣ Testing debt collector stats endpoint...');
    try {
      const statsResponse = await api.get(`/reports/debt-collector/${user._id}/stats?period=30`);
      
      if (statsResponse.data.success) {
        console.log('✅ Debt collector stats retrieved successfully');
        console.log('📊 Stats data:', JSON.stringify(statsResponse.data.data, null, 2));
      } else {
        console.log('❌ Failed to retrieve debt collector stats');
        console.log('Error:', statsResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error testing debt collector stats:', error.response?.data?.message || error.message);
    }

    // Step 3: Test specialized debt collection report
    console.log('\n3️⃣ Testing specialized debt collection report...');
    try {
      const reportResponse = await api.get(`/reports/specialized/${user.lawFirm._id}/debt-collection`);
      
      if (reportResponse.status === 200) {
        console.log('✅ Specialized debt collection report generated successfully');
        console.log(`📄 Report size: ${reportResponse.data.length} characters`);
        
        // Check if the report contains the expected data
        const reportContent = reportResponse.data;
        if (reportContent.includes('Total Credit Cases')) {
          console.log('✅ Report contains "Total Credit Cases" section');
        }
        if (reportContent.includes('Cases Collected')) {
          console.log('✅ Report contains "Cases Collected" section');
        }
        if (reportContent.includes('Collection Rate')) {
          console.log('✅ Report contains "Collection Rate" section');
        }
        
        // Check for actual values (not zeros)
        if (reportContent.includes('>0<') || reportContent.includes('>1<') || reportContent.includes('>2<')) {
          console.log('✅ Report contains non-zero values');
        } else {
          console.log('❌ Report appears to contain only zeros');
        }
        
        // Save report to file for inspection
        const fs = require('fs');
        fs.writeFileSync('debt_collection_report.html', reportContent);
        console.log('💾 Report saved to debt_collection_report.html for inspection');
        
      } else {
        console.log('❌ Failed to generate specialized report');
      }
    } catch (error) {
      console.log('❌ Error testing specialized report:', error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log('\n🎉 Specialized report testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testSpecializedReport();
