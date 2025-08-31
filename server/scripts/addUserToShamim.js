import mongoose from "mongoose";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";
import bcrypt from "bcryptjs";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function addUserToShamim() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find Shamim Law firm
    const shamimLawFirm = await LawFirm.findOne({
      firmName: "Shamim Law firm",
    });
    if (!shamimLawFirm) {
      console.log("Shamim Law firm not found!");
      await mongoose.disconnect();
      return;
    }

    console.log(
      "Found Shamim Law firm:",
      shamimLawFirm.firmName,
      shamimLawFirm._id
    );

    // Check if user already exists
    const existingUser = await User.findOne({
      email: "james.mwemi@shamimlaw.com",
    });
    if (existingUser) {
      console.log(
        "User already exists:",
        existingUser.firstName,
        existingUser.lastName
      );
      console.log("Updating user's law firm...");

      await User.findByIdAndUpdate(existingUser._id, {
        lawFirm: shamimLawFirm._id,
      });
      console.log("Updated user's law firm to Shamim Law firm");
    } else {
      // Create new user for Shamim Law firm
      const hashedPassword = await bcrypt.hash("Admin123!@#", 12);

      const newUser = new User({
        firstName: "James",
        lastName: "Mwemi",
        email: "james.mwemi@shamimlaw.com",
        password: hashedPassword,
        role: "law_firm_admin",
        lawFirm: shamimLawFirm._id,
        phoneNumber: "+254700000000",
        address: {
          street: "123 Shamim Street",
          city: "Nairobi",
          state: "Nairobi County",
          zipCode: "00100",
          country: "Kenya",
        },
        emailVerified: true,
        isActive: true,
      });

      const savedUser = await newUser.save();
      console.log("Created new user:", savedUser.firstName, savedUser.lastName);
      console.log("User ID:", savedUser._id);
    }

    // Verify the user was created/updated
    const user = await User.findOne({
      email: "james.mwemi@shamimlaw.com",
    }).populate("lawFirm", "firmName firmCode");
    console.log("\n=== USER DETAILS ===");
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(
      `Law Firm: ${user.lawFirm?.firmName || "No law firm"} (${
        user.lawFirm?._id || "No ID"
      })`
    );
    console.log(`User ID: ${user._id}`);

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

addUserToShamim();
