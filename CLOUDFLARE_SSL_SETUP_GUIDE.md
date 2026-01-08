# Complete Cloudflare SSL Setup Guide

This guide will help you set up **free SSL** for your EC2 backend using Cloudflare. Takes about 10-15 minutes!

---

## Step 1: Get a Free Domain (5 minutes)

### Option A: Freenom (Free .tk, .ml, .ga domains)

1. **Go to Freenom**: https://www.freenom.com/
2. **Search for a domain**:
   - Enter a name you want (e.g., "samlex-backend")
   - Click "Get it now!"
   - Select a free domain (.tk, .ml, .ga, .cf, or .gq)
   - Click "Checkout"
3. **Create account** (if you don't have one):
   - Click "Create Account" or "Sign In"
   - Complete registration
4. **Complete checkout**:
   - Select "12 Months @ FREE" (or longer if available)
   - Complete the checkout process
   - **Note your domain name** (e.g., `samlex-backend.tk`)

### Option B: Use Existing Domain
If you already have a domain, skip to Step 2.

---

## Step 2: Sign Up for Cloudflare (2 minutes)

1. **Go to Cloudflare**: https://www.cloudflare.com/
2. **Click "Sign Up"** (top right)
3. **Enter your email and password**
4. **Verify your email** (check inbox)
5. **Complete the signup process**

---

## Step 3: Add Your Site to Cloudflare (3 minutes)

1. **After logging in**, click **"Add a Site"** button
2. **Enter your domain name** (e.g., `samlex-backend.tk`)
3. **Click "Add site"**
4. **Select a plan**: Choose **"Free"** plan (click Continue)
5. **Cloudflare will scan your DNS records** (takes 30-60 seconds)
6. **Review DNS records**: You'll see existing records (if any)
   - Don't worry if it's empty - we'll add records in the next step

---

## Step 4: Get Your EC2 Public IP

You need your EC2 instance's public IP address.

1. **Go to AWS Console**: https://console.aws.amazon.com/ec2/
2. **Navigate to**: EC2 → Instances
3. **Find your instance**
4. **Copy the "Public IPv4 address"** (e.g., `34.224.51.176`)
   - **Note this IP** - you'll need it in the next step

---

## Step 5: Configure DNS in Cloudflare (5 minutes)

1. **In Cloudflare**, you should see your domain dashboard
2. **Go to "DNS"** tab (left sidebar)
3. **Add DNS Records**:

   **Record 1: Root Domain (A Record)**
   - Click **"Add record"**
   - **Type**: Select `A`
   - **Name**: Enter `@` (this means root domain)
   - **IPv4 address**: Enter your EC2 public IP (e.g., `34.224.51.176`)
   - **Proxy status**: Click the **orange cloud** icon to enable proxy (this enables SSL!)
   - **TTL**: Auto
   - Click **"Save"**

   **Record 2: WWW Subdomain (Optional)**
   - Click **"Add record"** again
   - **Type**: Select `A`
   - **Name**: Enter `www`
   - **IPv4 address**: Enter your EC2 public IP (same as above)
   - **Proxy status**: Click the **orange cloud** icon
   - **TTL**: Auto
   - Click **"Save"**

4. **Verify records**:
   - You should see two A records with **orange cloud icons** (proxied)
   - The orange cloud = SSL enabled!

---

## Step 6: Update Nameservers at Freenom (3 minutes)

Cloudflare will provide you with nameservers. You need to update them at Freenom.

1. **In Cloudflare dashboard**, go to your domain overview
2. **Look for "Nameservers"** section
3. **Copy the two nameservers** (e.g., `alice.ns.cloudflare.com` and `bob.ns.cloudflare.com`)

4. **Go to Freenom**: https://www.freenom.com/
5. **Login** to your account
6. **Go to**: "My Domains" → Select your domain → "Management Tools"
7. **Click "Nameservers"** tab
8. **Select "Use custom nameservers"**
9. **Enter the two Cloudflare nameservers**:
   - Nameserver 1: `alice.ns.cloudflare.com` (or your first one)
   - Nameserver 2: `bob.ns.cloudflare.com` (or your second one)
10. **Click "Change Nameservers"**
11. **Wait for confirmation**

---

## Step 7: Wait for DNS Propagation (5-30 minutes)

1. **DNS changes take time to propagate**
2. **Check status in Cloudflare**:
   - Go to your domain dashboard
   - Look for "Status" - should show "Active"
   - SSL/TLS tab should show "Full (strict)" or "Flexible" after a few minutes

3. **Test your domain**:
   ```bash
   # In your browser, try:
   https://yourdomain.tk
   
   # Or test with curl:
   curl -I https://yourdomain.tk
   ```

4. **Verify SSL is working**:
   - Visit `https://yourdomain.tk` in browser
   - You should see a padlock icon (🔒) in the address bar
   - No security warnings!

---

## Step 8: Update Your Frontend Code

Now update your frontend to use the new Cloudflare domain with SSL.

### Update `client/src/config/api.js`:

```javascript
// Change from:
return 'https://ec2-3-89-161-91.compute-1.amazonaws.com/api';

// To:
return 'https://yourdomain.tk/api';  // Replace with your actual domain
```

### Update `client/src/config/forceProduction.js`:

```javascript
// Change from:
import.meta.env.VITE_API_URL = 'https://ec2-3-89-161-91.compute-1.amazonaws.com/api';

// To:
import.meta.env.VITE_API_URL = 'https://yourdomain.tk/api';
```

### Update `client/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "env": {
    "VITE_API_URL": "https://yourdomain.tk/api",
    "VITE_SITE_URL": "https://yourdomain.tk"
  }
}
```

### Update Server CORS (`server/app.js` and `server/server.js`):

Add your new domain to allowed origins:

```javascript
const allowedOrigins = [
  "https://samlex-client.vercel.app",
  "https://lawfirm-saas-client.vercel.app",
  "https://yourdomain.tk",  // Add your Cloudflare domain
  "http://localhost:5001",
  "http://localhost:5002",
];
```

---

## Step 9: Configure Cloudflare SSL Settings (Optional but Recommended)

1. **In Cloudflare dashboard**, go to **"SSL/TLS"** tab
2. **SSL/TLS encryption mode**: Select **"Full"** or **"Full (strict)"**
   - **Full**: Works with self-signed certificates
   - **Full (strict)**: Requires valid SSL certificate (use if you install SSL on EC2 later)
3. **Always Use HTTPS**: Enable this (redirects HTTP to HTTPS)
4. **Minimum TLS Version**: Set to 1.2 or higher

---

## Step 10: Test Everything

1. **Test API endpoint**:
   ```bash
   curl https://yourdomain.tk/api/health
   ```

2. **Test in browser**:
   - Visit your frontend on Vercel
   - Open browser console (F12)
   - Check for any CORS or SSL errors
   - Try logging in or making an API call

3. **Verify WebSocket connection**:
   - Check browser console for WebSocket connection
   - Should see `wss://yourdomain.tk` (not `ws://`)

