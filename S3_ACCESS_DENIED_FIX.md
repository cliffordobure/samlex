# 🔧 Fixing S3 AccessDenied Error

You're getting "AccessDenied" because your S3 bucket blocks public access, but files are being accessed via public URLs.

## ✅ Solution 1: Make Files Public (Quick Fix)

This is the **easiest** solution. Files will be publicly accessible via their URLs.

### Step 1: Update S3 Bucket Settings

1. Go to your S3 bucket in AWS Console
2. Click **"Permissions"** tab
3. Scroll to **"Block public access (bucket settings)"**
4. Click **"Edit"**
5. **Uncheck** "Block all public access"
6. Click **"Save changes"**
7. Type `confirm` to confirm

### Step 2: Update Bucket Policy

1. Still in **"Permissions"** tab
2. Scroll to **"Bucket policy"**
3. Click **"Edit"**
4. Add this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

5. Click **"Save changes"**

### Step 3: Code Already Updated ✅

The code has been updated to set `ACL: "public-read"` when uploading files. New uploads will be publicly accessible.

**Note**: Existing files uploaded before this change will still need to be made public. You can:
- Re-upload them, OR
- Use AWS Console to change their permissions individually

---

## 🔒 Solution 2: Use Signed URLs (More Secure)

This is the **more secure** solution but requires frontend changes.

### Step 1: Keep Bucket Private

Keep "Block all public access" **enabled** (default).

### Step 2: Backend Already Ready ✅

The backend already has an endpoint: `GET /api/upload/signed-url?url=<file-url>`

### Step 3: Update Frontend

You need to update the frontend to fetch signed URLs before displaying documents. Here's how:

**In your document viewer components** (e.g., `CaseDetails.jsx`, `Documents.jsx`):

```javascript
// Before displaying document, fetch signed URL if it's S3
const handleDocumentClick = async (doc) => {
  let documentUrl = doc.path || doc.url || "";
  
  // Check if it's an S3 URL
  if (documentUrl.includes('.s3.') || documentUrl.includes('s3.amazonaws.com')) {
    try {
      // Fetch signed URL from backend
      const response = await fetch(
        `${API_BASE}/upload/signed-url?url=${encodeURIComponent(documentUrl)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        documentUrl = data.url; // Use signed URL
      }
    } catch (error) {
      console.error("Error getting signed URL:", error);
      toast.error("Failed to load document");
      return;
    }
  }
  
  setSelectedDocument({ url: documentUrl, filename });
  setShowDocumentModal(true);
};
```

---

## 🎯 Recommended Approach

**For now**: Use **Solution 1** (make files public) - it's quick and works immediately.

**For production**: Consider **Solution 2** (signed URLs) for better security, especially if documents contain sensitive information.

---

## 🧪 Testing

After implementing Solution 1:

1. Upload a new file
2. Try to view it - should work now!
3. Check the file URL in browser - should load directly

After implementing Solution 2:

1. Upload a file
2. Click to view it
3. Check browser network tab - should see request to `/api/upload/signed-url`
4. Document should load with signed URL

---

## 🔍 Troubleshooting

**Still getting AccessDenied?**

1. **Check bucket policy** - Make sure it allows `s3:GetObject`
2. **Check file ACL** - In S3 console, click on file → Permissions → Make sure it's public
3. **Check CORS** - Make sure CORS is configured correctly
4. **Clear browser cache** - Old URLs might be cached

**Signed URLs not working?**

1. **Check IAM permissions** - User needs `s3:GetObject` permission
2. **Check URL format** - Make sure you're passing the correct S3 URL
3. **Check expiration** - Signed URLs expire after 1 hour (default)
