import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Payment from "../models/Payment.js";
import { createNotification } from "../services/notificationService.js";

// Create a new credit collection case
export const createCreditCase = async (req, res) => {
  try {
    console.log("Incoming create case request body:", req.body);
    const {
      title,
      description,
      debtorName,
      debtorEmail,
      debtorContact,
      creditorName,
      creditorEmail,
      creditorContact,
      debtAmount,
      caseReference,
      assignedTo, // Add assignment field
      documents = [],
    } = req.body;

    // Ensure the user is authenticated and has a lawFirm
    if (!req.user || !req.user.lawFirm) {
      return res.status(400).json({
        success: false,
        message:
          "User is not authenticated or not linked to a law firm. Cannot create case.",
      });
    }

    console.log("=== DEBUG: Creating Credit Case ===");
    console.log("Request body:", req.body);
    console.log("Assigned To:", assignedTo);
    console.log("Status:", assignedTo ? "assigned" : "new");
    console.log("User ID:", req.user._id);
    console.log("User role:", req.user.role);

    const newCase = new CreditCase({
      title,
      description,
      debtorName,
      debtorEmail,
      debtorContact,
      creditorName,
      creditorEmail,
      creditorContact,
      debtAmount,
      caseReference,
      assignedTo, // Add assignment
      documents: Array.isArray(documents) ? documents : [documents],
      status: assignedTo ? "assigned" : "new", // Set status based on assignment
      lawFirm: req.user.lawFirm,
      createdBy: req.user._id, // Enable createdBy
    });
    const savedCase = await newCase.save();

    console.log("=== DEBUG: Credit Case Created ===");
    console.log("Saved Case ID:", savedCase._id);
    console.log("Assigned To:", savedCase.assignedTo);
    console.log("Status:", savedCase.status);
    console.log("Full saved case:", JSON.stringify(savedCase, null, 2));

    // Create notification if case is assigned to someone else
    if (
      savedCase.assignedTo &&
      savedCase.assignedTo.toString() !== req.user._id.toString()
    ) {
      await createNotification({
        user: savedCase.assignedTo,
        title: `Credit Case Assigned: ${savedCase.caseNumber}`,
        message: `You have been assigned credit collection case "${savedCase.title}" by ${req.user.firstName} ${req.user.lastName}.`,
        type: "credit_case_assigned",
        priority: "high",
        relatedCreditCase: savedCase._id,
        actionUrl: `/credit-collection/cases/${savedCase._id}`,
        metadata: {
          caseNumber: savedCase.caseNumber,
          caseTitle: savedCase.title,
          assignedBy: `${req.user.firstName} ${req.user.lastName}`,
          debtorName: savedCase.debtorName,
          debtAmount: savedCase.debtAmount,
          currency: savedCase.currency,
        },
        sendEmail: true, // Enable email notification
      });
    }

    req.app.get("io").emit("caseCreated", savedCase);
    res.status(201).json({ success: true, data: savedCase });
  } catch (error) {
    console.error("Error in createCreditCase:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating case",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Move (update stage/status) a credit case
export const moveCreditCase = async (req, res) => {
  try {
    console.log("=== DEBUG: moveCreditCase called ===");
    console.log("User:", req.user);
    console.log("User role:", req.user?.role);
    console.log("User ID:", req.user?._id);

    const { id } = req.params;
    const { status } = req.body;

    console.log("Case ID:", id);
    console.log("New Status:", status);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid case ID:", id);
      return res
        .status(400)
        .json({ success: false, message: "Invalid case ID" });
    }

    // Check permissions - debt collectors, credit heads, and admins can change status
    if (
      !["debt_collector", "credit_head", "law_firm_admin", "admin"].includes(
        req.user.role
      )
    ) {
      console.log("Permission denied for role:", req.user.role);
      return res.status(403).json({
        success: false,
        message:
          "Only debt collectors, credit heads, and admins can change case status",
      });
    }

    // Find the case first to check if it's assigned to the user
    const case_ = await CreditCase.findById(id);
    if (!case_) {
      console.log("Case not found:", id);
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    // Verify the case belongs to the user's law firm
    if (case_.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      console.log("Case does not belong to user's law firm");
      return res.status(403).json({
        success: false,
        message: "You can only modify cases from your law firm",
      });
    }

    console.log("Found case:", case_._id);
    console.log("Case assigned to:", case_.assignedTo);
    console.log("Current user ID:", req.user._id);

    // Check if the case is assigned to the current user (for debt collectors)
    // Admins and credit heads can change status of any case
    if (
      req.user.role === "debt_collector" &&
      case_.assignedTo?.toString() !== req.user._id.toString()
    ) {
      console.log("Debt collector trying to move unassigned case");
      return res.status(403).json({
        success: false,
        message: "You can only change status of cases assigned to you",
      });
    }

    console.log("Updating case status to:", status);
    const updatedCase = await CreditCase.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    console.log("Case updated successfully:", updatedCase._id);
    req.app.get("io").emit("caseMoved", updatedCase);
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    console.error("Error in moveCreditCase:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error moving case",
      error: error.message,
    });
  }
};

// Assign a case to an officer (or self)
export const assignCreditCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid case ID" });
    }

    // Check permissions - only admins, debt collectors, and credit heads can assign cases
    if (
      !["law_firm_admin", "admin", "debt_collector", "credit_head"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only admins, debt collectors, and credit heads can assign cases",
      });
    }

    // Find the case first and verify it belongs to the user's law firm
    const case_ = await CreditCase.findById(id);
    if (!case_) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    // Verify the case belongs to the user's law firm
    if (case_.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only assign cases from your law firm",
      });
    }

    // If user is debt collector, they can only assign to themselves
    if (
      req.user.role === "debt_collector" &&
      assignedTo !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Debt collectors can only assign cases to themselves",
      });
    }

    // Verify the assigned user is a debt collector, credit head, or admin (for self-assignment)
    const assignedUser = await User.findById(assignedTo);
    if (
      !assignedUser ||
      !["debt_collector", "credit_head", "law_firm_admin", "admin"].includes(
        assignedUser.role
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Assigned user must be a debt collector, credit head, or admin",
      });
    }

    const updatedCase = await CreditCase.findByIdAndUpdate(
      id,
      {
        assignedTo,
        assignedBy: req.user._id,
        assignedAt: new Date(),
        status: "assigned", // Update status to "assigned" when case is assigned
      },
      { new: true }
    );

    // Create notification for the assigned debt collector
    await createNotification({
      user: assignedTo,
      title: `Credit Case Assigned: ${updatedCase.caseNumber}`,
      message: `You have been assigned credit collection case "${updatedCase.title}" by ${req.user.firstName} ${req.user.lastName}.`,
      type: "credit_case_assigned",
      priority: "high",
      relatedCreditCase: updatedCase._id,
      actionUrl: `/credit-collection/cases/${updatedCase._id}`,
      metadata: {
        caseNumber: updatedCase.caseNumber,
        caseTitle: updatedCase.title,
        assignedBy: `${req.user.firstName} ${req.user.lastName}`,
        debtorName: updatedCase.debtorName,
        debtAmount: updatedCase.debtAmount,
        currency: updatedCase.currency,
      },
      sendEmail: true, // Enable email notification
    });

    req.app.get("io").emit("caseAssigned", updatedCase);
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error assigning case",
      error: error.message,
    });
  }
};

