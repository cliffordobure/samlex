import mongoose from "mongoose";
import User from "./models/User.js";
import config from "./config/config.js";

// Connect to database
await mongoose.connect(config.MONGO_URI);

console.log("Checking Edmond Obure's details...");

// Find Edmond Obure
const edmond = await User.findOne({
  email: "kivuvakevin10@gmail.com",
}).populate("lawFirm");
if (!edmond) {
  console.log("Edmond Obure not found!");
  await mongoose.connection.close();
  process.exit(1);
}

console.log("Edmond's details:");
console.log(`- Name: ${edmond.firstName} ${edmond.lastName}`);
console.log(`- Email: ${edmond.email}`);
console.log(`- Role: ${edmond.role}`);
console.log(`- Law Firm: ${edmond.lawFirm?.firmName || edmond.lawFirm?._id}`);
console.log(`- Law Firm ID: ${edmond.lawFirm?._id}`);
console.log(`- User ID: ${edmond._id}`);

await mongoose.connection.close();
console.log("Database connection closed");
