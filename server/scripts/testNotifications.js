import mongoose from "mongoose";
import { config } from "../config/config.js";
import {
  createCourtDateNotifications,
  createFollowUpDateNotifications,
} from "../services/notificationService.js";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log("✅ MongoDB Connected for Test Notifications");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Test notification function
const testNotifications = async () => {
  try {
    console.log("🧪 Testing notification system...");
    console.log("📅 Current time:", new Date().toISOString());

    // Test court date notifications
    console.log("⚖️ Testing court date notifications...");
    await createCourtDateNotifications();
    console.log("✅ Court date notifications test completed");

    // Test follow-up date notifications
    console.log("📋 Testing follow-up date notifications...");
    await createFollowUpDateNotifications();
    console.log("✅ Follow-up date notifications test completed");

    console.log("🎉 All notification tests completed successfully");
  } catch (error) {
    console.error("❌ Error in notification tests:", error);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
};

// Run the test
if (process.argv[1] === new URL(import.meta.url).pathname) {
  connectDB().then(() => {
    testNotifications();
  });
}

export default testNotifications;
