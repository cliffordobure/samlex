import mongoose from "mongoose";
import LegalCase from "../models/LegalCase.js";
import config from "../config/config.js";

const fixLegalCaseStatus = async () => {
  try {
    console.log("🔧 Starting Legal Case Status Fix...");

    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find all cases that are marked as "assigned" but have no assignedTo
    const casesToFix = await LegalCase.find({
      status: "assigned",
      assignedTo: { $exists: false },
    });

    console.log(`📋 Found ${casesToFix.length} cases to fix`);

    if (casesToFix.length === 0) {
      console.log("✅ No cases need fixing");
      return;
    }

    // Update these cases to "pending_assignment"
    const updateResult = await LegalCase.updateMany(
      {
        status: "assigned",
        assignedTo: { $exists: false },
      },
      {
        $set: { status: "pending_assignment" },
      }
    );

    console.log(
      `✅ Updated ${updateResult.modifiedCount} cases to 'pending_assignment'`
    );

    // Also find cases that are marked as "assigned" but assignedTo is null
    const nullAssignedCases = await LegalCase.find({
      status: "assigned",
      assignedTo: null,
    });

    console.log(
      `📋 Found ${nullAssignedCases.length} cases with null assignedTo`
    );

    if (nullAssignedCases.length > 0) {
      const nullUpdateResult = await LegalCase.updateMany(
        {
          status: "assigned",
          assignedTo: null,
        },
        {
          $set: { status: "pending_assignment" },
        }
      );

      console.log(
        `✅ Updated ${nullUpdateResult.modifiedCount} null-assigned cases to 'pending_assignment'`
      );
    }

    // Show summary
    const totalFixed =
      (updateResult.modifiedCount || 0) +
      (nullUpdateResult ? nullUpdateResult.modifiedCount || 0 : 0);
    console.log(`🎉 Total cases fixed: ${totalFixed}`);

    // Show some examples of fixed cases
    const fixedCases = await LegalCase.find({
      status: "pending_assignment",
    }).limit(5);

    console.log("📝 Examples of fixed cases:");
    fixedCases.forEach((case_, index) => {
      console.log(
        `  ${index + 1}. ${case_.caseNumber} - ${case_.title} (Status: ${
          case_.status
        })`
      );
    });
  } catch (error) {
    console.error("❌ Error fixing legal case status:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
fixLegalCaseStatus();
