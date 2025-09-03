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
  FaPlus,
  FaFilter,
  FaSearch,
  FaBell,
  FaStar,
  FaInfoCircle,
  FaPhone,
  FaEnvelope,
  FaUserTie,
  FaShieldAlt,
  FaFileContract,
  FaRocket,
  FaLightbulb,
  FaHandshake,
  FaAward,
  FaCalendarCheck,
  FaUserCheck,
  FaUserTimes,
  FaFileInvoiceDollar,
  FaBalanceScale as FaScale,
  FaShieldAlt as FaShield,
  FaRocket as FaRocketIcon,
  FaLightbulb as FaBulb,
  FaCog as FaSettings,
  FaMinus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaStar as FaStarIcon,
  FaBookmark,
  FaShare,
  FaPrint,
  FaEllipsisH,
  FaThumbsUp,
  FaThumbsDown,
  FaComments,
  FaPaperclip,
  FaLink,
  FaList,
  FaColumns,
  FaTh,
  FaCalendarDay,
  FaCalendarWeek,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaChevronDown,
  FaExpand,
  FaCompress,
  FaSyncAlt,
  FaCog,
  FaWifi,
  FaServer,
  FaKey,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Court Calendar
          </h1>
          <p className="text-slate-300 text-lg">
            Manage court dates, due dates, and case assignments
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={goToToday} 
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors flex items-center gap-2"
          >
            <FaCalendarCheck className="w-4 h-4" />
            Today
          </button>
          <button
            onClick={handleExportToGoogleCalendar}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors flex items-center gap-2"
            title="Export all events as ICS file"
          >
            <FaDownload className="w-4 h-4" />
            Export All
          </button>
          <button
            onClick={handleExportToGoogleCalendarDirect}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-colors flex items-center gap-2"
            title="Add all events directly to Google Calendar"
          >
            <FaGoogle className="w-4 h-4" />
            Add All to Google
          </button>
          <button
            onClick={handleExportSelectedEvents}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors flex items-center gap-2"
            title="Export current month events as ICS file"
          >
            <FaDownload className="w-4 h-4" />
            Export Month
          </button>
          <button
            onClick={handleExportSelectedEventsToGoogle}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-colors flex items-center gap-2"
            title="Add current month events directly to Google Calendar"
          >
            <FaGoogle className="w-4 h-4" />
            Add Month to Google
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors"
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("month")}
              className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                viewMode === "month" 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
              }`}
            >
                             <FaCalendar className="w-4 h-4" />
               Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                viewMode === "week" 
                  ? "bg-blue-600 text-white" 
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
              }`}
            >
              <FaCalendarWeek className="w-4 h-4" />
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
              className="p-3 text-center font-semibold text-slate-400 bg-slate-700/30 rounded-xl"
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
                className={`min-h-32 p-3 border border-slate-600/30 rounded-xl transition-all duration-300 ${
                  isCurrentMonth ? "bg-slate-700/30" : "bg-slate-800/30"
                } ${isToday ? "ring-2 ring-blue-500 bg-blue-500/10" : ""} ${
                  events.length > 3 ? "cursor-pointer hover:bg-slate-600/30" : ""
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
                    className={`text-sm font-medium ${
                      isCurrentMonth ? "text-white" : "text-slate-500"
                    } ${isToday ? "font-bold text-blue-400" : ""}`}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs text-white ${event.color} hover:opacity-80 transition-all duration-300 flex items-center gap-1 shadow-sm`}
                      >
                        <EventIcon className="text-xs" />
                        <span className="truncate font-medium">{event.title}</span>
                      </button>
                    );
                  })}
                  {events.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateClick(day, events);
                      }}
                      className="w-full text-xs text-slate-400 text-center hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer rounded-lg px-2 py-1 font-medium"
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

      {/* Event Legend */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
        <h3 className="font-bold text-white mb-4 text-lg">Event Types</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-white font-medium">Court Hearings</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-white font-medium">Next Hearings</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
            <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
            <span className="text-sm text-white font-medium">Mentionings</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-white font-medium">Due Dates</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-white font-medium">Case Assignments</span>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl border border-slate-600/50 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {getEventTypeLabel(selectedEvent.type)}
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {selectedCase ? (
                <div className="space-y-6">
                  {/* Case Header */}
                  <div className="bg-slate-700/30 p-6 rounded-xl border border-slate-600/30">
                    <div className="flex items-center gap-4 mb-4">
                      {(() => {
                        const CaseTypeIcon = getCaseTypeIcon(
                          selectedCase.caseType
                        );
                        return <CaseTypeIcon className="text-3xl text-blue-400" />;
                      })()}
                      <div>
                        <h4 className="font-bold text-xl text-white">
                          {selectedCase.title}
                        </h4>
                        <p className="text-sm text-slate-400">
                          Case: {selectedCase.caseNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium border border-blue-500/30">
                        {selectedCase.caseType}
                      </span>
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium border border-yellow-500/30">
                        {selectedCase.priority}
                      </span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium border border-green-500/30">
                        {selectedCase.status}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                      <label className="text-sm font-medium text-slate-300 mb-2 block">
                        Event Date
                      </label>
                      <div className="flex items-center gap-3">
                        <FaCalendarAlt className="text-slate-400 w-4 h-4" />
                        <span className="text-white">{selectedEvent.date.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                      <label className="text-sm font-medium text-slate-300 mb-2 block">
                        Event Time
                      </label>
                      <div className="flex items-center gap-3">
                        <FaClock className="text-slate-400 w-4 h-4" />
                        <span className="text-white">{formatTime(selectedEvent.date)}</span>
                      </div>
                    </div>

                    {(selectedEvent.type === "court" ||
                      selectedEvent.type === "next_hearing" ||
                      selectedEvent.type === "mentioning") &&
                      selectedCase.courtDetails && (
                        <>
                          {selectedCase.courtDetails.courtName && (
                            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                              <label className="text-sm font-medium text-slate-300 mb-2 block">
                                Court
                              </label>
                              <div className="flex items-center gap-3">
                                <FaGavel className="text-slate-400 w-4 h-4" />
                                <span className="text-white">{selectedCase.courtDetails.courtName}</span>
                              </div>
                            </div>
                          )}

                          {selectedCase.courtDetails.courtLocation && (
                            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                              <label className="text-sm font-medium text-slate-300 mb-2 block">
                                Location
                              </label>
                              <div className="flex items-center gap-3">
                                <FaMapMarkerAlt className="text-slate-400 w-4 h-4" />
                                <span className="text-white">{selectedCase.courtDetails.courtLocation}</span>
                              </div>
                            </div>
                          )}

                          {selectedCase.courtDetails.judgeAssigned && (
                            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                              <label className="text-sm font-medium text-slate-300 mb-2 block">
                                Judge
                              </label>
                              <span className="text-white">{selectedCase.courtDetails.judgeAssigned}</span>
                            </div>
                          )}

                          {selectedCase.courtDetails.courtRoom && (
                            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                              <label className="text-sm font-medium text-slate-300 mb-2 block">
                                Court Room
                              </label>
                              <span className="text-white">{selectedCase.courtDetails.courtRoom}</span>
                            </div>
                          )}

                          {selectedCase.courtDetails.hearingNotes && (
                            <div className="md:col-span-2 bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                              <label className="text-sm font-medium text-slate-300 mb-2 block">
                                Hearing Notes
                              </label>
                              <div className="text-sm bg-slate-800/50 p-4 rounded-lg text-slate-300">
                                {selectedCase.courtDetails.hearingNotes}
                              </div>
                            </div>
                          )}

                          {selectedCase.courtDetails.adjournmentReason && (
                            <div className="md:col-span-2 bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                              <label className="text-sm font-medium text-slate-300 mb-2 block">
                                Adjournment Reason
                              </label>
                              <div className="text-sm bg-slate-800/50 p-4 rounded-lg text-slate-300">
                                {selectedCase.courtDetails.adjournmentReason}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                    {selectedEvent.type === "assigned" &&
                      selectedCase.assignedTo && (
                        <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                          <label className="text-sm font-medium text-slate-300 mb-2 block">
                            Assigned To
                          </label>
                          <div className="flex items-center gap-3">
                            <FaUser className="text-slate-400 w-4 h-4" />
                            <span className="text-white">
                              {selectedCase.assignedTo.firstName}{" "}
                              {selectedCase.assignedTo.lastName}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Case Description */}
                  <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      Case Description
                    </label>
                    <div className="text-sm bg-slate-800/50 p-4 rounded-lg text-slate-300">
                      {selectedCase.description}
                    </div>
                  </div>

                  {/* Client Info */}
                  {selectedCase.client && (
                    <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                      <label className="text-sm font-medium text-slate-300 mb-2 block">
                        Client
                      </label>
                      <div className="text-sm text-white">
                        {selectedCase.client.firstName}{" "}
                        {selectedCase.client.lastName}
                        <div className="text-slate-400 mt-1">
                          {selectedCase.client.email}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 flex-wrap">
                    <button
                      onClick={() => setShowEventModal(false)}
                      className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors font-medium flex items-center gap-2"
                    >
                      <FaTimes className="w-4 h-4" />
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowEventModal(false);
                        // Navigate to case details
                        window.location.href = `/legal/cases/${selectedCase._id}`;
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
                    >
                      <FaEye className="w-4 h-4" />
                      View Full Case
                    </button>
                    {selectedEvent && (
                      <button
                        onClick={() => handleExportSingleEvent(selectedEvent)}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
                        title="Add this event to Google Calendar"
                      >
                        <FaGoogle className="w-4 h-4" />
                        Add to Google Calendar
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center py-12">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <span className="ml-4 text-slate-300 text-lg">Loading case details...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date Events Modal */}
      {showDateEventsModal && selectedDateForEvents && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl border border-slate-600/50 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  All Events for {selectedDateForEvents.toLocaleDateString()}
                </h3>
                <button
                  onClick={() => setShowDateEventsModal(false)}
                  className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedDateEvents.map((event) => {
                  const EventIcon = event.icon;
                  return (
                    <div
                      key={event.id}
                      className={`p-4 rounded-xl border ${event.color} text-white shadow-lg`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <EventIcon className="text-xl" />
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
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <FaEye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowDateEventsModal(false)}
                  className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtCalendar;