// Add a comment to a case
export const commentOnCreditCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid case ID" });
    }

    // First check if the case exists and belongs to the user's law firm
    const case_ = await CreditCase.findById(id);
    if (!case_) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    // Verify the case belongs to the user's law firm
    if (case_.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only comment on cases from your law firm",
      });
    }

    const updatedCase = await CreditCase.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: {
            text: comment,
            author: req.user._id,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );
    req.app.get("io").emit("caseCommented", updatedCase);
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error commenting on case",
      error: error.message,
    });
  }
};

// Add a private note to a case
export const addNoteToCreditCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, date, followUpDate } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid case ID" });
    }

    // First check if the case exists and belongs to the user's law firm
    const case_ = await CreditCase.findById(id);
    if (!case_) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    // Verify the case belongs to the user's law firm
    if (case_.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only add notes to cases from your law firm",
      });
    }

    const noteObj = {
      content,
      date,
      followUpDate,
      createdBy: req.user?._id,
      createdAt: new Date(),
    };
    const updatedCase = await CreditCase.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: noteObj,
        },
      },
      { new: true }
    );
    req.app.get("io").emit("caseNoted", updatedCase);
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error adding note",
      error: error.message,
    });
  }
};

// Escalate a case
export const escalateCreditCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { escalationFee } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid credit case ID format",
      });
    }

    // Check if user has permission to escalate
    if (!["law_firm_admin", "admin", "credit_head"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to escalate cases",
      });
    }

    const creditCase = await CreditCase.findById(id)
      .populate("lawFirm", "firmName settings")
      .populate("assignedTo", "firstName lastName email");

    if (!creditCase) {
      return res.status(404).json({
        success: false,
        message: "Credit case not found",
      });
    }

    // Check if user has access to this case
    if (req.user.lawFirm._id.toString() !== creditCase.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this case",
      });
    }

    // Check if case is already escalated
    if (creditCase.escalatedToLegal) {
      return res.status(400).json({
        success: false,
        message: "Case is already escalated to legal department",
      });
    }

    // Get escalation fee from law firm settings or use default
    const escalationFeeAmount =
      escalationFee ||
      creditCase.lawFirm.settings?.escalationFees?.caseFilingFee ||
      5000;

    // Create payment record for escalation
    const payment = new Payment({
      lawFirm: creditCase.lawFirm._id,
      amount: escalationFeeAmount,
      currency: "KES",
      status: "pending",
      description: `Escalation fee for case: ${creditCase.caseNumber}`,
      // Add required fields for Payment model
      purpose: "escalation_fee",
      paymentMethod: "bank_transfer", // Default payment method
      client: creditCase.client || creditCase.createdBy, // Use case client or creator
      case: {
        caseId: creditCase._id,
        caseType: "credit",
        caseNumber:
          creditCase.caseNumber ||
          `CASE-${creditCase._id.toString().slice(-6)}`,
      },
    });

    await payment.save();

    // Update credit case with escalation details
    creditCase.escalatedToLegal = true;
    creditCase.escalationDate = new Date();
    creditCase.escalatedBy = req.user._id;
    creditCase.status = "escalated_to_legal";
    creditCase.escalationPayment = {
      paymentId: payment._id,
      status: "pending",
      amount: escalationFeeAmount,
    };

    await creditCase.save();

    // Emit socket event for real-time updates
    req.app
      .get("io")
      .to(`lawfirm-${creditCase.lawFirm._id.toString()}`)
      .emit("creditCaseUpdated", {
        caseId: creditCase._id,
        status: creditCase.status,
        escalatedToLegal: creditCase.escalatedToLegal,
        escalationPayment: creditCase.escalationPayment,
      });

    // Emit specific case escalated event
    req.app
      .get("io")
      .to(`lawfirm-${creditCase.lawFirm._id.toString()}`)
      .emit("caseEscalated", {
        caseId: creditCase._id,
        caseNumber: creditCase.caseNumber,
        title: creditCase.title,
        escalatedToLegal: creditCase.escalatedToLegal,
        escalationDate: creditCase.escalationDate,
        escalationPayment: creditCase.escalationPayment,
      });

    res.status(200).json({
      success: true,
      message: "Case escalated to legal department successfully",
      data: {
        creditCase: {
          _id: creditCase._id,
          caseNumber: creditCase.caseNumber,
          status: creditCase.status,
          escalatedToLegal: creditCase.escalatedToLegal,
          escalationPayment: creditCase.escalationPayment,
        },
        payment: {
          _id: payment._id,
          amount: payment.amount,
          status: payment.status,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error escalating credit case:", error);
    res.status(500).json({
      success: false,
      message: "Server error while escalating case",
      error: error.message,
    });
  }
};

// Get all credit collection cases
export const getCreditCases = async (req, res) => {
  try {
    console.log("GET /api/credit-cases called with query:", req.query);
    console.log("User object:", {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      lawFirm: req.user.lawFirm,
      lawFirmType: typeof req.user.lawFirm,
      lawFirmKeys:
        req.user.lawFirm &&
        typeof req.user.lawFirm === "object" &&
        req.user.lawFirm !== null
          ? Object.keys(req.user.lawFirm)
          : "null",
    });

    const { assignedTo, lawFirm } = req.query;

    // Check if user has law firm association
    if (!req.user.lawFirm) {
      console.error("User has no law firm association:", req.user._id);
      return res.status(400).json({
        success: false,
        message: "User is not associated with any law firm",
      });
    }

    // Handle different lawFirm formats (ObjectId, Buffer, or populated object)
    let userLawFirmId;
    if (req.user.lawFirm && req.user.lawFirm._id) {
      // Populated object
      userLawFirmId = req.user.lawFirm._id;
    } else if (req.user.lawFirm && req.user.lawFirm.buffer) {
      // Buffer format - convert to string
      userLawFirmId = req.user.lawFirm.toString();
    } else if (req.user.lawFirm) {
      // Direct ObjectId
      userLawFirmId = req.user.lawFirm;
    } else {
      console.error("User has no law firm association:", req.user._id);
      return res.status(400).json({
        success: false,
        message: "User is not associated with any law firm",
      });
    }

    console.log("User law firm ID resolved:", userLawFirmId);

    // Always filter by the authenticated user's law firm
    let filter = { lawFirm: userLawFirmId };

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // If a specific law firm is requested and user has permission, allow it
    if (
      lawFirm &&
      (req.user.role === "admin" || req.user.role === "law_firm_admin")
    ) {
      filter.lawFirm = lawFirm;
    }

    console.log("Filter used:", filter);
    console.log("User law firm ID:", userLawFirmId);

    const cases = await CreditCase.find(filter)
      .populate("assignedTo", "firstName lastName email role")
      .sort({ createdAt: -1 });
    console.log("Cases found:", cases.length);
    res.json({ success: true, data: cases });
  } catch (error) {
    console.error("Error in getCreditCases:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching cases",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const getCreditCaseById = async (req, res) => {
  try {
    console.log("[getCreditCaseById] Called with params:", req.params);
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn("[getCreditCaseById] Invalid ObjectId:", id);
      return res
        .status(400)
        .json({ success: false, message: "Invalid case ID" });
    }
    console.log("[getCreditCaseById] Valid ObjectId:", id);
    const creditCase = await CreditCase.findById(id).populate("assignedTo");
    if (!creditCase) {
      console.warn("[getCreditCaseById] Case not found for ID:", id);
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }
    console.log("[getCreditCaseById] Case found:", creditCase);
    res.json({ success: true, data: creditCase });
  } catch (error) {
    console.error("[getCreditCaseById] Error:", error);
    console.error("[getCreditCaseById] Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error fetching case",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Get comments for a case
export const getCaseComments = async (req, res) => {
  try {
    const comments = await Comment.find({ case: req.params.id })
      .populate("author", "firstName lastName email role")
      .sort({ createdAt: 1 });
    res.json({ success: true, data: comments });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch comments" });
  }
};

// Add a comment to a case
export const addCaseComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Content required" });
    }
    const comment = await Comment.create({
      case: req.params.id,
      author: req.user._id,
      content,
      role: req.user.role,
    });

    // Populate author for response and socket
    await comment.populate("author", "firstName lastName email role");

    // Emit via Socket.IO
    const io = req.app.get("io");
    io.to(`case-${req.params.id}`).emit("newComment", comment);

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

// Initiate escalation with payment
export const initiateEscalation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid case ID" });
    }

    const creditCase = await CreditCase.findById(id)
      .populate("lawFirm")
      .populate("assignedTo");

    if (!creditCase) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    if (!creditCase.lawFirm) {
      return res.status(400).json({
        success: false,
        message:
          "This case is not linked to a law firm. Please check the case data.",
      });
    }

    // Check if user is authorized to escalate this case
    if (
      req.user.role !== "debt_collector" ||
      creditCase.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to escalate this case",
      });
    }

    // Get escalation fee from law firm settings
    const escalationFee =
      creditCase.lawFirm.settings?.escalationFees?.caseFilingFee || 5000;

    // Create payment record
    const Payment = mongoose.model("Payment");
    const payment = new Payment({
      amount: escalationFee,
      currency: "KES",
      status: "pending",
      paymentMethod: "bank_transfer", // Default method
      lawFirm: creditCase.lawFirm._id,
      client: creditCase.client || req.user._id,
      case: {
        caseId: creditCase._id,
        caseType: "credit",
        caseNumber: creditCase.caseNumber,
      },
      purpose: "escalation_fee",
      description: `Case filing fee for escalation of case ${creditCase.caseNumber}`,
    });
    await payment.save();

    // Update case with escalation payment info
    const updatedCase = await CreditCase.findByIdAndUpdate(
      id,
      {
        "escalationPayment.paymentId": payment._id,
        "escalationPayment.amount": escalationFee,
        "escalationPayment.status": "pending",
      },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        case: updatedCase,
        payment: payment,
        escalationFee: escalationFee,
      },
    });
  } catch (error) {
    console.error("Error in initiateEscalation:", error);
    res.status(500).json({
      success: false,
      message: "Server error initiating escalation",
      error: error.message,
    });
  }
};

