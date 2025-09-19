import mongoose from "mongoose";
import User from "../models/User.js";
import CreditCase from "../models/CreditCase.js";
import LegalCase from "../models/LegalCase.js";
import { createNotification } from "../services/notificationService.js";
import config from "../config/config.js";

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI);

async function testNotifications() {
  try {
    console.log("🧪 Testing notification and email system...");

    // Get a test user (advocate or debt collector)
    const testUser = await User.findOne({
      role: { $in: ["advocate", "debt_collector"] },
      isActive: true,
    }).populate('lawFirm', 'firmName');

    if (!testUser) {
      console.log("❌ No test user found. Please create an advocate or debt collector user first.");
      return;
    }

    console.log(`👤 Test user: ${testUser.firstName} ${testUser.lastName} (${testUser.role})`);
    console.log(`🏢 Law firm: ${testUser.lawFirm?.firmName}`);

    // Test legal case assignment notification
    const legalCase = await LegalCase.findOne({
      lawFirm: testUser.lawFirm._id,
    });

    if (legalCase) {
      console.log(`\n📋 Testing legal case assignment notification...`);
      console.log(`Case: ${legalCase.caseNumber} - ${legalCase.title}`);

      await createNotification({
        user: testUser._id,
        title: `Case Assigned: ${legalCase.caseNumber}`,
        message: `You have been assigned case "${legalCase.title}" by Test Admin.`,
        type: "case_assigned",
        priority: "high",
        relatedCase: legalCase._id,
        actionUrl: `/legal/cases/${legalCase._id}`,
        metadata: {
          caseNumber: legalCase.caseNumber,
          caseTitle: legalCase.title,
          assignedBy: "Test Admin",
        },
        sendEmail: true,
      });

      console.log("✅ Legal case assignment notification created and email sent!");
    } else {
      console.log("⚠️ No legal cases found for testing");
    }

    // Test credit case assignment notification
    const creditCase = await CreditCase.findOne({
      lawFirm: testUser.lawFirm._id,
    });

    if (creditCase) {
      console.log(`\n💳 Testing credit case assignment notification...`);
      console.log(`Case: ${creditCase.caseNumber} - ${creditCase.title}`);

      await createNotification({
        user: testUser._id,
        title: `Credit Case Assigned: ${creditCase.caseNumber}`,
        message: `You have been assigned credit collection case "${creditCase.title}" by Test Admin.`,
        type: "credit_case_assigned",
        priority: "high",
        relatedCreditCase: creditCase._id,
        actionUrl: `/credit-collection/cases/${creditCase._id}`,
        metadata: {
          caseNumber: creditCase.caseNumber,
          caseTitle: creditCase.title,
          assignedBy: "Test Admin",
          debtorName: creditCase.debtorName,
          debtAmount: creditCase.debtAmount,
          currency: creditCase.currency,
        },
        sendEmail: true,
      });

      console.log("✅ Credit case assignment notification created and email sent!");
    } else {
      console.log("⚠️ No credit cases found for testing");
    }

    console.log("\n🎉 Notification and email testing completed!");
    console.log(`📧 Check ${testUser.email} for the test emails`);

  } catch (error) {
    console.error("❌ Error testing notifications:", error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the test
testNotifications();