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
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const migrateCreditorToClient = async () => {
  try {
    console.log("🔄 Starting migration: Creditor to Client...\n");

    // Find all credit cases
    const creditCases = await CreditCase.find({}).populate("lawFirm");
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

        const lawFirmId = creditCase.lawFirm._id || creditCase.lawFirm;

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
          const nameParts = (creditCase.creditorName || "").trim().split(" ");
          const firstName = nameParts[0] || creditCase.creditorName || "Unknown";
          const lastName = nameParts.slice(1).join(" ") || "";

          const newClient = new Client({
            firstName,
            lastName,
            email: creditCase.creditorEmail || undefined,
            phoneNumber: creditCase.creditorContact || undefined,
            lawFirm: lawFirmId,
            clientType: "individual", // Default to individual
            isActive: true,
            // Note: We don't have createdBy for migration, so it will be null
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
