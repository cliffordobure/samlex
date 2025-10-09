# Bulk Case Import & SMS Feature

## Overview

This feature allows credit collection administrators and debt collectors to bulk import cases from Excel files and send automated SMS reminders to debtors. This is particularly useful when banks or financial institutions provide debtor lists in spreadsheet format.

## Features

### 1. **Bulk Case Import from Excel**
- Upload Excel files (.xlsx, .xls) containing debtor information
- Automatic parsing and validation of data
- Individual case creation for each debtor
- Error reporting for failed imports
- Batch tracking with unique batch IDs

### 2. **Bulk SMS**
- Send SMS to all debtors in an import batch
- Customizable message templates
- Automatic personalization with debtor name, amount, and bank name
- Batch processing with progress tracking
- Success/failure reporting per SMS

### 3. **Single SMS**
- Send individual SMS to specific debtors
- Available from case details page
- Template or custom message options

## How to Use

### Prerequisites

1. **For Administrators**: Set up Africa's Talking SMS credentials
   - Add to your `.env` file:
     ```
     AFRICASTALKING_USERNAME=your_username
     AFRICASTALKING_API_KEY=your_api_key
     ```
   - Get credentials from: https://africastalking.com

2. **Excel File Requirements**:
   - Must have headers in the first row
   - Required columns:
     - **Name** (or "Debtor Name", "Debtor", etc.)
     - **Phone** (or "Contact", "Mobile", "Phone Number", etc.)
     - **Amount** (or "Debt Amount", "Debt", "Balance", etc.)
   - Optional column:
     - **Email**
   - Phone number formats accepted: `+254712345678`, `0712345678`, `254712345678`
   - Maximum file size: 10MB

### Step-by-Step Guide

#### **Step 1: Access Bulk Import**

**For Credit Collectors/Credit Heads:**
1. Navigate to Credit Collection Dashboard
2. Click on "Bulk Import" in the Quick Actions section

**For Law Firm Admins:**
1. Navigate to Admin Dashboard
2. Click on "Bulk Import" in the Quick Actions section

#### **Step 2: Prepare Your Excel File**

Download the sample template or prepare your Excel file with the following structure:

| Name | Phone | Amount | Email (Optional) |
|------|-------|---------|------------------|
| John Doe | +254712345678 | 50000 | john@example.com |
| Jane Smith | 0722345678 | 75000 | jane@example.com |
| Bob Wilson | 0733456789 | 120000 | |

#### **Step 3: Import Cases**

1. Enter the **Bank/Creditor Name** (e.g., "KCB Bank", "Equity Bank")
2. Click "Click to upload Excel file" or drag and drop your file
3. Review the file details
4. Click "Import Cases"
5. Wait for the import to complete

#### **Step 4: Review Import Results**

After import:
- View summary: Total processed, successful, and failed imports
- Review any errors (with row numbers)
- Each successful case is created with:
  - Case title: `[Bank Name] - [Debtor Name] Debt Collection`
  - Unique case reference number
  - Status: "new"
  - Priority: "high" if amount > KES 100,000, otherwise "medium"

#### **Step 5: Send Bulk SMS (Optional)**

After successful import:
1. Click "Send Bulk SMS" button
2. Choose between:
   - **Use Default Template**: Pre-formatted professional message
   - **Custom Message**: Write your own (use placeholders: `{name}`, `{amount}`, `{bank}`, `{currency}`)
3. Preview the message
4. Review the recipient list
5. Click "Send Bulk SMS to [X] Recipients"
6. Wait for SMS sending to complete
7. Review results: sent vs. failed messages

### SMS Message Examples

#### Default Template:
```
Dear [Name], this is a reminder that you have an outstanding debt of KES [Amount] with [Bank]. Please contact us to arrange payment. Thank you.
```

#### Custom Message Example:
```
Hello {name}, you have a pending payment of {currency} {amount} to {bank}. Please settle by end of month. Call us on 0712345678.
```

## API Endpoints

### Bulk Import
- **POST** `/api/credit-cases/bulk-import`
  - Body: `multipart/form-data` with `file` and `bankName`
  - Returns: Import results with batch ID

