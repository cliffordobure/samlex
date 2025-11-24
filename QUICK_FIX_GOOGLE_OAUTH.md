# Quick Fix: Google OAuth "Access Denied" Error

## ✅ You Can Fix This RIGHT NOW (Takes 2 Minutes)

The error you're seeing is because your Google OAuth app is in **Testing** mode and your email isn't added as a test user.

### Step-by-Step Fix:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Make sure you're logged in with the account that created the OAuth app

2. **Select Your Project**
   - Click the project dropdown at the top
   - Select the project where you created the OAuth credentials

3. **Navigate to OAuth Consent Screen**
   - In the left sidebar, go to: **APIs & Services** → **OAuth consent screen**
   - Or directly: https://console.cloud.google.com/apis/credentials/consent

4. **Add Test Users**
   - Scroll down to the **"Test users"** section
   - Click the **"+ ADD USERS"** button
   - Add these email addresses (one per line or comma-separated):
     ```
     cliffordobure98@gmail.com
     cliffobure@gmail.com
     ```
   - Click **"SAVE"**

5. **Try Again**
   - Go back to your newsletter page
   - Click "Connect Gmail" again
   - It should work now! ✅

## Why This Happens

- Google OAuth apps start in **Testing** mode for security
- In Testing mode, only explicitly added test users can access the app
- This prevents unauthorized access during development

## Alternative Solutions

### Option 1: Keep Testing Mode (Recommended for Now)
- ✅ Quick fix (2 minutes)
- ✅ Works immediately
- ✅ Good for development/testing
- ❌ Need to manually add each user

### Option 2: Publish Your App (For Production)
If you want ANY user to access it:

1. Go to **OAuth consent screen**
2. Click **"PUBLISH APP"** button
3. Fill out the verification form
4. Wait for Google's review (can take 3-7 days)
5. Once approved, anyone can use it

**Note:** Publishing may require additional verification if you're using sensitive scopes like Gmail.

### Option 3: Use Internal App Type (Best for G Suite/Workspace)
If you have Google Workspace:

1. Go to **OAuth consent screen**
2. Change **User Type** from "External" to **"Internal"**
3. Only users in your Google Workspace organization can use it
4. No verification needed!

## Current Status

Based on your error, your app is currently:
- ✅ Created and configured
- ✅ OAuth credentials set up
- ❌ In Testing mode
- ❌ No test users added yet

**Fix:** Just add your email as a test user (steps above) and you're done!

## Still Having Issues?

If you still get errors after adding test users:

1. **Check the email matches exactly** - Must be the exact email you're using to sign in
2. **Wait 1-2 minutes** - Changes can take a moment to propagate
3. **Clear browser cache** - Sometimes helps
4. **Check redirect URI** - Make sure it matches exactly:
   - `https://samlex-client.vercel.app/admin/newsletter/auth/callback`
5. **Verify client ID** - Make sure the client ID in your `.env` matches the one in Google Cloud Console

## Need Help?

If you're stuck, check:
- The full setup guide: `NEWSLETTER_SETUP.md`
- Google Cloud Console: https://console.cloud.google.com/
- Google OAuth Documentation: https://developers.google.com/identity/protocols/oauth2

