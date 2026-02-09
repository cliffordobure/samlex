import express from "express";
import multer from "multer";
import {
  createCreditCase,
  updateCreditCase,
  moveCreditCase,
  assignCreditCase,
  commentOnCreditCase,
  addNoteToCreditCase,
  addFollowUpToCreditCase,
  addPromisedPaymentToCreditCase,
  updatePromisedPaymentStatus,
  escalateCreditCase,
  getCreditCases,
  getCreditCaseById,
  getCaseComments,
  addCaseComment,
  initiateEscalation,
  confirmEscalationPayment,
  getEscalationFee,
  getEscalatedCreditCases,
  addDocumentToCreditCase,
  updateEscalatedCaseStatus,
  deleteCreditCase,
} from "../controllers/creditCaseController.js";
import {
  bulkImportCases,
  sendBulkCaseSMS,
  sendSingleSMS,
  sendSingleCaseSMS,
  getImportBatches,
  getCasesByBatchId,
  checkDuplicateImport,
} from "../controllers/bulkImportController.js";
import { protect } from "../middleware/auth.js";

// Configure multer for Excel file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed (.xlsx, .xls)"));
    }
  },
});

const router = express.Router();

// Get all credit collection cases
router.get("/", protect, getCreditCases);

// Get escalated credit cases for legal department
router.get("/escalated", protect, getEscalatedCreditCases);

// Bulk import and SMS routes - MUST BE BEFORE /:id routes
router.post("/check-duplicate", protect, checkDuplicateImport);
router.post("/bulk-import", protect, upload.single("file"), bulkImportCases);
router.post("/bulk-sms", protect, sendBulkCaseSMS);
router.post("/send-sms", protect, sendSingleSMS); // General single SMS (not tied to a case)
router.get("/import-batches", protect, getImportBatches);
router.get("/import-batch/:batchId", protect, getCasesByBatchId);

// Create a new credit collection case
router.post("/", protect, createCreditCase);

// Update a credit case
router.put("/:id", protect, updateCreditCase);

// Delete a credit case (admin only)
router.delete("/:id", protect, deleteCreditCase);

// Move (update stage/status) a credit case
router.patch("/:id/move", protect, moveCreditCase);

// Assign a case to an officer (or self)
router.patch("/:id/assign", protect, assignCreditCase);

// Add a comment to a case
router.post("/:id/comment", protect, commentOnCreditCase);

// Add a private note to a case
router.post("/:id/note", protect, addNoteToCreditCase);

// Add a note to a case (plural route for RESTful convention)
router.post("/:id/notes", protect, addNoteToCreditCase);

// Add a follow-up to a case
router.post("/:id/follow-up", protect, addFollowUpToCreditCase);

// Add a promised payment to a case
router.post("/:id/promised-payment", protect, addPromisedPaymentToCreditCase);

// Update promised payment status
router.patch(
  "/:id/promised-payment/:paymentId",
  protect,
  updatePromisedPaymentStatus
);

// Escalate a case
router.patch("/:id/escalate", protect, escalateCreditCase);

// Comments endpoints
router.get("/:id/comments", protect, getCaseComments);
router.post("/:id/comments", protect, addCaseComment);

// Escalation endpoints
router.get("/:id/escalation-fee", protect, getEscalationFee);
router.post("/:id/initiate-escalation", protect, initiateEscalation);
router.post("/:id/confirm-escalation", protect, confirmEscalationPayment);

// Document endpoints
router.post("/:id/documents", protect, addDocumentToCreditCase);

// Escalated case status update
router.patch("/:id/escalated-status", protect, updateEscalatedCaseStatus);

// Send SMS for a single case
router.post("/:id/send-sms", protect, sendSingleCaseSMS);

// Get a single credit collection case by ID - MUST BE LAST
router.get("/:id", protect, getCreditCaseById);

export default router;
