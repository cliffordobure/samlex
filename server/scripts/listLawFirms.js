import mongoose from "mongoose";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function listLawFirms() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Get all law firms
    const lawFirms = await LawFirm.find({});
    console.log(`\nTotal law firms in database: ${lawFirms.length}`);

    if (lawFirms.length > 0) {
      console.log("\nLaw firms found:");
      lawFirms.forEach((firm, index) => {
        console.log(`${index + 1}. Firm Name: ${firm.firmName}`);
        console.log(`   Firm Code: ${firm.firmCode}`);
        console.log(`   Firm ID: ${firm._id}`);
        console.log(`   Firm Email: ${firm.firmEmail}`);
        console.log("---");
      });
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

listLawFirms();
