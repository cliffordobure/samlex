import { google } from 'googleapis';
import axios from 'axios';

let oauth2Client = null;
let gmail = null;

/**
 * Initialize Gmail OAuth2 client
 */
export const initializeGmail = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:5001'}/admin/newsletter/auth/callback`;

  if (!clientId || !clientSecret) {
    console.warn('⚠️  Google OAuth credentials not found. Gmail integration will be disabled.');
    return null;
  }

  oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  console.log('✅ Gmail OAuth2 client initialized');
  return oauth2Client;
};

/**
 * Get Google OAuth2 authorization URL
 * @returns {string} Authorization URL
 */
export const getAuthUrl = () => {
  if (!oauth2Client) {
    oauth2Client = initializeGmail();
    if (!oauth2Client) {
      throw new Error('Gmail service is not configured');
    }
  }

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
    include_granted_scopes: true, // Include previously granted scopes
  });
};

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} Tokens (access_token, refresh_token)
 */
export const getTokensFromCode = async (code) => {
  if (!oauth2Client) {
    oauth2Client = initializeGmail();
    if (!oauth2Client) {
      throw new Error('Gmail service is not configured');
    }
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Initialize Gmail API
    gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
};

/**
 * Set OAuth2 credentials (for stored tokens)
 * @param {Object} tokens - Access and refresh tokens
 */
export const setCredentials = (tokens) => {
  if (!oauth2Client) {
    oauth2Client = initializeGmail();
    if (!oauth2Client) {
      throw new Error('Gmail service is not configured');
    }
  }

  oauth2Client.setCredentials(tokens);
  
  // Refresh token if needed
  oauth2Client.on('tokens', (newTokens) => {
    if (newTokens.refresh_token) {
      tokens.refresh_token = newTokens.refresh_token;
    }
    tokens.access_token = newTokens.access_token;
  });

  // Initialize Gmail API
  gmail = google.gmail({ version: 'v1', auth: oauth2Client });
};

/**
 * Fetch emails from Gmail
 * @param {Object} options - Query options
 * @param {string} options.query - Gmail search query (e.g., "from:user@example.com")
 * @param {number} options.maxResults - Maximum number of emails to fetch (default: 50)
 * @param {string} options.pageToken - Token for pagination
 * @returns {Promise<Object>} List of emails with metadata
 */
export const fetchEmails = async (options = {}) => {
  if (!gmail) {
    throw new Error('Gmail API not initialized. Please authenticate first.');
  }

  try {
    const {
      query = '',
      maxResults = 50,
      pageToken = null,
    } = options;

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: Math.min(maxResults, 500), // Gmail API limit
      pageToken: pageToken,
    });

    const messages = response.data.messages || [];
    
    // Fetch full message details
    const emailPromises = messages.map(async (message) => {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });

      return parseEmailMessage(fullMessage.data);
    });

    const emails = await Promise.all(emailPromises);

    return {
      emails,
      nextPageToken: response.data.nextPageToken,
      resultSizeEstimate: response.data.resultSizeEstimate,
    };
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }
};

/**
 * Parse Gmail message into readable format
 * @param {Object} message - Gmail message object
 * @returns {Object} Parsed email
 */
const parseEmailMessage = (message) => {
  const headers = message.payload.headers;
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  // Extract body content
  let body = '';
  let htmlBody = '';

  const extractBody = (part) => {
    if (part.body && part.body.data) {
      const content = Buffer.from(part.body.data, 'base64').toString('utf-8');
      if (part.mimeType === 'text/html') {
        htmlBody += content;
      } else if (part.mimeType === 'text/plain') {
        body += content;
      }
    }
    if (part.parts) {
      part.parts.forEach(extractBody);
    }
  };

  if (message.payload.parts) {
    message.payload.parts.forEach(extractBody);
  } else if (message.payload.body && message.payload.body.data) {
    const content = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    if (message.payload.mimeType === 'text/html') {
      htmlBody = content;
    } else {
      body = content;
    }
  }

  return {
    id: message.id,
    threadId: message.threadId,
    subject: getHeader('subject'),
    from: getHeader('from'),
    to: getHeader('to'),
    cc: getHeader('cc'),
    date: getHeader('date'),
    snippet: message.snippet,
    body: body || htmlBody.replace(/<[^>]*>/g, ''), // Strip HTML if no plain text
    htmlBody: htmlBody || body,
    labels: message.labelIds || [],
    internalDate: message.internalDate,
  };
};

/**
 * Get user profile information
 * @returns {Promise<Object>} User profile
 */
export const getUserProfile = async () => {
  if (!gmail) {
    throw new Error('Gmail API not initialized. Please authenticate first.');
  }

  try {
    const response = await gmail.users.getProfile({
      userId: 'me',
    });

    return response.data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
};

// Initialize on module load
initializeGmail();

const gmailService = {
  initializeGmail,
  getAuthUrl,
  getTokensFromCode,
  setCredentials,
  fetchEmails,
  getUserProfile,
};

export default gmailService;

