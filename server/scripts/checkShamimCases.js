const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Import models
const LawFirm = require("../models/LawFirm");
const User = require("../models/User");
const CreditCase = require("../models/CreditCase");
const LegalCase = require("../models/LegalCase");

async function checkShamimCases() {
  try {
    console.log("=== CHECKING CLIFFSHAMIM LAW FIRM CASES ===\n");

    // Find Cliffshamim law firm
    const shamimFirm = await LawFirm.findOne({
      firmName: { $regex: /cliffshamim/i },
    });

    if (!shamimFirm) {
      console.log("❌ Cliffshamim law firm not found");
      return;
    }

    console.log(
      `✅ Found law firm: ${shamimFirm.firmName} (ID: ${shamimFirm._id})`
    );

    // Check users in this firm
    const users = await User.find({ lawFirm: shamimFirm._id });
    console.log(`\n👥 Users in ${shamimFirm.firmName}: ${users.length}`);
    users.forEach((user) => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Check credit cases
    const creditCases = await CreditCase.find({ lawFirm: shamimFirm._id }).sort(
      { createdAt: -1 }
    );
    console.log(`\n💳 Credit Cases: ${creditCases.length}`);

    if (creditCases.length > 0) {
      creditCases.forEach((case_, index) => {
        const createdDate = new Date(case_.createdAt).toLocaleString("en-US", {
          timeZone: "Africa/Nairobi",
        });
        console.log(
          `   ${index + 1}. ${case_.caseNumber} - ${case_.clientName}`
        );
        console.log(`      Status: ${case_.status} | Created: ${createdDate}`);
        console.log(`      Assigned to: ${case_.assignedTo || "Unassigned"}`);
        console.log(`      Law Firm: ${case_.lawFirm}`);
        console.log("");
      });
    }

    // Check legal cases
    const legalCases = await LegalCase.find({ lawFirm: shamimFirm._id }).sort({
      createdAt: -1,
    });
    console.log(`⚖️ Legal Cases: ${legalCases.length}`);

    if (legalCases.length > 0) {
      legalCases.forEach((case_, index) => {
        const createdDate = new Date(case_.createdAt).toLocaleString("en-US", {
          timeZone: "Africa/Nairobi",
        });
        console.log(
          `   ${index + 1}. ${case_.caseNumber} - ${case_.clientName}`
        );
        console.log(`      Status: ${case_.status} | Created: ${createdDate}`);
        console.log(`      Assigned to: ${case_.assignedTo || "Unassigned"}`);
        console.log(`      Law Firm: ${case_.lawFirm}`);
        console.log("");
      });
    }

    // Check recent cases (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCreditCases = await CreditCase.find({
      lawFirm: shamimFirm._id,
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: -1 });

    const recentLegalCases = await LegalCase.find({
      lawFirm: shamimFirm._id,
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: -1 });

    console.log(`\n📅 Recent Cases (last 7 days):`);
    console.log(`   Credit Cases: ${recentCreditCases.length}`);
    console.log(`   Legal Cases: ${recentLegalCases.length}`);

    if (recentCreditCases.length > 0) {
      console.log("\nRecent Credit Cases:");
      recentCreditCases.forEach((case_, index) => {
        const createdDate = new Date(case_.createdAt).toLocaleString("en-US", {
          timeZone: "Africa/Nairobi",
        });
        console.log(
          `   ${index + 1}. ${case_.caseNumber} - ${
            case_.clientName
          } (${createdDate})`
        );
      });
    }

    if (recentLegalCases.length > 0) {
      console.log("\nRecent Legal Cases:");
      recentLegalCases.forEach((case_, index) => {
        const createdDate = new Date(case_.createdAt).toLocaleString("en-US", {
          timeZone: "Africa/Nairobi",
        });
        console.log(
          `   ${index + 1}. ${case_.caseNumber} - ${
            case_.clientName
          } (${createdDate})`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

checkShamimCases();
