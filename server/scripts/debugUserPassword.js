import mongoose from "mongoose";
import { User } from "../models/index.js";
import config from "../config/config.js";

const debugUserPassword = async (userEmail) => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to database");

    console.log("\n[DEBUG] ===== USER PASSWORD DEBUG =====");
    console.log(`[DEBUG] Checking user: ${userEmail}`);
    console.log("=====================================");

    // Find the user with password
    const user = await User.findOne({ email: userEmail }).select("+password");

    if (!user) {
      console.log("User not found");
      return;
    }

    console.log(`Found user: ${user.firstName} ${user.lastName}`);
    console.log(`Role: ${user.role}`);
    console.log(`Created: ${user.createdAt}`);
    console.log(`Updated: ${user.updatedAt}`);
    console.log(`Password hash: ${user.password}`);
    console.log(`Password hash length: ${user.password.length}`);
    console.log(
      `Is password a hash? ${
        user.password.startsWith("$2a$") ||
        user.password.startsWith("$2b$") ||
        user.password.startsWith("$2y$")
      }`
    );

    // Check if there are multiple users with the same email
    const allUsers = await User.find({ email: userEmail });
    console.log(`\nFound ${allUsers.length} users with email: ${userEmail}`);

    if (allUsers.length > 1) {
      console.log("WARNING: Multiple users with same email!");
      allUsers.forEach((u, index) => {
        console.log(
          `User ${index + 1}: ID=${u._id}, Role=${u.role}, Created=${
            u.createdAt
          }`
        );
      });
    }

    console.log("\n[DEBUG] ===== END USER PASSWORD DEBUG =====");
  } catch (error) {
    console.error("❌ Error debugging user password:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.log("Usage: node scripts/debugUserPassword.js <user-email>");
  console.log(
    "Example: node scripts/debugUserPassword.js cliffordobure98@gmail.com"
  );
  process.exit(1);
}

// Run the debug
debugUserPassword(userEmail);
