import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,

  // Database
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/law-firm-saas",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  // Cloudinary (Required for file uploads)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Client
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || "./uploads",

  // Rate Limiting
  RATE_LIMIT_WINDOW: 60 * 60 * 1000,
  RATE_LIMIT_MAX: 10000, // requests per window

  // Security
  BCRYPT_ROUNDS: 12,

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || "your-session-secret",
};

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET"];

if (config.NODE_ENV === "production") {
  requiredEnvVars.push("MONGO_URI", "EMAIL_HOST", "EMAIL_USER", "EMAIL_PASS");
}

// Always require Cloudinary for file uploads
requiredEnvVars.push(
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
);

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    if (envVar.includes("CLOUDINARY")) {
      console.error(
        "Cloudinary credentials are required for file uploads to work!"
      );
      console.error("Please add your Cloudinary credentials to the .env file:");
      console.error("CLOUDINARY_CLOUD_NAME=your_cloud_name");
      console.error("CLOUDINARY_API_KEY=your_api_key");
      console.error("CLOUDINARY_API_SECRET=your_api_secret");
    }
    process.exit(1);
  }
}

export default config;
