import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import LawFirm from "../models/LawFirm.js";
import User from "../models/User.js";
import CreditCase from "../models/CreditCase.js";
import jwt from "jsonwebtoken";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: join(__dirname, "..", ".env") });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function testApiCall() {
  try {
    console.log("=== TESTING API CALL SIMULATION ===\n");

    // Find James Mwemi user
    const user = await User.findOne({ email: "james@gmail.com" });

    if (!user) {
      console.log("❌ James Mwemi user not found");
      return;
    }

    console.log(
      `✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`
    );
    console.log(`   Role: ${user.role}`);
    console.log(`   Law Firm: ${user.lawFirm}`);

    // Check if user has law firm populated
    if (!user.lawFirm) {
      console.log("❌ User has no law firm association");
      return;
    }

    // Simulate the API call that the frontend makes
    console.log("\n🔍 Simulating API call: GET /api/credit-cases");
    console.log("User law firm ID:", user.lawFirm);

    // This is the same filter logic as in the controller
    const filter = { lawFirm: user.lawFirm };
    console.log("Filter used:", filter);

    const cases = await CreditCase.find(filter)
      .populate("assignedTo", "firstName lastName email role")
      .sort({ createdAt: -1 });

    console.log(`\n📊 API Response:`);
    console.log(`   Cases found: ${cases.length}`);
    console.log(`   Success: true`);
    console.log(`   Data: ${cases.length} cases`);

    if (cases.length > 0) {
      console.log("\n📋 Cases details:");
      cases.forEach((case_, index) => {
        console.log(
          `   ${index + 1}. ${case_.caseNumber} - ${case_.title || "No title"}`
        );
        console.log(`      Status: ${case_.status}`);
        console.log(`      Law Firm: ${case_.lawFirm}`);
        console.log(`      Created: ${case_.createdAt}`);
        console.log("");
      });
    }

    // Also test with lawFirm parameter (as admin view does)
    console.log(
      "\n🔍 Simulating API call with lawFirm parameter: GET /api/credit-cases?lawFirm=" +
        user.lawFirm
    );

    const casesWithParam = await CreditCase.find({ lawFirm: user.lawFirm })
      .populate("assignedTo", "firstName lastName email role")
      .sort({ createdAt: -1 });

    console.log(`📊 API Response with lawFirm parameter:`);
    console.log(`   Cases found: ${casesWithParam.length}`);
    console.log(`   Success: true`);
    console.log(`   Data: ${casesWithParam.length} cases`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

testApiCall();
