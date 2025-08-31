import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const API_BASE_URL = "http://localhost:5000/api";

// Test user credentials (you'll need to update these)
const TEST_USER = {
  email: "edmond@kimani.com", // Update with actual test user
  password: "password123" // Update with actual password
};

let authToken = null;

const testEndpoints = async () => {
  try {
    console.log("🧪 Testing Credit Collection Report Endpoints...\n");

    // 1. Test authentication
    console.log("1. Testing authentication...");
    const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    if (authResponse.data.success) {
      authToken = authResponse.data.token;
      console.log("✅ Authentication successful");
    } else {
      console.log("❌ Authentication failed");
      return;
    }

    // Set auth header for subsequent requests
    const authHeaders = {
      Authorization: `Bearer ${authToken}`,
    };

    // 2. Test comprehensive summary endpoint
    console.log("\n2. Testing comprehensive summary endpoint...");
    try {
      const summaryResponse = await axios.get(
        `${API_BASE_URL}/reports/credit-collection/comprehensive-summary?period=30`,
        { headers: authHeaders }
      );
      console.log("✅ Comprehensive summary endpoint working");
      console.log(`   Total cases: ${summaryResponse.data.data.totalCases}`);
      console.log(`   Active cases: ${summaryResponse.data.data.activeCases}`);
      console.log(`   Resolved cases: ${summaryResponse.data.data.resolvedCases}`);
    } catch (error) {
      console.log("❌ Comprehensive summary endpoint failed:", error.response?.data?.message || error.message);
    }

    // 3. Test enhanced performance endpoint
    console.log("\n3. Testing enhanced performance endpoint...");
    try {
      // Get user's law firm ID from the auth response
      const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers: authHeaders });
      const lawFirmId = userResponse.data.user.lawFirm._id;
      
      const performanceResponse = await axios.get(
        `${API_BASE_URL}/reports/credit-collection/enhanced-performance/${lawFirmId}?period=30`,
        { headers: authHeaders }
      );
      console.log("✅ Enhanced performance endpoint working");
      console.log(`   Performance data received: ${performanceResponse.data.success ? 'Yes' : 'No'}`);
    } catch (error) {
      console.log("❌ Enhanced performance endpoint failed:", error.response?.data?.message || error.message);
    }

    // 4. Test enhanced revenue endpoint
    console.log("\n4. Testing enhanced revenue endpoint...");
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers: authHeaders });
      const lawFirmId = userResponse.data.user.lawFirm._id;
      
      const revenueResponse = await axios.get(
        `${API_BASE_URL}/reports/credit-collection/enhanced-revenue/${lawFirmId}?period=30`,
        { headers: authHeaders }
      );
      console.log("✅ Enhanced revenue endpoint working");
      console.log(`   Revenue data received: ${revenueResponse.data.success ? 'Yes' : 'No'}`);
    } catch (error) {
      console.log("❌ Enhanced revenue endpoint failed:", error.response?.data?.message || error.message);
    }

    // 5. Test enhanced promised payments endpoint
    console.log("\n5. Testing enhanced promised payments endpoint...");
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers: authHeaders });
      const lawFirmId = userResponse.data.user.lawFirm._id;
      
      const promisedPaymentsResponse = await axios.get(
        `${API_BASE_URL}/reports/credit-collection/enhanced-promised-payments/${lawFirmId}?period=30`,
        { headers: authHeaders }
      );
      console.log("✅ Enhanced promised payments endpoint working");
      console.log(`   Promised payments data received: ${promisedPaymentsResponse.data.success ? 'Yes' : 'No'}`);
    } catch (error) {
      console.log("❌ Enhanced promised payments endpoint failed:", error.response?.data?.message || error.message);
    }

    // 6. Test CSV download endpoint
    console.log("\n6. Testing CSV download endpoint...");
    try {
      const csvResponse = await axios.get(
        `${API_BASE_URL}/reports/credit-collection/download-csv?period=30`,
        { headers: authHeaders }
      );
      console.log("✅ CSV download endpoint working");
      console.log(`   CSV data received: ${csvResponse.data.success ? 'Yes' : 'No'}`);
    } catch (error) {
      console.log("❌ CSV download endpoint failed:", error.response?.data?.message || error.message);
    }

    // 7. Test PDF download endpoint
    console.log("\n7. Testing PDF download endpoint...");
    try {
      const pdfResponse = await axios.get(
        `${API_BASE_URL}/reports/credit-collection/download-pdf?period=30`,
        { headers: authHeaders }
      );
      console.log("✅ PDF download endpoint working");
      console.log(`   PDF data received: ${pdfResponse.data.success ? 'Yes' : 'No'}`);
    } catch (error) {
      console.log("❌ PDF download endpoint failed:", error.response?.data?.message || error.message);
    }

    console.log("\n🎉 Testing completed!");

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
  }
};

// Run the tests
testEndpoints();
