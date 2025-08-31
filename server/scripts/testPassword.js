import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { generatePassword } from "../utils/generatePassword.js";
import config from "../config/config.js";

const testPasswordGeneration = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to database");

    console.log("\n🔐 Testing Password Generation:");
    console.log("=====================================");

    // Test password generation
    for (let i = 0; i < 5; i++) {
      const password = generatePassword();
      console.log(`Password ${i + 1}: ${password}`);
      console.log(`Length: ${password.length}`);
      console.log(`Contains lowercase: ${/[a-z]/.test(password)}`);
      console.log(`Contains uppercase: ${/[A-Z]/.test(password)}`);
      console.log(`Contains number: ${/\d/.test(password)}`);
      console.log(`Contains special char: ${/[!@#$%^&*]/.test(password)}`);
      console.log("---");
    }

    // Test password hashing and comparison
    console.log("\n🔐 Testing Password Hashing:");
    console.log("=====================================");

    const testPassword = generatePassword();
    console.log(`Original password: ${testPassword}`);

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    console.log(`Hashed password: ${hashedPassword}`);

    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`Password match: ${isMatch}`);

    // Test with wrong password
    const wrongPassword = "WrongPassword123!";
    const isWrongMatch = await bcrypt.compare(wrongPassword, hashedPassword);
    console.log(`Wrong password match: ${isWrongMatch}`);

    console.log("\n✅ Password testing completed successfully!");
  } catch (error) {
    console.error("❌ Error testing passwords:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

// Run the test
testPasswordGeneration();
