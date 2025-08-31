// server/routes/dev.js - Fixed version
import express from "express";
import bcrypt from "bcryptjs";
import { SystemOwner, LawFirm, User, Department } from "../models/index.js";

const router = express.Router();

// Helper function to generate firm code
const generateFirmCode = (firmName) => {
  const cleanName = firmName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
  return (cleanName.substr(0, 3) + randomSuffix).substr(0, 6);
};

// Only enable in development
if (process.env.NODE_ENV === "development") {
  // POST /api/dev/seed - Create test data
  router.post("/seed", async (req, res) => {
    try {
      // Clear existing data
      await SystemOwner.deleteMany({});
      await LawFirm.deleteMany({});
      await User.deleteMany({});
      await Department.deleteMany({});

      // Create System Owner
      const systemOwner = await SystemOwner.create({
        firstName: "System",
        lastName: "Admin",
        email: "admin@samlex.com",
        password: "Admin123!@#",
        phoneNumber: "+254700000000",
      });

      // Create Law Firm with firmCode
      const firmName = "Test Law Firm";
      const lawFirm = await LawFirm.create({
        firmName: firmName,
        firmCode: generateFirmCode(firmName), // Generate the code
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
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        settings: {
          allowedDepartments: ["credit_collection", "legal"],
          paymentMethods: ["stripe", "bank_transfer"],
          emailNotifications: true,
          timezone: "Africa/Nairobi",
        },
        createdBy: systemOwner._id,
        password: "TestLawFirm123!", // <-- Add this line
      });

      // Create Law Firm Admin
      const lawFirmAdmin = await User.create({
        firstName: "John",
        lastName: "Admin",
        email: "admin@testlawfirm.com",
        password: "Admin123!@#",
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
        emailVerified: true,
        createdBy: systemOwner._id,
      });

      // Create Departments
      const creditDepartment = await Department.create({
        name: "Credit Collection",
        code: "CC",
        description: "Handles debt collection and recovery cases",
        lawFirm: lawFirm._id,
        departmentType: "credit_collection",
        settings: {
          casePrefixes: new Map([["credit_collection", "CC"]]),
          workflowStages: [
            "new",
            "assigned",
            "in_progress",
            "follow_up_required",
            "escalated_to_legal",
            "resolved",
            "closed",
          ],
          autoAssignment: false,
          requireApproval: true,
        },
        createdBy: lawFirmAdmin._id,
      });

      const legalDepartment = await Department.create({
        name: "Legal Services",
        code: "LG",
        description: "Handles legal cases and court proceedings",
        lawFirm: lawFirm._id,
        departmentType: "legal",
        settings: {
          casePrefixes: new Map([["legal", "LG"]]),
          workflowStages: [
            "filed",
            "assigned",
            "under_review",
            "court_proceedings",
            "settlement",
            "resolved",
            "closed",
          ],
          autoAssignment: false,
          requireApproval: true,
        },
        createdBy: lawFirmAdmin._id,
      });

      // Create additional test users
      const creditHead = await User.create({
        firstName: "Sarah",
        lastName: "Collins",
        email: "sarah.collins@testlawfirm.com",
        password: "Password123!",
        role: "credit_head",
        lawFirm: lawFirm._id,
        department: creditDepartment._id,
        phoneNumber: "+254700000003",
        emailVerified: true,
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
        emailVerified: true,
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
        emailVerified: true,
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
        emailVerified: true,
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
        emailVerified: true,
        createdBy: lawFirmAdmin._id,
      });

      res.status(200).json({
        success: true,
        message: "Test data created successfully",
        data: {
          systemOwner: {
            id: systemOwner._id,
            email: systemOwner.email,
          },
          lawFirm: {
            id: lawFirm._id,
            name: lawFirm.firmName,
            code: lawFirm.firmCode,
          },
          lawFirmAdmin: {
            id: lawFirmAdmin._id,
            email: lawFirmAdmin.email,
          },
          departments: [
            {
              id: creditDepartment._id,
              name: creditDepartment.name,
              code: creditDepartment.code,
            },
            {
              id: legalDepartment._id,
              name: legalDepartment.name,
              code: legalDepartment.code,
            },
          ],
          users: [
            {
              id: creditHead._id,
              email: creditHead.email,
              role: creditHead.role,
            },
            {
              id: debtCollector._id,
              email: debtCollector.email,
              role: debtCollector.role,
            },
            { id: legalHead._id, email: legalHead.email, role: legalHead.role },
            { id: advocate._id, email: advocate.email, role: advocate.role },
            { id: client._id, email: client.email, role: client.role },
          ],
        },
        credentials: {
          systemOwner: {
            email: "admin@samlex.com",
            password: "Admin123!@#",
            role: "system_owner",
          },
          lawFirmAdmin: {
            email: "admin@testlawfirm.com",
            password: "Admin123!@#",
            role: "law_firm_admin",
          },
          creditHead: {
            email: "sarah.collins@testlawfirm.com",
            password: "Password123!",
            role: "credit_head",
          },
          debtCollector: {
            email: "mike.johnson@testlawfirm.com",
            password: "Password123!",
            role: "debt_collector",
          },
          legalHead: {
            email: "david.williams@testlawfirm.com",
            password: "Password123!",
            role: "legal_head",
          },
          advocate: {
            email: "lisa.brown@testlawfirm.com",
            password: "Password123!",
            role: "advocate",
          },
          client: {
            email: "james.client@testlawfirm.com",
            password: "Password123!",
            role: "client",
          },
        },
      });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating test data",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  });

  // POST /api/dev/create-system-owner - Create just a system owner
  router.post("/create-system-owner", async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      // Check if system owner already exists
      const existingOwner = await SystemOwner.findOne({
        email: email || "admin@samlex.com",
      });
      if (existingOwner) {
        return res.status(400).json({
          success: false,
          message: "System owner already exists with this email",
        });
      }

      const systemOwner = await SystemOwner.create({
        firstName: firstName || "System",
        lastName: lastName || "Admin",
        email: email || "admin@samlex.com",
        password: password || "Admin123!@#",
        phoneNumber: "+254700000000",
      });

      res.status(201).json({
        success: true,
        message: "System owner created successfully",
        data: {
          id: systemOwner._id,
          email: systemOwner.email,
          name: `${systemOwner.firstName} ${systemOwner.lastName}`,
        },
        credentials: {
          email: systemOwner.email,
          password: password || "Admin123!@#",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating system owner",
        error: error.message,
      });
    }
  });

  // GET /api/dev/status - Check what data exists
  router.get("/status", async (req, res) => {
    try {
      const systemOwners = await SystemOwner.countDocuments();
      const lawFirms = await LawFirm.countDocuments();
      const users = await User.countDocuments();
      const departments = await Department.countDocuments();

      res.json({
        success: true,
        data: {
          systemOwners,
          lawFirms,
          users,
          departments,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // DELETE /api/dev/clear - Clear all data
  router.delete("/clear", async (req, res) => {
    try {
      await SystemOwner.deleteMany({});
      await LawFirm.deleteMany({});
      await User.deleteMany({});
      await Department.deleteMany({});

      res.json({
        success: true,
        message: "All data cleared successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // GET /api/dev/check-user/:email - Check user details (including password hash)
  router.get("/check-user/:email", async (req, res) => {
    try {
      const { email } = req.params;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lawFirm: user.lawFirm,
          isActive: user.isActive,
          passwordHashLength: user.password ? user.password.length : 0,
          passwordHashPrefix: user.password
            ? user.password.substring(0, 10) + "..."
            : null,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
}

export default router;
