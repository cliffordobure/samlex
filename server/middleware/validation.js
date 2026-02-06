import { body, param, query, validationResult } from "express-validator";

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Common validation rules
export const validateEmail = body("email")
  .isEmail()
  .normalizeEmail()
  .withMessage("Please provide a valid email");

export const validatePassword = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/)
  .withMessage(
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. !@#$%^&*)."
  );

export const validateName = (field) =>
  body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage(`${field} must contain only letters and spaces`);

export const validateObjectId = (field) =>
  param(field).isMongoId().withMessage(`Invalid ${field} format`);

export const validatePhoneNumber = body("phoneNumber")
  .optional()
  .isMobilePhone()
  .withMessage("Please provide a valid phone number");

// Law firm validation
export const validateLawFirm = [
  body("firmName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Firm name must be between 2 and 100 characters"),
  validateEmail.withMessage("Please provide a valid firm email"),
  body("firmPhone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  body("address.city")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("City name cannot exceed 50 characters"),
  body("address.country")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Country name cannot exceed 50 characters"),
];

// User validation
export const validateUser = [
  validateName("firstName"),
  validateName("lastName"),
  validateEmail,
  body("role")
    .isIn([
      "law_firm_admin",
      "credit_head",
      "debt_collector",
      "legal_head",
      "advocate",
      "receptionist",
      "client",
    ])
    .withMessage("Invalid role specified"),
  validatePhoneNumber,
];

// Case validation
export const validateCreditCase = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Case title must be between 5 and 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Case description must be at least 10 characters if provided"),
  body("debtorName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Debtor name must be between 2 and 100 characters"),
  body("debtAmount")
    .optional()
    .isNumeric()
    .custom((value) => {
      if (value !== undefined && value !== null && value !== '') {
        return value > 0;
      }
      return true;
    })
    .withMessage("Debt amount must be a positive number if provided"),
  body("caseReference")
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage("Case reference must be between 5 and 50 characters"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid priority level"),
];

export const validateLegalCase = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Case title must be between 5 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Case description must be at least 10 characters"),
  body("caseType")
    .isIn([
      "civil",
      "criminal",
      "corporate",
      "family",
      "property",
      "labor",
      "debt_collection",
      "other",
    ])
    .withMessage("Invalid case type"),
  body("caseReference")
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage("Case reference must be between 5 and 50 characters"),
  body("filingFee.amount")
    .isNumeric()
    .custom((value) => value > 0)
    .withMessage("Filing fee must be a positive number"),
];
