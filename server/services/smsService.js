import axios from 'axios';

// Beem SMS Configuration
const BEEM_API_URL = 'https://apisms.beem.africa/v1/send';
let beemConfig = null;

const initializeSMS = () => {
  if (!process.env.BEEM_API_KEY || !process.env.BEEM_SECRET_KEY || !process.env.BEEM_SOURCE_ADDR) {
    console.warn('⚠️  Beem SMS credentials not found. SMS functionality will be disabled.');
    return null;
  }

  try {
    beemConfig = {
      apiKey: process.env.BEEM_API_KEY,
      secretKey: process.env.BEEM_SECRET_KEY,
      sourceAddr: process.env.BEEM_SOURCE_ADDR,
    };
    
    console.log('✅ Beem SMS Service initialized successfully');
    return beemConfig;
  } catch (error) {
    console.error('❌ Failed to initialize SMS service:', error);
    return null;
  }
};

/**
 * Send a single SMS
 * @param {string} phoneNumber - Recipient phone number (format: +254...)
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - SMS sending result
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    if (!beemConfig) {
      beemConfig = initializeSMS();
      if (!beemConfig) {
        throw new Error('SMS service is not configured');
      }
    }

    // Validate phone number format
    const cleanedPhone = formatPhoneNumber(phoneNumber);
    
    // Debug: Log phone number validation
    console.log('📞 Phone number validation:', {
      original: phoneNumber,
      cleaned: cleanedPhone,
      isValid: validatePhoneNumber(cleanedPhone)
    });
    
    if (!validatePhoneNumber(cleanedPhone)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        phone: cleanedPhone,
      };
    }

    // Prepare Beem API request
    const requestData = {
      source_addr: beemConfig.sourceAddr,
      schedule_time: '',
      message: message.substring(0, 160), // SMS character limit
      recipients: [
        {
          recipient_id: 1,
          dest_addr: cleanedPhone.replace('+', ''), // Beem expects numbers without +
        }
      ]
    };

    // Create Basic Auth header
    const auth = Buffer.from(`${beemConfig.apiKey}:${beemConfig.secretKey}`).toString('base64');

    const response = await axios.post(BEEM_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
    });
    
    // Debug: Log the full response from Beem
    console.log('📱 Single SMS Response for', cleanedPhone, ':', JSON.stringify(response.data, null, 2));
    
    // Check if the SMS was successfully sent
    if (response.data && response.data.successful === true) {
      return {
        success: true,
        data: response.data,
        phone: cleanedPhone,
      };
    } else {
      const errorMessage = response.data?.message || 'Failed to send SMS';
      return {
        success: false,
        error: errorMessage,
        phone: cleanedPhone,
        data: response.data,
      };
    }
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to send SMS';
    return {
      success: false,
      error: errorMessage,
      phone: phoneNumber,
    };
  }
};

/**
 * Send bulk SMS to multiple recipients
 * @param {Array} recipients - Array of {phoneNumber, message, debtorName, debtAmount}
 * @returns {Promise<Object>} - Bulk SMS sending results
 */
