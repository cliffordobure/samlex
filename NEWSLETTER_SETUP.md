# Newsletter Feature Setup Guide

## Google OAuth Setup - Fixing "Access Blocked" Error

The error you're seeing ("Access blocked: samlex-client.vercel.app has not completed the Google verification process") occurs because your Google OAuth app is in **Testing** mode and your account is not added as a test user.

### Solution 1: Add Test Users (Quick Fix for Development)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Scroll down to **Test users** section
4. Click **+ ADD USERS**
5. Add the email addresses that will use this feature:
   - `cliffordobure98@gmail.com`
   - `cliffobure@gmail.com`
   - Any other admin emails
6. Click **SAVE**

### Solution 2: Publish Your App (For Production)

If you want anyone in your organization to use it:

1. Go to **OAuth consent screen**
2. Click **PUBLISH APP**
3. Fill out the verification form (may take a few days for Google to review)
4. Once published, any user in your organization can use it

### Solution 3: Use Internal App Type (Recommended for G Suite/Workspace)

If you have Google Workspace:

1. Go to **OAuth consent screen**
2. Change **User Type** to **Internal**
3. Only users in your Google Workspace organization can use it
4. No verification needed!

## Complete Setup Steps

### 1. Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable **Gmail API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Gmail API"
   - Click **Enable**

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - **User Type**: Internal (if Workspace) or External
   - **App name**: Your Law Firm Name
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **Scopes**: Add `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/gmail.send`
4. Click **SAVE AND CONTINUE**
5. For **Test users**, add your admin email addresses
6. Create OAuth client:
   - **Application type**: Web application
   - **Name**: Newsletter Gmail Integration
   - **Authorized redirect URIs**: 
     - `https://samlex-client.vercel.app/admin/newsletter/auth/callback`
     - `http://localhost:5001/admin/newsletter/auth/callback` (for local dev)
7. Click **CREATE**
8. Copy **Client ID** and **Client Secret**

### 3. Add to Environment Variables

Add to your `server/.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://samlex-client.vercel.app/admin/newsletter/auth/callback
```

### 4. Deploy and Test

1. Deploy your updated code
2. Go to Admin Dashboard → Newsletter
3. Click "Connect Gmail"
4. Select your Google account
5. Grant permissions
6. You should be redirected back and see "Gmail Connected"

## Troubleshooting

### Error: "Access blocked"
- **Solution**: Add your email as a test user in Google Cloud Console

### Error: "Redirect URI mismatch"
- **Solution**: Make sure the redirect URI in your `.env` matches exactly what's in Google Cloud Console

### Error: "Invalid client"
- **Solution**: Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### Error: "Token expired"
- **Solution**: The system will automatically refresh tokens, but you may need to reconnect

## Security Notes

- OAuth tokens are stored securely in the database (not exposed to frontend)
- Only law firm admins can access this feature
- Gmail access is read-only and send-only (no delete/modify permissions)

