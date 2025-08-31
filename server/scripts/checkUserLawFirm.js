import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import User from "../models/User.js";

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

async function checkUserLawFirm() {
  try {
    console.log("=== CHECKING USER LAW FIRM ASSOCIATION ===\n");

    // Find James Mwemi user
    const user = await User.findOne({ email: "james@gmail.com" });

    if (!user) {
      console.log("❌ James Mwemi user not found");
      return;
    }

    console.log(
      `✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`
    );
    console.log(`   Role: ${user.role}`);
    console.log(`   Law Firm ID: ${user.lawFirm}`);
    console.log(`   Law Firm Type: ${typeof user.lawFirm}`);

    // Check if lawFirm is populated
    if (user.lawFirm) {
      console.log(`   Law Firm Object Keys: ${Object.keys(user.lawFirm)}`);
      console.log(`   Law Firm _id: ${user.lawFirm._id}`);
      console.log(`   Law Firm Name: ${user.lawFirm.firmName || "No name"}`);
    } else {
      console.log("   ❌ User has no law firm association");
    }

    // Try to populate the law firm
    const populatedUser = await User.findOne({
      email: "james@gmail.com",
    }).populate("lawFirm");

    console.log("\n🔍 After population:");
    console.log(`   Law Firm: ${populatedUser.lawFirm}`);
    console.log(`   Law Firm Type: ${typeof populatedUser.lawFirm}`);

    if (populatedUser.lawFirm) {
      console.log(
        `   Law Firm Object Keys: ${Object.keys(populatedUser.lawFirm)}`
      );
      console.log(`   Law Firm _id: ${populatedUser.lawFirm._id}`);
      console.log(
        `   Law Firm Name: ${populatedUser.lawFirm.firmName || "No name"}`
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

checkUserLawFirm();
