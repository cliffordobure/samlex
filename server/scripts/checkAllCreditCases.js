import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function checkAllCreditCases() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Get all credit cases with law firm populated
    const allCases = await CreditCase.find({}).populate(
      "lawFirm",
      "firmName firmCode"
    );
    console.log(`\nTotal credit cases in database: ${allCases.length}`);

    if (allCases.length > 0) {
      console.log("\nAll credit cases:");
      allCases.forEach((case_, index) => {
        console.log(`${index + 1}. Case Number: ${case_.caseNumber}`);
        console.log(`   Title: ${case_.title}`);
        console.log(
          `   Law Firm: ${case_.lawFirm?.firmName || "NULL/INVALID"} (${
            case_.lawFirm?._id || "NULL"
          })`
        );
        console.log(`   Status: ${case_.status}`);
        console.log(`   Created: ${case_.createdAt}`);
        console.log(`   Case ID: ${case_._id}`);
        console.log("---");
      });
    }

    // Group cases by law firm
    const casesByLawFirm = {};
    allCases.forEach((case_) => {
      const firmName = case_.lawFirm?.firmName || "No Law Firm";
      if (!casesByLawFirm[firmName]) {
        casesByLawFirm[firmName] = [];
      }
      casesByLawFirm[firmName].push(case_);
    });

    console.log("\nCases grouped by law firm:");
    Object.keys(casesByLawFirm).forEach((firmName) => {
      console.log(`\n${firmName}: ${casesByLawFirm[firmName].length} cases`);
      casesByLawFirm[firmName].forEach((case_) => {
        console.log(
          `  - ${case_.caseNumber}: ${case_.title} (${case_.status})`
        );
      });
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

checkAllCreditCases();
