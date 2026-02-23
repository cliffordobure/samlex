# 🚨 Quick Fix: Emails Not Sending

## The Problem

Emails aren't being sent because **email environment variables are not configured**.

## ✅ Quick Solution (5 Minutes)

### Step 1: Set Up Gmail App Password

1. **Enable 2-Factor Authentication:**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" → "Other (Custom name)" → Enter "Samlex"
   - Click "Generate"
   - **Copy the 16-character password** (remove spaces)

### Step 2: Add Environment Variables

**If using Render/Railway/Heroku:**
1. Go to your hosting dashboard
2. Environment Variables section
3. Add these 4 variables:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

**If using local development:**
Create/update `server/.env` file:
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

### Step 3: Restart Server

**Important:** Restart your server after adding environment variables!

### Step 4: Verify

Check server logs on startup - you should see:
- ✅ `Email transporter configured successfully`
- ✅ `Email service is ready to send emails`

If you see errors, they'll tell you exactly what's wrong!

## 🧪 Test Email

Run this to test:
```bash
cd server
node scripts/testEmail.js
```

## ✅ After Setup

Once configured:
- ✅ New users receive welcome emails with login credentials
- ✅ Password reset emails work
- ✅ All email notifications work

## ⚠️ Important Notes

- **Gmail requires App Password** (not your regular password)
- **Remove spaces** from the App Password
- **Restart server** after setting environment variables
- Check **spam folder** - emails might go there initially

See `FIX_EMAIL_NOT_SENDING.md` for detailed instructions and troubleshooting.
