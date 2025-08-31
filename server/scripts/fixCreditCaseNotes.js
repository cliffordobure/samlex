import mongoose from "mongoose";
import dotenv from "dotenv";
import CreditCase from "../models/CreditCase.js";

dotenv.config();

const fixCreditCaseNotes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find all credit cases with notes that don't have createdBy
    const creditCases = await CreditCase.find({
      "notes.createdBy": { $exists: false },
    });

    console.log(`Found ${creditCases.length} credit cases with invalid notes`);

    let fixedCount = 0;
    for (const creditCase of creditCases) {
      let needsUpdate = false;

      // Fix notes that don't have createdBy
      for (const note of creditCase.notes) {
        if (!note.createdBy) {
          note.createdBy =
            creditCase.createdBy ||
            creditCase.assignedBy ||
            creditCase.assignedTo;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await creditCase.save();
        fixedCount++;
        console.log(`Fixed notes for case: ${creditCase.caseNumber}`);
      }
    }

    console.log(`✅ Fixed ${fixedCount} credit cases`);
  } catch (error) {
    console.error("❌ Error fixing credit case notes:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
};

fixCreditCaseNotes();
