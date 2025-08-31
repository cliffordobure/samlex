import mongoose from "mongoose";
import { User } from "../models/index.js";
import config from "../config/config.js";

const fixDuplicateUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to database");

    console.log("\n[DEBUG] ===== FIXING DUPLICATE USERS =====");

    // Find all users with duplicate emails
    const duplicateEmails = await User.aggregate([
      {
        $group: {
          _id: "$email",
          count: { $sum: 1 },
          users: { $push: "$$ROOT" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    console.log(`Found ${duplicateEmails.length} emails with duplicate users`);

    for (const duplicate of duplicateEmails) {
      const email = duplicate._id;
      const users = duplicate.users;

      console.log(`\nProcessing email: ${email}`);
      console.log(`Found ${users.length} users with this email:`);

      // Sort users by creation date (newest first)
      users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Keep the newest user, delete the rest
      const userToKeep = users[0];
      const usersToDelete = users.slice(1);

      console.log(
        `Keeping user: ${userToKeep._id} (created: ${userToKeep.createdAt})`
      );
      console.log(`Deleting ${usersToDelete.length} older users:`);

      for (const userToDelete of usersToDelete) {
        console.log(
          `  - ${userToDelete._id} (created: ${userToDelete.createdAt})`
        );
        await User.findByIdAndDelete(userToDelete._id);
      }
    }

    console.log("\n[DEBUG] ===== DUPLICATE USERS FIXED =====");
  } catch (error) {
    console.error("Error fixing duplicate users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

// Run the fix
fixDuplicateUsers();
