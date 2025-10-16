import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

// Import middleware
import errorHandler from "./middleware/errorHandler.js";
import { accessLogger, errorLogger } from "./middleware/logger.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import devRoutes from "./routes/dev.js";
// Import routes
import authRoutes from "./routes/auth.js";
import systemOwnerRoutes from "./routes/systemOwner.js";
import lawFirmRoutes from "./routes/lawFirmRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reportsRoutes from "./routes/reports.js";
import creditCaseRoutes from "./routes/creditCaseRoutes.js";
import uploadRoutes from "./routes/upload.js";
import legalCaseRoutes from "./routes/legalCaseRoutes.js";
import notificationRoutes from "./routes/notifications.js";
import aiRoutes from "./routes/ai.js";
// import paymentRoutes from "./routes/payments.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "https://samlex-client.vercel.app",
  "https://lawfirm-saas-client.vercel.app",
  "http://localhost:5001",
  "http://localhost:5002",
  // Add more allowed origins if needed
];

const app = express();

// Trust proxy for correct client IPs behind load balancers (e.g., Render, Vercel)
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Content-Length', 'Content-Type'],
  exposedHeaders: ['Content-Length'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Compression middleware
app.use(compression());

// Rate limiting
app.use(generalLimiter);

// Logging middleware
app.use(accessLogger);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Allow embedding uploads in iframe from Vercel domains
app.use("/uploads", (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://samlex-client.vercel.app https://lawfirm-saas-client.vercel.app"
  );
  res.setHeader(
    "X-Frame-Options",
    "ALLOW-FROM https://samlex-client.vercel.app"
  );
  next();
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});
if (process.env.NODE_ENV === "development") {
  app.use("/api/dev", devRoutes);
}
// API routes
app.use("/api/auth", authRoutes);
app.use("/api/system-owner", systemOwnerRoutes);
app.use("/api/law-firms", lawFirmRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/credit-cases", creditCaseRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/legal-cases", legalCaseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
// app.use("/api/payments", paymentRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorLogger);
app.use(errorHandler);

export default app;
