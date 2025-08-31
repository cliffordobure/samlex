import mongoose from "mongoose";
import emailService from "../utils/emailService.js";
import config from "../config/config.js";

const testEmailService = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to database");

    console.log("\n🧪 Testing Email Service Configuration");
    console.log("=====================================");

    // Check email configuration
    console.log("📧 Email Configuration:");
    console.log("Host:", config.EMAIL_HOST);
    console.log("Port:", config.EMAIL_PORT);
    console.log("User:", config.EMAIL_USER);
    console.log("Pass:", config.EMAIL_PASS ? "***SET***" : "***NOT SET***");
    console.log("Client URL:", config.CLIENT_URL);

    // Test email service connection
    console.log("\n🔍 Testing email service connection...");
    const emailServiceReady = await emailService.verifyConnection();
    console.log("Email service ready:", emailServiceReady);

    if (!emailServiceReady) {
      console.log("❌ Email service is not ready!");
      console.log("Please check your email configuration in .env file:");
      console.log("EMAIL_HOST=smtp.gmail.com");
      console.log("EMAIL_PORT=587");
      console.log("EMAIL_USER=your-email@gmail.com");
      console.log("EMAIL_PASS=your-app-password");
      return;
    }

    // Test sending a welcome email
    console.log("\n📤 Testing welcome email...");
    const testUser = {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com", // Change this to a real email for testing
      role: "test",
    };

    const testLawFirm = {
      firmName: "Test Law Firm",
    };

    try {
      await emailService.sendWelcomeEmail(
        testUser,
        "TestPassword123!",
        testLawFirm
      );
      console.log("✅ Test welcome email sent successfully!");
    } catch (emailError) {
      console.error(
        "❌ Failed to send test welcome email:",
        emailError.message
      );
      console.error("❌ Error details:", {
        name: emailError.name,
        stack: emailError.stack,
      });
    }

    // Test law firm registration email
    console.log("\n📤 Testing law firm registration email...");
    try {
      await emailService.sendLawFirmRegistrationEmail({
        to: "test@example.com", // Change this to a real email for testing
        firmName: "Test Law Firm",
        adminName: "Test Admin",
        plan: "premium",
      });
      console.log("✅ Test law firm registration email sent successfully!");
    } catch (emailError) {
      console.error(
        "❌ Failed to send law firm registration email:",
        emailError.message
      );
      console.error("❌ Error details:", {
        name: emailError.name,
        stack: emailError.stack,
      });
    }

    console.log("\n✅ Email service test completed!");
  } catch (error) {
    console.error("❌ Error testing email service:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

// Run the test
testEmailService();