/**
 * @desc    Confirm escalation payment
 * @route   POST /api/credit-cases/:id/confirm-escalation-payment
 * @access  Private (law_firm_admin, credit_head)
 */
export const confirmEscalationPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(paymentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Check if user has permission to confirm payment
    if (!["law_firm_admin", "admin", "credit_head"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to confirm payments",
      });
    }

    const creditCase = await CreditCase.findById(id);
    if (!creditCase) {
      return res.status(404).json({
        success: false,
        message: "Credit case not found",
      });
    }

    // Check if user has access to this case
    if (req.user.lawFirm._id.toString() !== creditCase.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this case",
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Update payment status
    payment.status = "confirmed";
    payment.confirmedAt = new Date();
    payment.confirmedBy = req.user._id;
    await payment.save();

    // Update credit case escalation payment status
    creditCase.escalationPayment.status = "confirmed";
    creditCase.escalationPayment.confirmedAt = new Date();
    creditCase.escalationPayment.confirmedBy = req.user._id;
    await creditCase.save();

    // Emit socket event for real-time updates
    req.app
      .get("io")
      .to(creditCase.lawFirm._id.toString())
      .emit("creditCaseUpdated", {
        caseId: creditCase._id,
        escalationPayment: creditCase.escalationPayment,
      });

    res.status(200).json({
      success: true,
      message: "Escalation payment confirmed successfully",
      data: {
        creditCase: {
          _id: creditCase._id,
          caseNumber: creditCase.caseNumber,
          escalationPayment: creditCase.escalationPayment,
        },
        payment: {
          _id: payment._id,
          status: payment.status,
          confirmedAt: payment.confirmedAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error confirming escalation payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error while confirming payment",
      error: error.message,
    });
  }
};

// Get escalation fee for a case
export const getEscalationFee = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid case ID" });
    }

    const creditCase = await CreditCase.findById(id).populate("lawFirm");

    if (!creditCase) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    const escalationFee =
      creditCase.lawFirm.settings?.escalationFees?.caseFilingFee || 5000;

    res.json({
      success: true,
      data: {
        escalationFee: escalationFee,
        currency: "KES",
        caseNumber: creditCase.caseNumber,
      },
    });
  } catch (error) {
    console.error("Error in getEscalationFee:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting escalation fee",
      error: error.message,
    });
  }
};

