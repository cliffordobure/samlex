import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "KES",
      enum: ["KES", "USD", "EUR", "GBP"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "bank_transfer", "cash", "check", "mobile_money"],
      required: true,
    },
    lawFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawFirm",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    case: {
      caseId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      caseType: {
        type: String,
        enum: ["credit", "legal"],
        required: true,
      },
      caseNumber: {
        type: String,
        required: true,
      },
    },
    purpose: {
      type: String,
      enum: [
        "filing_fee",
        "escalation_fee",
        "service_charge",
        "subscription",
        "consultation",
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Stripe specific fields
    stripePaymentIntentId: {
      type: String,
    },
    stripeClientSecret: {
      type: String,
    },
    // Bank transfer specific fields
    bankTransferDetails: {
      accountNumber: { type: String },
      bankName: { type: String },
      referenceNumber: { type: String },
    },
    // Mobile money specific fields
    mobileMoneyDetails: {
      provider: {
        type: String,
        enum: ["mpesa", "airtel_money", "orange_money"],
      },
      phoneNumber: { type: String },
      transactionId: { type: String },
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },
    processedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: {
      type: String,
    },
    refundedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate payment ID
paymentSchema.pre("save", function (next) {
  console.log("PRE-SAVE HOOK: paymentId before:", this.paymentId);
  if (!this.paymentId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.paymentId = `PAY-${timestamp}-${random}`;
  }
  console.log("PRE-SAVE HOOK: paymentId after:", this.paymentId);
  next();
});

export default mongoose.model("Payment", paymentSchema);
