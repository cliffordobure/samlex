import mongoose from "mongoose";
import { config } from "../config/config.js";
import { createFollowUpDateNotifications } from "../services/notificationService.js";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log("✅ MongoDB Connected for Follow-up Notification Test");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Test function to create sample follow-up data
const createSampleFollowUpData = async () => {
  try {
    console.log("🔧 Creating sample follow-up data...");

    // Find a law firm
    const lawFirm = await mongoose.model("LawFirm").findOne();
    if (!lawFirm) {
      console.log("❌ No law firm found. Please create a law firm first.");
      return;
    }

    // Find a debt collector
    const debtCollector = await User.findOne({
      role: "debt_collector",
      lawFirm: lawFirm._id,
    });
    if (!debtCollector) {
      console.log(
        "❌ No debt collector found. Please create a debt collector first."
      );
      return;
    }

    // Find a credit case
    const creditCase = await CreditCase.findOne({
      lawFirm: lawFirm._id,
    });
    if (!creditCase) {
      console.log(
        "❌ No credit case found. Please create a credit case first."
      );
      return;
    }

    // Add a follow-up note for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10:00 AM

    const followUpNote = {
      content: "Test follow-up: Call debtor to discuss payment plan",
      date: new Date(),
      followUpDate: tomorrow,
      createdBy: debtCollector._id,
      createdAt: new Date(),
    };

    // Update the credit case with the follow-up note
    await CreditCase.findByIdAndUpdate(
      creditCase._id,
      {
        $push: {
          notes: followUpNote,
        },
      },
      { new: true }
    );

    console.log("✅ Sample follow-up data created successfully");
    console.log("📅 Follow-up scheduled for:", tomorrow.toLocaleDateString());
    console.log(
      "👤 Assigned to:",
      debtCollector.firstName,
      debtCollector.lastName
    );
    console.log("📋 Case:", creditCase.caseNumber);
  } catch (error) {
    console.error("❌ Error creating sample data:", error);
  }
};

// Main test function
const testFollowUpNotifications = async () => {
  try {
    console.log("🧪 Starting follow-up notification test...");
    console.log("📅 Current time:", new Date().toISOString());

    // Create sample data first
    await createSampleFollowUpData();

    // Test the notification creation
    console.log("📋 Testing follow-up date notifications...");
    await createFollowUpDateNotifications();
    console.log("✅ Follow-up notification test completed");
  } catch (error) {
    console.error("❌ Error in follow-up notification test:", error);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
};

// Run the test
if (process.argv[1] === new URL(import.meta.url).pathname) {
  connectDB().then(() => {
    testFollowUpNotifications();
  });
}