/**
 * @desc    Get escalated credit cases for legal department
 * @route   GET /api/credit-cases/escalated
 * @access  Private (legal_head only)
 */
export const getEscalatedCreditCases = async (req, res) => {
  try {
    // Only legal heads and law firm admins can access escalated cases
    if (!["legal_head", "law_firm_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Only legal heads and law firm admins can access escalated cases",
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Find credit cases that have been escalated to legal and not yet processed
    const filter = {
      lawFirm: req.user.lawFirm._id,
      $or: [{ escalatedToLegal: true }, { status: "escalated_to_legal" }],
      processed: { $ne: true }, // Exclude processed cases
    };

    console.log("=== DEBUG: getEscalatedCreditCases ===");
    console.log("User Law Firm ID:", req.user.lawFirm._id);
    console.log("Filter:", JSON.stringify(filter, null, 2));

    // Check all cases in this law firm
    const allCases = await CreditCase.find({ lawFirm: req.user.lawFirm._id });
    console.log("Total cases in law firm:", allCases.length);

    // Check cases with escalatedToLegal: true
    const escalatedCases = await CreditCase.find(filter)
      .populate("client", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .populate("escalatedBy", "firstName lastName email")
      .populate("legalCaseId", "caseNumber title status")
      .sort({ escalationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log("Escalated cases found:", escalatedCases.length);
    escalatedCases.forEach((case_, index) => {
      console.log(
        `${index + 1}. ${case_.caseNumber} - ${
          case_.title
        } - escalatedToLegal: ${case_.escalatedToLegal}`
      );
    });

    const total = await CreditCase.countDocuments(filter);

    res.json({
      success: true,
      data: escalatedCases,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCount: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error in getEscalatedCreditCases:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching escalated credit cases",
      error: error.message,
    });
  }
};

/**
 * @desc    Update escalated case status
 * @route   PATCH /api/credit-cases/:id/escalated-status
 * @access  Private (legal_head, law_firm_admin)
 */
export const updateEscalatedCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { processed, legalCaseId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid credit case ID format",
      });
    }

    // Check if user has permission
    if (!["legal_head", "law_firm_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update escalated case status",
      });
    }

    const creditCase = await CreditCase.findById(id);

    if (!creditCase) {
      return res.status(404).json({
        success: false,
        message: "Credit case not found",
      });
    }

    // Check if user has access to this case
    if (req.user.lawFirm._id.toString() !== creditCase.lawFirm.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this case",
      });
    }

    // Update the escalated case
    const updateData = {};
    if (processed !== undefined) {
      updateData.processed = processed;
    }
    if (legalCaseId) {
      updateData.legalCaseId = legalCaseId;
    }

    const updatedCase = await CreditCase.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.json({
      success: true,
      message: "Escalated case status updated successfully",
      data: updatedCase,
    });
  } catch (error) {
    console.error("Error updating escalated case status:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating escalated case status",
      error: error.message,
    });
  }
};

