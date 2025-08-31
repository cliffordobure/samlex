// models/Department.js
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      maxLength: [50, "Department name cannot exceed 50 characters"],
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: false,
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, "Description cannot exceed 500 characters"],
    },
    lawFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawFirm",
      required: true,
    },
    departmentType: {
      type: String,
      enum: ["credit_collection", "legal", "custom"],
      required: true,
    },
    settings: {
      casePrefixes: {
        type: Map,
        of: String,
        default: new Map([
          ["credit_collection", "CC"],
          ["legal", "LG"],
        ]),
      },
      workflowStages: {
        type: [String],
        default: function () {
          if (this.departmentType === "credit_collection") {
            return [
              "new",
              "assigned",
              "in_progress",
              "follow_up_required",
              "escalated_to_legal",
              "resolved",
              "closed",
            ];
          } else if (this.departmentType === "legal") {
            return [
              "filed",
              "assigned",
              "under_review",
              "court_proceedings",
              "settlement",
              "resolved",
              "closed",
            ];
          }
          return ["new", "in_progress", "completed"];
        },
      },
      autoAssignment: {
        type: Boolean,
        default: false,
      },
      requireApproval: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique department code within a law firm
departmentSchema.index({ code: 1, lawFirm: 1 }, { unique: true });

// Pre-save hook to generate department code
departmentSchema.pre("save", function (next) {
  if (!this.code) {
    const codeMap = {
      credit_collection: "CC",
      legal: "LG",
      custom: "CU",
    };
    this.code = codeMap[this.departmentType] || "DP";
  }
  next();
});

export default mongoose.model("Department", departmentSchema);
