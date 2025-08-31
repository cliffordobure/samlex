import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function fixCreditCaseLawFirms() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find cases without law firm
    const casesWithoutLawFirm = await CreditCase.find({
      lawFirm: { $exists: false },
    });
    console.log(`\nFound ${casesWithoutLawFirm.length} cases without law firm`);

    if (casesWithoutLawFirm.length === 0) {
      console.log("No cases to fix!");
      await mongoose.disconnect();
      return;
    }

    // Get the KWCO LAW FIRM (which appears to be the main law firm)
    const kwcoLawFirm = await LawFirm.findOne({ firmName: "KWCO LAW FIRM" });
    if (!kwcoLawFirm) {
      console.log("KWCO LAW FIRM not found!");
      await mongoose.disconnect();
      return;
    }

    console.log(
      `\nUsing law firm: ${kwcoLawFirm.firmName} (${kwcoLawFirm._id})`
    );

    // Fix cases without law firm
    let fixedCount = 0;
    for (const case_ of casesWithoutLawFirm) {
      try {
        await CreditCase.findByIdAndUpdate(case_._id, {
          lawFirm: kwcoLawFirm._id,
        });
        console.log(`Fixed case: ${case_.caseNumber} - ${case_.title}`);
        fixedCount++;
      } catch (error) {
        console.error(`Error fixing case ${case_.caseNumber}:`, error.message);
      }
    }

    console.log(
      `\nFixed ${fixedCount} out of ${casesWithoutLawFirm.length} cases`
    );

    // Verify the fix
    const remainingCasesWithoutLawFirm = await CreditCase.find({
      lawFirm: { $exists: false },
    });
    console.log(
      `\nRemaining cases without law firm: ${remainingCasesWithoutLawFirm.length}`
    );

    // Show all cases for KWCO LAW FIRM
    const kwcoCases = await CreditCase.find({ lawFirm: kwcoLawFirm._id });
    console.log(`\nTotal cases for KWCO LAW FIRM: ${kwcoCases.length}`);

    if (kwcoCases.length > 0) {
      console.log("\nKWCO LAW FIRM cases:");
      kwcoCases.forEach((case_, index) => {
        console.log(`${index + 1}. Case Number: ${case_.caseNumber}`);
        console.log(`   Title: ${case_.title}`);
        console.log(`   Status: ${case_.status}`);
        console.log(`   Created: ${case_.createdAt}`);
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

fixCreditCaseLawFirms();
