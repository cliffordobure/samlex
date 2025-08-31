import mongoose from "mongoose";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";
import config from "../config/config.js";

// Connect to MongoDB
mongoose.connect(config.MONGO_URI);

const activateInactiveUsers = async () => {
  try {
    console.log("🔧 Activating inactive users and law firms...");

    // Find all inactive law firm admin users
    const inactiveUsers = await User.find({
      role: "law_firm_admin",
      isActive: false,
    }).populate("lawFirm");

    console.log(`Found ${inactiveUsers.length} inactive admin users`);

    for (const user of inactiveUsers) {
      console.log(`Activating user: ${user.email}`);

      // Activate the user
      user.isActive = true;
      await user.save();

      // Activate the associated law firm if it exists
      if (user.lawFirm) {
        console.log(`Activating law firm: ${user.lawFirm.firmName}`);
        user.lawFirm.isActive = true;
        user.lawFirm.registrationStatus = "approved";
        await user.lawFirm.save();
      }
    }

    // Also activate any inactive law firms that might not have admin users
    const inactiveLawFirms = await LawFirm.find({
      isActive: false,
      registrationStatus: "pending",
    });

    console.log(`Found ${inactiveLawFirms.length} inactive law firms`);

    for (const lawFirm of inactiveLawFirms) {
      console.log(`Activating law firm: ${lawFirm.firmName}`);
      lawFirm.isActive = true;
      lawFirm.registrationStatus = "approved";
      await lawFirm.save();
    }

    console.log("✅ All inactive users and law firms have been activated!");

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error activating users:", error);
    await mongoose.disconnect();
  }
};

// Run the script
activateInactiveUsers();
