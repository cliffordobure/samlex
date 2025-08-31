# Credit Collection Reports - Real Statistics Endpoints

This document describes the new enhanced credit collection report endpoints that provide real statistics from the database instead of mock data.

## Overview

The credit collection reports now use real data from the `CreditCase` model and related collections to provide accurate, up-to-date statistics for debt collectors, credit heads, and law firm administrators.

## New Endpoints

### 1. Comprehensive Summary
**Endpoint:** `GET /api/reports/credit-collection/comprehensive-summary`

**Description:** Provides a comprehensive overview of credit collection cases with real statistics.

**Query Parameters:**
- `period` (optional): Number of days to look back (default: 30)

**Response Data:**
```json
{
  "success": true,
  "data": {
    "totalCases": 150,
    "activeCases": 45,
    "resolvedCases": 105,
    "successRate": 70,
    "totalDebtAmount": 2500000,
    "casesByStatus": [...],
    "casesByPriority": [...],
    "recentActivity": [...],
    "monthlyTrends": [...]
  }
}
```

**Access:** `debt_collector`, `credit_head`, `law_firm_admin`, `system_owner`

### 2. Enhanced Performance Metrics
**Endpoint:** `GET /api/reports/credit-collection/enhanced-performance/:lawFirmId`

**Description:** Provides detailed performance metrics including resolution times and collector performance.

**Query Parameters:**
- `period` (optional): Number of days to look back (default: 30)

**Response Data:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCases": 150,
      "activeCases": 45,
      "resolvedCases": 105,
      "successRate": 70,
      "avgResolutionTime": 15
    },
    "collectorPerformance": [...],
    "monthlyPerformance": [...],
    "chartData": {...}
  }
}
```

**Access:** `debt_collector`, `credit_head`, `law_firm_admin`, `system_owner`

### 3. Enhanced Revenue Analytics
**Endpoint:** `GET /api/reports/credit-collection/enhanced-revenue/:lawFirmId`

**Description:** Provides detailed revenue analytics including collection fees and escalation fees.

**Query Parameters:**
- `period` (optional): Number of days to look back (default: 30)

**Response Data:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 150000,
      "totalCollectionFees": 120000,
      "totalEscalationFees": 30000,
      "monthlyGrowth": 12
    },
    "monthlyRevenue": [...],
    "revenueByStatus": [...],
    "revenueByPriority": [...],
    "chartData": {...}
  }
}
```

**Access:** `debt_collector`, `credit_head`, `law_firm_admin`, `system_owner`

### 4. Enhanced Promised Payments Analytics
**Endpoint:** `GET /api/reports/credit-collection/enhanced-promised-payments/:lawFirmId`

**Description:** Provides detailed analytics on promised payments including payment rates and trends.

**Query Parameters:**
- `period` (optional): Number of days to look back (default: 30)

**Response Data:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPromisedAmount": 500000,
      "totalPaidAmount": 350000,
      "totalPendingAmount": 150000,
      "paymentRate": 70
    },
    "monthlyPromisedPayments": [...],
    "recentPromisedPayments": [...],
    "chartData": {...}
  }
}
```

**Access:** `debt_collector`, `credit_head`, `law_firm_admin`, `system_owner`

### 5. CSV Download
**Endpoint:** `GET /api/reports/credit-collection/download-csv`

**Description:** Downloads credit collection data in CSV format.

**Query Parameters:**
- `period` (optional): Number of days to look back (default: 30)
- `department` (optional): Department filter (default: "all")

**Response:** CSV file download

**Access:** `debt_collector`, `credit_head`, `law_firm_admin`, `system_owner`

### 6. PDF Download
**Endpoint:** `GET /api/reports/credit-collection/download-pdf`

**Description:** Downloads credit collection report in PDF format.

**Query Parameters:**
- `period` (optional): Number of days to look back (default: 30)
- `department` (optional): Department filter (default: "all")

**Response:** PDF file download

**Access:** `debt_collector`, `credit_head`, `law_firm_admin`, `system_owner`

## Data Sources

### Primary Collections
- **CreditCase**: Main source for case statistics, debt amounts, and status information
- **User**: For collector performance and assignment data
- **PromisedPayments**: Embedded in CreditCase for payment analytics

### Key Fields Used
- `status`: Case status (active, resolved, closed, cancelled)
- `debtAmount`: Total debt amount for the case
- `collectionFee`: Fee charged for collection services
- `escalationFee`: Fee charged for escalated cases
- `priority`: Case priority level
- `assignedTo`: Debt collector assigned to the case
- `createdAt`: Case creation date
- `resolvedAt`: Case resolution date
- `promisedPayments`: Array of promised payment objects

## Security & Authorization

- All endpoints require authentication via JWT token
- Role-based access control ensures users can only access data for their law firm
- Debt collectors can only see their own assigned cases
- Credit heads and admins can see all cases for their law firm

## Performance Considerations

- Aggregation pipelines are optimized for performance
- Date-based filtering reduces data processing
- Indexes on key fields (lawFirm, status, createdAt, assignedTo)
- Pagination support for large datasets

## Testing

Use the test script `server/scripts/testCreditCollectionReports.js` to verify all endpoints are working correctly.

## Frontend Integration

The frontend has been updated to use these new endpoints instead of mock data. Key changes:

1. **API Calls**: Updated to use new enhanced endpoints
2. **Data Processing**: Handles real data structure from backend
3. **Error Handling**: Graceful fallback when data is unavailable
4. **Real-time Updates**: Data refreshes with actual database values

## Migration Notes

- Old mock data functions have been preserved as fallbacks
- Existing endpoints remain functional for backward compatibility
- New endpoints provide enhanced functionality with real data
- Frontend automatically detects and uses real data when available

## Future Enhancements

- Real-time data updates via WebSocket
- Advanced filtering and search capabilities
- Export to additional formats (Excel, JSON)
- Custom report builder
- Scheduled report generation
- Email delivery of reports
