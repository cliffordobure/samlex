import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Document name is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    path: {
      type: String,
      required: [true, "File path is required"],
    },
    url: {
      type: String,
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    category: {
      type: String,
      enum: [
        "case_document",
        "evidence",
        "contract",
        "identification",
        "court_filing",
        "correspondence",
        "other",
      ],
      default: "case_document",
    },
    lawFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawFirm",
      required: true,
    },
    relatedCase: {
      caseId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      caseType: {
        type: String,
        enum: ["credit", "legal"],
        required: true,
      },
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accessLevel: {
      type: String,
      enum: ["public", "internal", "restricted"],
      default: "internal",
    },
    tags: {
      type: [String],
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastAccessed: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
documentSchema.index({ lawFirm: 1, "relatedCase.caseId": 1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });

export default mongoose.model("Document", documentSchema);
