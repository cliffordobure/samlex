import mongoose from "mongoose";
import CaseNumberCounter from "./CaseNumberCounter.js";

const noteSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    followUpDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const promisedPaymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Promised amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "KES",
      enum: ["KES", "USD", "EUR", "GBP"],
    },
    promisedDate: {
      type: Date,
      required: [true, "Promised payment date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paidAt: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const creditCaseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Case title is required"],
      trim: true,
      maxLength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    lawFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawFirm",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: false,
    },
    debtorName: {
      type: String,
      required: [true, "Debtor name is required"],
      trim: true,
    },
    debtorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    debtorContact: {
      type: String,
      trim: true,
    },
    creditorName: {
      type: String,
      trim: true,
    },
    creditorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    creditorContact: {
      type: String,
      trim: true,
    },
    debtAmount: {
      type: Number,
      required: false,
      min: [0, "Debt amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "KES",
      enum: ["KES", "USD", "EUR", "GBP"],
    },
    status: {
      type: String,
      enum: [
        "new",
        "assigned",
        "in_progress",
        "follow_up_required",
        "escalated_to_legal",
        "resolved",
        "closed",
      ],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    notes: [noteSchema],
    promisedPayments: [promisedPaymentSchema],
    documents: [{ type: String }],
    escalatedToLegal: {
      type: Boolean,
      default: false,
    },
    escalationDate: {
      type: Date,
    },
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    escalationPayment: {
      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "confirmed", "failed"],
        default: "pending",
      },
      amount: {
        type: Number,
      },
      paidAt: {
        type: Date,
      },
      confirmedAt: {
        type: Date,
      },
      confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    legalCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LegalCase",
    },
    processed: {
      type: Boolean,
      default: false,
    },
    caseReference: {
      type: String,
      required: [true, "Case reference number is required"],
      trim: true,
      unique: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    tags: {
      type: [String],
      default: [],
    },
    // Bulk import fields
    bankName: {
      type: String,
      trim: true,
    },
    importBatchId: {
      type: String,
      trim: true,
    },
    importedAt: {
      type: Date,
    },
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to set resolvedAt when status changes to resolved
creditCaseSchema.pre("save", function (next) {
  // If status is changing to "resolved" and resolvedAt is not set, set it to now
  if (this.isModified("status")) {
    if (this.status === "resolved" && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    // If status is changing away from "resolved", clear resolvedAt
    if (this.status !== "resolved" && this.resolvedAt) {
      this.resolvedAt = null;
    }
  }
  next();
});

// Pre-save hook to generate case number (must be after resolvedAt hook)
creditCaseSchema.pre("save", async function (next) {
  try {
    // Only generate case number if it doesn't already exist
    if (this.caseNumber) {
      this.lastActivity = new Date();
      return next();
    }

    if (!this.lawFirm || !this.department) {
      // Fallback: generate a simple case number with timestamp to ensure uniqueness
      this.caseNumber = "CC-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
      this.lastActivity = new Date();
      return next();
    }

    const year = new Date().getFullYear();
    const department = await mongoose
      .model("Department")
      .findById(this.department);
    const lawFirm = await mongoose.model("LawFirm").findById(this.lawFirm);

    if (!lawFirm || !department) {
      return next(new Error("Law Firm or Department not found"));
    }

    const prefix = `${lawFirm.firmCode || "CC"}-${department.code || "CC"}`;

    // Check if counter exists, if not, initialize it based on existing cases
    const existingCounter = await CaseNumberCounter.findOne({
      year: year,
      prefix: prefix,
      lawFirm: this.lawFirm,
      department: this.department,
      escalated: false,
    });

    // If counter doesn't exist, find the highest existing case number and set counter accordingly
    if (!existingCounter) {
      const existingCases = await this.constructor.find({
        lawFirm: this.lawFirm,
        department: this.department,
        caseNumber: { $regex: `^${prefix}-${year}-` },
      }).sort({ caseNumber: -1 }).limit(1);

      let initialSequence = 0;
      if (existingCases.length > 0) {
        // Extract sequence number from the highest case number
        const lastCaseNumber = existingCases[0].caseNumber;
        const match = lastCaseNumber.match(new RegExp(`^${prefix}-${year}-(\\d+)$`));
        if (match) {
          initialSequence = parseInt(match[1], 10);
        }
      }

      // Create counter with the next sequence number
      await CaseNumberCounter.findOneAndUpdate(
        {
          year: year,
          prefix: prefix,
          lawFirm: this.lawFirm,
          department: this.department,
          escalated: false,
        },
        {
          sequence: initialSequence,
          year: year,
          prefix: prefix,
          lawFirm: this.lawFirm,
          department: this.department,
          escalated: false,
        },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    // Use atomic findAndModify to get the next sequence number
    // This prevents race conditions when multiple cases are created simultaneously
    const counter = await CaseNumberCounter.findOneAndUpdate(
      {
        year: year,
        prefix: prefix,
        lawFirm: this.lawFirm,
        department: this.department,
        escalated: false,
      },
      { $inc: { sequence: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    this.caseNumber = `${prefix}-${year}-${counter.sequence
      .toString()
      .padStart(4, "0")}`;

    // Safety check: verify the case number doesn't already exist
    // This handles edge cases where the counter might have been reset or corrupted
    let maxRetries = 5;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      const existingCase = await this.constructor.findOne({
        caseNumber: this.caseNumber,
        _id: { $ne: this._id }, // Exclude current document if updating
      });

      if (!existingCase) {
        // Case number is unique, we're good
        break;
      }

      console.warn(`Duplicate case number detected: ${this.caseNumber}. Retrying with incremented sequence... (Attempt ${retryCount + 1}/${maxRetries})`);
      
      // Increment the counter and generate a new case number
      const retryCounter = await CaseNumberCounter.findOneAndUpdate(
        {
          year: year,
          prefix: prefix,
          lawFirm: this.lawFirm,
          department: this.department,
          escalated: false,
        },
        { $inc: { sequence: 1 } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );
      
      this.caseNumber = `${prefix}-${year}-${retryCounter.sequence
        .toString()
        .padStart(4, "0")}`;
      
      retryCount++;
    }

    // If we still have a duplicate after retries, use a fallback with timestamp
    if (retryCount >= maxRetries) {
      console.error(`Failed to generate unique case number after ${maxRetries} retries. Using fallback.`);
      this.caseNumber = `${prefix}-${year}-${Date.now().toString().slice(-4)}`;
    }

    this.lastActivity = new Date();
    next();
  } catch (error) {
    console.error("Error in CreditCase pre-save hook:", error);
    next(error);
  }
});

// Update lastActivity on note addition
creditCaseSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastActivity: new Date() });
  next();
});

export default mongoose.model("CreditCase", creditCaseSchema);
