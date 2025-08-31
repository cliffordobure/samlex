import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const lawFirmSchema = new mongoose.Schema(
  {
    firmName: {
      type: String,
      required: [true, "Firm name is required"],
      unique: true,
      trim: true,
      maxLength: [100, "Firm name cannot exceed 100 characters"],
    },
    firmCode: {
      type: String,
      unique: true,
      uppercase: true,
      required: false, // Will be generated in pre-save hook
    },
    firmEmail: {
      type: String,
      required: [true, "Firm email is required"],
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    firmType: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    registrationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Authentication fields
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    loginEmail: {
      type: String,
      unique: true,
      lowercase: true,
      required: false, // Optional alternative login email with 254 prefix
    },
    firmPhone: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
      default: null, // URL to the uploaded logo
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: "Kenya" },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["testing", "basic", "premium", "enterprise"],
        default: "testing",
      },
      planName: {
        type: String,
        trim: true,
        default: "Testing Package"
      },
      status: {
        type: String,
        enum: ["active", "suspended", "cancelled", "trial", "pending"],
        default: "trial",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        default: function () {
          // 30-day trial by default
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        },
      },
      trialEndsAt: {
        type: Date,
        default: function () {
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        },
      },
      maxUsers: {
        type: Number,
        default: 3, // Testing package default
      },
      maxCases: {
        type: Number,
        default: 50, // Testing package default
      },
      features: {
        type: [String],
        default: ["basic_reporting", "email_support"]
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed", "free"],
        default: "free"
      },
      paymentMethod: {
        type: String,
        enum: ["mpesa", "card", "bank", "cash"],
        required: false
      },
      lastPaymentDate: {
        type: Date,
        required: false
      },
      nextPaymentDate: {
        type: Date,
        required: false
      },
      amount: {
        type: Number,
        default: 0
      }
    },
    settings: {
      allowedDepartments: {
        type: [String],
        default: ["credit_collection", "legal"],
      },
      customFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map(),
      },
      paymentMethods: {
        type: [String],
        enum: ["stripe", "bank_transfer", "cash", "check"],
        default: ["stripe", "bank_transfer"],
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      timezone: {
        type: String,
        default: "Africa/Nairobi",
      },
      escalationFees: {
        caseFilingFee: {
          type: Number,
          default: 5000, // Default fee in KES
        },
        autoEscalation: {
          type: Boolean,
          default: false, // Whether to auto-escalate after payment
        },
        requireConfirmation: {
          type: Boolean,
          default: true, // Whether debt collector needs to confirm after payment
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: "law_firm",
      enum: ["law_firm"],
    },
    lastLogin: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SystemOwner",
      required: false, // Optional for public registration
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full address
lawFirmSchema.virtual("fullAddress").get(function () {
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(", ");
});

// Method to compare password
lawFirmSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Pre-save hook to generate and ensure unique firm code and hash password
lawFirmSchema.pre("save", async function (next) {
  try {
    // Hash password if it's modified
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }

    // Generate firm code if it doesn't exist
    if (!this.firmCode || this.firmCode.trim() === "") {
      const cleanName = this.firmName
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase();
      const randomSuffix = Math.random()
        .toString(36)
        .substr(2, 3)
        .toUpperCase();
      this.firmCode = (cleanName.substr(0, 3) + randomSuffix).substr(0, 6);

      // Ensure we have a valid firm code
      if (!this.firmCode || this.firmCode.length < 3) {
        this.firmCode =
          "FIRM" + Math.random().toString(36).substr(2, 2).toUpperCase();
      }
    }

    // Generate login email with 254 prefix if not provided
    if (!this.loginEmail) {
      this.loginEmail = `254${this.firmEmail}`;
    }

    // Ensure firm code uniqueness
    if (this.isNew || this.isModified("firmCode")) {
      const LawFirm = this.constructor;
      let attempts = 0;
      let isUnique = false;

      while (!isUnique && attempts < 10) {
        const existingFirm = await LawFirm.findOne({ firmCode: this.firmCode });
        if (
          !existingFirm ||
          existingFirm._id.toString() === this._id.toString()
        ) {
          isUnique = true;
        } else {
          // Generate a new unique firm code
          const cleanName = this.firmName
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase();
          const randomSuffix = Math.random()
            .toString(36)
            .substr(2, 4)
            .toUpperCase();
          this.firmCode = (cleanName.substr(0, 2) + randomSuffix).substr(0, 6);
          attempts++;
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model("LawFirm", lawFirmSchema);