### Bulk SMS
- **POST** `/api/credit-cases/bulk-sms`
  - Body: `{ importBatchId, customMessage, useTemplate }`
  - Returns: SMS sending results

### Single SMS
- **POST** `/api/credit-cases/:id/send-sms`
  - Body: `{ message, useTemplate }`
  - Returns: SMS sending result

### Get Import Batches
- **GET** `/api/credit-cases/import-batches`
  - Returns: List of all import batches with statistics

### Get Cases by Batch
- **GET** `/api/credit-cases/import-batch/:batchId`
  - Returns: All cases in a specific import batch

## Database Changes

### CreditCase Model - New Fields:
```javascript
{
  bankName: String,           // Name of the bank/creditor
  importBatchId: String,      // Unique ID for the import batch
  importedAt: Date,           // When the case was imported
  importedBy: ObjectId        // User who performed the import
}
```

## Access Control

**Who can use this feature:**
- ✅ Law Firm Admins
- ✅ Credit Heads
- ✅ Debt Collectors

**Who cannot use this feature:**
- ❌ Legal Heads
- ❌ Advocates
- ❌ System Owners (unless they have credit collection access)

## Technical Details

### Backend Stack:
- **ExcelJS**: Excel file parsing
- **Africa's Talking**: SMS gateway
- **Multer**: File upload handling
- **UUID**: Batch ID generation

### Frontend Stack:
- **React**: UI components
- **Axios**: API calls
- **React Hot Toast**: Notifications

### Phone Number Validation:
- Supports Kenyan phone numbers
- Formats: `+254XXXXXXXXX`, `0XXXXXXXXX`, `254XXXXXXXXX`
- Auto-converts to international format (+254...)

### Error Handling:
- File validation (type, size)
- Row-level error tracking
- SMS delivery status per recipient
- Network error handling with retries

## Troubleshooting

### Import Issues:

**Problem**: "Excel file must contain columns for: Name, Phone/Contact, and Amount/Debt"
- **Solution**: Ensure your Excel file has headers with these keywords in the first row

**Problem**: Some rows failed to import
- **Solution**: Check the error report for specific row numbers and fix the data (missing fields, invalid phone numbers, non-numeric amounts)

**Problem**: File upload fails
- **Solution**: Ensure file size is under 10MB and file type is .xlsx or .xls

### SMS Issues:

**Problem**: "SMS service is not configured"
- **Solution**: Admin needs to add Africa's Talking credentials to `.env` file and restart the server

**Problem**: "No valid phone numbers found"
- **Solution**: Ensure phone numbers are in correct format (+254... or 07...)

**Problem**: Some SMS failed to send
- **Solution**: Check the failed SMS report for specific phone numbers and reasons (usually invalid numbers or network issues)

## Cost Considerations

- **SMS Costs**: Each SMS sent through Africa's Talking incurs a cost (typically KES 0.80 - 1.00 per SMS)
- **Recommendation**: Review recipient list carefully before sending bulk SMS
- **Testing**: Use Africa's Talking sandbox for testing before production use

## Best Practices

1. **Data Quality**: Clean your Excel data before import (remove duplicates, validate phone numbers)
2. **Batch Size**: Import in manageable batches (100-500 cases at a time) for better error handling
3. **SMS Timing**: Send SMS during business hours (9 AM - 5 PM) for better response rates
4. **Message Length**: Keep SMS under 160 characters to avoid multi-part messages (which cost more)
5. **Follow-up**: Track SMS delivery status and follow up on failed messages
6. **Documentation**: Keep records of import batches and SMS campaigns for audit purposes

## Future Enhancements

Potential improvements for future versions:
- Schedule SMS for later delivery
- SMS templates library
- SMS delivery reports
- Excel export of import results
- Support for more SMS gateways (Twilio, etc.)
- Bulk case assignment after import
- Duplicate detection during import
- Import history and analytics

## Support

For issues or questions:
1. Check this documentation
2. Review error messages carefully
3. Contact your system administrator
4. Check Africa's Talking dashboard for SMS delivery logs

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Author**: Law Firm SaaS Team

