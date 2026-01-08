# AWS EC2 SSL Certificate Setup Guide

This guide will help you set up HTTPS/SSL on your AWS EC2 instance to fix the mixed content error.

## Problem
Your frontend (HTTPS) is trying to connect to an insecure backend (HTTP), which browsers block for security reasons.

## Solution Options

### Option 1: Using Nginx + Let's Encrypt (Recommended - Free SSL)

This is the most cost-effective solution using free SSL certificates from Let's Encrypt.

#### Prerequisites
- An EC2 instance running Ubuntu/Linux or Amazon Linux
- A domain name pointing to your EC2 instance (or use the EC2 public DNS)
- SSH access to your EC2 instance
- Ports 80 and 443 open in your EC2 Security Group

#### Quick Check: Which Linux Distribution?

First, check which Linux you're using:
```bash
cat /etc/os-release
```

**Common distributions:**
- **Ubuntu/Debian**: Uses `apt` package manager
- **Amazon Linux 2**: Uses `yum` package manager
- **Amazon Linux 2023**: Uses `dnf` package manager

If you see "apt: command not found", you're on Amazon Linux - use `yum` or `dnf` commands instead!

#### Step 1: Update Security Group
1. Go to AWS Console → EC2 → Security Groups
2. Select your instance's security group
3. Add inbound rules:
   - **Type**: HTTP, **Port**: 80, **Source**: 0.0.0.0/0
   - **Type**: HTTPS, **Port**: 443, **Source**: 0.0.0.0/0

#### Step 2: Install Nginx

**For Ubuntu/Debian:**
SSH into your EC2 instance and run:

```bash
# Update package list
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

**For Amazon Linux 2:**
```bash
# Update package list
sudo yum update -y

# Install Nginx (may need to add EPEL repository first)
sudo amazon-linux-extras install nginx1 -y
# OR if that doesn't work:
sudo yum install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

**For Amazon Linux 2023:**
```bash
# Update package list
sudo dnf update -y

# Install Nginx
sudo dnf install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 3: Install Certbot (Let's Encrypt)

**For Ubuntu/Debian:**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

**For Amazon Linux 2:**
```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx -y
```

**For Amazon Linux 2023:**
```bash
# Install Certbot
sudo dnf install certbot python3-certbot-nginx -y
```

**If Certbot is not available in default repos (Amazon Linux):**
```bash
# For Amazon Linux 2
sudo yum install python3-pip -y
sudo pip3 install certbot certbot-nginx

# For Amazon Linux 2023
sudo dnf install python3-pip -y
sudo pip3 install certbot certbot-nginx
```

#### Step 4: Configure Nginx as Reverse Proxy

**Determine your Linux distribution first:**
```bash
# Check which Linux you're using
cat /etc/os-release
```

**For Ubuntu/Debian:**
Create/edit the Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/default
```

**For Ubuntu/Debian:**
Replace the content with this configuration (adjust the domain name):

