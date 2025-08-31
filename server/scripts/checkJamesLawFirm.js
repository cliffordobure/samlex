import mongoose from "mongoose";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function checkJamesLawFirm() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find James Mwemi user
    const user = await User.findOne({
      $or: [
        { email: "james@gmail.com" },
        { firstName: "James", lastName: "Mwemi" },
      ],
    }).populate("lawFirm");

    if (!user) {
      console.log("❌ James Mwemi user not found");
      await mongoose.disconnect();
      return;
    }

    console.log(
      `✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`
    );
    console.log(`   Role: ${user.role}`);
    console.log(`   Law Firm: ${user.lawFirm?.firmName || "No law firm"}`);
    console.log(`   Law Firm ID: ${user.lawFirm?._id || "No ID"}`);

    // Check all users in this law firm
    if (user.lawFirm) {
      const usersInFirm = await User.find({ lawFirm: user.lawFirm._id });
      console.log(
        `\n👥 Users in ${user.lawFirm.firmName}: ${usersInFirm.length}`
      );

      usersInFirm.forEach((firmUser, index) => {
        console.log(
          `${index + 1}. ${firmUser.firstName} ${firmUser.lastName} (${
            firmUser.email
          }) - Role: ${firmUser.role}`
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
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
}

checkJamesLawFirm();
