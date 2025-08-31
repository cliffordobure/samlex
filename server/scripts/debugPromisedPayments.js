import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function debugPromisedPayments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find Edmond's user record
    const edmond = await User.findOne({ email: "cliffordobure98@gmail.com" }).populate("lawFirm");
    if (!edmond) {
      console.log("❌ Edmond not found");
      return;
    }

    console.log("👤 Edmond found:", {
      _id: edmond._id,
      email: edmond.email,
      role: edmond.role,
      lawFirm: edmond.lawFirm?._id,
      lawFirmName: edmond.lawFirm?.firmName
    });

    const lawFirmId = edmond.lawFirm._id;
    console.log("\n🔍 Checking Credit Cases for law firm:", lawFirmId);

    // Check total cases
    const totalCases = await CreditCase.countDocuments({ lawFirm: lawFirmId });
    console.log("📊 Total cases:", totalCases);

    // Check cases with promised payments (without assignedTo filter)
    const casesWithPromisedPayments = await CreditCase.countDocuments({ 
      lawFirm: lawFirmId,
      "promisedPayments.0": { $exists: true }
    });
    console.log("💰 Cases with promised payments (any user):", casesWithPromisedPayments);

    // Check cases assigned to Edmond
    const casesAssignedToEdmond = await CreditCase.countDocuments({ 
      lawFirm: lawFirmId,
      assignedTo: edmond._id
    });
    console.log("👤 Cases assigned to Edmond:", casesAssignedToEdmond);

    // Check cases assigned to Edmond with promised payments
    const edmondCasesWithPromisedPayments = await CreditCase.countDocuments({ 
      lawFirm: lawFirmId,
      assignedTo: edmond._id,
      "promisedPayments.0": { $exists: true }
    });
    console.log("💰 Edmond's cases with promised payments:", edmondCasesWithPromisedPayments);

    // Get all cases with promised payments (any user)
    const allCases = await CreditCase.find({ 
      lawFirm: lawFirmId,
      "promisedPayments.0": { $exists: true }
    }).populate("assignedTo", "firstName lastName email");

    console.log("\n📋 All cases with promised payments:");
    allCases.forEach((case_, index) => {
      console.log(`\n${index + 1}. Case: ${case_.caseNumber}`);
      console.log(`   Status: ${case_.status}`);
      console.log(`   Assigned to: ${case_.assignedTo?.firstName} ${case_.assignedTo?.lastName} (${case_.assignedTo?.email})`);
      console.log(`   Promised payments: ${case_.promisedPayments.length}`);
      
      case_.promisedPayments.forEach((payment, pIndex) => {
        console.log(`     ${pIndex + 1}. Amount: ${payment.amount} ${payment.currency}`);
        console.log(`        Status: ${payment.status}`);
        console.log(`        Promised Date: ${payment.promisedDate}`);
        console.log(`        Due: ${payment.dueDate || 'N/A'}`);
      });
    });

    // Test the aggregation pipeline without assignedTo filter
    console.log("\n🧪 Testing aggregation pipeline (any user)...");
    
    const caseQueryAnyUser = { 
      lawFirm: lawFirmId
    };

    const promisedPaymentsOverviewAnyUser = await CreditCase.aggregate([
      { $match: caseQueryAnyUser },
      { $match: { "promisedPayments.0": { $exists: true } } },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: null,
          totalPromisedAmount: { $sum: "$promisedPayments.amount" },
          totalPaidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          totalPendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          totalPromisedCount: { $sum: 1 }
        }
      }
    ]);

    console.log("📈 Aggregation result (any user):", JSON.stringify(promisedPaymentsOverviewAnyUser, null, 2));

    // Test with Edmond's assignedTo filter
    console.log("\n🧪 Testing aggregation pipeline (Edmond only)...");
    
    const caseQueryEdmond = { 
      lawFirm: lawFirmId,
      assignedTo: edmond._id
    };

    const promisedPaymentsOverviewEdmond = await CreditCase.aggregate([
      { $match: caseQueryEdmond },
      { $match: { "promisedPayments.0": { $exists: true } } },
      { $unwind: "$promisedPayments" },
      {
        $group: {
          _id: null,
          totalPromisedAmount: { $sum: "$promisedPayments.amount" },
          totalPaidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "paid"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          totalPendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$promisedPayments.status", "pending"] },
                "$promisedPayments.amount",
                0
              ]
            }
          },
          totalPromisedCount: { $sum: 1 }
        }
      }
    ]);

    console.log("📈 Aggregation result (Edmond only):", JSON.stringify(promisedPaymentsOverviewEdmond, null, 2));

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

debugPromisedPayments();
