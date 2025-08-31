import mongoose from "mongoose";
import dotenv from "dotenv";
import CreditCase from "../models/CreditCase.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const testEnhancedRevenue = async () => {
  try {
    console.log("🔍 Testing enhanced revenue endpoint logic...\n");

    // Get the first law firm with data
    const lawFirm = await LawFirm.findOne();
    if (!lawFirm) {
      console.log("❌ No law firms found");
      return;
    }

    console.log(`🏢 Testing with Law Firm: ${lawFirm.name} (${lawFirm._id})`);

    // Test the revenue calculation logic
    const lawFirmId = lawFirm._id;
    const period = "30";
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    let caseQuery = { lawFirm: lawFirmId };

    // Get collection fees from Payment model
    const collectionFeesStats = await Payment.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          purpose: "service_charge",
          status: "completed"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalCollectionFees: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    console.log("💳 Collection fees stats:", collectionFeesStats);

    // Get escalation fees from Payment model
    const escalationFeesStats = await Payment.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          purpose: "escalation_fee",
          status: "completed"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalEscalationFees: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    console.log("⚖️ Escalation fees stats:", escalationFeesStats);

    // Get promised payments that are paid
    const promisedPaymentsStats = await CreditCase.aggregate([
      { $match: caseQuery },
      { $unwind: "$promisedPayments" },
      {
        $match: {
          "promisedPayments.status": "paid"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$promisedPayments.paidAt" },
            month: { $month: "$promisedPayments.paidAt" }
          },
          totalPromisedPayments: { $sum: "$promisedPayments.amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    console.log("🤝 Promised payments stats:", promisedPaymentsStats);

    // Get revenue overview
    const revenueOverview = await CreditCase.aggregate([
      { $match: caseQuery },
      {
        $group: {
          _id: null,
          totalDebtAmount: { $sum: "$debtAmount" },
          avgDebtAmount: { $avg: "$debtAmount" }
        }
      }
    ]);

    console.log("📊 Revenue overview:", revenueOverview);

    // Calculate totals
    const totalCollectionFees = collectionFeesStats.reduce(
      (sum, stat) => sum + stat.totalCollectionFees,
      0
    );
    const totalEscalationFees = escalationFeesStats.reduce(
      (sum, stat) => sum + stat.totalEscalationFees,
      0
    );
    const totalPromisedPayments = promisedPaymentsStats.reduce(
      (sum, stat) => sum + stat.totalPromisedPayments,
      0
    );

    console.log("\n💰 Calculated Totals:");
    console.log(`  Collection Fees: KSH ${totalCollectionFees.toLocaleString()}`);
    console.log(`  Escalation Fees: KSH ${totalEscalationFees.toLocaleString()}`);
    console.log(`  Promised Payments: KSH ${totalPromisedPayments.toLocaleString()}`);
    console.log(`  Total Revenue: KSH ${(totalCollectionFees + totalEscalationFees + totalPromisedPayments).toLocaleString()}`);

    // Simulate the response structure
    const response = {
      success: true,
      data: {
        overview: {
          totalRevenue: totalCollectionFees + totalEscalationFees + totalPromisedPayments,
          totalCollectionFees,
          totalEscalationFees,
          totalPromisedPayments,
          totalDebtAmount: revenueOverview[0]?.totalDebtAmount || 0,
          avgDebtAmount: Math.round(revenueOverview[0]?.avgDebtAmount || 0),
          monthlyGrowth: "N/A"
        },
        monthlyRevenue: [],
        revenueByStatus: [],
        revenueByPriority: [],
        chartData: {
          labels: [],
          datasets: []
        }
      }
    };

    console.log("\n📤 Response structure:");
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error("❌ Error testing enhanced revenue:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

connectDB().then(testEnhancedRevenue);
