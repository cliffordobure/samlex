import mongoose from "mongoose";

const ledgerAccountSchema = new mongoose.Schema(
  {
    lawFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawFirm",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: "",
    },
    accountType: {
      type: String,
      required: true,
      enum: ["asset", "liability", "equity", "revenue", "expense"],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

ledgerAccountSchema.index({ lawFirm: 1, name: 1 });
ledgerAccountSchema.index({ lawFirm: 1, code: 1 });

export default mongoose.model("LedgerAccount", ledgerAccountSchema);
