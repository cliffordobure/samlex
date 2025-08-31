import mongoose from "mongoose";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";
import bcrypt from "bcryptjs";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function createDebtCollector() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find Shamim Law firm
    const shamimFirm = await LawFirm.findOne({
      firmName: { $regex: /shamim/i },
    });

    if (!shamimFirm) {
      console.log("❌ Shamim law firm not found");
      await mongoose.disconnect();
      return;
    }

    console.log(
      `✅ Found law firm: ${shamimFirm.firmName} (ID: ${shamimFirm._id})`
    );

    // Check if debt collector already exists
    const existingCollector = await User.findOne({
      lawFirm: shamimFirm._id,
      role: "debt_collector",
    });

    if (existingCollector) {
      console.log("✅ Debt collector already exists:");
      console.log(
        `   Name: ${existingCollector.firstName} ${existingCollector.lastName}`
      );
      console.log(`   Email: ${existingCollector.email}`);
      console.log(`   Role: ${existingCollector.role}`);
      await mongoose.disconnect();
      return;
    }

    // Create a debt collector user
    const hashedPassword = await bcrypt.hash("password123", 12);

    const newCollector = new User({
      firstName: "John",
      lastName: "Collector",
      email: "collector@shamimlaw.com",
      password: hashedPassword,
      role: "debt_collector",
      lawFirm: shamimFirm._id,
      phoneNumber: "+254700000001",
      address: {
        street: "123 Collector Street",
        city: "Nairobi",
        state: "Nairobi County",
        zipCode: "00100",
        country: "Kenya",
      },
      emailVerified: true,
      isActive: true,
    });

    const savedCollector = await newCollector.save();

    console.log("✅ Debt collector created successfully:");
    console.log(
      `   Name: ${savedCollector.firstName} ${savedCollector.lastName}`
    );
    console.log(`   Email: ${savedCollector.email}`);
    console.log(`   Role: ${savedCollector.role}`);
    console.log(`   Law Firm: ${shamimFirm.firmName}`);
    console.log(`   Password: password123`);

    // Verify all users in the law firm
    const allUsers = await User.find({ lawFirm: shamimFirm._id });
    console.log(
      `\n👥 Total users in ${shamimFirm.firmName}: ${allUsers.length}`
    );
    allUsers.forEach((user) => {
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

createDebtCollector();
