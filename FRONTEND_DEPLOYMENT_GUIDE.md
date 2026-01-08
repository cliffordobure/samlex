# Complete Frontend Deployment & Backend Connection Guide

This guide will help you deploy your frontend to Vercel and connect it to your EC2 backend.

---

## Prerequisites

✅ Backend is running on EC2: `ec2-34-224-51-176.compute-1.amazonaws.com`  
✅ Backend is accessible (ports 80/443 open)  
✅ You have a GitHub account (for Vercel deployment)

---

## Part 1: Deploy Frontend to Vercel

### Step 1: Prepare Your Code

1. **Make sure your code is updated**:
   - Backend URLs have been updated to: `ec2-34-224-51-176.compute-1.amazonaws.com`
   - All changes are committed to Git

2. **Build the frontend locally** (optional, to test):
   ```bash
   cd client
   npm install
   npm run build
   ```
   - If build succeeds, you're ready to deploy!

### Step 2: Push Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   cd client
   git init
   git add .
   git commit -m "Ready for deployment"
   ```

2. **Create GitHub Repository**:
   - Go to: https://github.com/new
   - Create a new repository (e.g., `samlex-frontend`)
   - **Don't** initialize with README (if you have code)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/samlex-frontend.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Deploy to Vercel

1. **Sign up/Login to Vercel**:
   - Go to: https://vercel.com/
   - Click "Sign Up" or "Login"
   - Sign in with GitHub

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository (`samlex-frontend`)
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `client` (if your repo has both frontend and backend)
     - OR leave empty if `client` folder is the root
   - **Build Command**: `npm run build` (should be auto-filled)
   - **Output Directory**: `dist` (should be auto-filled)
   - **Install Command**: `npm install` (should be auto-filled)

4. **Environment Variables** (Important!):
   - Click "Environment Variables"
   - Add these variables:
     ```
     VITE_API_URL = https://ec2-34-224-51-176.compute-1.amazonaws.com/api
     VITE_SOCKET_URL = https://ec2-34-224-51-176.compute-1.amazonaws.com
     ```
   - **Note**: These will override the hardcoded URLs in your code

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)
   - You'll get a URL like: `https://your-project.vercel.app`

---

## Part 2: Connect Frontend to Backend

### Step 1: Verify Backend is Running

1. **Test backend health endpoint**:
   ```bash
   curl http://ec2-34-224-51-176.compute-1.amazonaws.com/api/health
   ```
   - Should return: `{"success":true,"message":"Server is running",...}`

2. **If using HTTPS** (after Cloudflare setup):
   ```bash
   curl https://yourdomain.tk/api/health
   ```

### Step 2: Update Backend CORS

Make sure your backend allows requests from your Vercel frontend:

1. **SSH into your EC2 instance**:
   ```bash
   ssh -i your-key.pem ec2-user@ec2-34-224-51-176.compute-1.amazonaws.com
   # OR if Ubuntu:
   ssh -i your-key.pem ubuntu@ec2-34-224-51-176.compute-1.amazonaws.com
   ```

2. **Edit server CORS settings**:
   ```bash
   cd /path/to/your/server
   nano server/app.js
   ```

3. **Add your Vercel URL to allowed origins**:
   ```javascript
   const allowedOrigins = [
     "https://your-project.vercel.app",  // Add your Vercel URL
     "https://samlex-client.vercel.app",
     "https://lawfirm-saas-client.vercel.app",
     "https://ec2-34-224-51-176.compute-1.amazonaws.com",
     "http://localhost:5001",
     "http://localhost:5002",
   ];
   ```

4. **Also update Socket.IO CORS** in `server/server.js`:
   ```javascript
   const io = new SocketIOServer(server, {
     cors: { 
       origin: [
         "https://your-project.vercel.app",  // Add your Vercel URL
         "https://samlex-client.vercel.app",
         "https://ec2-34-224-51-176.compute-1.amazonaws.com",
         "http://localhost:5001",
         "http://localhost:5002"
       ],
       methods: ["*"],
       credentials: true,
     },
   });
   ```

5. **Restart your Node.js server**:
   ```bash
   # If using PM2:
   pm2 restart all
   
   # OR if using systemd:
   sudo systemctl restart your-app
   
   # OR if running directly:
   # Stop current process (Ctrl+C) and restart:
   node server.js
   ```

### Step 3: Test the Connection

1. **Visit your Vercel frontend URL**:
   - Go to: `https://your-project.vercel.app`

2. **Open Browser Console** (F12):
   - Check for any CORS errors
   - Check for API connection errors
   - Look for the API configuration log:
     ```
     🔧 API Configuration:
       Hostname: your-project.vercel.app
       API URL: https://ec2-34-224-51-176.compute-1.amazonaws.com/api
       Socket URL: https://ec2-34-224-51-176.compute-1.amazonaws.com
     ```

