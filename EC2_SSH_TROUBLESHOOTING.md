# EC2 SSH Connection Troubleshooting Guide

## Problem: SSH Connection Timeout

Your security group rules look correct (SSH port 22 is open), but you're getting a connection timeout. Here are the most common causes and solutions:

---

## Step 1: Verify EC2 Instance Status

1. **Check if instance is running:**
   - Go to AWS Console → EC2 → Instances
   - Verify the instance state is "Running"
   - Check the "Status checks" - should show "2/2 checks passed"

2. **Check if instance has a Public IP:**
   - In the EC2 console, look at your instance details
   - Check the "Public IPv4 address" field
   - If it shows "None" or is empty, that's the problem!

**Solution if no Public IP:**
- Stop the instance
- Go to Actions → Networking → Change source/destination check
- Or better: Actions → Networking → Manage IP addresses → Assign new IP
- Start the instance again

---

## Step 2: Verify Security Group (Already Done ✅)

Your security group shows:
- ✅ SSH (port 22) from 0.0.0.0/0 - This is correct
- ✅ HTTP (port 80) from 0.0.0.0/0 - This is correct  
- ✅ HTTPS (port 443) from 0.0.0.0/0 - This is correct

**However, check these:**
1. Make sure this security group is actually attached to your instance
2. Check if there are multiple security groups - all must allow SSH
3. Verify the security group is in the same VPC as your instance

---

## Step 3: Check Network ACLs

Network ACLs can block traffic even if Security Groups allow it:

1. Go to AWS Console → VPC → Network ACLs
2. Find the Network ACL for your instance's subnet
3. Check inbound rules - should allow SSH (port 22) from 0.0.0.0/0
4. Check outbound rules - should allow ephemeral ports (1024-65535)

---

## Step 4: Verify Correct Username

The username depends on your AMI (operating system):

| AMI Type | Username |
|----------|----------|
| Amazon Linux 2 | `ec2-user` |
| Amazon Linux 2023 | `ec2-user` |
| Ubuntu | `ubuntu` |
| Debian | `admin` |
| RHEL | `ec2-user` |
| CentOS | `centos` or `ec2-user` |
| SUSE | `ec2-user` |

**To find your AMI:**
- EC2 Console → Instances → Select instance → Details tab → Look for "AMI ID" or "Platform details"

**Try different usernames:**
```bash
# For Ubuntu
ssh -i node-backend-server-samlex.pem ubuntu@ec2-3-89-161-91.compute-1.amazonaws.com

# For Amazon Linux
ssh -i node-backend-server-samlex.pem ec2-user@ec2-3-89-161-91.compute-1.amazonaws.com
```

---

## Step 5: Check Key File Permissions (Windows)

On Windows with Git Bash/MINGW64, set correct permissions:

```bash
# In Git Bash/MINGW64
chmod 400 node-backend-server-samlex.pem

# Or try:
chmod 600 node-backend-server-samlex.pem
```

**If chmod doesn't work on Windows:**
- The key file should be in your user directory or a path without spaces
- Try using the full path:
```bash
ssh -i "C:/Users/DELL/node-backend-server-samlex.pem" ec2-user@ec2-3-89-161-91.compute-1.amazonaws.com
```

---

## Step 6: Check Subnet Configuration

1. Go to EC2 Console → Instances → Select your instance
2. Click on the "Subnet ID" link
3. Check "Auto-assign public IPv4 address" - should be "Yes"
4. If "No", you need to:
   - Stop the instance
   - Modify the subnet to auto-assign public IPs
   - Or assign an Elastic IP

---

## Step 7: Check Route Table

1. Go to VPC Console → Route Tables
2. Find the route table for your instance's subnet
3. Verify there's a route to `0.0.0.0/0` via an Internet Gateway
4. If missing, the instance is in a private subnet and can't be accessed directly

---

## Step 8: Try Using Public IP Instead of DNS

Instead of using the DNS name, try the Public IP directly:

1. Get the Public IP from EC2 Console
2. Use it in SSH:
```bash
ssh -i node-backend-server-samlex.pem ec2-user@<PUBLIC_IP>
```

