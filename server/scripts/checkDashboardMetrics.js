import mongoose from "mongoose";
import LegalCase from "../models/LegalCase.js";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import config from "../config/config.js";

const checkDashboardMetrics = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get a sample law firm ID
    const lawFirm = await User.findOne({}).select('lawFirm');
    if (!lawFirm || !lawFirm.lawFirm) {
      console.log("❌ No law firm found");
      return;
    }
    const lawFirmId = lawFirm.lawFirm;

    console.log("🏢 Law Firm ID:", lawFirmId);

    // Total credit cases
    const totalCreditCases = await CreditCase.countDocuments({
      lawFirm: lawFirmId,
    });
    console.log("📊 Total Credit Cases:", totalCreditCases);

    // Total legal cases
    const totalLegalCases = await LegalCase.countDocuments({
      lawFirm: lawFirmId,
    });
    console.log("⚖️ Total Legal Cases:", totalLegalCases);

    // Total users
    const totalUsers = await User.countDocuments({ lawFirm: lawFirmId });
    console.log("👥 Total Users:", totalUsers);

    // Active users
    const activeUsers = await User.countDocuments({
      lawFirm: lawFirmId,
      isActive: true,
    });
    console.log("✅ Active Users:", activeUsers);

    // Escalated cases
    const escalatedCases = await CreditCase.countDocuments({
      lawFirm: lawFirmId,
      escalatedToLegal: true,
    });
    console.log("📈 Escalated Cases:", escalatedCases);

    // Escalation rate
    const escalationRate = totalCreditCases > 0 ? (escalatedCases / totalCreditCases) * 100 : 0;
    console.log("📊 Escalation Rate:", escalationRate.toFixed(2) + "%");

    // Filing fees (paid only)
    const filingFees = await LegalCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      { 
        $group: { 
          _id: null, 
          total: { 
            $sum: {
              $cond: ["$filingFee.paid", "$filingFee.amount", 0]
            }
          } 
        } 
      },
    ]);
    const totalFilingFees = filingFees[0]?.total || 0;
    console.log("💰 Total Filing Fees (Paid):", totalFilingFees);

    // All filing fees (for comparison)
    const allFilingFees = await LegalCase.aggregate([
      { $match: { lawFirm: lawFirmId } },
      { $group: { _id: null, total: { $sum: "$filingFee.amount" } } },
    ]);
    const totalAllFilingFees = allFilingFees[0]?.total || 0;
    console.log("💰 Total Filing Fees (All):", totalAllFilingFees);

    // Escalation fees (completed only)
    const escalationFees = await Payment.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          purpose: "escalation_fee",
          status: "completed",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalEscalationFees = escalationFees[0]?.total || 0;
    console.log("💸 Total Escalation Fees (Completed):", totalEscalationFees);

    // All escalation fees (for comparison)
    const allEscalationFees = await Payment.aggregate([
      {
        $match: {
          lawFirm: lawFirmId,
          purpose: "escalation_fee",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalAllEscalationFees = allEscalationFees[0]?.total || 0;
    console.log("💸 Total Escalation Fees (All):", totalAllEscalationFees);

    // Total revenue
    const totalRevenue = totalFilingFees + totalEscalationFees;
    console.log("💵 Total Revenue:", totalRevenue);

    console.log("\n📋 Summary:");
    console.log("Total Credit Cases:", totalCreditCases);
    console.log("Total Legal Cases:", totalLegalCases);
    console.log("Active Users:", activeUsers);
    console.log("Total Revenue: Ksh", totalRevenue.toLocaleString());
    console.log("Escalation Revenue: Ksh", totalEscalationFees.toLocaleString());
    console.log("Escalation Rate:", escalationRate.toFixed(2) + "%");

    console.log("\n✅ Check completed successfully");
  } catch (error) {
    console.error("❌ Error checking dashboard metrics:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

checkDashboardMetrics();

