import CreditCase from "../models/CreditCase.js";
import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";
import {
  sendBulkSMS,
  sendSMS,
  generateDebtCollectionMessage,
  formatPhoneNumber,
  validatePhoneNumber,
} from "../services/smsService.js";

/**
 * @desc    Bulk import credit cases from Excel file
 * @route   POST /api/credit-cases/bulk-import
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const bulkImportCases = async (req, res) => {
  try {
    const { bankName } = req.body;
    
    if (!bankName) {
      return res.status(400).json({
        success: false,
        message: "Bank name is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required",
      });
    }

    // Verify user permissions
    if (
      !["debt_collector", "credit_head", "law_firm_admin", "admin"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to import cases",
      });
    }

    // Read Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty or invalid",
      });
    }

    const importBatchId = uuidv4();
    const cases = [];
    const errors = [];
    let successCount = 0;
    let failureCount = 0;

    // Get headers from first row
    const headers = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString().toLowerCase().trim();
    });

    // Expected columns: name/debtor name, phone/contact, amount/debt amount, email (optional)
    const nameColumn = headers.findIndex((h) =>
      h?.includes("name") || h?.includes("debtor")
    );
    const phoneColumn = headers.findIndex((h) =>
      h?.includes("phone") || h?.includes("contact") || h?.includes("mobile")
    );
    const amountColumn = headers.findIndex((h) =>
      h?.includes("amount") || h?.includes("debt") || h?.includes("balance")
    );
    const emailColumn = headers.findIndex((h) => h?.includes("email"));

    if (nameColumn === -1 || phoneColumn === -1 || amountColumn === -1) {
      return res.status(400).json({
        success: false,
        message: "Excel file must contain columns for: Name, Phone/Contact, and Amount/Debt",
        hint: "Please ensure your Excel file has headers like 'Name', 'Phone', 'Amount'",
      });
    }

    // Process each row (skip header)
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      // Skip empty rows
      if (row.getCell(nameColumn).value === null) {
        continue;
      }

      try {
        const debtorName = row.getCell(nameColumn).value?.toString().trim();
        
        // Handle phone number - convert from scientific notation if needed
        let debtorContact = row.getCell(phoneColumn).value;
        if (typeof debtorContact === 'number') {
          // Convert scientific notation to full number
          debtorContact = debtorContact.toFixed(0);
        }
        debtorContact = debtorContact?.toString().trim();
        
        const debtAmount = parseFloat(
          row.getCell(amountColumn).value?.toString().replace(/,/g, "")
        );
        const debtorEmail = emailColumn !== -1
          ? row.getCell(emailColumn).value?.toString().trim()
          : "";

        // Validate required fields
        if (!debtorName || !debtorContact || isNaN(debtAmount)) {
          errors.push({
            row: rowNumber,
            error: "Missing or invalid required fields",
            data: { debtorName, debtorContact, debtAmount },
          });
          failureCount++;
          continue;
        }

        // Format phone number
        const formattedPhone = formatPhoneNumber(debtorContact);

        // Create case reference
        const caseReference = `${bankName
          .substring(0, 3)
          .toUpperCase()}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase()}`;

        // Create credit case
        const creditCase = new CreditCase({
          title: `${bankName} - ${debtorName} Debt Collection`,
          description: `Debt collection case for ${debtorName} imported from ${bankName} bulk import on ${new Date().toLocaleDateString()}`,
          debtorName,
          debtorContact: formattedPhone,
          debtorEmail: debtorEmail || "",
          creditorName: bankName,
          debtAmount,
          currency: "KES",
          status: "new",
          priority: debtAmount > 100000 ? "high" : "medium",
          lawFirm: req.user.lawFirm,
          createdBy: req.user._id,
          caseReference,
          bankName,
          importBatchId,
          importedAt: new Date(),
          importedBy: req.user._id,
        });

        await creditCase.save();
        cases.push(creditCase);
        successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message,
        });
        failureCount++;
      }
    }

    // Emit socket event for real-time updates
    req.app.get("io").emit("bulkCasesImported", {
      batchId: importBatchId,
      bankName,
      total: successCount + failureCount,
      success: successCount,
      failed: failureCount,
    });

    res.status(201).json({
      success: true,
      message: `Bulk import completed. ${successCount} cases created, ${failureCount} failed.`,
      data: {
        importBatchId,
        bankName,
        totalProcessed: successCount + failureCount,
        successCount,
        failureCount,
        cases,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Error in bulkImportCases:", error);
    res.status(500).json({
      success: false,
      message: "Server error during bulk import",
      error: error.message,
    });
  }
};

/**
 * @desc    Send bulk SMS to imported cases
 * @route   POST /api/credit-cases/bulk-sms
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const sendBulkCaseSMS = async (req, res) => {
  try {
    const { importBatchId, customMessage, useTemplate } = req.body;

    if (!importBatchId) {
      return res.status(400).json({
        success: false,
        message: "Import batch ID is required",
      });
    }

    // Verify user permissions
    if (
      !["debt_collector", "credit_head", "law_firm_admin", "admin"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to send SMS",
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

    // Get all cases from this import batch
    const cases = await CreditCase.find({
      importBatchId,
      lawFirm: userLawFirmId,
    });

    if (cases.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No cases found for this import batch",
      });
    }

    // Prepare SMS recipients
    const recipients = cases
      .filter((c) => c.debtorContact && validatePhoneNumber(c.debtorContact))
      .map((c) => {
        const message = useTemplate
          ? generateDebtCollectionMessage(
              c.debtorName,
              c.debtAmount,
              c.bankName || c.creditorName,
              c.currency
            )
          : customMessage
              .replace("{name}", c.debtorName)
              .replace("{amount}", c.debtAmount.toLocaleString())
              .replace("{bank}", c.bankName || c.creditorName)
              .replace("{currency}", c.currency);

        return {
          phoneNumber: c.debtorContact,
          message,
          debtorName: c.debtorName,
          debtAmount: c.debtAmount,
          caseId: c._id,
        };
      });

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid phone numbers found in the selected cases",
      });
    }

    // Send bulk SMS
    const smsResult = await sendBulkSMS(recipients);

    res.status(200).json({
      success: true,
      message: `Bulk SMS sent. ${smsResult.sent} succeeded, ${smsResult.failed} failed.`,
      data: smsResult,
    });
  } catch (error) {
    console.error("Error in sendBulkCaseSMS:", error);
    res.status(500).json({
      success: false,
      message: "Server error sending bulk SMS",
      error: error.message,
    });
  }
};

/**
 * @desc    Send SMS to a single case
 * @route   POST /api/credit-cases/:id/send-sms
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const sendSingleCaseSMS = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, useTemplate } = req.body;

    // Verify user permissions
    if (
      !["debt_collector", "credit_head", "law_firm_admin", "admin"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to send SMS",
      });
    }

    // Get the case
    const creditCase = await CreditCase.findById(id);

    if (!creditCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Verify case belongs to user's law firm
    if (creditCase.lawFirm.toString() !== req.user.lawFirm._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only send SMS for cases in your law firm",
      });
    }

    // Validate phone number
    if (!creditCase.debtorContact) {
      return res.status(400).json({
        success: false,
        message: "This case doesn't have a phone number",
      });
    }

    if (!validatePhoneNumber(creditCase.debtorContact)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // Generate message
    const smsMessage = useTemplate
      ? generateDebtCollectionMessage(
          creditCase.debtorName,
          creditCase.debtAmount,
          creditCase.bankName || creditCase.creditorName,
          creditCase.currency
        )
      : message
          .replace("{name}", creditCase.debtorName)
          .replace("{amount}", creditCase.debtAmount.toLocaleString())
          .replace("{bank}", creditCase.bankName || creditCase.creditorName)
          .replace("{currency}", creditCase.currency);

    // Send SMS
    const smsResult = await sendSMS(creditCase.debtorContact, smsMessage);

    if (smsResult.success) {
      // Add note to case about SMS sent
      creditCase.notes.push({
        content: `SMS sent to ${creditCase.debtorContact}: "${smsMessage.substring(0, 100)}..."`,
        date: new Date(),
        createdBy: req.user._id,
      });
      await creditCase.save();
    }

    res.status(200).json({
      success: smsResult.success,
      message: smsResult.success
        ? "SMS sent successfully"
        : "Failed to send SMS",
      data: smsResult,
    });
  } catch (error) {
    console.error("Error in sendSingleCaseSMS:", error);
    res.status(500).json({
      success: false,
      message: "Server error sending SMS",
      error: error.message,
    });
  }
};

/**
 * @desc    Get import batches
 * @route   GET /api/credit-cases/import-batches
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const getImportBatches = async (req, res) => {
  try {
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

    // Get unique import batches for the user's law firm
    const batches = await CreditCase.aggregate([
      {
        $match: {
          lawFirm: userLawFirmId,
          importBatchId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$importBatchId",
          bankName: { $first: "$bankName" },
          importedAt: { $first: "$importedAt" },
          importedBy: { $first: "$importedBy" },
          totalCases: { $sum: 1 },
          totalDebt: { $sum: "$debtAmount" },
        },
      },
      {
        $sort: { importedAt: -1 },
      },
    ]);

    // Populate importedBy user details
    await CreditCase.populate(batches, {
      path: "importedBy",
      select: "firstName lastName email",
    });

    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error("Error in getImportBatches:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching import batches",
      error: error.message,
    });
  }
};

/**
 * @desc    Get cases by import batch ID
 * @route   GET /api/credit-cases/import-batch/:batchId
 * @access  Private (debt_collector, credit_head, law_firm_admin)
 */
export const getCasesByBatchId = async (req, res) => {
  try {
    const { batchId } = req.params;

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

    const cases = await CreditCase.find({
      importBatchId: batchId,
      lawFirm: userLawFirmId,
    })
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: cases,
    });
  } catch (error) {
    console.error("Error in getCasesByBatchId:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching cases",
      error: error.message,
    });
  }
};

export default {
  bulkImportCases,
  sendBulkCaseSMS,
  sendSingleCaseSMS,
  getImportBatches,
  getCasesByBatchId,
};

