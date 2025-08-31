import mongoose from "mongoose";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function testAssignmentPermissions() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find Test Law Firm (since Cliffshamim doesn't exist in current DB)
    const testFirm = await LawFirm.findById("68615b748750369cbbd2ecf3");

    if (!testFirm) {
      console.log("❌ Test Law Firm not found");
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Found law firm: ${testFirm.firmName}`);

    // Get all users in this law firm
    const users = await User.find({ lawFirm: testFirm._id });
    console.log(`\n👥 Total users in ${testFirm.firmName}: ${users.length}`);

    if (users.length === 0) {
      console.log("❌ No users found in this law firm");
      await mongoose.disconnect();
      return;
    }

    // Group users by role
    const usersByRole = {};
    users.forEach((user) => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    console.log("\n📋 Users by role:");
    Object.keys(usersByRole).forEach((role) => {
      console.log(`\n${role.toUpperCase()} (${usersByRole[role].length}):`);
      usersByRole[role].forEach((user) => {
        console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`);
      });
    });

    // Show assignment permissions
    console.log("\n🎯 ASSIGNMENT PERMISSIONS:");
    console.log("\n📋 Credit Collection Cases can be assigned to:");
    console.log("   ✅ debt_collector");
    console.log("   ✅ credit_head");
    console.log("   ✅ law_firm_admin (admin can assign to themselves)");
    console.log("   ✅ admin (admin can assign to themselves)");

    console.log("\n⚖️ Legal Cases can be assigned to:");
    console.log("   ✅ advocate");
    console.log("   ✅ legal_head");
    console.log("   ✅ law_firm_admin (admin can assign to themselves)");
    console.log("   ✅ admin (admin can assign to themselves)");

    console.log("\n🔧 STATUS UPDATE PERMISSIONS:");
    console.log("\n📋 Credit Collection Cases:");
    console.log("   ✅ debt_collector (can update their assigned cases)");
    console.log("   ✅ law_firm_admin (can update any case)");
    console.log("   ✅ admin (can update any case)");

    console.log("\n⚖️ Legal Cases:");
    console.log("   ✅ advocate (can update their assigned cases)");
    console.log("   ✅ legal_head (can update any case)");
    console.log("   ✅ law_firm_admin (can update any case)");
    console.log("   ✅ admin (can update any case)");

    // Show available users for assignment
    console.log("\n👥 AVAILABLE USERS FOR ASSIGNMENT:");

    const creditAssignableUsers = users.filter((user) =>
      ["debt_collector", "credit_head", "law_firm_admin", "admin"].includes(
        user.role
      )
    );
    console.log(
      `\n📋 Credit Collection Cases (${creditAssignableUsers.length} users):`
    );
    creditAssignableUsers.forEach((user) => {
      console.log(
        `   - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`
      );
    });

    const legalAssignableUsers = users.filter((user) =>
      ["advocate", "legal_head", "law_firm_admin", "admin"].includes(user.role)
    );
    console.log(`\n⚖️ Legal Cases (${legalAssignableUsers.length} users):`);
    legalAssignableUsers.forEach((user) => {
      console.log(
        `   - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`
      );
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

testAssignmentPermissions();