3. **Test Login**:
   - Try logging in
   - Check Network tab for API calls
   - Verify requests are going to your backend

---

## Part 3: SSL Setup (Required!)

**Important**: Your frontend is HTTPS, so your backend MUST be HTTPS too!

### Option A: Quick Setup with Cloudflare (Recommended)

Follow the `CLOUDFLARE_SSL_SETUP_GUIDE.md` to set up free SSL.

After Cloudflare setup:
1. Update frontend URLs to use your Cloudflare domain
2. Update backend CORS to include your Cloudflare domain
3. Test the connection

### Option B: Self-Signed Certificate (Quick Test)

For immediate testing, you can use a self-signed certificate:

1. **SSH into EC2**
2. **Install Nginx** (if not installed):
   ```bash
   # Amazon Linux 2:
   sudo yum install nginx -y
   
   # Ubuntu:
   sudo apt install nginx -y
   ```

3. **Generate self-signed certificate**:
   ```bash
   sudo mkdir -p /etc/nginx/ssl
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/nginx/ssl/nginx-selfsigned.key \
     -out /etc/nginx/ssl/nginx-selfsigned.crt \
     -subj "/CN=ec2-34-224-51-176.compute-1.amazonaws.com"
   ```

4. **Configure Nginx** (see `AMAZON_LINUX_QUICK_START.md`)

5. **Update frontend to use HTTPS** (already done in code)

**Note**: Browsers will show a warning with self-signed certificates. Users need to click "Advanced" → "Proceed" the first time.

---

## Part 4: Update Environment Variables in Vercel

After setting up SSL (Cloudflare or self-signed):

1. **Go to Vercel Dashboard**:
   - Select your project
   - Go to "Settings" → "Environment Variables"

2. **Update Variables**:
   - If using Cloudflare domain:
     ```
     VITE_API_URL = https://yourdomain.tk/api
     VITE_SOCKET_URL = https://yourdomain.tk
     ```
   - If using EC2 with self-signed:
     ```
     VITE_API_URL = https://ec2-34-224-51-176.compute-1.amazonaws.com/api
     VITE_SOCKET_URL = https://ec2-34-224-51-176.compute-1.amazonaws.com
     ```

3. **Redeploy**:
   - Go to "Deployments" tab
   - Click "..." on latest deployment → "Redeploy"
   - Or push a new commit to trigger redeploy

---

## Troubleshooting

### Issue: "CORS Error" in Browser

**Solution**:
1. Check backend CORS includes your Vercel URL
2. Verify backend is running
3. Check Security Group allows traffic from Vercel IPs (or allow all on port 80/443)

### Issue: "Mixed Content" Error

**Solution**:
- Backend MUST use HTTPS
- Set up SSL using Cloudflare (recommended) or self-signed certificate

### Issue: "Connection Refused" or "Network Error"

**Solution**:
1. Verify backend is running: `curl http://ec2-34-224-51-176.compute-1.amazonaws.com/api/health`
2. Check Security Group allows port 80/443
3. Check backend is listening on the correct port (5000)
4. If using Nginx, verify it's running: `sudo systemctl status nginx`

### Issue: "API URL is incorrect"

**Solution**:
1. Check Vercel environment variables are set correctly
2. Check `client/src/config/api.js` has correct URLs
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: "WebSocket Connection Failed"

**Solution**:
1. Verify Socket.IO CORS includes your Vercel URL
2. Check WebSocket URL is using HTTPS (wss://)
3. Verify Nginx is configured for WebSocket proxying (if using Nginx)

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and deployed
- [ ] Environment variables set in Vercel
- [ ] Backend CORS updated with Vercel URL
- [ ] Backend Socket.IO CORS updated
- [ ] SSL set up on backend (Cloudflare or self-signed)
- [ ] Frontend URLs updated to use HTTPS backend
- [ ] Tested login/API calls from frontend
- [ ] WebSocket connection working
- [ ] No CORS errors in browser console

---

## Next Steps

1. **Set up custom domain** (optional):
   - Add your domain in Vercel settings
   - Update DNS records

2. **Monitor performance**:
   - Check Vercel analytics
   - Monitor backend logs
   - Set up error tracking (Sentry, etc.)

3. **Optimize**:
   - Enable Vercel caching
   - Optimize images
   - Set up CDN for static assets

---

## Summary

1. **Deploy to Vercel**: Push code → Import to Vercel → Deploy
2. **Update Backend CORS**: Add Vercel URL to allowed origins
3. **Set up SSL**: Use Cloudflare (free) or self-signed (quick test)
4. **Update URLs**: Use HTTPS backend URLs
5. **Test**: Verify connection works

**Total time**: ~30-60 minutes (depending on SSL setup)

**Cost**: Free (Vercel free tier + Cloudflare free tier)

