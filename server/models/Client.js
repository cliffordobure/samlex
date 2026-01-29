import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxLength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxLength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
      default: null,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: "Kenya" },
    },
    dateOfBirth: {
      type: Date,
    },
    idNumber: {
      type: String,
      trim: true,
    },
    clientType: {
      type: String,
      enum: ["individual", "corporate"],
      default: "individual",
    },
    // For corporate clients
    companyName: {
      type: String,
      trim: true,
    },
    registrationNumber: {
      type: String,
      trim: true,
    },
    // Business information
    businessType: {
      type: String,
      trim: true,
    },
    // Client status
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    // Law firm association
    lawFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawFirm",
      required: true,
    },
    // Department preference (if any)
    preferredDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    // Client notes
    notes: {
      type: String,
      trim: true,
    },
    // Emergency contact
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
    // Created by user
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Last updated by
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Tags for categorization
    tags: [{
      type: String,
      trim: true,
    }],
    // Profile image
    profileImage: {
      type: String,
    },
    // Documents
    documents: [{
      name: { type: String, required: true },
      path: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }],
    // Case history
    totalCases: {
      type: Number,
      default: 0,
    },
    activeCases: {
      type: Number,
      default: 0,
    },
    completedCases: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Unique index on email and lawFirm, but allow multiple null emails
clientSchema.index({ email: 1, lawFirm: 1 }, { unique: true, sparse: true });
clientSchema.index({ lawFirm: 1 });
clientSchema.index({ clientType: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ createdAt: -1 });

// Virtual for full name
clientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name (company name for corporate, full name for individual)
clientSchema.virtual("displayName").get(function () {
  if (this.clientType === "corporate" && this.companyName) {
    return this.companyName;
  }
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware
clientSchema.pre("save", function (next) {
  // Convert company name to title case for corporate clients
  if (this.clientType === "corporate" && this.companyName) {
    this.companyName = this.companyName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  
  // Convert names to title case
  if (this.firstName) {
    this.firstName = this.firstName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
    
  if (this.lastName) {
    this.lastName = this.lastName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  
  // Normalize email to null if empty string
  if (this.email === "" || this.email === undefined) {
    this.email = null;
  }
    
  next();
});

// Static method to find clients by law firm
clientSchema.statics.findByLawFirm = function (lawFirmId, options = {}) {
  return this.find({ lawFirm: lawFirmId, ...options })
    .populate("preferredDepartment", "name code")
    .populate("createdBy", "firstName lastName email")
    .populate("updatedBy", "firstName lastName email")
    .sort({ createdAt: -1 });
};

// Static method to find active clients
clientSchema.statics.findActive = function (lawFirmId) {
  return this.find({ lawFirm: lawFirmId, status: "active" })
    .populate("preferredDepartment", "name code")
    .sort({ createdAt: -1 });
};

const Client = mongoose.model("Client", clientSchema);

export default Client;

