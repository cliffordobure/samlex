import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import dotenv from "dotenv";

dotenv.config();

async function simpleTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find any case with promised payments
    const caseWithPromisedPayments = await CreditCase.findOne({
      "promisedPayments.0": { $exists: true }
    });

    if (!caseWithPromisedPayments) {
      console.log("❌ No cases with promised payments found");
      return;
    }

    console.log("✅ Found case with promised payments:");
    console.log("Case Number:", caseWithPromisedPayments.caseNumber);
    console.log("Law Firm:", caseWithPromisedPayments.lawFirm);
    console.log("Assigned To:", caseWithPromisedPayments.assignedTo);
    console.log("Promised Payments Count:", caseWithPromisedPayments.promisedPayments.length);
    
    console.log("\nPromised Payments Details:");
    caseWithPromisedPayments.promisedPayments.forEach((payment, index) => {
      console.log(`\n${index + 1}. Amount: ${payment.amount}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Promised Date: ${payment.promisedDate}`);
      console.log(`   Currency: ${payment.currency}`);
      console.log(`   Created By: ${payment.createdBy}`);
    });

    // Test the exact aggregation pipeline
    console.log("\n🧪 Testing exact aggregation pipeline...");
    
    const result = await CreditCase.aggregate([
      { $match: { lawFirm: caseWithPromisedPayments.lawFirm } },
      { $match: { "promisedPayments.0": { $exists: true } } },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: null,
          totalPromisedAmount: { $sum: "$promisedPayments.amount" },
          totalPromisedCount: { $sum: 1 }
        }
      }
    ]);

    console.log("📈 Aggregation result:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

simpleTest();

