import mongoose from "mongoose";
import { config } from "../config/config.js";
import {
  createCourtDateNotifications,
  createFollowUpDateNotifications,
  createPromisedPaymentNotifications,
} from "../services/notificationService.js";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log("✅ MongoDB Connected for Notification Scheduler");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Main scheduler function
const runNotificationScheduler = async () => {
  try {
    console.log("🕐 Starting notification scheduler...");
    console.log("📅 Current time:", new Date().toISOString());

    // Create court date notifications
    console.log("⚖️ Creating court date notifications...");
    await createCourtDateNotifications();
    console.log("✅ Court date notifications created");

    // Create follow-up date notifications
    console.log("📋 Creating follow-up date notifications...");
    await createFollowUpDateNotifications();
    console.log("✅ Follow-up date notifications created");

    // Create promised payment notifications
    console.log("💰 Creating promised payment notifications...");
    await createPromisedPaymentNotifications();
    console.log("✅ Promised payment notifications created");

    console.log("🎉 Notification scheduler completed successfully");
  } catch (error) {
    console.error("❌ Error in notification scheduler:", error);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
};

// Run the scheduler
if (process.argv[1] === new URL(import.meta.url).pathname) {
  connectDB().then(() => {
    runNotificationScheduler();
  });
}

export default runNotificationScheduler;
