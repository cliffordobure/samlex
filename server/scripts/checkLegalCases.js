import mongoose from "mongoose";
import LegalCase from "../models/LegalCase.js";
import config from "../config/config.js";

const checkLegalCases = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check for legal cases with filing fees
    const legalCases = await LegalCase.find({}).limit(10);
    console.log("📊 Legal Cases Found:", legalCases.length);

    if (legalCases.length > 0) {
      console.log("💰 Legal Case Details:");
      legalCases.forEach((case_, index) => {
        console.log(`\n--- Case ${index + 1} ---`);
        console.log("ID:", case_._id);
        console.log("Case Number:", case_.caseNumber);
        console.log("Title:", case_.title);
        console.log("Filing Fee:", case_.filingFee);
        console.log("Status:", case_.status);
        console.log("Created At:", case_.createdAt);
      });
    }

    // Check total filing fees
    const filingFeesAggregation = await LegalCase.aggregate([
      { $group: { _id: null, total: { $sum: "$filingFee.amount" } } },
    ]);
    console.log("\n💰 Total Filing Fees:", filingFeesAggregation[0]?.total || 0);

    console.log("\n✅ Check completed successfully");
  } catch (error) {
    console.error("❌ Error checking legal cases:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

checkLegalCases();