/**
 * @desc    Add document to credit case
 * @route   POST /api/credit-cases/:id/documents
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const addDocumentToCreditCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { documents } = req.body;

    console.log("=== DEBUG: addDocumentToCreditCase ===");
    console.log("Request body:", req.body);
    console.log("Documents:", documents);

    const creditCase = await CreditCase.findById(id);
    if (!creditCase) {
      return res.status(404).json({
        success: false,
        message: "Credit case not found",
      });
    }

    // Verify the case belongs to the user's law firm
    if (creditCase.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only add documents to cases from your law firm",
      });
    }

    // Check permissions - debt collectors can only add to their assigned cases
    if (
      req.user.role === "debt_collector" &&
      creditCase.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only add documents to cases assigned to you",
      });
    }

    // Validate documents parameter
    if (!documents) {
      return res.status(400).json({
        success: false,
        message: "Documents parameter is required",
      });
    }

    // Ensure documents is an array
    const documentsArray = Array.isArray(documents) ? documents : [documents];

    console.log("Documents array:", documentsArray);

    // Add documents to case (credit cases store documents as strings)
    const newDocuments = documentsArray.filter(
      (doc) => typeof doc === "string" && doc
    );

    // Add new documents to existing documents array
    creditCase.documents.push(...newDocuments);

    // Use findByIdAndUpdate to avoid triggering pre-save hooks that might create notes
    const updatedCase = await CreditCase.findByIdAndUpdate(
      id,
      {
        $push: { documents: { $each: newDocuments } },
        lastActivity: new Date(),
      },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedCase,
      message: "Documents added successfully",
    });
  } catch (error) {
    console.error("Error in addDocumentToCreditCase:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding documents to case",
      error: error.message,
    });
  }
};

// Add a follow-up date to a credit case
export const addFollowUpToCreditCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { followUpDate, title, description, time } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid case ID" });
    }

    // First check if the case exists and belongs to the user's law firm
    const case_ = await CreditCase.findById(id);
    if (!case_) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    // Verify the case belongs to the user's law firm
    if (case_.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only add follow-ups to cases from your law firm",
      });
    }

    // Check if user can add follow-ups to this case
    if (
      req.user.role === "debt_collector" &&
      case_.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only add follow-ups to cases assigned to you",
      });
    }

    // Create the note with follow-up date
    const noteObj = {
      content: description || `Follow-up scheduled: ${title || "Follow-up"}`,
      date: new Date(),
      followUpDate: new Date(followUpDate),
      createdBy: req.user._id,
      createdAt: new Date(),
    };

    const updatedCase = await CreditCase.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: noteObj,
        },
      },
      { new: true }
    );

    // Create notification for the follow-up
    if (
      req.user.role !== "debt_collector" ||
      case_.assignedTo?.toString() === req.user._id.toString()
    ) {
      await createNotification({
        user: case_.assignedTo || req.user._id,
        title: `Follow-up Scheduled: ${case_.caseNumber}`,
        message: `A follow-up has been scheduled for case "${
          case_.title || case_.caseNumber
        }" on ${new Date(followUpDate).toLocaleDateString()}`,
        type: "follow_up_scheduled",
        priority: "medium",
        relatedCreditCase: case_._id,
        eventDate: new Date(followUpDate),
        actionUrl: `/credit-collection/cases/${case_._id}`,
        metadata: {
          caseNumber: case_.caseNumber,
          caseTitle: case_.title,
          followUpDate: new Date(followUpDate),
          scheduledBy: `${req.user.firstName} ${req.user.lastName}`,
        },
      });
    }

    req.app.get("io").emit("caseFollowUpAdded", updatedCase);
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    console.error("Error in addFollowUpToCreditCase:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding follow-up",
      error: error.message,
    });
  }
};

// Add a promised payment to a credit case
export const addPromisedPaymentToCreditCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currency, promisedDate, notes, paymentMethod } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid case ID" });
    }

    // Validate required fields
    if (!amount || !promisedDate) {
      return res.status(400).json({
        success: false,
        message: "Amount and promised date are required",
      });
    }

    // First check if the case exists and belongs to the user's law firm
    const case_ = await CreditCase.findById(id);
    if (!case_) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    // Verify the case belongs to the user's law firm
    if (case_.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only add promised payments to cases in your law firm",
      });
    }

    // Verify user has permission to add promised payments
    if (
      req.user.role === "debt_collector" &&
      case_.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only add promised payments to cases assigned to you",
      });
    }

    // Create the promised payment
    const promisedPayment = {
      amount: parseFloat(amount),
      currency: currency || "KES",
      promisedDate: new Date(promisedDate),
      notes: notes || "",
      createdBy: req.user._id,
      paymentMethod: paymentMethod || "",
    };

    // Add the promised payment to the case
    const updatedCase = await CreditCase.findByIdAndUpdate(
      id,
      {
        $push: { promisedPayments: promisedPayment },
        lastActivity: new Date(),
      },
      { new: true }
    );

    // Create notification for the promised payment
    await createNotification({
      user: case_.assignedTo || req.user._id,
      title: `Promised Payment Added: ${case_.caseNumber}`,
      message: `A payment of ${currency || "KES"} ${parseFloat(
        amount
      ).toLocaleString()} has been promised for case "${
        case_.title || case_.caseNumber
      }" on ${new Date(promisedDate).toLocaleDateString()}`,
      type: "promised_payment_added",
      priority: "high",
      relatedCreditCase: case_._id,
      eventDate: new Date(promisedDate),
      actionUrl: `/credit-collection/cases/${case_._id}`,
      metadata: {
        caseNumber: case_.caseNumber,
        caseTitle: case_.title,
        promisedAmount: parseFloat(amount),
        promisedDate: new Date(promisedDate),
        currency: currency || "KES",
        scheduledBy: `${req.user.firstName} ${req.user.lastName}`,
      },
    });

    req.app.get("io").emit("promisedPaymentAdded", updatedCase);
    res.status(200).json({
      success: true,
      message: "Promised payment added successfully",
      data: updatedCase,
    });
  } catch (error) {
    console.error("Error adding promised payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add promised payment",
      error: error.message,
    });
  }
};

// Update promised payment status
export const updatePromisedPaymentStatus = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const { status, paidAt, paymentMethod } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid case ID" });
    }

    // First check if the case exists and belongs to the user's law firm
    const case_ = await CreditCase.findById(id);
    if (!case_) {
      return res
        .status(404)
        .json({ success: false, message: "Case not found" });
    }

    // Verify the case belongs to the user's law firm
    if (case_.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "You can only update promised payments for cases in your law firm",
      });
    }

    // Find and update the specific promised payment
    const updateData = { status };
    if (status === "paid") {
      updateData.paidAt = new Date();
      updateData.paymentMethod = paymentMethod;
    }

    // Calculate total paid amount for this case
    const totalPaidAmount = case_.promisedPayments.reduce((sum, payment) => {
      if (payment._id.toString() === paymentId) {
        // Include the new status for this payment
        return sum + (status === "paid" ? payment.amount : 0);
      } else {
        // Include existing paid payments
        return sum + (payment.status === "paid" ? payment.amount : 0);
      }
    }, 0);

    // Check if total paid amount equals or exceeds debt amount
    const shouldResolveCase = totalPaidAmount >= case_.debtAmount;

    const updatedCase = await CreditCase.findOneAndUpdate(
      {
        _id: id,
        "promisedPayments._id": paymentId,
      },
      {
        $set: {
          "promisedPayments.$.status": status,
          "promisedPayments.$.paidAt": updateData.paidAt,
          "promisedPayments.$.paymentMethod": updateData.paymentMethod,
          lastActivity: new Date(),
          // Update case status if fully paid
          ...(shouldResolveCase && { status: "resolved" }),
        },
      },
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        message: "Promised payment not found",
      });
    }

    // Find the updated payment for notification
    const updatedPayment = updatedCase.promisedPayments.find(
      (p) => p._id.toString() === paymentId
    );

    // Create notification for payment status update
    await createNotification({
      user: case_.assignedTo || req.user._id,
      title: `Payment Status Updated: ${case_.caseNumber}`,
      message: `Payment of ${
        updatedPayment.currency
      } ${updatedPayment.amount.toLocaleString()} for case "${
        case_.title || case_.caseNumber
      }" has been marked as ${status}`,
      type: "payment_status_updated",
      priority: "medium",
      relatedCreditCase: case_._id,
      actionUrl: `/credit-collection/cases/${case_._id}`,
      metadata: {
        caseNumber: case_.caseNumber,
        caseTitle: case_.title,
        paymentAmount: updatedPayment.amount,
        paymentStatus: status,
        currency: updatedPayment.currency,
        updatedBy: `${req.user.firstName} ${req.user.lastName}`,
      },
    });

    // Emit socket event for real-time updates
    req.app.get("io").emit("promisedPaymentUpdated", updatedCase);
    
    // If case was resolved, emit case status update
    if (shouldResolveCase) {
      req.app.get("io").emit("caseStatusUpdated", updatedCase);
    }

    res.status(200).json({
      success: true,
      message: "Promised payment status updated successfully",
      data: updatedCase,
      caseResolved: shouldResolveCase,
      totalPaidAmount,
      debtAmount: case_.debtAmount,
    });
  } catch (error) {
    console.error("Error updating promised payment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update promised payment status",
      error: error.message,
    });
  }
};
