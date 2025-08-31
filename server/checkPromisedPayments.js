import mongoose from "mongoose";
import CreditCase from "./models/CreditCase.js";
import User from "./models/User.js";
import config from "./config/config.js";

// Connect to database
await mongoose.connect(config.MONGO_URI);

console.log("Checking for promised payments...");

// Find cases with promised payments
const cases = await CreditCase.find({}).populate("assignedTo").limit(10);

console.log(`Found ${cases.length} cases to check`);

cases.forEach((case_, index) => {
  console.log(`\nCase ${index + 1}:`);
  console.log(`- Case Number: ${case_.caseNumber}`);
  console.log(
    `- Assigned To: ${case_.assignedTo?.firstName} ${case_.assignedTo?.lastName}`
  );
  console.log(`- Promised Payments: ${case_.promisedPayments?.length || 0}`);

  if (case_.promisedPayments && case_.promisedPayments.length > 0) {
    case_.promisedPayments.forEach((payment, idx) => {
      console.log(`  Payment ${idx + 1}:`);
      console.log(`    - Amount: ${payment.amount}`);
      console.log(`    - Date: ${payment.promisedDate}`);
      console.log(`    - Status: ${payment.status}`);
    });
  }
});

await mongoose.connection.close();
console.log("\nDatabase connection closed");
