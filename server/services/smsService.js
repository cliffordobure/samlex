import AfricasTalking from 'africastalking';

// Initialize Africa's Talking
let smsClient = null;

const initializeSMS = () => {
  if (!process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME) {
    console.warn('⚠️  Africa\'s Talking credentials not found. SMS functionality will be disabled.');
    return null;
  }

  try {
    const africastalking = AfricasTalking({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME,
    });
    
    smsClient = africastalking.SMS;
    console.log('✅ SMS Service initialized successfully');
    return smsClient;
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
    if (!smsClient) {
      smsClient = initializeSMS();
      if (!smsClient) {
        throw new Error('SMS service is not configured');
      }
    }

    // Validate phone number format
    const cleanedPhone = phoneNumber.replace(/\s+/g, '');
    
    // Debug: Log phone number validation
    console.log('📞 Phone number validation:', {
      original: phoneNumber,
      cleaned: cleanedPhone,
      isValid: validatePhoneNumber(cleanedPhone)
    });
    
    const options = {
      to: [cleanedPhone],
      message: message.substring(0, 160), // SMS character limit
    };

    const result = await smsClient.send(options);
    
    // Debug: Log the full response from Africa's Talking
    console.log('📱 Single SMS Response for', cleanedPhone, ':', JSON.stringify(result, null, 2));
    
    // Check if the SMS was actually accepted by Africa's Talking
    if (result && result.SMSMessageData && result.SMSMessageData.Recipients) {
      const recipient = result.SMSMessageData.Recipients[0];
      if (recipient && recipient.status === 'Success') {
        return {
          success: true,
          data: result,
          phone: cleanedPhone,
        };
      } else {
        const errorMessage = getErrorMessage(recipient.status);
        return {
          success: false,
          error: errorMessage,
          phone: cleanedPhone,
          data: result,
        };
      }
    } else {
      return {
        success: false,
        error: 'Invalid response from SMS provider',
        phone: cleanedPhone,
        data: result,
      };
    }
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return {
      success: false,
      error: error.message,
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
    if (!smsClient) {
      smsClient = initializeSMS();
      if (!smsClient) {
        throw new Error('SMS service is not configured');
      }
    }

    // Check if we're in test mode (sandbox credentials)
    const isTestMode = process.env.AFRICASTALKING_USERNAME === 'sandbox' || 
                      process.env.AFRICASTALKING_USERNAME === 'clifford';
    
    if (isTestMode) {
      console.log('🧪 SMS Test Mode: Using sandbox credentials - SMS will not be delivered');
      console.log('📱 Test recipients:', recipients.map(r => r.phoneNumber));
      console.log('⚠️  IMPORTANT: Sandbox only works with whitelisted numbers');
      console.log('💡 To send to real numbers, use production credentials');
    }

    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      details: [],
    };

    // Process in batches to avoid rate limiting
    const BATCH_SIZE = 10;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const { phoneNumber, message } = recipient;
          
          // Clean phone number
          const cleanedPhone = phoneNumber.replace(/\s+/g, '');
          
          const options = {
            to: [cleanedPhone],
            message: message.substring(0, 160),
          };

          const result = await smsClient.send(options);
          
          // Debug: Log the full response from Africa's Talking
          console.log('📱 SMS Response for', cleanedPhone, ':', JSON.stringify(result, null, 2));
          
          // Check if the SMS was actually accepted by Africa's Talking
          if (result && result.SMSMessageData && result.SMSMessageData.Recipients) {
            const recipient = result.SMSMessageData.Recipients[0];
            if (recipient && recipient.status === 'Success') {
              results.sent++;
              results.details.push({
                phone: cleanedPhone,
                status: 'sent',
                result: result,
              });
              return { success: true, phone: cleanedPhone };
            } else {
              // SMS was rejected by Africa's Talking
              const errorMessage = getErrorMessage(recipient.status);
              results.failed++;
              results.details.push({
                phone: cleanedPhone,
                status: 'failed',
                error: errorMessage,
                result: result,
              });
              return { success: false, phone: cleanedPhone, error: errorMessage };
            }
          } else {
            // Invalid response format
            results.failed++;
            results.details.push({
              phone: cleanedPhone,
              status: 'failed',
              error: 'Invalid response from SMS provider',
              result: result,
            });
            return { success: false, phone: cleanedPhone, error: 'Invalid response from SMS provider' };
          }
        } catch (error) {
          results.failed++;
          results.details.push({
            phone: recipient.phoneNumber,
            status: 'failed',
            error: error.message,
          });
          
          return { success: false, phone: recipient.phoneNumber, error: error.message };
        }
      });

      await Promise.all(batchPromises);
      
      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      success: true,
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
 * Get user-friendly error message for Africa's Talking status codes
 * @param {string} status - Africa's Talking status code
 * @returns {string} - User-friendly error message
 */
const getErrorMessage = (status) => {
  const isTestMode = process.env.AFRICASTALKING_USERNAME === 'sandbox' || 
                    process.env.AFRICASTALKING_USERNAME === 'clifford';
  
  const errorMessages = {
    'UserInBlacklist': isTestMode 
      ? 'Phone number not whitelisted for sandbox testing. Use production credentials or add number to sandbox whitelist.'
      : 'Phone number is blacklisted or opted out of SMS',
    'InvalidPhoneNumber': 'Invalid phone number format',
    'InsufficientBalance': 'Insufficient account balance',
    'InvalidSenderId': 'Invalid sender ID',
    'InvalidMessage': 'Invalid message content',
    'InvalidRecipient': 'Invalid recipient number',
    'MessageTooLong': 'Message exceeds character limit',
    'RateLimitExceeded': 'Rate limit exceeded, please try again later',
    'ServiceUnavailable': 'SMS service temporarily unavailable',
    'NetworkError': 'Network error, please try again',
  };
  
  return errorMessages[status] || `SMS failed: ${status}`;
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

