import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function checkShamimLawFirm() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find Shamim Law firm
    const shamimLawFirm = await LawFirm.findOne({ firmName: "Shamim Law firm" });
    if (!shamimLawFirm) {
      console.log("Shamim Law firm not found!");
      await mongoose.disconnect();
      return;
    }

    console.log(`\n=== Shamim Law firm Details ===");
    console.log(`Firm Name: ${shamimLawFirm.firmName}`);
    console.log(`Firm Code: ${shamimLawFirm.firmCode}`);
    console.log(`Firm ID: ${shamimLawFirm._id}`);

    // Get users for Shamim Law firm
    const shamimUsers = await User.find({ lawFirm: shamimLawFirm._id });
    console.log(`\n=== Users for Shamim Law firm (${shamimUsers.length}) ===`);
    shamimUsers.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   User ID: ${user._id}`);
      console.log("---");
    });

    // Get cases for Shamim Law firm
    const shamimCases = await CreditCase.find({ lawFirm: shamimLawFirm._id });
    console.log(`\n=== Cases for Shamim Law firm (${shamimCases.length}) ===`);
    if (shamimCases.length > 0) {
      shamimCases.forEach((case_, index) => {
        console.log(`${index + 1}. Case Number: ${case_.caseNumber}`);
        console.log(`   Title: ${case_.title}`);
        console.log(`   Status: ${case_.status}`);
        console.log(`   Created: ${case_.createdAt}`);
        console.log(`   Case ID: ${case_._id}`);
        console.log("---");
      });
    } else {
      console.log("No cases found for Shamim Law firm");
    }

    // Check if there are any cases that should be moved to Shamim Law firm
    const allCases = await CreditCase.find({}).populate('lawFirm', 'firmName firmCode');
    console.log(`\n=== All Credit Cases (${allCases.length}) ===`);
    allCases.forEach((case_, index) => {
      console.log(`${index + 1}. Case Number: ${case_.caseNumber}`);
      console.log(`   Title: ${case_.title}`);
      console.log(`   Law Firm: ${case_.lawFirm?.firmName || 'NULL'} (${case_.lawFirm?._id || 'NULL'})`);
      console.log(`   Status: ${case_.status}`);
      console.log(`   Created: ${case_.createdAt}`);
      console.log("---");
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

checkShamimLawFirm(); 