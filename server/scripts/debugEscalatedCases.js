import mongoose from "mongoose";
import dotenv from "dotenv";
import CreditCase from "../models/CreditCase.js";
import LawFirm from "../models/LawFirm.js";

dotenv.config();

const debugEscalatedCases = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find the law firm
    const lawFirm = await LawFirm.findOne();
    if (!lawFirm) {
      console.log("No law firm found");
      return;
    }
    console.log("Law Firm:", lawFirm.name, "ID:", lawFirm._id);

    // Find all credit cases for this law firm
    const allCases = await CreditCase.find({ lawFirm: lawFirm._id });
    console.log(`\nTotal credit cases in law firm: ${allCases.length}`);

    // Find cases with escalatedToLegal: true
    const escalatedCases = await CreditCase.find({
      lawFirm: lawFirm._id,
      escalatedToLegal: true,
    });
    console.log(
      `\nCases with escalatedToLegal: true: ${escalatedCases.length}`
    );

    // Find cases with status: "escalated_to_legal"
    const statusEscalatedCases = await CreditCase.find({
      lawFirm: lawFirm._id,
      status: "escalated_to_legal",
    });
    console.log(
      `\nCases with status "escalated_to_legal": ${statusEscalatedCases.length}`
    );

    // Show details of escalated cases
    if (escalatedCases.length > 0) {
      console.log("\n=== ESCALATED CASES DETAILS ===");
      escalatedCases.forEach((case_, index) => {
        console.log(`\n${index + 1}. Case: ${case_.caseNumber}`);
        console.log(`   Title: ${case_.title}`);
        console.log(`   Status: ${case_.status}`);
        console.log(`   escalatedToLegal: ${case_.escalatedToLegal}`);
        console.log(`   escalationDate: ${case_.escalationDate}`);
        console.log(`   escalatedBy: ${case_.escalatedBy}`);
        console.log(`   legalCaseId: ${case_.legalCaseId}`);
        console.log(`   Debt Amount: ${case_.debtAmount}`);
        console.log(`   Debtor: ${case_.debtorName}`);
      });
    }

    // Show details of status escalated cases
    if (statusEscalatedCases.length > 0) {
      console.log("\n=== STATUS ESCALATED CASES DETAILS ===");
      statusEscalatedCases.forEach((case_, index) => {
        console.log(`\n${index + 1}. Case: ${case_.caseNumber}`);
        console.log(`   Title: ${case_.title}`);
        console.log(`   Status: ${case_.status}`);
        console.log(`   escalatedToLegal: ${case_.escalatedToLegal}`);
        console.log(`   escalationDate: ${case_.escalationDate}`);
        console.log(`   escalatedBy: ${case_.escalatedBy}`);
        console.log(`   legalCaseId: ${case_.legalCaseId}`);
        console.log(`   Debt Amount: ${case_.debtAmount}`);
        console.log(`   Debtor: ${case_.debtorName}`);
      });
    }

    // Check for the specific case mentioned (17538085)
    const specificCase = await CreditCase.findOne({ caseNumber: "17538085" });
    if (specificCase) {
      console.log("\n=== SPECIFIC CASE 17538085 ===");
      console.log(`Case Number: ${specificCase.caseNumber}`);
      console.log(`Title: ${specificCase.title}`);
      console.log(`Status: ${specificCase.status}`);
      console.log(`escalatedToLegal: ${specificCase.escalatedToLegal}`);
      console.log(`escalationDate: ${specificCase.escalationDate}`);
      console.log(`escalatedBy: ${specificCase.escalatedBy}`);
      console.log(`legalCaseId: ${specificCase.legalCaseId}`);
      console.log(`Law Firm: ${specificCase.lawFirm}`);
      console.log(`Debt Amount: ${specificCase.debtAmount}`);
      console.log(`Debtor: ${specificCase.debtorName}`);
    } else {
      console.log("\nCase 17538085 not found");
    }

    // Check all cases with similar patterns
    const similarCases = await CreditCase.find({
      lawFirm: lawFirm._id,
      caseNumber: { $regex: /17538085/ },
    });
    console.log(
      `\nCases with similar case number pattern: ${similarCases.length}`
    );
  } catch (error) {
    console.error("Error debugging escalated cases:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
};

// Run the script
debugEscalatedCases();
