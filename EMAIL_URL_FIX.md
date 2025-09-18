# Email URL Fix - Production Configuration

## Problem Fixed
The email notifications were using localhost links instead of the production URL `samlex-client.vercel.app`.

## Changes Made

### 1. Updated Default CLIENT_URL Configuration
**File:** `server/config/config.js`
- Changed default CLIENT_URL from `http://localhost:3000` to `https://samlex-client.vercel.app`

### 2. Updated Notification Service
**File:** `server/services/notificationService.js`
- Updated hardcoded localhost reference in daily summary emails

### 3. Updated CORS Configuration
**File:** `server/server.js`
- Updated Socket.IO CORS origin to use `samlex-client.vercel.app`

### 4. Created Environment Configuration Template
**File:** `server/env.example`
- Created production environment template with proper CLIENT_URL

## Environment Variables Required

To ensure emails use the correct production URL, set this environment variable in your production environment:

```bash
CLIENT_URL=https://samlex-client.vercel.app
```

## Files That Use CLIENT_URL

The following files now properly reference the production URL:

1. **Email Templates** (`server/utils/emailService.js`):
   - Welcome emails
   - Case assignment notifications
   - Password reset emails
   - Payment confirmations

2. **Notification Service** (`server/services/notificationService.js`):
   - Daily summary emails
   - Dashboard links

3. **Configuration** (`server/config/config.js`):
   - Default fallback URL

## Deployment Instructions

### For Vercel/Railway/Heroku Deployment:

1. **Set Environment Variable:**
   ```bash
   CLIENT_URL=https://samlex-client.vercel.app
   ```

2. **Verify Email Configuration:**
   Make sure these environment variables are set:
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

3. **Test Email Functionality:**
   Run the email test script:
   ```bash
   cd server
   node scripts/testEmail.js
   ```

## Testing the Fix

### 1. Test Case Assignment Email
- Assign a case to a user
- Check that the email contains the correct production URL
- Verify the "View Case Details" link works

### 2. Test Welcome Email
- Create a new law firm
- Check that the welcome email contains the correct login URL

### 3. Test Daily Summary Email
- Trigger a daily summary email
- Verify the "View Dashboard" link points to production

## Additional CORS Configuration

The CORS configuration now allows both:
- `https://samlex-client.vercel.app` (your production URL)
- `https://lawfirm-saas-client.vercel.app` (backup URL)
- `http://localhost:5001` and `http://localhost:5002` (development)

## Verification Checklist

- [ ] Environment variable `CLIENT_URL` is set to `https://samlex-client.vercel.app`
- [ ] Email templates use `config.CLIENT_URL` instead of hardcoded URLs
- [ ] CORS configuration includes your production domain
- [ ] Test emails are sent with correct links
- [ ] Links in emails redirect to production site
- [ ] All email types work correctly (welcome, assignment, summary, etc.)

## Troubleshooting

If emails still contain localhost links:

1. **Check Environment Variables:**
   ```bash
   echo $CLIENT_URL
   ```

2. **Restart Server:**
   Environment variable changes require server restart

3. **Check Configuration Loading:**
   Add logging to verify config is loaded correctly:
   ```javascript
   console.log('CLIENT_URL:', config.CLIENT_URL);
   ```

4. **Verify Email Service:**
   Test email service configuration:
   ```bash
   node scripts/testEmail.js
   ```

The fix ensures all email notifications will now contain the correct production URL `https://samlex-client.vercel.app` instead of localhost links.
