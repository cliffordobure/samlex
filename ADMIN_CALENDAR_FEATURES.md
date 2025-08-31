# Admin Calendar Feature

## Overview

The Admin Calendar is a comprehensive calendar system that allows law firm administrators to view all cases, court dates, follow-ups, and assignments in a unified calendar interface. This feature integrates with the notification system to provide timely reminders for upcoming events.

## Features

### 1. Unified Calendar View

- **Credit Collection Cases**: Shows follow-up dates, assignment dates, escalation dates, and due dates
- **Legal Cases**: Shows court dates, next hearing dates, mentioning dates, assignment dates, and due dates
- **Filter Options**: Filter by case type (All, Credit Collection, Legal)
- **Event Types**: Different colors and icons for different event types

### 2. Event Types Displayed

#### Credit Collection Events

- **Assignment Events** (Blue): When cases are assigned to debt collectors
- **Follow-up Events** (Orange): Follow-up dates from case notes
- **Escalation Events** (Red): When cases are escalated to legal
- **Due Date Events** (Yellow): Case due dates

#### Legal Events

- **Court Dates** (Red): Main court hearing dates
- **Next Hearing** (Purple): Next scheduled hearing dates
- **Mentioning Dates** (Indigo): Court mentioning dates
- **Assignment Events** (Blue): When cases are assigned to advocates
- **Due Date Events** (Orange): Case due dates

### 3. Interactive Features

- **Event Click**: Click on any event to view detailed case information
- **Date Click**: Click on dates with multiple events to see all events for that date
- **Navigation**: Previous/Next month navigation and "Today" button
- **Case Details Modal**: View comprehensive case information including:
  - Case number and title
  - Status and priority
  - Debtor/client information
  - Court details (for legal cases)
  - Note content (for follow-up events)
  - Direct link to case details page

### 4. Notification Integration

The calendar works seamlessly with the notification system:

#### Automatic Notifications

- **Court Date Reminders**: Notifications for upcoming court dates (1-7 days in advance)
- **Follow-up Reminders**: Notifications for upcoming follow-up dates from case notes
- **Priority Levels**: Urgent (1 day), High (2-3 days), Medium (4-7 days)

#### Notification Types

- `court_date`: Court hearing reminders
- `hearing_date`: Next hearing reminders
- `mentioning_date`: Court mentioning reminders
- `follow_up_reminder`: Credit collection follow-up reminders

### 5. Technical Implementation

#### Backend Components

- **Updated Note Schema**: Added `date` and `followUpDate` fields to credit case notes
- **Notification Service**: Enhanced with follow-up date notifications
- **Scheduler Scripts**: Automated notification generation

#### Frontend Components

- **AdminCalendar.jsx**: Main calendar component
- **Route Integration**: Added `/admin/calendar` route
- **Navigation**: Added calendar link to admin sidebar

## Usage Instructions

### For Administrators

1. **Access Calendar**: Navigate to `/admin/calendar` or click "Calendar" in the admin sidebar
2. **View Events**: All events are displayed on the calendar with color coding
3. **Filter Events**: Use the dropdown to filter by case type
4. **View Details**: Click on any event to see case details
5. **Navigate**: Use arrow buttons or "Today" button to navigate months

### For System Setup

#### Running Notification Scheduler

```bash
# Run notification scheduler manually
npm run notifications

# Test notifications
npm run test-notifications
```

#### Setting Up Automated Notifications

The notification scheduler should be set up as a cron job to run daily:

```bash
# Add to crontab (runs daily at 9:00 AM)
0 9 * * * cd /path/to/server && npm run notifications
```

## Database Schema Updates

### CreditCase Note Schema

```javascript
const noteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    followUpDate: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isInternal: { type: Boolean, default: false },
  },
  { timestamps: true }
);
```

### Notification Schema

Notifications include additional fields for calendar events:

- `eventDate`: The date of the calendar event
- `actionUrl`: Direct link to the case
- `metadata`: Additional event information

## API Endpoints

### Calendar Data

The calendar uses existing API endpoints:

- `GET /api/credit-cases` - Credit collection cases
- `GET /api/legal-cases` - Legal cases
- `GET /api/notifications` - User notifications

### Notification Endpoints

- `POST /api/notifications` - Create notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Benefits

1. **Centralized View**: All case events in one calendar interface
2. **Proactive Management**: Early warning system for upcoming events
3. **Improved Efficiency**: Quick access to case details from calendar
4. **Better Organization**: Visual representation of case timelines
5. **Automated Reminders**: No manual tracking of important dates

## Future Enhancements

1. **Calendar Export**: Export calendar events to external calendar applications
2. **Recurring Events**: Support for recurring court dates or follow-ups
3. **Team Calendar**: View events for all team members
4. **Calendar Sync**: Integration with external calendar services
5. **Event Creation**: Direct creation of events from calendar interface
6. **Advanced Filtering**: Filter by user, department, or case status

## Troubleshooting

### Common Issues

1. **Events Not Showing**: Check if cases have the required date fields populated
2. **Notifications Not Working**: Verify the notification scheduler is running
3. **Calendar Not Loading**: Check browser console for JavaScript errors
4. **Permission Issues**: Ensure user has admin role permissions

### Debug Commands

```bash
# Test notification system
npm run test-notifications

# Check notification logs
tail -f server/logs/notifications.log
```

## Security Considerations

1. **Role-Based Access**: Only admin users can access the calendar
2. **Data Privacy**: Case information is filtered by user's law firm
3. **Audit Trail**: All calendar interactions are logged
4. **Input Validation**: All date inputs are validated and sanitized
