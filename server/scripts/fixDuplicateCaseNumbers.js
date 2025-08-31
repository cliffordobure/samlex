import mongoose from "mongoose";
import dotenv from "dotenv";
import LegalCase from "../models/LegalCase.js";

dotenv.config();

const fixDuplicateCaseNumbers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all legal cases and group by case number
    const legalCases = await LegalCase.find({}).sort({ createdAt: 1 });

    const caseNumberGroups = {};
    legalCases.forEach((case_) => {
      if (!caseNumberGroups[case_.caseNumber]) {
        caseNumberGroups[case_.caseNumber] = [];
      }
      caseNumberGroups[case_.caseNumber].push(case_);
    });

    // Find duplicates
    const duplicates = Object.entries(caseNumberGroups)
      .filter(([caseNumber, cases]) => cases.length > 1)
      .map(([caseNumber, cases]) => ({ caseNumber, cases }));

    console.log(`Found ${duplicates.length} duplicate case numbers`);

    let fixedCount = 0;
    for (const duplicate of duplicates) {
      console.log(`\nFixing duplicate case number: ${duplicate.caseNumber}`);
      console.log(`Found ${duplicate.cases.length} cases with this number`);

      // Keep the first case, update the rest
      const [firstCase, ...duplicateCases] = duplicate.cases;

      for (let i = 0; i < duplicateCases.length; i++) {
        const duplicateCase = duplicateCases[i];
        const newCaseNumber = `${duplicate.caseNumber}-DUP-${i + 1}`;

        console.log(
          `Updating case ${duplicateCase._id} from ${duplicateCase.caseNumber} to ${newCaseNumber}`
        );

        await LegalCase.findByIdAndUpdate(duplicateCase._id, {
          caseNumber: newCaseNumber,
        });

        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} duplicate case numbers`);
  } catch (error) {
    console.error("❌ Error fixing duplicate case numbers:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
};

fixDuplicateCaseNumbers();
