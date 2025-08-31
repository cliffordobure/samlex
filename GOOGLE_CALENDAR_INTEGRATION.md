# Google Calendar Integration Guide

## 🎯 Overview

Your law firm SaaS now includes **enhanced Google Calendar integration**! This feature allows you to export your calendar events (court dates, follow-ups, assignments, etc.) to Google Calendar for better organization and synchronization.

## ✨ New Features (Updated!)

### 1. **Direct Google Calendar Integration** 🆕

- **Add All to Google**: Add all calendar events directly to Google Calendar (as one bulk event)
- **Add Month to Google**: Add current month events directly to Google Calendar (as one bulk event)
- **Add Individually**: Open Google Calendar for each event separately (NEW!)
- **Add Individually Month**: Open Google Calendar for each current month event separately (NEW!)
- **Individual Events**: Add single events directly to Google Calendar
- **No file downloads required** - Opens Google Calendar directly in your browser

### 2. **Traditional ICS Export** (Still Available)

- Export all calendar events as an `.ics` file
- Export current month events as an `.ics` file
- Import the file directly into Google Calendar
- Perfect for backup and offline use

## 🚀 How to Use (Updated!)

### **Method 1: Direct Google Calendar Integration (Recommended for Google Users)** 🆕

#### **Add All Events to Google Calendar (Bulk)**

1. **Navigate to your calendar**:

   - Legal Cases: Go to `/legal/calendar`
   - Credit Collection: Go to `/credit-collection/calendar`
   - Admin Calendar: Go to `/admin/calendar`

2. **Click "Add All to Google"**:

   - Located in the top-right corner of the calendar
   - **Blue button with Google icon**
   - Opens Google Calendar directly in a new tab
   - All events are combined into one calendar entry with details

3. **In Google Calendar**:
   - Review the combined event that contains all your events
   - Click "Save" to add the bulk event to your Google Calendar
   - **Note**: This creates one event with all events listed in the description

#### **Add All Events Individually (NEW!)** 🎯

1. **Navigate to your calendar**
2. **Click "Add Individually"**:

   - **Gray button with Google icon**
   - Opens Google Calendar for each event separately
   - Each event opens in its own tab (with 500ms delay between tabs)

3. **In Google Calendar**:
   - Each tab will have one event pre-filled
   - Click "Save" on each tab to add individual events to your Google Calendar
   - **Result**: Each event appears as a separate entry in your Google Calendar

#### **Add Current Month Events to Google Calendar (Bulk)**

1. **Navigate to your calendar**
2. **Click "Add Month to Google"**:

   - **Blue button with Google icon**
   - Opens Google Calendar with only current month events (as one bulk event)
   - Perfect for regular monthly updates

3. **In Google Calendar**:
   - Review the month's events (combined into one entry)
   - Click "Save" to add them to your Google Calendar

#### **Add Current Month Events Individually (NEW!)** 🎯

1. **Navigate to your calendar**
2. **Click "Add Individually Month"**:

   - **Blue button with Google icon**
   - Opens Google Calendar for each current month event separately
   - Each event opens in its own tab

3. **In Google Calendar**:
   - Each tab will have one current month event pre-filled
   - Click "Save" on each tab to add individual events to your Google Calendar
   - **Result**: Each current month event appears as a separate entry in your Google Calendar

#### **Add Individual Events to Google Calendar**

1. **Click on any event** in your calendar
2. **Click "Add to Google Calendar"** in the event modal
3. **Google Calendar opens** in a new tab with the event pre-filled
4. **Click "Save"** to add the event to your Google Calendar

### **Method 2: Traditional ICS Export (For Backup/Offline Use)**

#### **Export All Events**

1. **Navigate to your calendar**
2. **Click "Export All"**:

   - **Gray button with download icon**
   - Downloads a `.ics` file with all your events

