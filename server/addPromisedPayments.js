import mongoose from "mongoose";
import CreditCase from "./models/CreditCase.js";
import User from "./models/User.js";
import config from "./config/config.js";

// Connect to database
await mongoose.connect(config.MONGO_URI);

console.log("Adding promised payments for Edmond Obure...");

// Find Edmond Obure
const edmond = await User.findOne({ email: "kivuvakevin10@gmail.com" });
if (!edmond) {
  console.log("Edmond Obure not found!");
  await mongoose.connection.close();
  process.exit(1);
}

console.log(`Found Edmond: ${edmond.firstName} ${edmond.lastName}`);

// Find cases assigned to Edmond
const edmondCases = await CreditCase.find({ assignedTo: edmond._id });
console.log(`Found ${edmondCases.length} cases assigned to Edmond`);

if (edmondCases.length === 0) {
  console.log("No cases assigned to Edmond. Creating a sample case...");

  // Create a sample case for Edmond
  const sampleCase = new CreditCase({
    caseNumber: `CASE-${Date.now()}`,
    debtorName: "John Doe",
    debtorPhone: "0712345678",
    debtorEmail: "john.doe@example.com",
    debtAmount: 50000,
    status: "open",
    priority: "medium",
    assignedTo: edmond._id,
    lawFirm: edmond.lawFirm,
    promisedPayments: [
      {
        amount: 25000,
        promisedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "pending",
        notes: "First installment",
      },
      {
        amount: 25000,
        promisedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: "pending",
        notes: "Second installment",
      },
    ],
  });

  await sampleCase.save();
  console.log("Created sample case with promised payments");
} else {
  // Add promised payments to existing cases
  for (const case_ of edmondCases) {
    if (!case_.promisedPayments || case_.promisedPayments.length === 0) {
      case_.promisedPayments = [
        {
          amount: case_.debtAmount * 0.5,
          promisedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "pending",
          notes: "First installment",
        },
        {
          amount: case_.debtAmount * 0.5,
          promisedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: "pending",
          notes: "Second installment",
        },
      ];
      await case_.save();
      console.log(`Added promised payments to case ${case_.caseNumber}`);
    }
  }
}

await mongoose.connection.close();
console.log("Database connection closed");
