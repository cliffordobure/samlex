import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: join(__dirname, "..", ".env") });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function resetJamesPassword() {
  try {
    console.log("=== RESETTING JAMES MWEMI PASSWORD ===\n");

    // Find James Mwemi user
    const user = await User.findOne({
      $or: [
        { email: "james@gmail.com" },
        { firstName: "James", lastName: "Mwemi" },
      ],
    });

    if (!user) {
      console.log("❌ James Mwemi user not found");
      return;
    }

    console.log(
      `✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`
    );

    // Reset password
    const newPassword = "password123";
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    await user.save();

    console.log("✅ Password reset successfully!");
    console.log(`   Email: ${user.email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Law Firm: ${user.lawFirm}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

resetJamesPassword();
