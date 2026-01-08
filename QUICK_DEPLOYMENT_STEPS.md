# Quick Deployment Steps - Frontend & Backend Connection

## Your Current Setup

- **Backend EC2**: `ec2-34-224-51-176.compute-1.amazonaws.com` (IP: `34.224.51.176`)
- **Backend Status**: ✅ Running
- **Frontend**: Ready to deploy to Vercel

---

## Step 1: Update Backend URLs (✅ Already Done!)

The frontend code has been updated to use your correct EC2 instance:
- `ec2-34-224-51-176.compute-1.amazonaws.com`

---

## Step 2: Deploy Frontend to Vercel (15 minutes)

### Quick Steps:

1. **Push code to GitHub**:
   ```bash
   cd client
   git add .
   git commit -m "Ready for Vercel deployment"
   git push
   ```

2. **Deploy to Vercel**:
   - Go to: https://vercel.com/
   - Sign in with GitHub
   - Click "Add New Project"
   - Select your repository
   - **Root Directory**: `client` (if repo has both frontend/backend)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Add Environment Variables** in Vercel:
   ```
   VITE_API_URL = https://ec2-34-224-51-176.compute-1.amazonaws.com/api
   VITE_SOCKET_URL = https://ec2-34-224-51-176.compute-1.amazonaws.com
   ```

4. **Click "Deploy"** and wait for build

5. **Get your Vercel URL** (e.g., `https://your-project.vercel.app`)

---

## Step 3: Update Backend CORS (5 minutes)

**SSH into your EC2 instance** and update CORS:

```bash
# Edit server/app.js
nano server/app.js
```

**Add your Vercel URL** to allowed origins:
```javascript
const allowedOrigins = [
  "https://your-project.vercel.app",  // ← Add your Vercel URL here
  "https://samlex-client.vercel.app",
  "https://lawfirm-saas-client.vercel.app",
  "https://ec2-34-224-51-176.compute-1.amazonaws.com",
  "http://localhost:5001",
  "http://localhost:5002",
];
```

**Also update** `server/server.js` Socket.IO CORS:
```javascript
origin: [
  "https://your-project.vercel.app",  // ← Add your Vercel URL here
  "https://samlex-client.vercel.app",
  "https://ec2-34-224-51-176.compute-1.amazonaws.com",
  "http://localhost:5001",
  "http://localhost:5002"
],
```

**Restart your server**:
```bash
# If using PM2:
pm2 restart all

# OR if running with node:
# Stop (Ctrl+C) and restart:
node server.js
```

---

## Step 4: Set Up SSL (Required!)

**⚠️ Important**: Your frontend is HTTPS, so backend MUST be HTTPS too!

### Option A: Cloudflare (Recommended - Free, 15 minutes)

1. Get free domain: https://www.freenom.com/
2. Sign up Cloudflare: https://www.cloudflare.com/
3. Add site to Cloudflare
4. Point DNS to EC2 IP (34.224.51.176) with proxy enabled
5. Update nameservers at Freenom
6. Wait 5-30 minutes
7. Update frontend URLs to use your Cloudflare domain

**See**: `CLOUDFLARE_SSL_SETUP_GUIDE.md` for detailed steps

### Option B: Self-Signed Certificate (Quick Test - 10 minutes)

For immediate testing:

```bash
# On EC2, install Nginx
sudo yum install nginx -y  # Amazon Linux
# OR
sudo apt install nginx -y  # Ubuntu

# Generate self-signed certificate
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/nginx-selfsigned.key \
  -out /etc/nginx/ssl/nginx-selfsigned.crt \
  -subj "/CN=ec2-34-224-51-176.compute-1.amazonaws.com"

# Configure Nginx (see AMAZON_LINUX_QUICK_START.md)
# Restart Nginx
sudo systemctl restart nginx
```

**Note**: Browsers will show warning - users need to click "Advanced" → "Proceed"

---

## Step 5: Test Connection (5 minutes)

1. **Visit your Vercel frontend**: `https://your-project.vercel.app`

2. **Open Browser Console** (F12):
   - Check for API configuration log
   - Look for CORS errors
   - Check Network tab for API calls

3. **Test Login**:
   - Try logging in
   - Verify API calls are working
   - Check WebSocket connection

---

## Troubleshooting Quick Fixes

### "CORS Error"
- ✅ Backend CORS includes your Vercel URL
- ✅ Backend server restarted

### "Mixed Content Error"
- ✅ Backend is using HTTPS
- ✅ Frontend URLs use `https://`

### "Connection Refused"
- ✅ Backend is running
- ✅ Security Group allows port 80/443
- ✅ Test: `curl http://ec2-34-224-51-176.compute-1.amazonaws.com/api/health`

### "API URL Wrong"
- ✅ Vercel environment variables set
- ✅ Code uses correct EC2 DNS

---

## Complete Checklist

- [ ] Code pushed to GitHub
- [ ] Frontend deployed to Vercel
- [ ] Vercel environment variables set
- [ ] Backend CORS updated with Vercel URL
- [ ] Backend Socket.IO CORS updated
- [ ] Backend server restarted
- [ ] SSL set up (Cloudflare or self-signed)
- [ ] Frontend URLs use HTTPS backend
- [ ] Tested connection from frontend
- [ ] No errors in browser console

---

## What's Next?

1. **Set up Cloudflare** for proper SSL (recommended)
2. **Test all features** from frontend
3. **Monitor logs** for any issues
4. **Set up custom domain** (optional)

---

## Need Help?

- **Detailed Vercel guide**: See `FRONTEND_DEPLOYMENT_GUIDE.md`
- **Cloudflare SSL setup**: See `CLOUDFLARE_SSL_SETUP_GUIDE.md`
- **Backend SSL setup**: See `AMAZON_LINUX_QUICK_START.md`

---

## Summary

1. ✅ **Updated backend URLs** in frontend code
2. 📤 **Deploy to Vercel** (15 min)
3. 🔧 **Update backend CORS** (5 min)
4. 🔒 **Set up SSL** (15-30 min)
5. ✅ **Test connection** (5 min)

**Total time**: ~40-60 minutes  
**Cost**: $0 (all free tiers)

