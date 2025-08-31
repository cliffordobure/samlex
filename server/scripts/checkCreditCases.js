import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function checkCreditCases() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Get all credit cases
    const allCases = await CreditCase.find({}).populate(
      "lawFirm",
      "firmName firmCode"
    );
    console.log(`\nTotal credit cases in database: ${allCases.length}`);

    if (allCases.length > 0) {
      console.log("\nCredit cases found:");
      allCases.forEach((case_, index) => {
        console.log(`${index + 1}. Case Number: ${case_.caseNumber}`);
        console.log(`   Title: ${case_.title}`);
        console.log(
          `   Law Firm: ${case_.lawFirm?.firmName || "No law firm"} (${
            case_.lawFirm?._id || "No ID"
          })`
        );
        console.log(`   Status: ${case_.status}`);
        console.log(`   Created: ${case_.createdAt}`);
        console.log(`   Case ID: ${case_._id}`);
        console.log("---");
      });
    }

    // Get all law firms
    const lawFirms = await LawFirm.find({});
    console.log(`\nTotal law firms in database: ${lawFirms.length}`);

    if (lawFirms.length > 0) {
      console.log("\nLaw firms found:");
      lawFirms.forEach((firm, index) => {
        console.log(`${index + 1}. Firm Name: ${firm.firmName}`);
        console.log(`   Firm Code: ${firm.firmCode}`);
        console.log(`   Firm ID: ${firm._id}`);
        console.log("---");
      });
    }

    // Get all users with their law firms
    const users = await User.find({}).populate("lawFirm", "firmName firmCode");
    console.log(`\nTotal users in database: ${users.length}`);

    const adminUsers = users.filter((user) => user.role === "law_firm_admin");
    console.log(`\nLaw firm admins found: ${adminUsers.length}`);

    if (adminUsers.length > 0) {
      console.log("\nAdmin users:");
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(
          `   Law Firm: ${user.lawFirm?.firmName || "No law firm"} (${
            user.lawFirm?._id || "No ID"
          })`
        );
        console.log(`   User ID: ${user._id}`);
        console.log("---");
      });
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

checkCreditCases();
