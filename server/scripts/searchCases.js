import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function searchCases() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Search for cases with similar titles to what's shown in the screenshot
    const searchTerms = ["fadfasdfas", "kwco", "href", "45", "2025"];

    console.log("🔍 Searching for cases with similar titles...");

    for (const term of searchTerms) {
      const cases = await CreditCase.find({
        $or: [
          { title: { $regex: term, $options: "i" } },
          { caseNumber: { $regex: term, $options: "i" } },
        ],
      }).populate("assignedTo", "firstName lastName email");

      if (cases.length > 0) {
        console.log(`\n✅ Found cases with term "${term}":`);
        cases.forEach((case_, index) => {
          console.log(`${index + 1}. ${case_.title} (${case_.caseNumber})`);
          console.log(`   Status: ${case_.status}`);
          console.log(
            `   Assigned to: ${case_.assignedTo?.firstName} ${case_.assignedTo?.lastName} (${case_.assignedTo?.email})`
          );
          console.log(`   Case ID: ${case_._id}`);
          console.log("---");
        });
      }
    }

    // Also check all cases to see if there are any with similar patterns
    console.log("\n🔍 All cases in database:");
    const allCases = await CreditCase.find({}).populate(
      "assignedTo",
      "firstName lastName email"
    );

    allCases.forEach((case_, index) => {
      console.log(`${index + 1}. ${case_.title} (${case_.caseNumber})`);
      console.log(`   Status: ${case_.status}`);
      console.log(
        `   Assigned to: ${case_.assignedTo?.firstName} ${case_.assignedTo?.lastName} (${case_.assignedTo?.email})`
      );
      console.log(`   Case ID: ${case_._id}`);
      console.log("---");
    });

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

searchCases();
