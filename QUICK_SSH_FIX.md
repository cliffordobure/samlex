# Quick SSH Connection Fix

## Immediate Steps to Try

### 1. Check Instance Status in AWS Console
- Go to: EC2 → Instances
- Find your instance: `ec2-3-89-161-91.compute-1.amazonaws.com`
- Verify:
  - ✅ State: **Running**
  - ✅ Status checks: **2/2 checks passed**
  - ✅ **Public IPv4 address**: Must have an IP (not empty!)

### 2. Try Different Username

**If your instance is Ubuntu:**
```bash
ssh -i node-backend-server-samlex.pem ubuntu@ec2-3-89-161-91.compute-1.amazonaws.com
```

**If your instance is Amazon Linux:**
```bash
ssh -i node-backend-server-samlex.pem ec2-user@ec2-3-89-161-91.compute-1.amazonaws.com
```

**To find your AMI type:**
- EC2 Console → Instances → Your instance → Details tab
- Look for "Platform details" or "AMI ID"
- If it says "Ubuntu" → use `ubuntu`
- If it says "Amazon Linux" → use `ec2-user`

### 3. Use Public IP Instead of DNS

1. Get the Public IP from EC2 Console (Details tab)
2. Use it directly:
```bash
ssh -i node-backend-server-samlex.pem ubuntu@<YOUR_PUBLIC_IP>
# OR
ssh -i node-backend-server-samlex.pem ec2-user@<YOUR_PUBLIC_IP>
```

### 4. Fix Key File Permissions (Windows/Git Bash)

```bash
chmod 400 node-backend-server-samlex.pem
# OR
chmod 600 node-backend-server-samlex.pem
```

### 5. Verify Security Group is Attached

- EC2 Console → Instances → Your instance → **Security** tab
- Verify `sg-0abfb2a67f1f00cc7` is listed
- If not, click "Edit security groups" and add it

### 6. Check if Instance Has Public IP

**If Public IP is missing:**
1. Stop the instance (Actions → Instance State → Stop)
2. Actions → Networking → **Manage IP addresses**
3. Click "Allocate Elastic IP" or "Assign new IP"
4. Start the instance again

**OR** (if using a new instance):
- Launch a new instance with "Auto-assign public IP" enabled

---

## Test Connection

After trying the above, test with:

```bash
# Test 1: With Ubuntu username
ssh -i node-backend-server-samlex.pem ubuntu@ec2-3-89-161-91.compute-1.amazonaws.com

# Test 2: With Public IP
ssh -i node-backend-server-samlex.pem ubuntu@<PUBLIC_IP>

# Test 3: Verbose mode (shows what's happening)
ssh -v -i node-backend-server-samlex.pem ubuntu@ec2-3-89-161-91.compute-1.amazonaws.com
```

---

## If Still Not Working

1. **Check Network ACLs:**
   - VPC Console → Network ACLs
   - Find your subnet's Network ACL
   - Verify inbound rule allows SSH (port 22) from 0.0.0.0/0

2. **Check Route Table:**
   - VPC Console → Route Tables
   - Find your subnet's route table
   - Must have route: `0.0.0.0/0` → Internet Gateway

3. **Use AWS Systems Manager (Alternative):**
   - EC2 Console → Instances → Your instance → Connect
   - Use "Session Manager" tab (no SSH needed)
   - Requires IAM role with SSM permissions

---

## Most Common Solution

**90% of the time, it's the username!**

Try this first:
```bash
ssh -i node-backend-server-samlex.pem ubuntu@ec2-3-89-161-91.compute-1.amazonaws.com
```

If that doesn't work, use the Public IP:
```bash
# Get Public IP from EC2 Console, then:
ssh -i node-backend-server-samlex.pem ubuntu@<PUBLIC_IP>
```

