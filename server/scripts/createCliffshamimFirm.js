import mongoose from "mongoose";
import LawFirm from "../models/LawFirm.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function createCliffshamimFirm() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if Cliffshamim law firm already exists
    const existingFirm = await LawFirm.findOne({
      firmName: { $regex: /cliffshamim/i },
    });

    if (existingFirm) {
      console.log("✅ Cliffshamim law firm already exists:");
      console.log(`   Firm Name: ${existingFirm.firmName}`);
      console.log(`   Firm ID: ${existingFirm._id}`);
      console.log(`   Firm Code: ${existingFirm.firmCode}`);
    } else {
      // Create Cliffshamim law firm
      const newFirm = new LawFirm({
        firmName: "Cliffshamim law firm",
        firmEmail: "kivuvakevin4@gmail.com",
        firmType: "general",
        website: "https://www.more.co.ke",
        licenseNumber: "",
        registrationStatus: "approved",
        firmPhone: "0759466446",
        isActive: true,
        role: "law_firm",
        address: {
          street: "254",
          city: "Nairobi Municipality",
          state: "Nairobi",
          zipCode: "00100",
          country: "Kenya",
        },
        subscription: {
          plan: "basic",
          status: "trial",
          startDate: new Date("2025-07-23T20:44:52.461Z"),
          trialEndsAt: new Date("2025-08-22T20:44:52.461Z"),
          endDate: new Date("2025-08-22T20:44:52.468Z"),
        },
        settings: {
          escalationFees: {
            caseFilingFee: 5000,
            autoEscalation: false,
            requireConfirmation: true,
          },
          allowedDepartments: ["credit_collection", "legal"],
          customFields: new Map(),
          paymentMethods: ["stripe", "bank_transfer"],
          emailNotifications: true,
          timezone: "Africa/Nairobi",
        },
        loginEmail: "254kivuvakevin4@gmail.com",
      });

      const savedFirm = await newFirm.save();
      console.log("✅ Cliffshamim law firm created successfully:");
      console.log(`   Firm Name: ${savedFirm.firmName}`);
      console.log(`   Firm ID: ${savedFirm._id}`);
      console.log(`   Firm Code: ${savedFirm.firmCode}`);
    }

    // Get the firm (either existing or newly created)
    const firm = await LawFirm.findOne({
      firmName: { $regex: /cliffshamim/i },
    });

    // Check if James Mwemi user exists
    const jamesUser = await User.findOne({ email: "james@gmail.com" });

    if (jamesUser) {
      console.log("✅ James Mwemi user already exists:");
      console.log(`   Name: ${jamesUser.firstName} ${jamesUser.lastName}`);
      console.log(`   Email: ${jamesUser.email}`);
      console.log(`   Role: ${jamesUser.role}`);
      console.log(`   Current Law Firm: ${jamesUser.lawFirm}`);

      // Update James Mwemi to belong to Cliffshamim law firm
      if (jamesUser.lawFirm?.toString() !== firm._id.toString()) {
        jamesUser.lawFirm = firm._id;
        await jamesUser.save();
        console.log("✅ Updated James Mwemi's law firm association");
      }
    } else {
      // Create James Mwemi user
      const hashedPassword = await bcrypt.hash("password123", 12);

      const newJames = new User({
        firstName: "James",
        lastName: "Mwemi",
        email: "james@gmail.com",
        password: hashedPassword,
        role: "law_firm_admin",
        lawFirm: firm._id,
        phoneNumber: "+254759466446",
        isActive: true,
        emailVerified: true,
      });

      const savedJames = await newJames.save();
      console.log("✅ James Mwemi user created successfully:");
      console.log(`   Name: ${savedJames.firstName} ${savedJames.lastName}`);
      console.log(`   Email: ${savedJames.email}`);
      console.log(`   Role: ${savedJames.role}`);
      console.log(`   Password: password123`);
    }

    // Check if debt collector exists
    const existingCollector = await User.findOne({
      lawFirm: firm._id,
      role: "debt_collector",
    });

    if (existingCollector) {
      console.log("✅ Debt collector already exists:");
      console.log(
        `   Name: ${existingCollector.firstName} ${existingCollector.lastName}`
      );
      console.log(`   Email: ${existingCollector.email}`);
      console.log(`   Role: ${existingCollector.role}`);
    } else {
      // Create a debt collector user
      const hashedPassword = await bcrypt.hash("password123", 12);

      const newCollector = new User({
        firstName: "John",
        lastName: "Collector",
        email: "collector@cliffshamim.com",
        password: hashedPassword,
        role: "debt_collector",
        lawFirm: firm._id,
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
      console.log(`   Password: password123`);
    }

    // Verify all users in the law firm
    const allUsers = await User.find({ lawFirm: firm._id });
    console.log(`\n👥 Total users in ${firm.firmName}: ${allUsers.length}`);
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

createCliffshamimFirm();
