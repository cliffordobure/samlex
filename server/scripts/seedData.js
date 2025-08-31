import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { SystemOwner, LawFirm, User, Department } from "../models/index.js";
import config from "../config/config.js";

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to database");

    // Clear existing data (optional - be careful in production!)
    await SystemOwner.deleteMany({});
    await LawFirm.deleteMany({});
    await User.deleteMany({});
    await Department.deleteMany({});
    console.log("Cleared existing data");

    // 1. Create System Owner
    const systemOwner = await SystemOwner.create({
      firstName: "System",
      lastName: "Admin",
      email: "admin@samlex.com",
      password: "Admin123!@#", // This will be hashed automatically
      phoneNumber: "+254700000000",
    });
    console.log("✅ System Owner created:", systemOwner.email);

    // 2. Create a Test Law Firm
    const lawFirm = await LawFirm.create({
      firmName: "Test Law Firm",
      firmEmail: "info@testlawfirm.com",
      firmPhone: "+254700000001",
      address: {
        street: "123 Test Street",
        city: "Nairobi",
        state: "Nairobi County",
        zipCode: "00100",
        country: "Kenya",
      },
      subscription: {
        plan: "premium",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
      createdBy: systemOwner._id,
    });
    console.log("✅ Law Firm created:", lawFirm.firmName);

    // 3. Create Law Firm Admin
    const lawFirmAdmin = await User.create({
      firstName: "John",
      lastName: "Admin",
      email: "admin@testlawfirm.com",
      password: "Admin123!@#", // This will be hashed automatically
      role: "law_firm_admin",
      lawFirm: lawFirm._id,
      phoneNumber: "+254700000002",
      address: {
        street: "456 Admin Street",
        city: "Nairobi",
        state: "Nairobi County",
        zipCode: "00200",
        country: "Kenya",
      },
      createdBy: systemOwner._id,
    });
    console.log("✅ Law Firm Admin created:", lawFirmAdmin.email);

    // 4. Create Departments
    const creditDepartment = await Department.create({
      name: "Credit Collection",
      code: "CC",
      description: "Handles debt collection and recovery cases",
      lawFirm: lawFirm._id,
      departmentType: "credit_collection",
      createdBy: lawFirmAdmin._id,
    });

    const legalDepartment = await Department.create({
      name: "Legal Services",
      code: "LG",
      description: "Handles legal cases and court proceedings",
      lawFirm: lawFirm._id,
      departmentType: "legal",
      createdBy: lawFirmAdmin._id,
    });
    console.log("✅ Departments created");

    // 5. Create test users for different roles
    const creditHead = await User.create({
      firstName: "Sarah",
      lastName: "Collins",
      email: "sarah.collins@testlawfirm.com",
      password: "Password123!",
      role: "credit_head",
      lawFirm: lawFirm._id,
      department: creditDepartment._id,
      phoneNumber: "+254700000003",
      createdBy: lawFirmAdmin._id,
    });

    const debtCollector = await User.create({
      firstName: "Mike",
      lastName: "Johnson",
      email: "mike.johnson@testlawfirm.com",
      password: "Password123!",
      role: "debt_collector",
      lawFirm: lawFirm._id,
      department: creditDepartment._id,
      phoneNumber: "+254700000004",
      createdBy: lawFirmAdmin._id,
    });

    const legalHead = await User.create({
      firstName: "David",
      lastName: "Williams",
      email: "david.williams@testlawfirm.com",
      password: "Password123!",
      role: "legal_head",
      lawFirm: lawFirm._id,
      department: legalDepartment._id,
      phoneNumber: "+254700000005",
      createdBy: lawFirmAdmin._id,
    });

    const advocate = await User.create({
      firstName: "Lisa",
      lastName: "Brown",
      email: "lisa.brown@testlawfirm.com",
      password: "Password123!",
      role: "advocate",
      lawFirm: lawFirm._id,
      department: legalDepartment._id,
      phoneNumber: "+254700000006",
      createdBy: lawFirmAdmin._id,
    });

    const client = await User.create({
      firstName: "James",
      lastName: "Client",
      email: "james.client@testlawfirm.com",
      password: "Password123!",
      role: "client",
      lawFirm: lawFirm._id,
      phoneNumber: "+254700000007",
      createdBy: lawFirmAdmin._id,
    });

    console.log("✅ Test users created");

    // Print login credentials
    console.log("\n🔐 LOGIN CREDENTIALS:");
    console.log("=====================================");
    console.log("System Owner:");
    console.log("Email: admin@samlex.com");
    console.log("Password: Admin123!@#");
    console.log("");
    console.log("Law Firm Admin:");
    console.log("Email: admin@testlawfirm.com");
    console.log("Password: Admin123!@#");
    console.log("");
    console.log("Credit Head:");
    console.log("Email: sarah.collins@testlawfirm.com");
    console.log("Password: Password123!");
    console.log("");
    console.log("Debt Collector:");
    console.log("Email: mike.johnson@testlawfirm.com");
    console.log("Password: Password123!");
    console.log("");
    console.log("Legal Head:");
    console.log("Email: david.williams@testlawfirm.com");
    console.log("Password: Password123!");
    console.log("");
    console.log("Advocate:");
    console.log("Email: lisa.brown@testlawfirm.com");
    console.log("Password: Password123!");
    console.log("");
    console.log("Client:");
    console.log("Email: james.client@testlawfirm.com");
    console.log("Password: Password123!");
    console.log("=====================================");

    console.log("\n🎉 Seed data created successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
};

// Run the seed function
seedData();