export const sendBulkSMS = async (recipients) => {
  try {
    if (!beemConfig) {
      beemConfig = initializeSMS();
      if (!beemConfig) {
        throw new Error('SMS service is not configured');
      }
    }

    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      details: [],
    };

    // Check if all messages are the same (can use batch API) or different (need individual sends)
    const firstMessage = recipients[0]?.message;
    const allSameMessage = recipients.every(r => r.message === firstMessage);

    if (allSameMessage) {
      // All messages are the same - use batch API (more efficient)
      const BATCH_SIZE = 50; // Beem allows up to 100 recipients per request
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        
        try {
          // Format recipients for Beem API
          const formattedRecipients = batch.map((recipient, index) => {
            const cleanedPhone = formatPhoneNumber(recipient.phoneNumber);
            return {
              recipient_id: i + index + 1,
              dest_addr: cleanedPhone.replace('+', ''), // Beem expects numbers without +
            };
          });

          // Prepare Beem API request for batch
          const requestData = {
            source_addr: beemConfig.sourceAddr,
            schedule_time: '',
            message: firstMessage.substring(0, 160),
            recipients: formattedRecipients,
          };

          // Create Basic Auth header
          const auth = Buffer.from(`${beemConfig.apiKey}:${beemConfig.secretKey}`).toString('base64');

          const response = await axios.post(BEEM_API_URL, requestData, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${auth}`,
            },
          });

          // Debug: Log the full response from Beem
          console.log('📱 Bulk SMS Response:', JSON.stringify(response.data, null, 2));

          // Process Beem response
          if (response.data && response.data.successful === true) {
            // All messages in batch were successful
            batch.forEach((recipient) => {
              const cleanedPhone = formatPhoneNumber(recipient.phoneNumber);
              results.sent++;
              results.details.push({
                phone: cleanedPhone,
                status: 'sent',
                result: response.data,
              });
            });
          } else {
            // Some or all messages failed
            batch.forEach((recipient) => {
              const cleanedPhone = formatPhoneNumber(recipient.phoneNumber);
              const errorMessage = response.data?.message || 'Failed to send SMS';
              results.failed++;
              results.details.push({
                phone: cleanedPhone,
                status: 'failed',
                error: errorMessage,
                result: response.data,
              });
            });
          }
        } catch (error) {
          // If batch request fails, mark all recipients in batch as failed
          batch.forEach((recipient) => {
            const cleanedPhone = formatPhoneNumber(recipient.phoneNumber);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send SMS';
            results.failed++;
            results.details.push({
              phone: cleanedPhone,
              status: 'failed',
              error: errorMessage,
            });
          });
          console.error('❌ Error sending batch SMS:', error);
        }
        
        // Add delay between batches to respect rate limits
        if (i + BATCH_SIZE < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } else {
      // Messages are different - send individually
      const BATCH_SIZE = 10; // Smaller batches for individual sends
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (recipient) => {
          try {
            const { phoneNumber, message } = recipient;
            const cleanedPhone = formatPhoneNumber(phoneNumber);
            
            if (!validatePhoneNumber(cleanedPhone)) {
              results.failed++;
              results.details.push({
                phone: cleanedPhone,
                status: 'failed',
                error: 'Invalid phone number format',
              });
              return { success: false, phone: cleanedPhone };
            }

            // Prepare Beem API request
            const requestData = {
              source_addr: beemConfig.sourceAddr,
              schedule_time: '',
              message: message.substring(0, 160),
              recipients: [
                {
                  recipient_id: 1,
                  dest_addr: cleanedPhone.replace('+', ''),
                }
              ]
            };

            // Create Basic Auth header
            const auth = Buffer.from(`${beemConfig.apiKey}:${beemConfig.secretKey}`).toString('base64');

            const response = await axios.post(BEEM_API_URL, requestData, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
              },
            });

            // Check if SMS was successfully sent
            if (response.data && response.data.successful === true) {
              results.sent++;
              results.details.push({
                phone: cleanedPhone,
                status: 'sent',
                result: response.data,
              });
              return { success: true, phone: cleanedPhone };
            } else {
              const errorMessage = response.data?.message || 'Failed to send SMS';
              results.failed++;
              results.details.push({
                phone: cleanedPhone,
                status: 'failed',
                error: errorMessage,
                result: response.data,
              });
              return { success: false, phone: cleanedPhone, error: errorMessage };
            }
          } catch (error) {
            const cleanedPhone = formatPhoneNumber(recipient.phoneNumber);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send SMS';
            results.failed++;
            results.details.push({
              phone: cleanedPhone,
              status: 'failed',
              error: errorMessage,
            });
            return { success: false, phone: cleanedPhone, error: errorMessage };
          }
        });

        await Promise.all(batchPromises);
        
        // Add delay between batches to respect rate limits
        if (i + BATCH_SIZE < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    return {
      success: results.sent > 0,
      ...results,
    };
  } catch (error) {
    console.error('❌ Error sending bulk SMS:', error);
    return {
      success: false,
      error: error.message,
      total: recipients.length,
      sent: 0,
      failed: recipients.length,
    };
  }
};

/**
 * Generate SMS message template for debt collection
 * @param {string} debtorName - Name of the debtor
 * @param {number} debtAmount - Amount owed
 * @param {string} bankName - Name of the creditor/bank
 * @param {string} currency - Currency (default: KES)
 * @returns {string} - Formatted SMS message
 */
export const generateDebtCollectionMessage = (debtorName, debtAmount, bankName, currency = 'KES') => {
  const formattedAmount = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
  }).format(debtAmount);

  return `Dear ${debtorName}, this is a reminder that you have an outstanding debt of ${formattedAmount} with ${bankName}. Please contact us to arrange payment. Thank you.`;
};

/**
 * Get user-friendly error message for Beem SMS error codes
 * @param {string} error - Beem error message or code
 * @returns {string} - User-friendly error message
 */
const getErrorMessage = (error) => {
  const errorMessages = {
    'Invalid phone number': 'Invalid phone number format',
    'Insufficient balance': 'Insufficient account balance',
    'Invalid sender ID': 'Invalid sender ID',
    'Invalid message': 'Invalid message content',
    'Invalid recipient': 'Invalid recipient number',
    'Message too long': 'Message exceeds character limit',
    'Rate limit exceeded': 'Rate limit exceeded, please try again later',
    'Service unavailable': 'SMS service temporarily unavailable',
    'Network error': 'Network error, please try again',
    'Authentication failed': 'Invalid API credentials',
    'Blacklisted': 'Phone number is blacklisted or opted out of SMS',
  };
  
  // Try to match error message
  for (const [key, value] of Object.entries(errorMessages)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return error || 'Failed to send SMS';
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const validatePhoneNumber = (phoneNumber) => {
  // Kenya phone number validation (supports +254 and 07/01 formats)
  const cleanedPhone = phoneNumber.replace(/\s+/g, '');
  // Updated pattern: +254/254/0 + 1 or 7 + 8 digits (total 12 digits for +254, 11 for 254, 10 for 0)
  const kenyanPattern = /^(\+254|254|0)[17]\d{8}$/;
  
  const isValid = kenyanPattern.test(cleanedPhone);
  
  // Debug: Log validation details
  console.log('📞 Phone validation:', {
    phone: cleanedPhone,
    pattern: kenyanPattern.toString(),
    isValid: isValid,
    length: cleanedPhone.length
  });
  
  return isValid;
};

/**
 * Format phone number to international format
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number (+254...)
 */
export const formatPhoneNumber = (phoneNumber) => {
  let cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // If starts with 0, replace with +254
  if (cleaned.startsWith('0')) {
    cleaned = '+254' + cleaned.substring(1);
  }
  // If starts with 254 but no +, add +
  else if (cleaned.startsWith('254')) {
    cleaned = '+' + cleaned;
  }
  // If doesn't start with +254, assume it's missing country code
  else if (!cleaned.startsWith('+254')) {
    cleaned = '+254' + cleaned;
  }
  
  return cleaned;
};

// Initialize the SMS service on module load
initializeSMS();

export default {
  sendSMS,
  sendBulkSMS,
  generateDebtCollectionMessage,
  validatePhoneNumber,
  formatPhoneNumber,
};

