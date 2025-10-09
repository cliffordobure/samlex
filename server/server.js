import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";
import connectDB from "./config/database.js";
import config from "./config/config.js";
import { createServer } from "http";

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

// Connect to database
connectDB();
  
// Create HTTP server
const server = createServer(app);

// Allow CORS for your client
const io = new SocketIOServer(server, {
  cors: { 
    origin: ["https://samlex-client.vercel.app", "http://localhost:5001", "http://localhost:5002"],
    methods: ["*"], // Allow all HTTP methods
    credentials: true,
  },
});

// Make io available globally (optional, but useful)
app.set("io", io);

// Listen for connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join law firm room for notifications
  socket.on("join-law-firm", (lawFirmId) => {
    socket.join(`lawfirm-${lawFirmId}`);
    console.log(`User ${socket.id} joined law firm room: ${lawFirmId}`);
  });

  // Leave law firm room
  socket.on("leave-law-firm", (lawFirmId) => {
    socket.leave(`lawfirm-${lawFirmId}`);
    console.log(`User ${socket.id} left law firm room: ${lawFirmId}`);
  });

  // Join department room
  socket.on("join-department", (departmentId) => {
    socket.join(`department-${departmentId}`);
    console.log(`User ${socket.id} joined department room: ${departmentId}`);
  });

  // Handle case updates
  socket.on("case-update", (data) => {
    // Broadcast to law firm members
    socket.to(`lawfirm-${data.lawFirm}`).emit("case-updated", data);
  });

  // Handle new notifications
  socket.on("send-notification", (notification) => {
    // Send to specific user or broadcast to law firm
    if (notification.recipient) {
      socket
        .to(`user-${notification.recipient}`)
        .emit("new-notification", notification);
    } else if (notification.lawFirm) { 
      socket
        .to(`lawfirm-${notification.lawFirm}`)
        .emit("new-notification", notification);
    }
  });  

  socket.on("join-case", (caseId) => {
    socket.join(`case-${caseId}`);
    console.log(`User ${socket.id} joined case room: ${caseId}`);
  });

  socket.on("leave-case", (caseId) => {
    socket.leave(`case-${caseId}`);
    console.log(`User ${socket.id} left case room: ${caseId}`);
  });

  // Handle legal case comments
  socket.on("legalCaseCommented", (data) => {
    // Broadcast to all users in the case room
    socket.to(`case-${data.caseId}`).emit("legalCaseCommented", data.comment);
    console.log(`Legal case comment broadcasted for case: ${data.caseId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
  console.error(err.stack);

  // Close server gracefully
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
  });
});

export default server;
