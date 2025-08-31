import express from "express";
import {
  createLegalCase,
  getLegalCases,
  getLegalCaseById,
  assignLegalCase,
  updateLegalCaseStatus,
  updateLegalCase,
  addDocumentToCase,
  addNoteToCase,
  getPendingAssignmentCases,
  getAssignedCases,
  getLegalCaseStatistics,
  updateCourtDates,
  completeCaseInfo,
} from "../controllers/legalCaseController.js";
import { protect } from "../middleware/auth.js";
import { validateLegalCase } from "../middleware/validation.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get all legal cases with filtering and pagination
router.get("/", getLegalCases);

// Get legal case statistics
router.get("/statistics", getLegalCaseStatistics);

// Get cases pending assignment (legal head only)
router.get("/pending-assignment", getPendingAssignmentCases);

// Get assigned cases for a specific user
router.get("/assigned/:userId", getAssignedCases);

// Get a single legal case by ID
router.get("/:id", getLegalCaseById);

// Create a new legal case
router.post("/", createLegalCase);

// Update a legal case
router.put("/:id", updateLegalCase);

// Assign a legal case to an advocate
router.put("/:id/assign", assignLegalCase);

// Update legal case status
router.put("/:id/status", updateLegalCaseStatus);

// Add documents to a legal case
router.post("/:id/documents", addDocumentToCase);

// Add note to a legal case
router.post("/:id/notes", addNoteToCase);

// Update court dates for a legal case
router.put("/:id/court-dates", updateCourtDates);

// Complete case information (for advocates to add missing details)
router.put("/:id/complete-info", completeCaseInfo);

export default router;
