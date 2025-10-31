import mongoose from "mongoose";

const legalCaseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      unique: true,
      required: false, // Will be generated in pre-save hook
    },
    title: {
      type: String,
      required: [true, "Case title is required"],
      trim: true,
      maxLength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Case description is required"],
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
      required: false, // Made optional to handle escalated cases
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: false, // Made optional to handle escalated cases without clients
    },
    caseType: {
      type: String,
      enum: [
        "civil",
        "criminal",
        "corporate",
        "family",
        "property",
        "labor",
        "debt_collection",
        "other",
      ],
      required: true,
    },
    caseReference: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "pending_assignment",
        "filed",
        "assigned",
        "under_review",
        "court_proceedings",
        "settlement",
        "resolved",
        "closed",
      ],
      default: "pending_assignment",
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
      required: true,
    },
    filingFee: {
      amount: {
        type: Number,
        required: true,
        min: [0, "Filing fee cannot be negative"],
      },
      currency: {
        type: String,
        default: "KES",
        enum: ["KES", "USD", "EUR", "GBP"],
      },
      paid: {
        type: Boolean,
        default: false,
      },
      paidAt: {
        type: Date,
      },
      paymentId: {
        type: String,
      },
    },
    notes: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
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
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    documents: [
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
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    courtDetails: {
      courtName: { type: String, trim: true },
      courtLocation: { type: String, trim: true },
      judgeAssigned: { type: String, trim: true },
      courtDate: { type: Date },
      courtRoom: { type: String, trim: true },
      // New fields for court dates
      nextHearingDate: { type: Date },
      mentioningDate: { type: Date },
      hearingNotes: { type: String, trim: true },
      adjournmentReason: { type: String, trim: true },
    },
    opposingParty: {
      name: { type: String, trim: true },
      lawyer: { type: String, trim: true },
      contact: {
        email: { type: String, lowercase: true },
        phone: { type: String, trim: true },
      },
    },
    escalatedFrom: {
      creditCaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CreditCase",
      },
      escalationFee: {
        type: Number,
        min: [0, "Escalation fee cannot be negative"],
      },
      escalationDate: {
        type: Date,
      },
    },
    dueDate: {
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
    requiredDocuments: {
      type: [String],
      default: function () {
        // Default required documents for legal cases
        return [
          "demand_letter",
          "payment_proof",
          "debtor_response",
          "escalation_authorization",
        ];
      },
    },
    missingDocuments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Add a counter schema for atomic case number generation
const caseNumberCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 1 },
  year: { type: Number, required: true },
  prefix: { type: String, required: true },
  lawFirm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LawFirm",
    required: true,
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  escalated: { type: Boolean, default: false },
});

const CaseNumberCounter = mongoose.model(
  "CaseNumberCounter",
  caseNumberCounterSchema
);

// Pre-save hook to generate case number
legalCaseSchema.pre("save", async function (next) {
  try {
    // Only generate case number if it doesn't already exist
    if (this.caseNumber) {
      return next();
    }

    const year = new Date().getFullYear();
    const lawFirm = await mongoose.model("LawFirm").findById(this.lawFirm);

    if (!lawFirm) {
      return next(new Error("Law Firm not found"));
    }

    // Handle escalated cases (no department required)
    if (this.escalatedFrom && this.escalatedFrom.creditCaseId) {
      // For escalated cases, use a different prefix
      const prefix = `${lawFirm.firmCode || "LEG"}-ESC`;

      // Use atomic findAndModify to get the next sequence number
      const counter = await CaseNumberCounter.findOneAndUpdate(
        {
          year: year,
          prefix: prefix,
          lawFirm: this.lawFirm,
          escalated: true,
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
    } else {
      // For regular cases, require department
      const department = await mongoose
        .model("Department")
        .findById(this.department);

      if (!department) {
        return next(new Error("Department not found for regular cases"));
      }

      const prefix = `${lawFirm.firmCode || "LEG"}-${department.code || "LEG"}`;

      // Use atomic findAndModify to get the next sequence number
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
    }

    // Check if case number already exists (safety check)
    if (this.caseNumber) {
      const existingCase = await this.constructor.findOne({
        caseNumber: this.caseNumber,
        _id: { $ne: this._id }, // Exclude current document if updating
      });

      if (existingCase) {
        console.error(`Duplicate case number detected: ${this.caseNumber}`);
        return next(new Error(`Case number ${this.caseNumber} already exists`));
      }
    }

    this.lastActivity = new Date();
    next();
  } catch (error) {
    console.error("Error in LegalCase pre-save hook:", error);
    next(error);
  }
});

// Update lastActivity on note addition
legalCaseSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastActivity: new Date() });
  next();
});

export default mongoose.model("LegalCase", legalCaseSchema);
