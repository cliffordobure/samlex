/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCreditCases,
  getCreditCaseById,
} from "../../store/slices/creditCaseSlice";
import { getLegalCases, getLegalCase } from "../../store/slices/legalCaseSlice";
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
  FaMoneyBillWave,
  FaPhone,
  FaEnvelope,
  FaStickyNote,
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

const AdminCalendar = () => {
  const dispatch = useDispatch();
  const { cases: creditCases, isLoading: creditLoading } = useSelector(
    (state) => state.creditCases
  );
  const { cases: legalCases, isLoading: legalLoading } = useSelector(
    (state) => state.legalCases
  );
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
  const [filterType, setFilterType] = useState("all"); // all, credit, legal

  // Load cases
  useEffect(() => {
    if (user?.lawFirm?._id) {
      dispatch(getCreditCases({ lawFirm: user.lawFirm._id }));
      dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));
    }
  }, [dispatch, user]);

  // Get calendar events from both credit and legal cases
  const getCalendarEvents = () => {
    const events = [];

    // Credit Collection Events
    if (creditCases && Array.isArray(creditCases)) {
      creditCases.forEach((creditCase) => {
        // Assignment date events
        if (creditCase.assignedAt) {
          events.push({
            id: `${creditCase._id}-assigned`,
            title: `Assigned: ${creditCase.title}`,
            date: new Date(creditCase.assignedAt),
            type: "credit_assigned",
            case: creditCase,
            caseType: "credit",
            color: "bg-blue-500",
            icon: FaUser,
          });
        }

        // Follow-up dates from notes
        if (creditCase.notes && Array.isArray(creditCase.notes)) {
          creditCase.notes.forEach((note, noteIndex) => {
            if (note.followUpDate) {
              events.push({
                id: `${creditCase._id}-followup-${noteIndex}`,
                title: `Follow-up: ${creditCase.title}`,
                date: new Date(note.followUpDate),
                type: "credit_followup",
                case: creditCase,
                caseType: "credit",
                note: note,
                color: "bg-orange-500",
                icon: FaStickyNote,
              });
            }
          });
        }

        // Escalation date events
        if (creditCase.escalationDate) {
          events.push({
            id: `${creditCase._id}-escalated`,
            title: `Escalated: ${creditCase.title}`,
            date: new Date(creditCase.escalationDate),
            type: "credit_escalated",
            case: creditCase,
            caseType: "credit",
            color: "bg-red-500",
            icon: FaExclamationTriangle,
          });
        }

        // Due date events (if any)
        if (creditCase.dueDate) {
          events.push({
            id: `${creditCase._id}-due`,
            title: `Due: ${creditCase.title}`,
            date: new Date(creditCase.dueDate),
            type: "credit_due",
            case: creditCase,
            caseType: "credit",
            color: "bg-yellow-500",
            icon: FaClock,
          });
        }
      });
    }

    // Legal Cases Events
    if (legalCases && Array.isArray(legalCases)) {
      legalCases.forEach((legalCase) => {
        // Court date events
        if (legalCase.courtDetails?.courtDate) {
          events.push({
            id: `${legalCase._id}-court`,
            title: `Court: ${legalCase.title}`,
            date: new Date(legalCase.courtDetails.courtDate),
            type: "legal_court",
            case: legalCase,
            caseType: "legal",
            color: "bg-red-600",
            icon: FaGavel,
          });
        }

        // Next hearing date events
        if (legalCase.courtDetails?.nextHearingDate) {
          events.push({
            id: `${legalCase._id}-next-hearing`,
            title: `Next Hearing: ${legalCase.title}`,
            date: new Date(legalCase.courtDetails.nextHearingDate),
            type: "legal_next_hearing",
            case: legalCase,
            caseType: "legal",
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
            type: "legal_mentioning",
            case: legalCase,
            caseType: "legal",
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
            type: "legal_due",
            case: legalCase,
            caseType: "legal",
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
            type: "legal_assigned",
            case: legalCase,
            caseType: "legal",
            color: "bg-blue-600",
            icon: FaUser,
          });
        }
      });
    }

    // Filter events based on selected filter
    let filteredEvents = events;
    if (filterType === "credit") {
      filteredEvents = events.filter((event) => event.caseType === "credit");
    } else if (filterType === "legal") {
      filteredEvents = events.filter((event) => event.caseType === "legal");
    }

    return filteredEvents.sort((a, b) => a.date - b.date);
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
      if (event.caseType === "credit") {
        const result = await dispatch(
          getCreditCaseById(event.case._id)
        ).unwrap();
        setSelectedCase(result.data);
      } else {
        const result = await dispatch(getLegalCase(event.case._id)).unwrap();
        setSelectedCase(result.data);
      }
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
      credit_assigned: "Credit Case Assigned",
      credit_followup: "Credit Follow-up",
      credit_escalated: "Credit Escalated",
      credit_due: "Credit Due Date",
      legal_court: "Court Hearing",
      legal_next_hearing: "Next Hearing",
      legal_mentioning: "Mentioning",
      legal_due: "Legal Due Date",
      legal_assigned: "Legal Case Assigned",
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
      `admin-calendar-${currentDate.getFullYear()}-${
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
      `admin-calendar-${currentDate.getFullYear()}-${
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              📅 Admin Calendar
            </h1>
            <p className="text-slate-300 text-lg">
              Comprehensive view of all cases, court dates, follow-ups, and assignments
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <FaCalendar className="text-blue-400" />
                {getCalendarEvents().length} Total Events
              </span>
              <span className="flex items-center gap-2">
                <FaGavel className="text-purple-400" />
                {getCalendarEvents().filter(e => e.caseType === 'legal').length} Legal Cases
              </span>
              <span className="flex items-center gap-2">
                <FaFileAlt className="text-orange-400" />
                {getCalendarEvents().filter(e => e.caseType === 'credit').length} Credit Cases
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="select select-bordered bg-slate-700/80 border-slate-600/50 text-white rounded-xl"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Cases</option>
              <option value="credit">Credit Collection</option>
              <option value="legal">Legal Cases</option>
            </select>
            <button 
              onClick={goToToday} 
              className="btn btn-outline border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white rounded-xl"
            >
              <FaCalendar className="mr-2" /> Today
            </button>
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FaDownload className="text-blue-400" />
          Export & Integration Options
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={handleExportToGoogleCalendar}
            className="btn btn-outline border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white rounded-xl"
            title="Export all events as ICS file"
          >
            <FaDownload className="mr-2" /> Export All
          </button>
          <button
            onClick={handleExportToGoogleCalendarDirect}
            className="btn bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-xl shadow-lg"
            title="Add all events directly to Google Calendar"
          >
            <FaGoogle className="mr-2" /> Add All to Google
          </button>
          <button
            onClick={handleExportSelectedEvents}
            className="btn btn-outline border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white rounded-xl"
            title="Export current month events as ICS file"
          >
            <FaDownload className="mr-2" /> Export Month
          </button>
          <button
            onClick={handleExportSelectedEventsToGoogle}
            className="btn bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 rounded-xl shadow-lg"
            title="Add current month events directly to Google Calendar"
          >
            <FaGoogle className="mr-2" /> Add Month to Google
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <button
            onClick={handleExportToGoogleCalendarIndividual}
            className="btn btn-outline border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white rounded-xl"
            title="Open Google Calendar for individual events"
          >
            <FaGoogle className="mr-2" /> Add Individually
          </button>
          <button
            onClick={handleExportSelectedEventsToGoogleIndividual}
            className="btn bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-xl shadow-lg"
            title="Open Google Calendar for individual current month events"
          >
            <FaGoogle className="mr-2" /> Add Individually Month
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="btn btn-circle bg-slate-700/80 border-slate-600/50 text-slate-300 hover:bg-slate-600 hover:text-white hover:scale-110 transition-all duration-200 shadow-lg"
          >
            <FaArrowLeft />
          </button>
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <p className="text-slate-400 text-sm">
              {getCalendarEvents().filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getMonth() === currentDate.getMonth() && 
                       eventDate.getFullYear() === currentDate.getFullYear();
              }).length} events this month
            </p>
          </div>
          <button
            onClick={goToNextMonth}
            className="btn btn-circle bg-slate-700/80 border-slate-600/50 text-slate-300 hover:bg-slate-600 hover:text-white hover:scale-110 transition-all duration-200 shadow-lg"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-600/50 shadow-2xl">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-px bg-slate-700/80">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="bg-slate-800/90 p-4 text-center text-sm font-bold text-white border-b border-slate-600/50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-px bg-slate-700/80">
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
                className={`min-h-36 p-3 border border-slate-600/50 transition-all duration-200 ${
                  isCurrentMonth 
                    ? "bg-gradient-to-br from-slate-700/50 to-slate-600/50 hover:from-slate-600/50 hover:to-slate-500/50" 
                    : "bg-slate-800/30"
                } ${isToday ? "ring-2 ring-blue-500/50 shadow-blue-500/25" : ""} ${
                  events.length > 3 ? "cursor-pointer" : ""
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
                <div className="text-right mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      isCurrentMonth ? "text-white" : "text-slate-500"
                    } ${isToday ? "text-blue-400 font-bold" : ""}`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Events */}
                <div className="space-y-2">
                  {events.slice(0, 3).map((event) => {
                    const EventIcon = event.icon;
                    return (
                      <div
                        key={event.id}
                        className={`${event.color} text-white text-xs p-2 rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-lg`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <EventIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate font-medium">{event.title}</span>
                        </div>
                      </div>
                    );
                  })}
                  {events.length > 3 && (
                    <div className="text-xs text-slate-400 text-center py-2 bg-slate-600/30 rounded-lg border border-slate-500/30">
                      +{events.length - 3} more events
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl max-w-2xl w-full mx-4 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-bold text-white">{selectedEvent.title}</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="btn btn-circle bg-slate-700/80 border-slate-600/50 text-slate-300 hover:bg-slate-600 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Event Type</label>
                  <div className="flex items-center gap-3">
                    {React.createElement(selectedEvent.icon, {
                      className: "text-blue-400 text-lg"
                    })}
                    <span className="text-white font-medium">{getEventTypeLabel(selectedEvent.type)}</span>
                  </div>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Event Date</label>
                  <div className="flex items-center gap-3">
                    <FaCalendar className="text-green-400 text-lg" />
                    <span className="text-white font-medium">{selectedEvent.date.toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Event Time</label>
                  <div className="flex items-center gap-3">
                    <FaClock className="text-orange-400 text-lg" />
                    <span className="text-white font-medium">{formatTime(selectedEvent.date)}</span>
                  </div>
                </div>
              </div>

              {selectedCase && (
                <>
                  <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Case Number</label>
                    <div className="font-mono text-sm bg-slate-600/50 p-3 rounded-lg text-white border border-slate-500/50">
                      {selectedCase.caseNumber}
                    </div>
                  </div>

                  <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Case Type</label>
                    <div className="flex items-center gap-3">
                      {React.createElement(
                        getCaseTypeIcon(selectedCase.caseType || "other"),
                        {
                          className: "text-purple-400 text-lg",
                        }
                      )}
                      <span className="text-white font-medium">
                        {selectedCase.caseType?.replace("_", " ").toUpperCase() ||
                          "CREDIT COLLECTION"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Status</label>
                    <div className="inline-flex px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-medium">
                      {selectedCase.status?.replace("_", " ").toUpperCase()}
                    </div>
                  </div>

                  {selectedEvent.caseType === "credit" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Debtor</label>
                        <div className="flex items-center gap-3">
                          <FaUser className="text-green-400 text-lg" />
                          <span className="text-white font-medium">{selectedCase.debtorName}</span>
                        </div>
                      </div>

                      {selectedCase.debtorContact && (
                        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Contact</label>
                          <div className="flex items-center gap-3">
                            <FaPhone className="text-blue-400 text-lg" />
                            <span className="text-white font-medium">{selectedCase.debtorContact}</span>
                          </div>
                        </div>
                      )}

                      {selectedCase.debtAmount && (
                        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50 sm:col-span-2">
                          <label className="block text-sm font-semibold text-slate-300 mb-2">Amount</label>
                          <div className="flex items-center gap-3">
                            <FaMoneyBillWave className="text-green-400 text-lg" />
                            <span className="text-white font-medium">
                              {selectedCase.currency || "KES"}{" "}
                              {selectedCase.debtAmount?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedEvent.caseType === "legal" &&
                    selectedCase.courtDetails && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {selectedCase.courtDetails.courtName && (
                          <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Court</label>
                            <div className="flex items-center gap-3">
                              <FaGavel className="text-red-400 text-lg" />
                              <span className="text-white font-medium">{selectedCase.courtDetails.courtName}</span>
                            </div>
                          </div>
                        )}

                        {selectedCase.courtDetails.courtRoom && (
                          <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Court Room</label>
                            <div className="flex items-center gap-3">
                              <FaMapMarkerAlt className="text-orange-400 text-lg" />
                              <span className="text-white font-medium">{selectedCase.courtDetails.courtRoom}</span>
                            </div>
                          </div>
                        )}

                        {selectedCase.courtDetails.judgeAssigned && (
                          <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Judge</label>
                            <div className="flex items-center gap-3">
                              <FaUser className="text-purple-400 text-lg" />
                              <span className="text-white font-medium">{selectedCase.courtDetails.judgeAssigned}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {selectedEvent.note && (
                    <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Note Content</label>
                      <div className="bg-slate-600/50 p-4 rounded-lg text-white text-sm border border-slate-500/50">
                        {selectedEvent.note.content}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-600/50">
              <button
                onClick={() => setShowEventModal(false)}
                className="btn btn-outline border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white rounded-xl"
              >
                Close
              </button>
              {selectedCase && (
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    // Navigate to case details
                    window.location.href =
                      selectedEvent.caseType === "credit"
                        ? `/admin/credit-case/${selectedCase._id}`
                        : `/admin/legal-case/${selectedCase._id}`;
                  }}
                  className="btn bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-xl shadow-lg"
                >
                  <FaEye className="mr-2" />
                  View Case
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date Events Modal */}
      {showDateEventsModal && selectedDateForEvents && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl max-w-2xl w-full mx-4 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-bold text-white">
                📅 Events for {selectedDateForEvents.toLocaleDateString()}
              </h3>
              <button
                onClick={() => setShowDateEventsModal(false)}
                className="btn btn-circle bg-slate-700/80 border-slate-600/50 text-slate-300 hover:bg-slate-600 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedDateEvents.map((event) => {
                const EventIcon = event.icon;
                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-xl border border-slate-600/50 ${event.color} text-white shadow-lg hover:shadow-xl transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-lg">
                          <EventIcon className="text-xl" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{event.title}</h4>
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
                        className="btn btn-sm bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl"
                      >
                        <FaEye className="mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end p-6 border-t border-slate-600/50">
              <button
                onClick={() => setShowDateEventsModal(false)}
                className="btn btn-outline border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white rounded-xl"
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

export default AdminCalendar;
