import dotenv from 'dotenv';
import { sendSMS } from '../services/smsService.js';

// Load environment variables
dotenv.config();

console.log('🧪 Testing SMS Service...\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('  BEEM_API_KEY:', process.env.BEEM_API_KEY ? `${process.env.BEEM_API_KEY.substring(0, 8)}...` : '❌ NOT SET');
console.log('  BEEM_SECRET_KEY:', process.env.BEEM_SECRET_KEY ? `${process.env.BEEM_SECRET_KEY.substring(0, 8)}...` : '❌ NOT SET');
console.log('  BEEM_SOURCE_ADDR:', process.env.BEEM_SOURCE_ADDR || '❌ NOT SET');
console.log('');

// Test SMS sending
const testPhoneNumber = process.argv[2] || '+254712345678'; // Default test number
const testMessage = 'Test SMS from Samlex Law Firm SaaS. If you receive this, SMS is working!';

console.log('📱 Sending test SMS...');
console.log('  To:', testPhoneNumber);
console.log('  Message:', testMessage);
console.log('');

try {
  const result = await sendSMS(testPhoneNumber, testMessage);
  
  console.log('\n📊 Result:');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n✅ SMS sent successfully!');
  } else {
    console.log('\n❌ SMS failed:', result.error);
    console.log('\n💡 Common issues:');
    console.log('  1. Check if BEEM_API_KEY and BEEM_SECRET_KEY are correct');
    console.log('  2. Verify BEEM_SOURCE_ADDR is registered and approved in Beem dashboard');
    console.log('  3. Check if you have sufficient balance in your Beem account');
    console.log('  4. Verify phone number format is correct (+254XXXXXXXXX)');
    console.log('  5. Check Beem dashboard for error details');
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
}

process.exit(0);


