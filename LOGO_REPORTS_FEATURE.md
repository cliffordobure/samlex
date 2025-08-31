# Law Firm Logo in Reports Feature

## Overview

This feature automatically includes the law firm's logo in all generated reports (PDF and Excel) when a logo has been uploaded to the system.

## How It Works

### Logo Upload

1. Law firm admins can upload their logo through the Settings page
2. Logos are stored on Cloudinary and the URL is saved in the LawFirm model
3. Supported formats: JPEG, PNG, GIF

### Report Generation

When generating reports, the system:

1. **Fetches the law firm details** including the logo URL
2. **Downloads the logo** from Cloudinary using HTTPS
3. **Embeds the logo** in the report header
4. **Falls back gracefully** if the logo cannot be loaded

## Supported Reports

### PDF Reports

- ✅ Comprehensive Law Firm Reports (all types)
- ✅ Credit Collection Cases Report
- ✅ Legal Performance Reports
- ✅ Revenue Analytics Reports

### Excel Reports

- ✅ All comprehensive reports with Excel export
- ✅ Logo is embedded as an image in the Excel file

### CSV Reports

- ✅ Credit Collection Cases CSV (includes branded filename)

## Technical Implementation

### PDF Generation

```javascript
// Logo is fetched from Cloudinary URL and embedded in PDF
const addLawFirmHeader = async (doc, lawFirm, reportTitle) => {
  if (lawFirm.logo) {
    // Fetch logo from Cloudinary
    const logoBuffer = await fetchLogoFromUrl(lawFirm.logo);
    // Embed in PDF
    doc.image(logoBuffer, 30, 30, { width: 60, height: 60 });
  }
};
```

### Excel Generation

```javascript
// Logo is embedded as an image in Excel
const logoId = workbook.addImage({
  buffer: logoBuffer,
  extension: "png", // or jpeg, gif
});
worksheet.addImage(logoId, {
  tl: { col: 0, row: 0 },
  ext: { width: 80, height: 80 },
});
```

## Benefits

1. **Professional Branding**: All reports include the law firm's logo
2. **Consistent Identity**: Maintains brand consistency across all documents
3. **Automatic Integration**: No manual intervention required
4. **Error Handling**: Gracefully handles missing or invalid logos
5. **Multiple Formats**: Supports PDF, Excel, and CSV reports

## File Naming

Reports are automatically named with the law firm's name:

- `KWCO_credit_cases_report.pdf`
- `KWCO_overview_report.xlsx`
- `KWCO_legal_performance_report.csv`

## Error Handling

- If logo URL is invalid or inaccessible, reports generate without logo
- If logo format is unsupported, falls back to text-only header
- All errors are logged but don't prevent report generation

## Future Enhancements

- Support for logo positioning options
- Custom logo sizes for different report types
- Watermark functionality
- Logo caching for better performance
