# Amazon Linux Quick Start - SSL Setup

Since you're getting "apt: command not found", you're on **Amazon Linux**. Use these commands:

## Step 1: Check Your Amazon Linux Version

```bash
cat /etc/os-release
```

This will tell you if you're on Amazon Linux 2 (uses `yum`) or Amazon Linux 2023 (uses `dnf`).

## Step 2: Install Nginx

### For Amazon Linux 2:
```bash
sudo yum update -y
sudo amazon-linux-extras install nginx1 -y
# OR if that doesn't work:
sudo yum install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### For Amazon Linux 2023:
```bash
sudo dnf update -y
sudo dnf install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 3: Install Certbot

### For Amazon Linux 2:
```bash
# Try installing from EPEL first
sudo yum install epel-release -y
sudo yum install certbot python3-certbot-nginx -y

# If that doesn't work, use pip:
sudo yum install python3-pip -y
sudo pip3 install certbot certbot-nginx
```

### For Amazon Linux 2023:
```bash
# Try default repos first
sudo dnf install certbot python3-certbot-nginx -y

# If that doesn't work, use pip:
sudo dnf install python3-pip -y
sudo pip3 install certbot certbot-nginx
```

## Step 4: Configure Nginx

**Important:** Amazon Linux uses a different config structure than Ubuntu!

```bash
# Create a new config file (recommended)
sudo nano /etc/nginx/conf.d/nodejs.conf
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name ec2-3-89-161-91.compute-1.amazonaws.com;  # Replace with your domain

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

## Step 5: Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

## Step 6: Get SSL Certificate

**Note:** You'll need a domain name. Let's Encrypt typically doesn't work with EC2 public DNS.

```bash
# If you have a domain:
sudo certbot --nginx -d yourdomain.com

# If certbot command not found, use the full path:
/usr/local/bin/certbot --nginx -d yourdomain.com
# OR
~/.local/bin/certbot --nginx -d yourdomain.com
```

## Common Issues

### Issue: "certbot: command not found"
**Solution:** Use full path or add to PATH:
```bash
# Find where certbot was installed
which certbot
# OR
find /usr -name certbot 2>/dev/null

# Then use full path or create alias:
echo 'alias certbot="/usr/local/bin/certbot"' >> ~/.bashrc
source ~/.bashrc
```

### Issue: Nginx config not loading
**Solution:** Make sure the config file is in `/etc/nginx/conf.d/` and has `.conf` extension.

### Issue: Can't find nginx config directory
**Solution:** Check where nginx looks for configs:
```bash
sudo nginx -T | grep "configuration file"
```

## Quick Command Reference

| Task | Amazon Linux 2 | Amazon Linux 2023 |
|------|----------------|-------------------|
| Update packages | `sudo yum update -y` | `sudo dnf update -y` |
| Install package | `sudo yum install <package>` | `sudo dnf install <package>` |
| Install Nginx | `sudo amazon-linux-extras install nginx1 -y` | `sudo dnf install nginx -y` |
| Start service | `sudo systemctl start nginx` | `sudo systemctl start nginx` |
| Enable service | `sudo systemctl enable nginx` | `sudo systemctl enable nginx` |
| Check status | `sudo systemctl status nginx` | `sudo systemctl status nginx` |
| Edit config | `sudo nano /etc/nginx/conf.d/nodejs.conf` | `sudo nano /etc/nginx/conf.d/nodejs.conf` |

## Next Steps

After Nginx is installed and configured:
1. Test your Node.js app is accessible via Nginx: `curl http://localhost/api/health`
2. Get SSL certificate (requires domain name)
3. Update frontend URLs to use HTTPS

