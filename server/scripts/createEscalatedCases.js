import mongoose from "mongoose";
import dotenv from "dotenv";
import LegalCase from "../models/LegalCase.js";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

dotenv.config();

const createEscalatedCases = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find a law firm
    const lawFirm = await LawFirm.findOne();
    if (!lawFirm) {
      console.log("No law firm found. Please create a law firm first.");
      return;
    }

    // Find legal head and advocates
    const legalHead = await User.findOne({
      role: "legal_head",
      lawFirm: lawFirm._id,
    });

    const advocates = await User.find({
      role: "advocate",
      lawFirm: lawFirm._id,
    });

    if (!legalHead) {
      console.log("No legal head found. Please create a legal head first.");
      return;
    }

    if (advocates.length === 0) {
      console.log("No advocates found. Please create advocates first.");
      return;
    }

    // Find some credit cases to escalate
    const creditCases = await CreditCase.find({
      lawFirm: lawFirm._id,
      status: { $in: ["pending_payment", "overdue", "defaulted"] },
    }).limit(5);

    if (creditCases.length === 0) {
      console.log(
        "No credit cases found to escalate. Please create credit cases first."
      );
      return;
    }

    console.log(`Found ${creditCases.length} credit cases to escalate`);

    // Create escalated legal cases
    const escalatedCases = [];

    for (let i = 0; i < creditCases.length; i++) {
      const creditCase = creditCases[i];

      // Create legal case data
      const legalCaseData = {
        title: `Legal Case for ${creditCase.caseNumber}`,
        caseNumber: `LEG-${Date.now()}-${i + 1}`,
        caseType: "debt_collection",
        description: `Legal proceedings for credit case ${creditCase.caseNumber}. Client: ${creditCase.client?.firstName} ${creditCase.client?.lastName}`,
        priority: ["low", "medium", "high", "urgent"][
          Math.floor(Math.random() * 4)
        ],
        status: "pending_assignment",
        lawFirm: lawFirm._id,
        client: creditCase.client,
        filingFee: {
          amount: Math.floor(Math.random() * 50000) + 5000,
          currency: "KES",
          paid: false,
        },
        escalatedFrom: {
          creditCaseId: creditCase._id,
          escalationDate: new Date(),
          escalationReason: "Payment default - requires legal action",
        },
        createdBy: legalHead._id,
        lastActivity: new Date(),
      };

      const legalCase = new LegalCase(legalCaseData);
      await legalCase.save();
      escalatedCases.push(legalCase);

      console.log(`Created escalated case: ${legalCase.caseNumber}`);
    }

    console.log(
      `\n✅ Successfully created ${escalatedCases.length} escalated cases`
    );
    console.log("\nEscalated Cases:");
    escalatedCases.forEach((case_, index) => {
      console.log(`${index + 1}. ${case_.caseNumber} - ${case_.title}`);
      console.log(`   From Credit Case: ${case_.escalatedFrom.creditCaseId}`);
      console.log(`   Status: ${case_.status}`);
      console.log(`   Priority: ${case_.priority}`);
      console.log("");
    });

    console.log("\nNext steps:");
    console.log("1. Login as legal head to view escalated cases");
    console.log("2. Assign cases to advocates");
    console.log("3. Advocates can complete case information");
  } catch (error) {
    console.error("Error creating escalated cases:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the script
createEscalatedCases();
