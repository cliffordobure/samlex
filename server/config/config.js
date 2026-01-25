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

  // Cloudinary (Optional - for file uploads, can be replaced with S3)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // AWS S3 (Required for file uploads if using S3)
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  AWS_S3_FOLDER_PREFIX: process.env.AWS_S3_FOLDER_PREFIX || "law-firm-files",
  
  // Storage provider selection (s3 or cloudinary)
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "s3", // Default to S3

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Client
  CLIENT_URL: process.env.CLIENT_URL || "https://samlex-client.vercel.app",

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

  // Beem SMS
  BEEM_API_KEY: process.env.BEEM_API_KEY,
  BEEM_SECRET_KEY: process.env.BEEM_SECRET_KEY,
  BEEM_SOURCE_ADDR: process.env.BEEM_SOURCE_ADDR,

  // Google OAuth (for Gmail integration)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
};

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET"];

if (config.NODE_ENV === "production") {
  requiredEnvVars.push("MONGO_URI", "EMAIL_HOST", "EMAIL_USER", "EMAIL_PASS");
}

// Require storage provider credentials based on STORAGE_PROVIDER
const storageProvider = process.env.STORAGE_PROVIDER || "s3";
if (storageProvider === "s3") {
  requiredEnvVars.push(
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME"
  );
} else {
  requiredEnvVars.push(
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  );
}

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
    
    if (envVar.includes("AWS")) {
      console.error(
        "AWS S3 credentials are required for file uploads to work!"
      );
      console.error("Please add your AWS credentials to the .env file:");
      console.error("AWS_REGION=us-east-1");
      console.error("AWS_ACCESS_KEY_ID=your_access_key_id");
      console.error("AWS_SECRET_ACCESS_KEY=your_secret_access_key");
      console.error("AWS_S3_BUCKET_NAME=your-bucket-name");
    }
    process.exit(1);
  }
}

export default config;
