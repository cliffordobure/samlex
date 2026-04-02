import mongoose from "mongoose";

const firmExpenseSchema = new mongoose.Schema(
  {
    lawFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawFirm",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "KES",
      enum: ["KES", "USD", "EUR", "GBP"],
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    ledgerAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LedgerAccount",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "check", "mobile_money", "card", "other"],
      default: "bank_transfer",
    },
    reference: {
      type: String,
      trim: true,
    },
    vendor: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

firmExpenseSchema.index({ lawFirm: 1, expenseDate: -1 });

export default mongoose.model("FirmExpense", firmExpenseSchema);
