import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "court_date",
        "mentioning_date",
        "hearing_date",
        "case_assigned",
        "case_reassigned",
        "task_reminder",
        "daily_summary",
        "system",
        "payment_status_updated",
        "payment_due_reminder",
        "follow_up_reminder",
        "promised_payment_added",
      ],
      default: "system",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    relatedCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LegalCase",
    },
    relatedCreditCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreditCase",
    },
    eventDate: {
      type: Date,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isEmailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, eventDate: 1 });
notificationSchema.index({ isEmailSent: 1, eventDate: 1 });

export default mongoose.model("Notification", notificationSchema);
