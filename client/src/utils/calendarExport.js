/**
 * Calendar Export Utility
 * Generates iCal/ICS files for Google Calendar integration
 */

// Generate iCal content for calendar events
export const generateICalContent = (
  events,
  calendarName = "Law Firm Calendar"
) => {
  const now = new Date();
  const calendarId = `law-firm-calendar-${now.getTime()}`;

  let icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Law Firm SaaS//Calendar Export//EN",
    `X-WR-CALNAME:${calendarName}`,
    `X-WR-CALDESC:Law Firm Calendar Events`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  events.forEach((event, index) => {
    const eventId = event.id || `event-${index}`;
    const startDate = event.date;
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    // Format dates for iCal (YYYYMMDDTHHMMSSZ)
    const formatDate = (date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    };

    // Escape special characters in text fields
    const escapeText = (text) => {
      return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
    };

    const description = event.description || event.title || "Calendar Event";
    const location = event.location || "";
    const summary = event.title || "Event";

    icalContent.push(
      "BEGIN:VEVENT",
      `UID:${eventId}@lawfirm-saas.com`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(description)}`,
      `LOCATION:${escapeText(location)}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT"
    );
  });

  icalContent.push("END:VCALENDAR");

  return icalContent.join("\r\n");
};

// Download iCal file
export const downloadICalFile = (
  events,
  filename = "law-firm-calendar.ics"
) => {
  const icalContent = generateICalContent(events);
  const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate Google Calendar URL for a single event
export const generateGoogleCalendarUrl = (event) => {
  const startDate = event.date;
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  const formatDate = (date) => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "Calendar Event",
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: event.description || event.title || "Calendar Event",
    location: event.location || "",
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Generate Google Calendar URL for multiple events (bulk add)
export const generateBulkGoogleCalendarUrl = (events) => {
  if (!events || events.length === 0) {
    return null;
  }

  // For bulk events, we'll create a single URL that opens Google Calendar
  // and then the user can manually add multiple events
  const firstEvent = events[0];
  const startDate = firstEvent.date;
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatDate = (date) => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  // Create a comprehensive description with all events
  const eventsDescription = events
    .map((event, index) => {
      const eventTime = event.date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${index + 1}. ${eventTime} - ${event.title}`;
    })
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Law Firm Calendar - ${events.length} Events`,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: `Multiple events from Law Firm Calendar:\n\n${eventsDescription}`,
    location: "Law Firm Calendar",
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Open Google Calendar with multiple events
export const openGoogleCalendarWithEvents = (events) => {
  if (!events || events.length === 0) {
    return false;
  }

  if (events.length === 1) {
    // Single event - use the direct URL
    const url = generateGoogleCalendarUrl(events[0]);
    window.open(url, "_blank");
    return true;
  } else {
    // Multiple events - use bulk URL
    const url = generateBulkGoogleCalendarUrl(events);
    if (url) {
      window.open(url, "_blank");
      return true;
    }
  }
  return false;
};

// Open Google Calendar for each event individually (NEW FUNCTION)
export const openGoogleCalendarForIndividualEvents = (events) => {
  if (!events || events.length === 0) {
    return false;
  }

  if (events.length === 1) {
    // Single event - use the direct URL
    const url = generateGoogleCalendarUrl(events[0]);
    window.open(url, "_blank");
    return true;
  } else {
    // Multiple events - open each one individually
    // We'll open them with a small delay to avoid overwhelming the browser
    events.forEach((event, index) => {
      setTimeout(() => {
        const url = generateGoogleCalendarUrl(event);
        window.open(url, "_blank");
      }, index * 500); // 500ms delay between each event
    });
    return true;
  }
};

// Generate Google Calendar subscription URL (for webcal)
export const generateGoogleCalendarSubscriptionUrl = (
  events,
  calendarName = "Law Firm Calendar"
) => {
  // This would typically point to a server endpoint that serves the iCal content
  // For now, we'll return a placeholder
  return `webcal://your-domain.com/api/calendar/feed/${encodeURIComponent(
    calendarName
  )}.ics`;
};

// Format event for Google Calendar
export const formatEventForGoogleCalendar = (event) => {
  return {
    summary: event.title,
    description: event.description || event.title,
    start: {
      dateTime: event.date.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: new Date(event.date.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: event.location || "",
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 }, // 1 day before
        { method: "popup", minutes: 60 }, // 1 hour before
      ],
    },
  };
};