```nginx
server {
    listen 80;
    server_name ec2-3-89-161-91.compute-1.amazonaws.com;  # Replace with your domain if you have one

    # Redirect HTTP to HTTPS (will be enabled after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Temporary: Proxy to Node.js app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**For Amazon Linux:**
The nginx config structure is different. You need to edit `/etc/nginx/nginx.conf` or create a new file in `/etc/nginx/conf.d/`:

```bash
# Create a new config file
sudo nano /etc/nginx/conf.d/nodejs.conf
```

Add this content:

```nginx
server {
    listen 80;
    server_name ec2-3-89-161-91.compute-1.amazonaws.com;  # Replace with your domain if you have one

    # Redirect HTTP to HTTPS (will be enabled after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Temporary: Proxy to Node.js app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Note**: If you have a custom domain name, replace `ec2-3-89-161-91.compute-1.amazonaws.com` with your domain.

#### Step 5: Test Nginx Configuration
```bash
sudo nginx -t
```

If successful, reload Nginx:
```bash
sudo systemctl reload nginx
```

#### Step 6: Get SSL Certificate with Let's Encrypt

**Important**: Let's Encrypt requires a valid domain name. If you're using the EC2 public DNS, you may need to:
- Option A: Get a free domain from services like Freenom, or
- Option B: Use AWS Route 53 to create a domain/subdomain

Once you have a domain pointing to your EC2 instance:

```bash
# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Or if using EC2 DNS (may not work, domain recommended):
sudo certbot --nginx -d ec2-3-89-161-91.compute-1.amazonaws.com
```

Certbot will:
- Automatically configure Nginx for HTTPS
- Set up automatic certificate renewal
- Configure HTTP to HTTPS redirect

#### Step 7: Update Nginx Config for HTTPS

After Certbot runs, your Nginx config will be updated automatically. Verify it looks like this:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Step 8: Test Certificate Renewal
```bash
sudo certbot renew --dry-run
```

#### Step 9: Update Your Node.js App

Make sure your Node.js app is running on `localhost:5000` (not 0.0.0.0:5000). Update your server.js if needed.

#### Step 10: Update Frontend URLs

The frontend URLs have already been updated to use HTTPS. Make sure to update them with your actual domain:

- If using a custom domain: `https://yourdomain.com`
- If using EC2 DNS: `https://ec2-3-89-161-91.compute-1.amazonaws.com`

---

### Option 2: Using AWS Application Load Balancer + ACM (Production)

This is the AWS-native solution, better for production but more complex.

#### Steps:
1. **Create Application Load Balancer (ALB)**
   - Go to EC2 → Load Balancers → Create
   - Choose Application Load Balancer
   - Configure listeners: HTTP (80) and HTTPS (443)
   - Select your VPC and subnets

2. **Request SSL Certificate in ACM**
   - Go to AWS Certificate Manager (ACM)
   - Request a public certificate
   - Add your domain name
   - Validate via DNS or email

3. **Configure ALB Listener**
   - Add HTTPS listener (port 443)
   - Select your ACM certificate
   - Create target group pointing to your EC2 instance (port 5000)

4. **Update Security Groups**
   - Allow ALB to access EC2 on port 5000
   - Allow public access to ALB on ports 80 and 443

5. **Update DNS**
   - Point your domain to the ALB DNS name

6. **Update Frontend URLs**
   - Use your domain name with HTTPS

---

### Option 3: Using CloudFront (CDN + SSL)

1. Create CloudFront distribution
2. Point origin to your EC2 instance
3. Use CloudFront's free SSL certificate
4. Update frontend to use CloudFront URL

---

## Quick Fix (Temporary - Not Recommended for Production)

If you need a quick temporary solution while setting up SSL, you can:

1. **Use a domain with free SSL** (like from Cloudflare):
   - Sign up for Cloudflare (free)
   - Add your domain
   - Point DNS to your EC2 IP
   - Enable Cloudflare's SSL (flexible mode)
   - Update frontend URLs to use your Cloudflare domain

2. **Or use a subdomain service**:
   - Use services like ngrok (for testing) or similar
   - They provide HTTPS endpoints

---

## Verification Steps

After setting up SSL:

1. **Test HTTPS endpoint**:
   ```bash
   curl https://yourdomain.com/api/health
   ```

2. **Test WebSocket connection**:
   - Open browser console on your frontend
   - Check for WebSocket connection errors
   - Should see `wss://` instead of `ws://`

3. **Check SSL certificate**:
   - Visit `https://yourdomain.com` in browser
   - Click the padlock icon to verify certificate

---

## Troubleshooting

### Certificate not working with EC2 DNS
- Let's Encrypt may not issue certificates for EC2 public DNS names
- **Solution**: Get a domain name (even a free one) and point it to your EC2 instance

### Nginx 502 Bad Gateway
- Check if Node.js app is running: `sudo systemctl status your-app`
- Check if app is listening on port 5000: `sudo netstat -tlnp | grep 5000`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### WebSocket not working
- Ensure `/socket.io/` location block is in Nginx config
- Check that `proxy_set_header Upgrade` and `Connection` are set
- Verify Socket.IO CORS settings allow your frontend domain

### Certificate renewal failing
- Ensure Certbot auto-renewal is set up: `sudo systemctl status certbot.timer`
- Check renewal logs: `sudo certbot renew --dry-run`

---

## Important Notes

1. **Domain Name Required**: For production, you'll need a domain name. Free options:
   - Freenom (.tk, .ml, .ga domains)
   - Namecheap (often has promotions)
   - AWS Route 53 (paid but reliable)

2. **Port Configuration**: 
   - Nginx listens on ports 80 (HTTP) and 443 (HTTPS)
   - Your Node.js app should run on localhost:5000
   - External traffic should only access ports 80/443

3. **Security**: 
   - Keep Certbot updated:
     - Ubuntu/Debian: `sudo apt upgrade certbot`
     - Amazon Linux 2: `sudo yum update certbot`
     - Amazon Linux 2023: `sudo dnf update certbot`
   - Monitor certificate expiration
   - Use strong SSL/TLS configurations

4. **Performance**:
   - Nginx acts as reverse proxy, which is good for performance
   - Consider adding caching if needed

---

## Next Steps After SSL Setup

1. Update frontend URLs in `client/src/config/api.js` with your actual domain
2. Update `client/vercel.json` environment variables
3. Update server CORS settings to include your HTTPS domain
4. Test all API endpoints and WebSocket connections
5. Monitor SSL certificate expiration (auto-renewal should handle this)

---

## Support

If you encounter issues:
1. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Check Node.js app logs
3. Verify Security Group rules
4. Test with `curl` commands to isolate the issue

