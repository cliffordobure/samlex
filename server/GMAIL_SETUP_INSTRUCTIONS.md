# Gmail Email Setup - Quick Fix Guide

## Current Error
```
❌ Email service verification failed:
   Error: Invalid login: 535-5.7.8 Username and Password not accepted
   Code: EAUTH
```

## This Means
Your Gmail credentials are being rejected. This happens when:
- ❌ You're using your regular Gmail password (won't work)
- ❌ 2-Factor Authentication is not enabled
- ❌ You haven't generated an App Password

## Solution: Use Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Under "Signing in to Google", click "2-Step Verification"
3. Follow the prompts to enable it

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. Select:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - **Name**: Enter "Samlex" or "Law Firm SaaS"
3. Click **Generate**
4. You'll see a 16-character password like: `abcd efgh ijkl mnop`
5. **Copy this password** (you can't see it again!)

### Step 3: Update Environment Variables

#### On Render.com:
1. Go to your service dashboard
2. Click on "Environment" tab
3. Update these variables:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=abcdefghijklmnop  (the 16-character App Password - NO SPACES)
   ```
4. Click "Save Changes"
5. **Redeploy** your service

#### On Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Update the variables (same as above)
4. Redeploy

#### On Railway:
1. Go to your project
2. Click "Variables" tab
3. Update the variables
4. Service will auto-redeploy

### Step 4: Verify
After redeploying, check your server logs. You should see:
```
✅ Email transporter configured successfully
✅ Email service is ready to send emails
```

## Important Notes

⚠️ **DO NOT use your regular Gmail password** - it will NOT work!

✅ **DO use the 16-character App Password** from Step 2

✅ **Remove spaces** from the App Password when setting EMAIL_PASS

✅ The App Password should look like: `abcdefghijklmnop` (16 characters, no spaces)

## Testing

After setting up, test by:
1. Creating a new user account
2. Check server logs for email sending
3. Check the user's email inbox (and spam folder)

## Still Not Working?

If you still see authentication errors:
1. Double-check the App Password has no spaces
2. Make sure 2-Factor Authentication is enabled
3. Try generating a new App Password
4. Verify EMAIL_USER matches the Gmail account you generated the App Password for
5. Check server logs for detailed error messages
