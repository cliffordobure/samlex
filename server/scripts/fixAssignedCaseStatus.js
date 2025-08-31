import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function fixAssignedCaseStatus() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find cases that are assigned but still have "new" status
    const casesToFix = await CreditCase.find({
      assignedTo: { $exists: true, $ne: null },
      status: "new",
    });

    console.log(
      `Found ${casesToFix.length} cases that are assigned but still have "new" status`
    );

    if (casesToFix.length === 0) {
      console.log("✅ No cases need fixing");
      await mongoose.disconnect();
      return;
    }

    // Update all these cases to "assigned" status
    const updateResult = await CreditCase.updateMany(
      {
        assignedTo: { $exists: true, $ne: null },
        status: "new",
      },
      {
        status: "assigned",
      }
    );

    console.log(
      `✅ Updated ${updateResult.modifiedCount} cases from "new" to "assigned" status`
    );

    // Show the updated cases
    const updatedCases = await CreditCase.find({
      assignedTo: { $exists: true, $ne: null },
      status: "assigned",
    }).populate("assignedTo", "firstName lastName email");

    console.log("\nUpdated cases:");
    updatedCases.forEach((case_, index) => {
      console.log(`${index + 1}. ${case_.title} (${case_.caseNumber})`);
      console.log(`   Status: ${case_.status}`);
      console.log(
        `   Assigned to: ${case_.assignedTo?.firstName} ${case_.assignedTo?.lastName} (${case_.assignedTo?.email})`
      );
      console.log("---");
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

fixAssignedCaseStatus();