3. **Import to Google Calendar**:
   - Open [Google Calendar](https://calendar.google.com)
   - Click the gear icon (Settings) → "Settings"
   - Scroll down to "Import & Export"
   - Click "Import" and select your downloaded `.ics` file
   - Choose your calendar and click "Import"

#### **Export Current Month**

1. **Navigate to your calendar**
2. **Click "Export Month"**:

   - Downloads only events from the current month
   - Useful for regular updates

3. **Import to Google Calendar** (same as above)

## 🎯 Which Method Should You Use?

### **For Google Calendar Users (Recommended)** 🎯

- **Use "Add Individually"** or **"Add Individually Month"** for separate calendar entries
- **Use "Add All to Google"** or **"Add Month to Google"** for bulk entries
- **No file downloads required**
- **Direct integration** with Google Calendar

### **For Backup/Offline Use**

- **Use "Export All"** or **"Export Month"** for `.ics` files
- **Perfect for backup** and offline access
- **Compatible with all calendar applications**

## 📅 Event Types Included

### **Legal Cases Calendar**

- **Court Dates**: Main court hearing dates
- **Next Hearing**: Next scheduled hearing dates
- **Mentioning Dates**: Court mentioning dates
- **Due Dates**: Case due dates
- **Assignment Events**: When cases are assigned

### **Credit Collection Calendar**

- **Assignment Events**: When cases are assigned to debt collectors
- **Follow-up Events**: Follow-up dates from case notes
- **Promised Payments**: Payment due dates
- **Due Dates**: Case due dates

### **Admin Calendar**

- **All Events**: Combines both legal and credit collection events
- **Filtered Views**: Filter by case type (All, Credit, Legal)

## 🔧 Technical Details

### **Direct Google Calendar Integration**

- **Format**: Google Calendar URL with pre-filled event data
- **Compatibility**: Works with any browser
- **Timezone**: Uses your local timezone
- **No file downloads**: Direct browser integration

### **ICS File Export**

- **Format**: iCal/ICS (`.ics` files)
- **Compatibility**: Works with Google Calendar, Outlook, Apple Calendar, and most calendar applications
- **Encoding**: UTF-8
- **Timezone**: Uses your local timezone

### **Event Information Included**

- **Title**: Event title (e.g., "Court: Case ABC123")
- **Date & Time**: Event date and time
- **Description**: Case details and notes
- **Location**: Court location or case location (if available)
- **Duration**: 1 hour (default)

## 🎨 User Interface

### **Button Layout**

```
[Today] [Export All] [Add All to Google] [Export Month] [Add Month to Google]
```

### **Button Colors**

- **Blue buttons** (Primary): Direct Google Calendar integration
- **Gray buttons** (Outline): ICS file export

### **Icons**

- **📥 Download icon**: ICS file export
- **🔗 Google icon**: Direct Google Calendar integration

## 🔄 Regular Updates

### **Recommended Workflow for Google Users**

1. **Weekly**: Use "Add Month to Google" for current month events
2. **Monthly**: Use "Add All to Google" for complete calendar sync
3. **As needed**: Use individual event "Add to Google Calendar" for important dates

### **Recommended Workflow for Backup Users**

1. **Weekly**: Use "Export Month" for current month backup
2. **Monthly**: Use "Export All" for complete calendar backup
3. **As needed**: Use individual event export for important dates

## 🛠️ Troubleshooting

### **Common Issues**

#### **Google Calendar Won't Open**

- **Solution**: Check if pop-ups are blocked in your browser
- **Fix**: Allow pop-ups for your law firm SaaS domain
- **Alternative**: Right-click the button and select "Open in new tab"

#### **Events Show Wrong Time**

- **Solution**: Check your timezone settings in Google Calendar
- **Fix**: Adjust timezone in Google Calendar settings

#### **Missing Events**

- **Check**: Ensure events have valid dates
- **Verify**: Events are within the selected date range
- **Refresh**: Re-export the calendar

#### **Duplicate Events**

- **Solution**: Clear existing events before importing
- **Alternative**: Import to a new calendar

### **Browser Compatibility**

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support

## 📞 Support

### **Getting Help**

1. **Check this guide** for common solutions
2. **Contact support** if issues persist
3. **Provide details**: Include browser, error messages, and steps taken

### **Feature Requests**

- **New integrations**: Request additional calendar platforms
- **Enhanced features**: Suggest improvements
- **Customization**: Request specific formatting options

## 🔮 Future Enhancements

### **Planned Features**

- **Real-time sync**: Automatic Google Calendar integration
- **Recurring events**: Support for recurring court dates
- **Team calendars**: Shared calendar views
- **Mobile app**: Calendar integration in mobile app
- **Notifications**: Google Calendar notifications

### **Advanced Features**

- **Calendar sharing**: Share calendars with team members
- **Event templates**: Pre-defined event templates
- **Bulk operations**: Bulk event management
- **Analytics**: Calendar usage analytics

## 📋 Best Practices

### **For Google Calendar Users**

1. **Use direct integration**: Prefer "Add to Google" buttons over file downloads
2. **Regular sync**: Use monthly sync for up-to-date calendar
3. **Event management**: Keep events up-to-date in your Google Calendar
4. **Mobile access**: Access calendar on mobile devices

### **For Backup Users**

1. **Regular exports**: Export monthly for backup
2. **Team coordination**: Share calendar exports with team
3. **Event management**: Keep events up-to-date
4. **Backup strategy**: Maintain multiple calendar backups

## 🎉 Success Stories

### **Law Firm Benefits**

- **Improved organization**: Better event management
- **Team coordination**: Shared calendar access
- **Reduced conflicts**: Better scheduling
- **Professional appearance**: Integrated calendar system

### **User Benefits**

- **Convenience**: Access events anywhere
- **Integration**: Works with existing tools
- **Automation**: Reduced manual work
- **Reliability**: Backup calendar system

---

## 🆕 What's New in This Update?

### **Direct Google Calendar Integration**

- **No more file downloads** for Google Calendar users
- **One-click integration** with Google Calendar
- **Immediate results** - events appear instantly
- **Better user experience** for Google Calendar users

### **Enhanced User Interface**

- **Clear button labeling** - "Add to Google" vs "Export"
- **Color-coded buttons** - Blue for Google, Gray for export
- **Better tooltips** - Clear descriptions of what each button does

### **Improved Workflow**

- **Faster integration** - Direct Google Calendar access
- **Reduced steps** - No file download/upload required
- **Better feedback** - Clear success/error messages

---

**Happy Calendar Integration! 🗓️✨**
