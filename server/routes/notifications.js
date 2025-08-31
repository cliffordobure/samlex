import express from "express";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get user's notifications
router.get("/", getUserNotifications);

// Get unread notifications count
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.put("/:id/read", markAsRead);

// Mark all notifications as read
router.put("/mark-all-read", markAllAsRead);

// Delete a notification
router.delete("/:id", deleteNotification);

export default router;
