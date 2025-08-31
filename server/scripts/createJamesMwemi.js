import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import LawFirm from "../models/LawFirm.js";
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

async function createJamesMwemi() {
  try {
    console.log("=== CREATING JAMES MWEMI USER ===\n");

    // Find Cliffshamim law firm
    const shamimFirm = await LawFirm.findOne({
      firmName: { $regex: /cliffshamim/i },
    });

    if (!shamimFirm) {
      console.log("❌ Cliffshamim law firm not found");
      return;
    }

    console.log(
      `✅ Found law firm: ${shamimFirm.firmName} (ID: ${shamimFirm._id})`
    );

    // Check if James Mwemi already exists
    const existingUser = await User.findOne({
      $or: [
        { email: "james.mwemi@gmail.com" },
        { firstName: "James", lastName: "Mwemi" },
      ],
    });

    if (existingUser) {
      console.log("⚠️ User James Mwemi already exists:");
      console.log(
        `   Name: ${existingUser.firstName} ${existingUser.lastName}`
      );
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Law Firm: ${existingUser.lawFirm}`);

      // Update the user's law firm if needed
      if (existingUser.lawFirm?.toString() !== shamimFirm._id.toString()) {
        console.log("🔄 Updating user law firm association...");
        existingUser.lawFirm = shamimFirm._id;
        await existingUser.save();
        console.log("✅ User law firm updated successfully");
      }
      return;
    }

    // Create James Mwemi user
    const hashedPassword = await bcrypt.hash("password123", 12);

    const newUser = new User({
      firstName: "James",
      lastName: "Mwemi",
      email: "james.mwemi@gmail.com",
      password: hashedPassword,
      role: "law_firm_admin",
      lawFirm: shamimFirm._id,
      phone: "+254759466446",
      isActive: true,
      emailVerified: true,
    });

    const savedUser = await newUser.save();

    console.log("✅ James Mwemi user created successfully:");
    console.log(`   Name: ${savedUser.firstName} ${savedUser.lastName}`);
    console.log(`   Email: ${savedUser.email}`);
    console.log(`   Role: ${savedUser.role}`);
    console.log(`   Law Firm: ${savedUser.lawFirm}`);
    console.log(`   Password: password123`);

    // Check all users in the law firm
    const allUsers = await User.find({ lawFirm: shamimFirm._id });
    console.log(
      `\n👥 Total users in ${shamimFirm.firmName}: ${allUsers.length}`
    );
    allUsers.forEach((user) => {
      console.log(
        `   - ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

createJamesMwemi();