---

## Troubleshooting

### Issue: "DNS not resolving"
**Solution**: 
- Wait longer (can take up to 48 hours, usually 5-30 minutes)
- Check nameservers are correctly set at Freenom
- Verify DNS records in Cloudflare have orange cloud enabled

### Issue: "SSL not working"
**Solution**:
- Make sure proxy is enabled (orange cloud icon) in Cloudflare DNS
- Check SSL/TLS mode is set to "Full" or "Flexible"
- Wait a few more minutes for SSL to activate

### Issue: "502 Bad Gateway" or "Connection refused"
**Solution**:
- Verify your EC2 instance is running
- Check Security Group allows traffic from Cloudflare IPs (or allow all on port 80/443)
- Test direct connection: `curl http://your-ec2-ip:5000/api/health`

### Issue: "CORS error"
**Solution**:
- Add your Cloudflare domain to server CORS allowed origins
- Make sure domain is added in both `server/app.js` and `server/server.js`

### Issue: "Nameservers not updating"
**Solution**:
- Wait 24-48 hours (usually faster)
- Double-check nameservers are correct at Freenom
- Verify you saved the changes

---

## Quick Checklist

- [ ] Got free domain from Freenom
- [ ] Signed up for Cloudflare
- [ ] Added site to Cloudflare
- [ ] Added A record pointing to EC2 IP (with orange cloud/proxy enabled)
- [ ] Updated nameservers at Freenom
- [ ] Waited for DNS propagation (5-30 min)
- [ ] Verified SSL is working (padlock in browser)
- [ ] Updated frontend code with new domain
- [ ] Updated server CORS settings
- [ ] Tested API calls from frontend

---

## What You Get

✅ **Free SSL certificate** (automatic, no installation needed)
✅ **HTTPS for your backend** (works with HTTPS frontend)
✅ **DDoS protection** (included free)
✅ **CDN** (faster loading)
✅ **No cost** (completely free)

---

## Next Steps After Setup

1. **Deploy updated frontend** to Vercel
2. **Test all API endpoints**
3. **Monitor for any issues**
4. **Consider setting up SSL on EC2 directly** later (optional, for better performance)

---

## Need Help?

If you get stuck at any step:
1. Check Cloudflare status page
2. Verify DNS records are correct
3. Test with `curl` commands
4. Check browser console for specific errors

**Common Commands for Testing:**
```bash
# Test DNS resolution
nslookup yourdomain.tk

# Test HTTPS connection
curl -I https://yourdomain.tk

# Test API endpoint
curl https://yourdomain.tk/api/health
```

---

## Summary

1. Get free domain (Freenom) → 5 min
2. Sign up Cloudflare → 2 min
3. Add site to Cloudflare → 3 min
4. Configure DNS → 5 min
5. Update nameservers → 3 min
6. Wait for propagation → 5-30 min
7. Update code → 5 min
8. Test → Done!

**Total time: ~30-45 minutes** (mostly waiting for DNS)

**Cost: $0** (completely free!)

