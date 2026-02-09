# Email Setup Guide

This guide will help you configure email sending for the Law Firm SaaS system.

## Problem
Emails are not being sent for:
- User account creation notifications (with password)
- Password reset emails

## Solution

### 1. Environment Variables Required

You need to set the following environment variables in your production environment (Render, Vercel, Railway, etc.):

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 2. Gmail Setup (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

#### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Samlex Law Firm SaaS" as the name
4. Click "Generate"
5. Copy the 16-character password (this is your `EMAIL_PASS`)

#### Step 3: Configure Environment Variables
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # The 16-character app password (remove spaces)
```

### 3. Outlook/Hotmail Setup

```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

**Note:** For Outlook, you may need to enable "Less secure app access" or use an app password.

### 4. Other SMTP Providers

For other email providers (SendGrid, Mailgun, etc.):

```bash
EMAIL_HOST=smtp.sendgrid.net  # or your provider's SMTP host
EMAIL_PORT=587
EMAIL_USER=apikey  # or your SMTP username
EMAIL_PASS=your_api_key_or_password
```

### 5. Testing Email Configuration

After setting up your environment variables, the system will:
1. Automatically verify the email connection on startup
2. Log detailed error messages if configuration is incorrect
3. Provide helpful error messages for common issues

### 6. Common Issues and Solutions

#### Issue: "Email authentication failed"
**Solution:** 
- Check that `EMAIL_USER` and `EMAIL_PASS` are correct
- For Gmail, make sure you're using an App Password, not your regular password
- Ensure 2-Factor Authentication is enabled (for Gmail)

#### Issue: "Cannot connect to email server"
**Solution:**
- Verify `EMAIL_HOST` is correct (e.g., `smtp.gmail.com` for Gmail)
- Check `EMAIL_PORT` (587 for TLS, 465 for SSL)
- Ensure your server/firewall allows outbound connections on the email port

#### Issue: "Email service is not configured"
**Solution:**
- Make sure all environment variables are set: `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
- Restart your server after adding environment variables
- Check server logs for configuration errors

### 7. Deployment Platforms

#### Render.com
1. Go to your service settings
2. Navigate to "Environment"
3. Add the email environment variables
4. Redeploy your service

#### Vercel
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the email environment variables
4. Redeploy your application

#### Railway
1. Go to your project settings
2. Navigate to "Variables"
3. Add the email environment variables
4. The service will automatically redeploy

### 8. Verification

After deployment, check your server logs for:
- `✅ Email transporter configured successfully`
- `✅ Email service is ready to send emails`

If you see error messages, they will indicate what needs to be fixed.

### 9. Testing

To test email functionality:
1. Create a new user account
2. Check the server logs for email sending attempts
3. Check the user's email inbox (and spam folder)
4. Try the password reset feature
5. Check logs for any errors

## Support

If emails are still not working after following this guide:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test your SMTP credentials using a tool like `telnet` or an email testing service
4. Contact your hosting provider if there are firewall/network restrictions
