import mongoose from "mongoose";
import config from "../config/config.js";
import SystemOwner from "../models/SystemOwner.js";
import LawFirm from "../models/LawFirm.js";
import User from "../models/User.js";

const updateUserRoles = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Update SystemOwner documents
    const systemOwners = await SystemOwner.find({ role: { $exists: false } });
    if (systemOwners.length > 0) {
      await SystemOwner.updateMany(
        { role: { $exists: false } },
        { $set: { role: "system_owner" } }
      );
      console.log(`✅ Updated ${systemOwners.length} SystemOwner documents`);
    } else {
      console.log("✅ All SystemOwner documents already have role field");
    }

    // Update LawFirm documents
    const lawFirms = await LawFirm.find({ role: { $exists: false } });
    if (lawFirms.length > 0) {
      await LawFirm.updateMany(
        { role: { $exists: false } },
        { $set: { role: "law_firm" } }
      );
      console.log(`✅ Updated ${lawFirms.length} LawFirm documents`);
    } else {
      console.log("✅ All LawFirm documents already have role field");
    }

    // Update User documents (set default role if missing)
    const usersWithoutRole = await User.find({ role: { $exists: false } });
    if (usersWithoutRole.length > 0) {
      // Set a default role for users without role
      await User.updateMany(
        { role: { $exists: false } },
        { $set: { role: "client" } }
      );
      console.log(
        `✅ Updated ${usersWithoutRole.length} User documents with default role`
      );
    } else {
      console.log("✅ All User documents already have role field");
    }

    console.log("✅ User role update completed successfully");
  } catch (error) {
    console.error("❌ Error updating user roles:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
};

// Run the script
updateUserRoles();
