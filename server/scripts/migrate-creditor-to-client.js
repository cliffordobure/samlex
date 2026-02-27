/**
 * Migration Script: Update Credit Cases to Link Creditor as Client
 * 
 * This script updates all existing credit cases to link the creditor information
 * to the client field. The creditor is the client who hired the law firm.
 * 
 * Run with: node server/scripts/migrate-creditor-to-client.js
 */

import mongoose from "mongoose";
import CreditCase from "../models/CreditCase.js";
import Client from "../models/Client.js";
import LawFirm from "../models/LawFirm.js"; // Import LawFirm model to register schema
import User from "../models/User.js"; // Import User model to find default createdBy
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env from multiple possible locations
const envPaths = [
  join(__dirname, "../.env"),        // server/.env (most likely)
  join(__dirname, "../../.env"),    // root/.env
  join(__dirname, "../../../.env"),  // parent/.env (just in case)
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

// If no .env file found, try default dotenv.config() which looks in current working directory
if (!envLoaded) {
  dotenv.config();
  console.log("⚠️  No .env file found in common locations, trying current directory...");
}

const connectDB = async () => {
  try {
    // Try to get MONGO_URI from environment
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error("\n❌ MongoDB connection string not found!");
      console.error("\nPlease set MONGO_URI in your .env file.");
      console.error("\nExpected .env file locations:");
      envPaths.forEach(path => console.error(`  - ${path}`));
      console.error("\nOr set MONGO_URI as an environment variable:");
      console.error("  Windows PowerShell: $env:MONGO_URI='your_connection_string'");
      console.error("  Windows CMD: set MONGO_URI=your_connection_string");
      console.error("  Linux/Mac: export MONGO_URI='your_connection_string'");
      process.exit(1);
    }
    
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const migrateCreditorToClient = async () => {
  try {
    console.log("🔄 Starting migration: Creditor to Client...\n");

    // Find a default user for createdBy (prefer law_firm_admin, fallback to any admin)
    let defaultCreatedBy = null;
    const adminUser = await User.findOne({ 
      role: { $in: ["law_firm_admin", "admin"] } 
    }).sort({ createdAt: 1 }); // Get the first admin user
    
    if (adminUser) {
      defaultCreatedBy = adminUser._id;
      console.log(`✅ Using default createdBy user: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.role})\n`);
    } else {
      console.log("⚠️  Warning: No admin user found. Will try to find a user per law firm.\n");
    }

    // Find all credit cases (don't populate lawFirm, we just need the ID)
    const creditCases = await CreditCase.find({});
    console.log(`📋 Found ${creditCases.length} credit cases to process\n`);

    let updatedCount = 0;
    let createdClientsCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const creditCase of creditCases) {
      try {
        // Skip if already has a client
        if (creditCase.client) {
          console.log(`⏭️  Case ${creditCase.caseNumber || creditCase._id} already has a client, skipping...`);
          skippedCount++;
          continue;
        }

        // Skip if no creditor information
        if (!creditCase.creditorName && !creditCase.creditorEmail && !creditCase.creditorContact) {
          console.log(`⏭️  Case ${creditCase.caseNumber || creditCase._id} has no creditor information, skipping...`);
          skippedCount++;
          continue;
        }

        if (!creditCase.lawFirm) {
          console.log(`⚠️  Case ${creditCase.caseNumber || creditCase._id} has no law firm, skipping...`);
          skippedCount++;
          continue;
        }

        // Get lawFirm ID (it's already an ObjectId, not populated)
        const lawFirmId = creditCase.lawFirm;

        // Try to find existing client by email or phone
        let existingClient = null;
        if (creditCase.creditorEmail) {
          existingClient = await Client.findOne({
            email: creditCase.creditorEmail.toLowerCase(),
            lawFirm: lawFirmId,
          });
        }
        if (!existingClient && creditCase.creditorContact) {
          existingClient = await Client.findOne({
            phoneNumber: creditCase.creditorContact,
            lawFirm: lawFirmId,
          });
        }

        let clientId = null;

        if (existingClient) {
          // Use existing client
          clientId = existingClient._id;
          console.log(`✅ Found existing client for case ${creditCase.caseNumber || creditCase._id}: ${existingClient.firstName} ${existingClient.lastName}`);
        } else if (creditCase.creditorName) {
          // Create new client from creditor information
          const nameParts = (creditCase.creditorName || "").trim().split(" ").filter(p => p.length > 0);
          let firstName = nameParts[0] || creditCase.creditorName || "Unknown";
          let lastName = nameParts.slice(1).join(" ") || "Creditor"; // Default to "Creditor" if no last name
          
          // If only one name provided, use it as firstName and set lastName to "Creditor"
          if (nameParts.length === 1) {
            firstName = nameParts[0];
            lastName = "Creditor";
          }

          // Find a user for createdBy (prefer admin from same law firm, fallback to default)
          let createdByUserId = defaultCreatedBy;
          if (!createdByUserId) {
            const lawFirmAdmin = await User.findOne({
              lawFirm: lawFirmId,
              role: { $in: ["law_firm_admin", "admin"] }
            });
            if (lawFirmAdmin) {
              createdByUserId = lawFirmAdmin._id;
            } else {
              // Last resort: find any user from this law firm
              const anyUser = await User.findOne({ lawFirm: lawFirmId });
              if (anyUser) {
                createdByUserId = anyUser._id;
              }
            }
          }

          if (!createdByUserId) {
            console.log(`⚠️  Case ${creditCase.caseNumber || creditCase._id}: No user found for createdBy, skipping client creation...`);
            skippedCount++;
            continue;
          }

          // Provide default phone number if missing
          const phoneNumber = creditCase.creditorContact || "N/A";

          const newClient = new Client({
            firstName,
            lastName,
            email: creditCase.creditorEmail || undefined,
            phoneNumber: phoneNumber,
            lawFirm: lawFirmId,
            clientType: "individual", // Default to individual
            status: "active", // Use status instead of isActive
            createdBy: createdByUserId,
          });

          const savedClient = await newClient.save();
          clientId = savedClient._id;
          createdClientsCount++;
          console.log(`✅ Created new client for case ${creditCase.caseNumber || creditCase._id}: ${firstName} ${lastName}`);
        }

        if (clientId) {
          // Update the credit case with client ID
          creditCase.client = clientId;
          await creditCase.save();
          updatedCount++;
          console.log(`✅ Updated case ${creditCase.caseNumber || creditCase._id} with client ID: ${clientId}\n`);
        } else {
          console.log(`⚠️  Could not create or find client for case ${creditCase.caseNumber || creditCase._id}\n`);
          skippedCount++;
        }
      } catch (caseError) {
        console.error(`❌ Error processing case ${creditCase.caseNumber || creditCase._id}:`, caseError.message);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(50));
    console.log(`✅ Updated cases: ${updatedCount}`);
    console.log(`🆕 Created clients: ${createdClientsCount}`);
    console.log(`⏭️  Skipped cases: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total cases processed: ${creditCases.length}`);
    console.log("=".repeat(50));
    console.log("\n✅ Migration completed!");

  } catch (error) {
    console.error("❌ Migration error:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await migrateCreditorToClient();
    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
main();
