import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function moveCasesToShamim() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find Shamim Law firm
    const shamimLawFirm = await LawFirm.findOne({
      firmName: "Shamim Law firm",
    });
    if (!shamimLawFirm) {
      console.log("Shamim Law firm not found!");
      await mongoose.disconnect();
      return;
    }

    console.log(
      "Found Shamim Law firm:",
      shamimLawFirm.firmName,
      shamimLawFirm._id
    );

    // Move 2 cases from KWCO LAW FIRM to Shamim Law firm
    const kwcoCases = await CreditCase.find({
      lawFirm: "68664564fea42141ff230ec4", // KWCO LAW FIRM ID
    }).limit(2);

    console.log(`Found ${kwcoCases.length} cases to move`);

    let movedCount = 0;
    for (const case_ of kwcoCases) {
      try {
        await CreditCase.findByIdAndUpdate(case_._id, {
          lawFirm: shamimLawFirm._id,
        });
        console.log(`Moved case: ${case_.caseNumber} - ${case_.title}`);
        movedCount++;
      } catch (error) {
        console.error(`Error moving case ${case_.caseNumber}:`, error.message);
      }
    }

    console.log(`\nMoved ${movedCount} cases to Shamim Law firm`);

    // Verify the move
    const shamimCases = await CreditCase.find({ lawFirm: shamimLawFirm._id });
    console.log(`\nTotal cases for Shamim Law firm: ${shamimCases.length}`);

    if (shamimCases.length > 0) {
      console.log("\nShamim Law firm cases:");
      shamimCases.forEach((case_, index) => {
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

moveCasesToShamim();
