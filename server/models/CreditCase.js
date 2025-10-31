import mongoose from "mongoose";

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
      required: [true, "Debt amount is required"],
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

// Pre-save hook to generate case number
creditCaseSchema.pre("save", async function (next) {
  if (!this.caseNumber) {
    if (!this.lawFirm || !this.department) {
      // Fallback: generate a simple case number
      this.caseNumber = "CASE-" + Date.now();
      return next();
    }
    const year = new Date().getFullYear();
    const department = await mongoose
      .model("Department")
      .findById(this.department);
    const lawFirm = await mongoose.model("LawFirm").findById(this.lawFirm);

    const prefix = `${lawFirm.firmCode}-${department.code}`;
    const count = await this.constructor.countDocuments({
      lawFirm: this.lawFirm,
      department: this.department,
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    });

    this.caseNumber = `${prefix}-${year}-${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }

  this.lastActivity = new Date();
  next();
});

// Update lastActivity on note addition
creditCaseSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastActivity: new Date() });
  next();
});

export default mongoose.model("CreditCase", creditCaseSchema);
