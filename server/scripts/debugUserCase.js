import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function debugUserCase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all law firms
    const lawFirms = await LawFirm.find({});
    console.log("\n=== ALL LAW FIRMS ===");
    lawFirms.forEach((firm, index) => {
      console.log(`${index + 1}. Firm Name: ${firm.firmName}`);
      console.log(`   Firm Code: ${firm.firmCode}`);
      console.log(`   Firm ID: ${firm._id}`);
      console.log("---");
    });

    // Find users that might be "James Mwemi" (check for similar names)
    const possibleUsers = await User.find({
      $or: [
        { firstName: { $regex: "James", $options: "i" } },
        { lastName: { $regex: "Mwemi", $options: "i" } },
        { firstName: { $regex: "James", $options: "i" } },
        { lastName: { $regex: "Obure", $options: "i" } },
      ],
    }).populate("lawFirm", "firmName firmCode");

    console.log(`\n=== POSSIBLE USERS (${possibleUsers.length}) ===`);
    possibleUsers.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(
        `   Law Firm: ${user.lawFirm?.firmName || "No law firm"} (${
          user.lawFirm?._id || "No ID"
        })`
      );
      console.log(`   User ID: ${user._id}`);
      console.log("---");
    });

    // Check all credit cases and their law firms
    const allCases = await CreditCase.find({}).populate(
      "lawFirm",
      "firmName firmCode"
    );
    console.log(`\n=== ALL CREDIT CASES (${allCases.length}) ===`);
    allCases.forEach((case_, index) => {
      console.log(`${index + 1}. Case Number: ${case_.caseNumber}`);
      console.log(`   Title: ${case_.title}`);
      console.log(
        `   Law Firm: ${case_.lawFirm?.firmName || "NULL"} (${
          case_.lawFirm?._id || "NULL"
        })`
      );
      console.log(`   Status: ${case_.status}`);
      console.log(`   Created: ${case_.createdAt}`);
      console.log(`   Created By: ${case_.createdBy}`);
      console.log("---");
    });

    // Check for cases created in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentCases = await CreditCase.find({
      createdAt: { $gte: yesterday },
    }).populate("lawFirm", "firmName firmCode");

    console.log(
      `\n=== RECENT CASES (last 24 hours) (${recentCases.length}) ===`
    );
    recentCases.forEach((case_, index) => {
      console.log(`${index + 1}. Case Number: ${case_.caseNumber}`);
      console.log(`   Title: ${case_.title}`);
      console.log(
        `   Law Firm: ${case_.lawFirm?.firmName || "NULL"} (${
          case_.lawFirm?._id || "NULL"
        })`
      );
      console.log(`   Status: ${case_.status}`);
      console.log(`   Created: ${case_.createdAt}`);
      console.log(`   Created By: ${case_.createdBy}`);
      console.log("---");
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

debugUserCase();
