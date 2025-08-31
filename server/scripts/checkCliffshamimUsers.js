import mongoose from "mongoose";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function checkCliffshamimUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find Cliffshamim law firm by the exact ID from the database
    const cliffshamimFirm = await LawFirm.findById("688149c4eb24e665cc97ec48");

    if (!cliffshamimFirm) {
      console.log(
        "❌ Cliffshamim law firm not found with ID: 688149c4eb24e665cc97ec48"
      );
      await mongoose.disconnect();
      return;
    }

    console.log(
      `✅ Found law firm: ${cliffshamimFirm.firmName} (ID: ${cliffshamimFirm._id})`
    );

    // Get all users in this law firm
    const users = await User.find({ lawFirm: cliffshamimFirm._id });
    console.log(`\n👥 Users in ${cliffshamimFirm.firmName}: ${users.length}`);

    if (users.length === 0) {
      console.log("❌ No users found in this law firm");
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   User ID: ${user._id}`);
        console.log(`   Active: ${user.isActive}`);
        console.log("---");
      });
    }

    // Check specifically for debt collectors (who can be assigned cases)
    const debtCollectors = users.filter(
      (user) => user.role === "debt_collector"
    );
    console.log(`\n💰 Debt Collectors: ${debtCollectors.length}`);

    if (debtCollectors.length === 0) {
      console.log(
        "❌ No debt collectors found - this is why case assignment is failing!"
      );
      console.log(
        "💡 You need to create at least one debt collector user to assign cases to."
      );
    } else {
      debtCollectors.forEach((user, index) => {
        console.log(
          `${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`
        );
      });
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

checkCliffshamimUsers();
