import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import LawFirm from "../models/LawFirm.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas";

async function auditAndFixCreditCases({ fix = false } = {}) {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const cases = await CreditCase.find({ assignedTo: { $ne: null } }).lean();
  let issues = 0;
  let fixed = 0;

  for (const c of cases) {
    if (!c.lawFirm) {
      issues++;
      if (fix) {
        // Try to fix by looking up the assigned user's lawFirm
        const user = await User.findById(c.assignedTo);
        if (user && user.lawFirm) {
          await CreditCase.findByIdAndUpdate(c._id, { lawFirm: user.lawFirm });
          fixed++;
          console.log(`Fixed missing lawFirm for case ${c.caseNumber}`);
        } else {
          console.log(
            `Case ${c.caseNumber} assignedTo user not found or has no lawFirm`
          );
        }
      } else {
        console.log(`Case ${c.caseNumber} has assignedTo but missing lawFirm`);
      }
    } else {
      // Check if assigned user's lawFirm matches case lawFirm
      const user = await User.findById(c.assignedTo);
      if (user && user.lawFirm && String(user.lawFirm) !== String(c.lawFirm)) {
        issues++;
        if (fix) {
          await CreditCase.findByIdAndUpdate(c._id, { lawFirm: user.lawFirm });
          fixed++;
          console.log(`Fixed mismatched lawFirm for case ${c.caseNumber}`);
        } else {
          console.log(
            `Case ${c.caseNumber} lawFirm (${c.lawFirm}) != assigned user's lawFirm (${user.lawFirm})`
          );
        }
      }
    }
  }

  console.log(
    `\nAudit complete. Issues found: ${issues}. Cases fixed: ${fixed}.`
  );
  await mongoose.disconnect();
}

// Usage: node cleanupCreditCases.js [--fix]
const args = process.argv.slice(2);
auditAndFixCreditCases({ fix: args.includes("--fix") });
