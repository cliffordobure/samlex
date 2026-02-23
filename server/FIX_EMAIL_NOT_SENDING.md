# 🔧 Fix: Emails Not Sending When Users Are Created

## Problem

When a new user is created, they should receive an email with their login credentials, but the email is not being sent.

## Root Cause

The email service requires environment variables that are **not configured**:
- `EMAIL_HOST` - SMTP server address
- `EMAIL_USER` - Email address to send from
- `EMAIL_PASS` - Email password or app password
- `EMAIL_PORT` - SMTP port (optional, defaults to 587)

## ✅ Solution: Configure Email Environment Variables

### Step 1: Choose Your Email Provider

**Option A: Gmail (Recommended - Free)**
- Most reliable
- Requires App Password (not regular password)

**Option B: Outlook/Hotmail**
- Free
- May require app password

**Option C: SendGrid/Mailgun (Professional)**
- Better for production
- Requires account setup

### Step 2: Gmail Setup (Recommended)

#### 2.1 Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"

#### 2.2 Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Samlex" as the name
4. Click "Generate"
5. **Copy the 16-character password** (remove spaces)

#### 2.3 Set Environment Variables

**For Local Development (.env file):**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=abcdefghijklmnop  # The 16-character App Password (NO SPACES)
```

**For Production (Render/Railway/etc.):**
1. Go to your hosting platform dashboard
2. Navigate to Environment Variables
3. Add these variables:
   - `EMAIL_HOST` = `smtp.gmail.com`
   - `EMAIL_PORT` = `587`
   - `EMAIL_USER` = `your_email@gmail.com`
   - `EMAIL_PASS` = `your_16_character_app_password` (NO SPACES)

### Step 3: Verify Configuration

After setting environment variables:

1. **Restart your server** (required for env vars to load)

2. **Check server logs** on startup:
   - Should see: `✅ Email transporter configured successfully`
   - Should see: `📧 Email Host: smtp.gmail.com`
   - Should see: `📧 Email User: your_email@gmail.com`
   - Should see: `✅ Email service is ready to send emails`

3. **If you see errors:**
   - `⚠️ Email configuration is missing` → Environment variables not set
   - `❌ Email authentication failed` → Wrong password or need App Password
   - `❌ Cannot connect to email server` → Wrong EMAIL_HOST or network issue

### Step 4: Test Email Sending

**Option A: Test Script**
```bash
cd server
node scripts/testEmail.js
```

**Option B: Create a Test User**
1. Create a new user through the admin panel
2. Check server logs for email sending attempts
3. Check the user's email inbox (and spam folder)

## 🐛 Common Issues

### Issue 1: "Email configuration is missing"
**Solution:** Environment variables not set. Add them to your hosting platform.

### Issue 2: "Email authentication failed" (EAUTH error)
**Solution:** 
- For Gmail: You MUST use an App Password, not your regular password
- Make sure 2-Factor Authentication is enabled
- Remove spaces from the App Password

### Issue 3: "Cannot connect to email server" (ECONNECTION error)
**Solution:**
- Check EMAIL_HOST is correct (`smtp.gmail.com` for Gmail)
- Check EMAIL_PORT is correct (`587` for TLS)
- Check firewall/network allows outbound connections

### Issue 4: Emails go to spam
**Solution:**
- Normal for new email accounts
- Check spam/junk folder
- Consider using a professional email service (SendGrid) for production

## 📋 Quick Checklist

- [ ] Environment variables set: `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
- [ ] For Gmail: 2-Factor Authentication enabled
- [ ] For Gmail: App Password generated and used (not regular password)
- [ ] Server restarted after setting environment variables
- [ ] Server logs show "✅ Email transporter configured successfully"
- [ ] Server logs show "✅ Email service is ready to send emails"

## 🚀 After Configuration

Once configured:
1. ✅ New users will receive welcome emails with login credentials
2. ✅ Password reset emails will work
3. ✅ Case assignment notifications will be sent
4. ✅ All email features will work

## 📝 Where to Set Environment Variables

### Render.com
1. Dashboard → Your Service → Environment
2. Add variables
3. Redeploy

### Railway
1. Project → Variables
2. Add variables
3. Auto-redeploys

### Heroku
1. Settings → Config Vars
2. Add variables
3. Restart dynos

### Local Development
Create `.env` file in `server/` folder:
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 🔍 Debug Commands

Check if email is configured:
```bash
cd server
node scripts/testEmail.js
```

Check server logs when creating a user - you should see:
- `📧 About to send welcome email to: user@example.com`
- `📧 Email service ready: true`
- `✅ Email sent successfully!`

If you see errors, they will tell you exactly what's wrong!
