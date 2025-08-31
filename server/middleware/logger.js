import morgan from "morgan";
import fs from "fs";
import path from "path";
import config from "../config/config.js";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create write streams for different log levels
const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), {
  flags: "a",
});

const errorLogStream = fs.createWriteStream(path.join(logsDir, "error.log"), {
  flags: "a",
});

// Custom token for user ID
morgan.token("user-id", (req) => {
  return req.user ? req.user._id : "anonymous";
});

// Custom token for law firm ID
morgan.token("law-firm", (req) => {
  return req.lawFirm ? req.lawFirm._id : "none";
});

// Define log formats
const developmentFormat =
  ":method :url :status :res[content-length] - :response-time ms - User: :user-id - Firm: :law-firm";

const productionFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - User: :user-id - Firm: :law-firm';

// Configure morgan middleware
export const accessLogger =
  config.NODE_ENV === "production"
    ? morgan(productionFormat, { stream: accessLogStream })
    : morgan(developmentFormat);

// Error logger
export const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${req.method} ${req.url} - ${
    err.message
  } - User: ${req.user ? req.user._id : "anonymous"} - Firm: ${
    req.lawFirm ? req.lawFirm._id : "none"
  }\n${err.stack}\n\n`;

  errorLogStream.write(logEntry);
  next(err);
};