---

## Step 9: Check Instance Firewall (If You Can Access via AWS Systems Manager)

If you have AWS Systems Manager access:

1. Go to EC2 Console → Instances → Select instance
2. Click "Connect" → "Session Manager" tab
3. Try connecting via Systems Manager
4. Once connected, check firewall:
```bash
# For Ubuntu/Debian
sudo ufw status
sudo ufw allow 22

# For Amazon Linux/CentOS/RHEL
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

---

## Step 10: Verify Key Pair is Correct

1. In EC2 Console → Instances → Select instance
2. Check "Key pair name" in the details
3. Make sure it matches your `.pem` file name
4. If it doesn't match, you need to:
   - Create a new key pair
   - Or use AWS Systems Manager to add your SSH key

---

## Quick Diagnostic Commands

### From Your Local Machine:

```bash
# Test if port 22 is reachable
telnet ec2-3-89-161-91.compute-1.amazonaws.com 22

# Or with PowerShell (Windows)
Test-NetConnection -ComputerName ec2-3-89-161-91.compute-1.amazonaws.com -Port 22

# Ping test
ping ec2-3-89-161-91.compute-1.amazonaws.com
```

### Check Your Local Firewall:
- Windows Firewall might be blocking outbound SSH
- Antivirus software might be blocking the connection
- Corporate VPN/firewall might be blocking port 22

---

## Most Common Solutions (Try These First)

### Solution 1: Use Correct Username
```bash
# Try Ubuntu username
ssh -i node-backend-server-samlex.pem ubuntu@ec2-3-89-161-91.compute-1.amazonaws.com
```

### Solution 2: Use Public IP
```bash
# Get Public IP from EC2 Console, then:
ssh -i node-backend-server-samlex.pem ec2-user@<YOUR_PUBLIC_IP>
```

### Solution 3: Verify Security Group is Attached
- EC2 Console → Instances → Select instance → Security tab
- Verify the security group `sg-0abfb2a67f1f00cc7` is listed

### Solution 4: Check Instance Has Public IP
- EC2 Console → Instances → Select instance → Details tab
- Look for "Public IPv4 address" - must not be empty

---

## Alternative: Use AWS Systems Manager Session Manager

If SSH still doesn't work, use AWS Systems Manager:

1. **Install AWS CLI** (if not installed):
   ```bash
   # Windows - download from AWS website
   # Or use: winget install Amazon.AWSCLI
   ```

2. **Install Session Manager Plugin**:
   - Download from: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

3. **Connect via Systems Manager**:
   ```bash
   aws ssm start-session --target i-<your-instance-id>
   ```

4. **Configure IAM Role** (if needed):
   - Instance needs IAM role with `AmazonSSMManagedInstanceCore` policy

---

## Still Not Working?

1. **Check AWS Service Health**: https://status.aws.amazon.com/
2. **Review CloudWatch Logs**: Check if instance is actually running
3. **Try Different Network**: Your local network might be blocking port 22
4. **Contact AWS Support**: If instance is critical and nothing works

---

## Next Steps After Successful SSH Connection

Once you can SSH in, proceed with SSL setup:

```bash
# Update system
sudo apt update  # For Ubuntu/Debian
# OR
sudo yum update  # For Amazon Linux/CentOS

# Install Nginx
sudo apt install nginx -y  # Ubuntu/Debian
# OR
sudo yum install nginx -y  # Amazon Linux (may need EPEL)

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu/Debian
# OR
sudo yum install certbot python3-certbot-nginx -y  # Amazon Linux
```

---

## Quick Checklist

- [ ] Instance is in "Running" state
- [ ] Instance has a Public IPv4 address
- [ ] Security group allows SSH (port 22) from 0.0.0.0/0
- [ ] Security group is attached to the instance
- [ ] Using correct username for your AMI
- [ ] Key file permissions are correct (400 or 600)
- [ ] Subnet has auto-assign public IP enabled
- [ ] Route table has route to Internet Gateway
- [ ] Network ACLs allow SSH traffic
- [ ] Your local firewall/network allows outbound SSH

