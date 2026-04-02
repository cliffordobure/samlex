import mongoose from "mongoose";

const balanceSheetLineSchema = new mongoose.Schema(
  {
    lawFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawFirm",
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      enum: ["asset", "liability", "equity"],
    },
    label: {
      type: String,
      required: [true, "Line label is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    asOfDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

balanceSheetLineSchema.index({ lawFirm: 1, section: 1, sortOrder: 1 });

export default mongoose.model("BalanceSheetLine", balanceSheetLineSchema);
