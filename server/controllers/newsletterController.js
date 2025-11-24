import gmailService from '../services/gmailService.js';
import emailService from '../utils/emailService.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * @desc    Get Google OAuth authorization URL
 * @route   GET /api/newsletter/auth-url
 * @access  Private (law_firm_admin)
 */
export const getAuthUrl = async (req, res) => {
  try {
    // Only allow law firm admins
    if (!['law_firm_admin', 'law_firm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can access Gmail integration',
      });
    }

    const authUrl = gmailService.getAuthUrl();

    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL',
      error: error.message,
    });
  }
};

/**
 * @desc    Handle OAuth callback and store tokens
 * @route   GET /api/newsletter/auth/callback
 * @access  Private (law_firm_admin)
 */
export const handleAuthCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Exchange code for tokens
    const tokens = await gmailService.getTokensFromCode(code);

    // Store tokens in user's record
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'gmailTokens': {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          scope: tokens.scope,
          token_type: tokens.token_type || 'Bearer',
        },
      },
    });

    // Set credentials for immediate use
    gmailService.setCredentials(tokens);

    // Get user profile to verify connection
    const profile = await gmailService.getUserProfile();

    res.json({
      success: true,
      message: 'Gmail account connected successfully',
      data: {
        email: profile.emailAddress,
        tokens: {
          // Don't send full tokens to frontend for security
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
        },
      },
    });
  } catch (error) {
    console.error('Error handling auth callback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete authorization',
      error: error.message,
    });
  }
};

/**
 * @desc    Fetch emails from Gmail
 * @route   POST /api/newsletter/fetch-emails
 * @access  Private (law_firm_admin)
 */
export const fetchEmails = async (req, res) => {
  try {
    // Only allow law firm admins
    if (!['law_firm_admin', 'law_firm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can fetch emails',
      });
    }

    const { query, maxResults = 50, pageToken } = req.body;

    // Get user's stored tokens
    const user = await User.findById(req.user._id).select('gmailTokens');
    
    if (!user?.gmailTokens?.access_token) {
      return res.status(401).json({
        success: false,
        message: 'Gmail account not connected. Please connect your Gmail account first.',
      });
    }

    // Set credentials
    gmailService.setCredentials(user.gmailTokens);

    // Build Gmail query
    // Filter emails from credit collectors and advocates in the law firm
    const lawFirmUsers = await User.find({
      lawFirm: req.user.lawFirm._id,
      role: { $in: ['debt_collector', 'credit_head', 'advocate', 'legal_head'] },
    }).select('email');

    const userEmails = lawFirmUsers.map(u => u.email).join(' OR ');
    const gmailQuery = query || (userEmails ? `from:(${userEmails})` : '');

    // Fetch emails
    const result = await gmailService.fetchEmails({
      query: gmailQuery,
      maxResults,
      pageToken,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emails',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all clients with email addresses
 * @route   GET /api/newsletter/clients
 * @access  Private (law_firm_admin)
 */
export const getNewsletterClients = async (req, res) => {
  try {
    // Only allow law firm admins
    if (!['law_firm_admin', 'law_firm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can access client list',
      });
    }

    // Get all clients with email addresses (not just active ones)
    const clients = await Client.find({
      lawFirm: req.user.lawFirm._id,
      email: { $exists: true, $ne: '', $regex: /.+@.+\..+/ }, // Valid email format
    })
      .select('firstName lastName email companyName clientType status')
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: {
        clients,
        total: clients.length,
      },
    });
  } catch (error) {
    console.error('Error getting newsletter clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get client list',
      error: error.message,
    });
  }
};

/**
 * @desc    Compile and send newsletter to all clients
 * @route   POST /api/newsletter/send
 * @access  Private (law_firm_admin)
 */
export const sendNewsletter = async (req, res) => {
  try {
    // Only allow law firm admins
    if (!['law_firm_admin', 'law_firm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can send newsletters',
      });
    }

    const { subject, content, selectedEmailIds, clientIds } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required',
      });
    }

    // Get clients to send to
    let clients = [];
    if (clientIds && clientIds.length > 0) {
      // Send to specific clients
      clients = await Client.find({
        _id: { $in: clientIds },
        lawFirm: req.user.lawFirm._id,
        email: { $exists: true, $ne: '' },
      }).select('firstName lastName email companyName');
    } else {
      // Send to all clients
      clients = await Client.find({
        lawFirm: req.user.lawFirm._id,
        status: 'active',
        email: { $exists: true, $ne: '' },
      }).select('firstName lastName email companyName');
    }

    if (clients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No clients with email addresses found',
      });
    }

    // Send emails
    const results = {
      total: clients.length,
      sent: 0,
      failed: 0,
      details: [],
    };

    // Send in batches to avoid rate limiting
    const BATCH_SIZE = 10;
    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
      const batch = clients.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (client) => {
        try {
          // Personalize content
          const personalizedContent = content
            .replace(/{firstName}/g, client.firstName || '')
            .replace(/{lastName}/g, client.lastName || '')
            .replace(/{name}/g, `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client')
            .replace(/{companyName}/g, client.companyName || '');

          await emailService.sendEmail({
            to: client.email,
            subject: subject,
            html: personalizedContent,
            text: personalizedContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
          });

          results.sent++;
          results.details.push({
            client: `${client.firstName} ${client.lastName}`,
            email: client.email,
            status: 'sent',
          });

          return { success: true, email: client.email };
        } catch (error) {
          results.failed++;
          results.details.push({
            client: `${client.firstName} ${client.lastName}`,
            email: client.email,
            status: 'failed',
            error: error.message,
          });

          return { success: false, email: client.email, error: error.message };
        }
      });

      await Promise.all(batchPromises);

      // Add delay between batches
      if (i + BATCH_SIZE < clients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: results.sent > 0,
      message: `Newsletter sent. ${results.sent} succeeded, ${results.failed} failed.`,
      data: results,
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send newsletter',
      error: error.message,
    });
  }
};

/**
 * @desc    Check Gmail connection status
 * @route   GET /api/newsletter/status
 * @access  Private (law_firm_admin)
 */
export const getConnectionStatus = async (req, res) => {
  try {
    // Only allow law firm admins
    if (!['law_firm_admin', 'law_firm'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can check connection status',
      });
    }

    const user = await User.findById(req.user._id).select('gmailTokens');

    if (!user?.gmailTokens?.access_token) {
      return res.json({
        success: true,
        data: {
          connected: false,
          message: 'Gmail account not connected',
        },
      });
    }

    // Try to get user profile to verify connection
    try {
      gmailService.setCredentials(user.gmailTokens);
      const profile = await gmailService.getUserProfile();

      return res.json({
        success: true,
        data: {
          connected: true,
          email: profile.emailAddress,
        },
      });
    } catch (error) {
      // Token might be expired
      return res.json({
        success: true,
        data: {
          connected: false,
          message: 'Gmail connection expired. Please reconnect.',
        },
      });
    }
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection status',
      error: error.message,
    });
  }
};

