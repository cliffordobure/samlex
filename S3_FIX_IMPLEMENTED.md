git # ✅ S3 AccessDenied Fix - IMPLEMENTED

## What Was Fixed

The issue was that S3 buckets by default block public access, but the code was trying to access files via public URLs. I've implemented **automatic signed URL generation** for S3 files.

## Changes Made

### 1. Backend Changes ✅
- **Removed ACL** from S3 uploads (ACLs are often disabled in modern S3 buckets)
- **Added signed URL endpoint**: `GET /api/upload/signed-url?url=<s3-url>`
- Files are now uploaded without ACL, relying on bucket policy or signed URLs

### 2. Frontend Changes ✅
- **Created utility function** (`client/src/utils/documentUrl.js`) to automatically fetch signed URLs for S3 files
- **Updated document viewers** in:
  - `CreditCollection/CaseDetails.jsx`
  - `Legal/CaseDetails.jsx`
  - `Legal/Documents.jsx`

### 3. How It Works Now

When a user clicks to view a document:
1. Frontend checks if the URL is an S3 URL (contains `.s3.` or `s3.amazonaws.com`)
2. If it's S3, automatically fetches a signed URL from the backend
3. Uses the signed URL to display the document
4. Signed URLs expire after 1 hour (configurable)

## Testing

1. **Upload a new document** - Should work normally
2. **Click to view the document** - Should automatically get signed URL and display
3. **Check browser console** - Should see signed URL being fetched for S3 files

## Bucket Configuration

Your S3 bucket can remain **private** (Block all public access enabled). The signed URLs will handle access.

**Optional**: If you want public access instead:
1. Go to S3 bucket → Permissions
2. Edit "Block public access" → Uncheck all
3. Add bucket policy:
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

## Troubleshooting

**Still getting AccessDenied?**
1. Check server logs for errors when fetching signed URL
2. Verify IAM user has `s3:GetObject` permission
3. Check that the URL format is correct (should contain `.s3.` or `s3.amazonaws.com`)

**Signed URL not working?**
1. Check browser console for errors
2. Verify the `/api/upload/signed-url` endpoint is accessible
3. Check that your authentication token is valid

## Next Steps

1. **Test with a new upload** - Upload a document and try to view it
2. **Check browser console** - Look for any errors
3. **Check server logs** - Verify signed URL generation is working

The fix is now live! Try uploading and viewing a document - it should work now. 🎉
