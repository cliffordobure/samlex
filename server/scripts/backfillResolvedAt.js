import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Script to backfill resolvedAt field for existing resolved credit cases
 * This sets resolvedAt to updatedAt for cases that are resolved but don't have resolvedAt set
 */
async function backfillResolvedAt() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Find all resolved cases without resolvedAt
    const resolvedCasesWithoutResolvedAt = await CreditCase.find({
      status: "resolved",
      $or: [
        { resolvedAt: { $exists: false } },
        { resolvedAt: null }
      ]
    });

    console.log(`📋 Found ${resolvedCasesWithoutResolvedAt.length} resolved cases without resolvedAt field`);

    if (resolvedCasesWithoutResolvedAt.length === 0) {
      console.log("✅ All resolved cases already have resolvedAt set");
      await mongoose.disconnect();
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (const case_ of resolvedCasesWithoutResolvedAt) {
      // Use updatedAt as the resolvedAt date (best guess for when it was resolved)
      if (case_.updatedAt) {
        await CreditCase.findByIdAndUpdate(
          case_._id,
          { resolvedAt: case_.updatedAt },
          { new: false }
        );
        console.log(`✅ Updated case ${case_.caseNumber} (${case_._id}): resolvedAt = ${case_.updatedAt}`);
        console.log(`   Debt Amount: ${case_.debtAmount}, Department: ${case_.department}`);
        updated++;
      } else {
        console.log(`⚠️  Skipped case ${case_.caseNumber} (${case_._id}): No updatedAt field`);
        skipped++;
      }
    }

    console.log(`\n✅ Backfill complete!`);
    console.log(`   Updated: ${updated} cases`);
    console.log(`   Skipped: ${skipped} cases`);

    // Verify the update
    const remaining = await CreditCase.countDocuments({
      status: "resolved",
      $or: [
        { resolvedAt: { $exists: false } },
        { resolvedAt: null }
      ]
    });
    console.log(`   Remaining cases without resolvedAt: ${remaining}`);

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error in backfillResolvedAt:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
backfillResolvedAt();


