import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function fixUndefinedAssignment() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find the case with undefined assignment
    const problematicCase = await CreditCase.findOne({
      title: "Tina test case",
    });

    if (!problematicCase) {
      console.log("❌ Case 'Tina test case' not found");
      await mongoose.disconnect();
      return;
    }

    console.log("🔍 Found problematic case:");
    console.log(`   Title: ${problematicCase.title}`);
    console.log(`   Status: ${problematicCase.status}`);
    console.log(`   Assigned to: ${problematicCase.assignedTo}`);
    console.log(`   Case ID: ${problematicCase._id}`);

    // Check if the assignedTo user exists
    if (problematicCase.assignedTo) {
      const assignedUser = await User.findById(problematicCase.assignedTo);
      if (!assignedUser) {
        console.log("❌ Assigned user does not exist, clearing assignment");
        // Clear the assignment since the user doesn't exist
        problematicCase.assignedTo = null;
        problematicCase.assignedBy = null;
        problematicCase.assignedAt = null;
        problematicCase.status = "new"; // Reset to new since it's unassigned
      } else {
        console.log("✅ Assigned user exists, updating status to 'assigned'");
        console.log(
          `   User: ${assignedUser.firstName} ${assignedUser.lastName} (${assignedUser.email})`
        );
        // Update status to assigned since the user exists
        problematicCase.status = "assigned";
      }
    } else {
      console.log("✅ Case has no assignment, keeping as 'new'");
    }

    await problematicCase.save();
    console.log("✅ Case updated successfully");

    // Verify the fix
    const updatedCase = await CreditCase.findById(problematicCase._id).populate(
      "assignedTo",
      "firstName lastName email"
    );
    console.log("\n🔍 Updated case:");
    console.log(`   Title: ${updatedCase.title}`);
    console.log(`   Status: ${updatedCase.status}`);
    console.log(
      `   Assigned to: ${updatedCase.assignedTo?.firstName} ${updatedCase.assignedTo?.lastName} (${updatedCase.assignedTo?.email})`
    );

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

fixUndefinedAssignment();
