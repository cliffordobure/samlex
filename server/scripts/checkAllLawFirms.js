import mongoose from "mongoose";
import LawFirm from "../models/LawFirm.js";
import User from "../models/User.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function checkAllLawFirms() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Get all law firms
    const lawFirms = await LawFirm.find({});
    console.log(`\nTotal law firms in database: ${lawFirms.length}`);

    if (lawFirms.length > 0) {
      console.log("\nAll law firms:");
      lawFirms.forEach((firm, index) => {
        console.log(`${index + 1}. Firm Name: ${firm.firmName}`);
        console.log(`   Firm Code: ${firm.firmCode}`);
        console.log(`   Firm ID: ${firm._id}`);
        console.log(`   Firm Email: ${firm.firmEmail}`);
        console.log("---");
      });
    }

    // Check specifically for the law firm ID from the server logs
    const specificFirmId = "688149c4eb24e665cc97ec48";
    const specificFirm = await LawFirm.findById(specificFirmId);

    if (specificFirm) {
      console.log(`\n✅ Found the specific law firm from server logs:`);
      console.log(`   Firm Name: ${specificFirm.firmName}`);
      console.log(`   Firm Code: ${specificFirm.firmCode}`);
      console.log(`   Firm ID: ${specificFirm._id}`);
      console.log(`   Firm Email: ${specificFirm.firmEmail}`);

      // Check users in this firm
      const usersInFirm = await User.find({ lawFirm: specificFirm._id });
      console.log(
        `\n👥 Users in ${specificFirm.firmName}: ${usersInFirm.length}`
      );

      usersInFirm.forEach((user, index) => {
        console.log(
          `${index + 1}. ${user.firstName} ${user.lastName} (${
            user.email
          }) - Role: ${user.role}`
        );
      });

      // Check for debt collectors
      const debtCollectors = usersInFirm.filter(
        (u) => u.role === "debt_collector"
      );
      console.log(`\n💰 Debt Collectors: ${debtCollectors.length}`);

      if (debtCollectors.length === 0) {
        console.log(
          "❌ No debt collectors found - this is why case assignment is failing!"
        );
      } else {
        debtCollectors.forEach((collector, index) => {
          console.log(
            `${index + 1}. ${collector.firstName} ${collector.lastName} (${
              collector.email
            })`
          );
        });
      }
    } else {
      console.log(
        `\n❌ Law firm with ID ${specificFirmId} not found in database`
      );
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

checkAllLawFirms();
