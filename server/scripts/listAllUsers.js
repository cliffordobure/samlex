import mongoose from "mongoose";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function listAllUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Get all users with their law firms
    const users = await User.find({}).populate("lawFirm", "firmName firmCode");
    console.log(`\nTotal users in database: ${users.length}`);

    if (users.length > 0) {
      console.log("\nAll users:");
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(
          `   Law Firm: ${user.lawFirm?.firmName || "No law firm"} (${
            user.lawFirm?._id || "No ID"
          })`
        );
        console.log(`   User ID: ${user._id}`);
        console.log("---");
      });
    }

    // Check for any user with "James" or "Mwemi" in their name
    const jamesUsers = users.filter(
      (user) =>
        user.firstName.toLowerCase().includes("james") ||
        user.lastName.toLowerCase().includes("mwemi") ||
        user.email.includes("james")
    );

    if (jamesUsers.length > 0) {
      console.log(
        `\n🔍 Users that might be James Mwemi (${jamesUsers.length}):`
      );
      jamesUsers.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Law Firm: ${user.lawFirm?.firmName || "No law firm"}`);
        console.log(`   User ID: ${user._id}`);
        console.log("---");
      });
    } else {
      console.log("\n❌ No users found with 'James' or 'Mwemi' in their name");
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

listAllUsers();
