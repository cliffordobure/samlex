import mongoose from "mongoose";
import { User, LawFirm } from "../models/index.js";
import { generatePassword } from "../utils/generatePassword.js";
import emailService from "../utils/emailService.js";
import config from "../config/config.js";

const resetSpecificUserPassword = async (userEmail) => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to database");

    console.log(`\n🔐 Resetting password for user: ${userEmail}`);
    console.log("=====================================");

    // Find the user
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName}`);
    console.log(`Role: ${user.role}`);

    // Generate new password
    const newPassword = generatePassword();
    console.log(`🔑 New password: ${newPassword}`);

    // Update user password
    user.password = newPassword;
    await user.save();

    console.log("✅ Password updated in database");

    // Test the password
    const testUser = await User.findById(user._id).select("+password");
    const passwordTest = await testUser.comparePassword(newPassword);
    console.log(`🔐 Password test: ${passwordTest}`);

    // Get law firm details
    const lawFirm = await LawFirm.findById(user.lawFirm);
    if (!lawFirm) {
      console.log("❌ Law firm not found, skipping email");
    } else {
      console.log(`🏢 Law firm: ${lawFirm.firmName}`);

      // Send email with new password
      try {
        await emailService.sendWelcomeEmail(user, newPassword, lawFirm);
        console.log("📧 Password reset email sent successfully");
      } catch (emailError) {
        console.error("❌ Error sending email:", emailError);
      }
    }

    console.log("\n✅ Password reset completed!");
    console.log(`📧 Check email: ${userEmail}`);
    console.log(`🔑 New password: ${newPassword}`);
  } catch (error) {
    console.error("❌ Error resetting password:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.log("Usage: node scripts/resetUserPassword.js <user-email>");
  console.log(
    "Example: node scripts/resetUserPassword.js cliffordobure98@gmail.com"
  );
  process.exit(1);
}

// Run the reset
resetSpecificUserPassword(userEmail);
