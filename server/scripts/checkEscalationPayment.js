import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import CreditCase from "../models/CreditCase.js";
import config from "../config/config.js";

const checkEscalationPayment = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check for escalation payments
    const escalationPayments = await Payment.find({
      purpose: "escalation_fee",
    });
    console.log("📊 Escalation Payments Found:", escalationPayments.length);

    if (escalationPayments.length > 0) {
      console.log("💰 Escalation Payment Details:");
      escalationPayments.forEach((payment, index) => {
        console.log(`\n--- Payment ${index + 1} ---`);
        console.log("ID:", payment._id);
        console.log("Amount:", payment.amount);
        console.log("Status:", payment.status);
        console.log("Purpose:", payment.purpose);
        console.log("Law Firm:", payment.lawFirm);
        console.log("Case ID:", payment.case?.caseId);
        console.log("Created At:", payment.createdAt);
      });
    }

    // Check for escalated credit cases
    const escalatedCases = await CreditCase.find({ escalatedToLegal: true });
    console.log("\n📋 Escalated Credit Cases Found:", escalatedCases.length);

    if (escalatedCases.length > 0) {
      console.log("📋 Escalated Case Details:");
      escalatedCases.forEach((case_, index) => {
        console.log(`\n--- Case ${index + 1} ---`);
        console.log("ID:", case_._id);
        console.log("Case Number:", case_.caseNumber);
        console.log("Status:", case_.status);
        console.log("Escalated To Legal:", case_.escalatedToLegal);
        console.log("Escalation Date:", case_.escalationDate);
        console.log("Escalation Payment:", case_.escalationPayment);
      });
    }

    console.log("\n✅ Check completed successfully");
  } catch (error) {
    console.error("❌ Error checking escalation payment:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

checkEscalationPayment();
