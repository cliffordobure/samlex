/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLegalCases } from "../../store/slices/legalCaseSlice";
import { getLegalCase } from "../../store/slices/legalCaseSlice";
import toast from "react-hot-toast";
import {
  FaCalendar,
  FaGavel,
  FaBalanceScale,
  FaBuilding,
  FaHome,
  FaBriefcase,
  FaUsers,
  FaFileAlt,
  FaTimes,
  FaEye,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendarAlt,
  FaArrowLeft,
  FaArrowRight,
  FaDownload,
  FaGoogle,
  FaExternalLinkAlt,
} from "react-icons/fa";
import {
  downloadICalFile,
  generateGoogleCalendarUrl,
  openGoogleCalendarWithEvents,
  openGoogleCalendarForIndividualEvents,
} from "../../utils/calendarExport";

const CourtCalendar = () => {
  const dispatch = useDispatch();
  const { cases, isLoading } = useSelector((state) => state.legalCases);
  const { user } = useSelector((state) => state.auth);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("month"); // month, week, day
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDateEventsModal, setShowDateEventsModal] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [selectedDateForEvents, setSelectedDateForEvents] = useState(null);

  // Load cases
  useEffect(() => {
    if (user?.lawFirm?._id) {
      dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));
    }
  }, [dispatch, user]);

  // Get calendar events from cases
  const getCalendarEvents = () => {
    if (!cases || !Array.isArray(cases)) return [];

    const events = [];

    cases.forEach((legalCase) => {
      // Court date events
      if (legalCase.courtDetails?.courtDate) {
        events.push({
          id: `${legalCase._id}-court`,
          title: `Court: ${legalCase.title}`,
          date: new Date(legalCase.courtDetails.courtDate),
          type: "court",
          case: legalCase,
          color: "bg-red-500",
          icon: FaGavel,
        });
      }

      // Next hearing date events
      if (legalCase.courtDetails?.nextHearingDate) {
        events.push({
          id: `${legalCase._id}-next-hearing`,
          title: `Next Hearing: ${legalCase.title}`,
          date: new Date(legalCase.courtDetails.nextHearingDate),
          type: "next_hearing",
          case: legalCase,
          color: "bg-purple-500",
          icon: FaGavel,
        });
      }

      // Mentioning date events
      if (legalCase.courtDetails?.mentioningDate) {
        events.push({
          id: `${legalCase._id}-mentioning`,
          title: `Mentioning: ${legalCase.title}`,
          date: new Date(legalCase.courtDetails.mentioningDate),
          type: "mentioning",
          case: legalCase,
          color: "bg-indigo-500",
          icon: FaCalendarAlt,
        });
      }

      // Due date events
      if (legalCase.dueDate) {
        events.push({
          id: `${legalCase._id}-due`,
          title: `Due: ${legalCase.title}`,
          date: new Date(legalCase.dueDate),
          type: "due",
          case: legalCase,
          color: "bg-orange-500",
          icon: FaClock,
        });
      }

      // Assignment date events
      if (legalCase.assignedAt) {
        events.push({
          id: `${legalCase._id}-assigned`,
          title: `Assigned: ${legalCase.title}`,
          date: new Date(legalCase.assignedAt),
          type: "assigned",
          case: legalCase,
          color: "bg-blue-500",
          icon: FaUser,
        });
      }
    });

    return events.sort((a, b) => a.date - b.date);
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const events = getCalendarEvents();
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    while (currentDay <= lastDay || days.length < 42) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  // Handle event click
  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    setSelectedCase(null);
    setShowEventModal(true);

    // Fetch full case details
    try {
      const result = await dispatch(getLegalCase(event.case._id)).unwrap();
      setSelectedCase(result.data);
    } catch (error) {
      toast.error("Failed to load case details");
    }
  };

  // Handle date click to show all events
  const handleDateClick = (date, events) => {
    if (events.length > 3) {
      setSelectedDateEvents(events);
      setSelectedDateForEvents(date);
      setShowDateEventsModal(true);
    }
  };

  // Get case type icon
  const getCaseTypeIcon = (caseType) => {
    const icons = {
      civil: FaBalanceScale,
      criminal: FaGavel,
      corporate: FaBuilding,
      family: FaUsers,
      property: FaHome,
      labor: FaBriefcase,
      debt_collection: FaFileAlt,
      other: FaFileAlt,
    };
    return icons[caseType] || FaFileAlt;
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get event type label
  const getEventTypeLabel = (type) => {
    const labels = {
      court: "Court Hearing",
      next_hearing: "Next Hearing",
      mentioning: "Mentioning",
      due: "Due Date",
      assigned: "Case Assigned",
    };
    return labels[type] || type;
  };

  // Google Calendar integration functions
  const handleExportToGoogleCalendar = () => {
    const events = getCalendarEvents();
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }

    // Export all events as iCal file
    downloadICalFile(
      events,
      `court-calendar-${currentDate.getFullYear()}-${
        currentDate.getMonth() + 1
      }.ics`
    );
    toast.success(
      "Calendar exported successfully! You can now import it into Google Calendar."
    );
  };

  const handleExportToGoogleCalendarDirect = () => {
    const events = getCalendarEvents();
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }

    // Open Google Calendar directly with all events
    const success = openGoogleCalendarWithEvents(events);
    if (success) {
      toast.success(
        `Opening Google Calendar with ${events.length} events. You can now add them to your calendar!`
      );
    } else {
      toast.error("Failed to open Google Calendar");
    }
  };

  const handleExportSingleEvent = (event) => {
    const googleCalendarUrl = generateGoogleCalendarUrl(event);
    window.open(googleCalendarUrl, "_blank");
    toast.success("Opening Google Calendar to add this event");
  };

  const handleExportSelectedEvents = () => {
    const events = getCalendarEvents();
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }

    // Filter events for current month
    const currentMonthEvents = events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });

    if (currentMonthEvents.length === 0) {
      toast.error("No events in current month to export");
      return;
    }

    downloadICalFile(
      currentMonthEvents,
      `court-calendar-${currentDate.getFullYear()}-${
        currentDate.getMonth() + 1
      }.ics`
    );
    toast.success(
      `${
        currentMonthEvents.length
      } events exported for ${currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}`
    );
  };

  const handleExportSelectedEventsToGoogle = () => {
    const events = getCalendarEvents();
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }

    // Filter events for current month
    const currentMonthEvents = events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });

    if (currentMonthEvents.length === 0) {
      toast.error("No events in current month to export");
      return;
    }

    // Open Google Calendar directly with current month events
    const success = openGoogleCalendarWithEvents(currentMonthEvents);
    if (success) {
      toast.success(
        `Opening Google Calendar with ${
          currentMonthEvents.length
        } events for ${currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}`
      );
    } else {
      toast.error("Failed to open Google Calendar");
    }
  };

  // NEW: Handle individual event creation for all events
  const handleExportToGoogleCalendarIndividual = () => {
    const events = getCalendarEvents();
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }

    const success = openGoogleCalendarForIndividualEvents(events);
    if (success) {
      toast.success(
        `Opening Google Calendar for ${events.length} individual events. Each event will open in a separate tab for you to add to your calendar!`
      );
    } else {
      toast.error("Failed to open Google Calendar");
    }
  };

  // NEW: Handle individual event creation for current month events
  const handleExportSelectedEventsToGoogleIndividual = () => {
    const events = getCalendarEvents();
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }

    // Filter events for current month
    const currentMonthEvents = events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });

    if (currentMonthEvents.length === 0) {
      toast.error("No events in current month to export");
      return;
    }

    const success = openGoogleCalendarForIndividualEvents(currentMonthEvents);
    if (success) {
      toast.success(
        `Opening Google Calendar for ${
          currentMonthEvents.length
        } individual events for ${currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}. Each event will open in a separate tab!`
      );
    } else {
      toast.error("Failed to open Google Calendar");
    }
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Court Calendar</h1>
          <p className="text-dark-400 mt-2">
            Manage court dates, due dates, and case assignments
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={goToToday} className="btn btn-outline btn-sm">
            Today
          </button>
          <button
            onClick={handleExportToGoogleCalendar}
            className="btn btn-outline btn-sm"
            title="Export all events as ICS file"
          >
            <FaDownload className="mr-1" /> Export All
          </button>
          <button
            onClick={handleExportToGoogleCalendarDirect}
            className="btn btn-primary btn-sm"
            title="Add all events directly to Google Calendar"
          >
            <FaGoogle className="mr-1" /> Add All to Google
          </button>
          <button
            onClick={handleExportSelectedEvents}
            className="btn btn-outline btn-sm"
            title="Export current month events as ICS file"
          >
            <FaDownload className="mr-1" /> Export Month
          </button>
          <button
            onClick={handleExportSelectedEventsToGoogle}
            className="btn btn-primary btn-sm"
            title="Add current month events directly to Google Calendar"
          >
            <FaGoogle className="mr-1" /> Add Month to Google
          </button>
          <button
            onClick={handleExportToGoogleCalendarIndividual}
            className="btn btn-outline btn-sm"
            title="Open Google Calendar for individual events"
          >
            <FaGoogle className="mr-1" /> Add Individually
          </button>
          <button
            onClick={handleExportSelectedEventsToGoogleIndividual}
            className="btn btn-primary btn-sm"
            title="Open Google Calendar for individual current month events"
          >
            <FaGoogle className="mr-1" /> Add Individually Month
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousMonth}
                className="btn btn-outline btn-sm"
              >
                <FaArrowLeft />
              </button>
              <h2 className="text-xl font-bold text-white">
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button
                onClick={goToNextMonth}
                className="btn btn-outline btn-sm"
              >
                <FaArrowRight />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("month")}
                className={`btn btn-sm ${
                  viewMode === "month" ? "btn-primary" : "btn-outline"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`btn btn-sm ${
                  viewMode === "week" ? "btn-primary" : "btn-outline"
                }`}
              >
                Week
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-center font-semibold text-dark-400 bg-base-200 rounded"
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday =
                day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear();
              const events = getEventsForDate(day);

              return (
                <div
                  key={index}
                  className={`min-h-32 p-2 border border-base-300 ${
                    isCurrentMonth ? "bg-base-100" : "bg-base-200"
                  } ${isToday ? "ring-2 ring-primary" : ""} ${
                    events.length > 3 ? "cursor-pointer hover:bg-base-200" : ""
                  }`}
                  onClick={
                    events.length > 3
                      ? () => handleDateClick(day, events)
                      : undefined
                  }
                  title={
                    events.length > 3
                      ? `Click to view all ${events.length} events`
                      : ""
                  }
                >
                  <div className="text-right mb-1">
                    <span
                      className={`text-sm ${
                        isCurrentMonth ? "text-white" : "text-dark-400"
                      } ${isToday ? "font-bold" : ""}`}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {events.slice(0, 3).map((event) => {
                      const EventIcon = event.icon;
                      return (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`w-full text-left p-1 rounded text-xs text-white ${event.color} hover:opacity-80 transition-opacity flex items-center gap-1`}
                        >
                          <EventIcon className="text-xs" />
                          <span className="truncate">{event.title}</span>
                        </button>
                      );
                    })}
                    {events.length > 3 && (
                      <button
                        onClick={() => handleDateClick(day, events)}
                        className="w-full text-xs text-dark-400 text-center hover:text-primary hover:bg-primary hover:bg-opacity-10 transition-all cursor-pointer rounded px-1 py-1"
                        title={`Click to view all ${events.length} events`}
                      >
                        +{events.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Legend */}
      <div className="card">
        <div className="card-body">
          <h3 className="font-bold mb-4">Event Types</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Court Hearings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm">Next Hearings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-500 rounded"></div>
              <span className="text-sm">Mentionings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm">Due Dates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Case Assignments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {getEventTypeLabel(selectedEvent.type)}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="btn btn-sm btn-outline"
              >
                <FaTimes />
              </button>
            </div>

            {selectedCase ? (
              <div className="space-y-4">
                {/* Case Header */}
                <div className="bg-base-200 p-4 rounded">
                  <div className="flex items-center gap-3 mb-2">
                    {(() => {
                      const CaseTypeIcon = getCaseTypeIcon(
                        selectedCase.caseType
                      );
                      return <CaseTypeIcon className="text-2xl text-primary" />;
                    })()}
                    <div>
                      <h4 className="font-bold text-lg">
                        {selectedCase.title}
                      </h4>
                      <p className="text-sm text-dark-400">
                        Case: {selectedCase.caseNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="badge badge-primary">
                      {selectedCase.caseType}
                    </span>
                    <span className="badge badge-secondary">
                      {selectedCase.priority}
                    </span>
                    <span className="badge badge-accent">
                      {selectedCase.status}
                    </span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Event Date</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-dark-400" />
                      {selectedEvent.date.toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Event Time</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-dark-400" />
                      {formatTime(selectedEvent.date)}
                    </div>
                  </div>

                  {(selectedEvent.type === "court" ||
                    selectedEvent.type === "next_hearing" ||
                    selectedEvent.type === "mentioning") &&
                    selectedCase.courtDetails && (
                      <>
                        {selectedCase.courtDetails.courtName && (
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">
                                Court
                              </span>
                            </label>
                            <div className="flex items-center gap-2">
                              <FaGavel className="text-dark-400" />
                              {selectedCase.courtDetails.courtName}
                            </div>
                          </div>
                        )}

                        {selectedCase.courtDetails.courtLocation && (
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">
                                Location
                              </span>
                            </label>
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="text-dark-400" />
                              {selectedCase.courtDetails.courtLocation}
                            </div>
                          </div>
                        )}

                        {selectedCase.courtDetails.judgeAssigned && (
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">
                                Judge
                              </span>
                            </label>
                            <div>{selectedCase.courtDetails.judgeAssigned}</div>
                          </div>
                        )}

                        {selectedCase.courtDetails.courtRoom && (
                          <div>
                            <label className="label">
                              <span className="label-text font-medium">
                                Court Room
                              </span>
                            </label>
                            <div>{selectedCase.courtDetails.courtRoom}</div>
                          </div>
                        )}

                        {selectedCase.courtDetails.hearingNotes && (
                          <div className="md:col-span-2">
                            <label className="label">
                              <span className="label-text font-medium">
                                Hearing Notes
                              </span>
                            </label>
                            <div className="text-sm bg-base-200 p-3 rounded">
                              {selectedCase.courtDetails.hearingNotes}
                            </div>
                          </div>
                        )}

                        {selectedCase.courtDetails.adjournmentReason && (
                          <div className="md:col-span-2">
                            <label className="label">
                              <span className="label-text font-medium">
                                Adjournment Reason
                              </span>
                            </label>
                            <div className="text-sm bg-base-200 p-3 rounded">
                              {selectedCase.courtDetails.adjournmentReason}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                  {selectedEvent.type === "assigned" &&
                    selectedCase.assignedTo && (
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            Assigned To
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <FaUser className="text-dark-400" />
                          {selectedCase.assignedTo.firstName}{" "}
                          {selectedCase.assignedTo.lastName}
                        </div>
                      </div>
                    )}
                </div>

                {/* Case Description */}
                <div>
                  <label className="label">
                    <span className="label-text font-medium">
                      Case Description
                    </span>
                  </label>
                  <div className="text-sm bg-base-200 p-3 rounded">
                    {selectedCase.description}
                  </div>
                </div>

                {/* Client Info */}
                {selectedCase.client && (
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Client</span>
                    </label>
                    <div className="text-sm">
                      {selectedCase.client.firstName}{" "}
                      {selectedCase.client.lastName}
                      <div className="text-dark-400">
                        {selectedCase.client.email}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="btn btn-outline"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      // Navigate to case details
                      window.location.href = `/legal/cases/${selectedCase._id}`;
                    }}
                    className="btn btn-primary"
                  >
                    <FaEye />
                    View Full Case
                  </button>
                  {selectedEvent && (
                    <button
                      onClick={() => handleExportSingleEvent(selectedEvent)}
                      className="btn btn-outline btn-sm"
                      title="Add this event to Google Calendar"
                    >
                      <FaGoogle className="mr-1" />
                      Add to Google Calendar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <div className="loading loading-spinner loading-lg"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Date Events Modal */}
      {showDateEventsModal && selectedDateForEvents && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                All Events for {selectedDateForEvents.toLocaleDateString()}
              </h3>
              <button
                onClick={() => setShowDateEventsModal(false)}
                className="btn btn-sm btn-outline"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3">
              {selectedDateEvents.map((event) => {
                const EventIcon = event.icon;
                return (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border ${event.color} text-white`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <EventIcon className="text-lg" />
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm opacity-90">
                            {getEventTypeLabel(event.type)}
                          </p>
                          <p className="text-xs opacity-75">
                            {formatTime(event.date)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowDateEventsModal(false);
                          handleEventClick(event);
                        }}
                        className="btn btn-sm btn-outline bg-white text-gray-800 hover:bg-gray-100"
                      >
                        <FaEye />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-action">
              <button
                onClick={() => setShowDateEventsModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtCalendar;
