# 📱 SMS Troubleshooting Guide - Beem Africa

## 🚨 Problem: All SMS are Failing

If you're seeing 6 failed SMS in your Beem dashboard, here are the most common causes and solutions:

## ✅ Step 1: Check Environment Variables

Make sure these are set in your `.env` file (or production environment):

```bash
BEEM_API_KEY=your_actual_api_key
BEEM_SECRET_KEY=your_actual_secret_key
BEEM_SOURCE_ADDR=your_sender_id
```

**Important:** 
- These must be your **actual** Beem credentials, not placeholders
- Get them from: https://engage.beem.africa → API Setup

## ✅ Step 2: Verify Sender ID (Source Address)

The `BEEM_SOURCE_ADDR` must be:
- **Registered** in your Beem account
- **Approved** by Beem (can take 24-48 hours)
- **Alphanumeric** (max 11 characters) or **Numeric** (max 15 digits)

**Common Issues:**
- Sender ID not registered → SMS will fail
- Sender ID pending approval → SMS will fail
- Invalid format → SMS will fail

**To Check:**
1. Go to Beem Dashboard → API Setup
2. Check your registered Sender IDs
3. Ensure the one you're using is "Active" or "Approved"

## ✅ Step 3: Check Account Balance

**Error Code 103** = Insufficient balance

1. Go to Beem Dashboard → Purchases
2. Check your SMS balance
3. Top up if needed

## ✅ Step 4: Verify API Credentials

**Error Code 102** = Authentication failed

1. Go to Beem Dashboard → API Setup
2. Verify your API Key and Secret Key match what's in your `.env`
3. Make sure there are no extra spaces or quotes
4. Regenerate API keys if needed

## ✅ Step 5: Check Phone Number Format

**Error Code 105** = Invalid phone number format

Phone numbers must be:
- Kenyan format: `+254712345678` or `254712345678` or `0712345678`
- Must start with 0, 254, or +254
- Must be 10 digits after country code (excluding leading 0)

**Test with:** `+254712345678` (replace with a real number for testing)

## ✅ Step 6: Check Server Logs

Run the test script to see detailed error messages:

```bash
cd server
node scripts/testSMS.js +254712345678
```

This will show you:
- Exact error codes from Beem
- What's wrong with the request
- Detailed response from Beem API

## ✅ Step 7: Verify API Endpoint

The current endpoint is: `https://apisms.beem.africa/v1/send`

If this doesn't work, check:
1. Beem API documentation for the correct endpoint
2. Your Beem account type (some accounts use different endpoints)
3. Contact Beem support if endpoint seems wrong

## ✅ Step 8: Check Message Content

**Error Code 106** = Message too long

- Plain text: Max 160 characters
- Unicode (emojis, special chars): Max 70 characters

## 🔍 Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 101 | Invalid request parameters | Check request format |
| 102 | Authentication failed | Verify API credentials |
| 103 | Insufficient balance | Top up your account |
| 104 | Invalid sender ID | Register/approve sender ID |
| 105 | Invalid phone number | Check phone format |
| 106 | Message too long | Shorten message |
| 107 | Rate limit exceeded | Wait and retry |

## 🧪 Testing Steps

1. **Test with a known good number:**
   ```bash
   cd server
   node scripts/testSMS.js +254712345678
   ```

2. **Check server logs** when sending SMS:
   - Look for `📤 Sending SMS Request:` logs
   - Look for `📱 Single SMS Response:` logs
   - Look for `❌ SMS Send Failed:` logs

3. **Check Beem Dashboard:**
   - Go to Reports → SMS Reports
   - See detailed error messages for each failed SMS

## 💡 Quick Fixes

1. **If all SMS fail immediately:**
   - Check environment variables are set
   - Verify API credentials are correct
   - Check sender ID is approved

2. **If some SMS work but others fail:**
   - Check phone number formats
   - Verify recipient numbers are valid mobile numbers
   - Check if numbers are blacklisted

3. **If SMS show as sent but not delivered:**
   - Check Beem dashboard for delivery status
   - Verify recipient phone is on and has network
   - Check if recipient has DND (Do Not Disturb) enabled

## 📞 Need Help?

1. Check Beem Dashboard → Reports for detailed error messages
2. Contact Beem Support: support@beem.africa
3. Check server logs for detailed error information


