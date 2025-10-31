import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
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
      required: [true, "Email is required"],
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: [
        "law_firm_admin",
        "credit_head",
        "debt_collector",
        "legal_head",
        "advocate",
        "receptionist",
        "client",
      ],
      required: true,
    },
    lawFirm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LawFirm",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    permissions: {
      type: [String],
      default: [],
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true, default: "Kenya" },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique email within a law firm
userSchema.index({ email: 1, lawFirm: 1 }, { unique: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  console.log("🔐 [DEBUG] ===== PASSWORD HASHING DEBUG =====");
  console.log("🔐 [DEBUG] User email:", this.email);
  console.log("🔐 [DEBUG] Original password:", this.password);
  console.log("🔐 [DEBUG] Original password length:", this.password.length);
  console.log("🔐 [DEBUG] Password type:", typeof this.password);
  console.log(
    "🔐 [DEBUG] Is password already hashed?",
    this.password.startsWith("$2a$") ||
      this.password.startsWith("$2b$") ||
      this.password.startsWith("$2y$")
  );

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  console.log("🔐 [DEBUG] Generated salt:", salt);
  console.log("🔐 [DEBUG] Hashed password:", this.password);
  console.log("🔐 [DEBUG] Hashed password length:", this.password.length);
  console.log("🔐 [DEBUG] ===== END PASSWORD HASHING DEBUG =====");

  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  console.log("🔐 [DEBUG] ===== PASSWORD COMPARISON DEBUG =====");
  console.log("🔐 [DEBUG] User email:", this.email);
  console.log("🔐 [DEBUG] Candidate password:", candidatePassword);
  console.log(
    "🔐 [DEBUG] Candidate password length:",
    candidatePassword.length
  );
  console.log("🔐 [DEBUG] Candidate password type:", typeof candidatePassword);
  console.log("🔐 [DEBUG] Stored password hash:", this.password);
  console.log("🔐 [DEBUG] Stored password hash length:", this.password.length);
  console.log("🔐 [DEBUG] Stored password type:", typeof this.password);
  console.log(
    "🔐 [DEBUG] Is stored password a hash?",
    this.password.startsWith("$2a$") ||
      this.password.startsWith("$2b$") ||
      this.password.startsWith("$2y$")
  );

  const result = await bcrypt.compare(candidatePassword, this.password);

  console.log("🔐 [DEBUG] Bcrypt comparison result:", result);
  console.log("🔐 [DEBUG] ===== END PASSWORD COMPARISON DEBUG =====");

  return result;
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for full address
userSchema.virtual("fullAddress").get(function () {
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(", ");
});

export default mongoose.model("User", userSchema);
