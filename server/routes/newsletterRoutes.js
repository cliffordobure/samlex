import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAuthUrl,
  handleAuthCallback,
  fetchEmails,
  getNewsletterClients,
  sendNewsletter,
  getConnectionStatus,
} from '../controllers/newsletterController.js';

const router = express.Router();

// Get Google OAuth authorization URL
router.get('/auth-url', protect, getAuthUrl);

// Handle OAuth callback
router.get('/auth/callback', protect, handleAuthCallback);

// Check Gmail connection status
router.get('/status', protect, getConnectionStatus);

// Fetch emails from Gmail
router.post('/fetch-emails', protect, fetchEmails);

// Get all clients for newsletter
router.get('/clients', protect, getNewsletterClients);

// Send newsletter to clients
router.post('/send', protect, sendNewsletter);

export default router;

