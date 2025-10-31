/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCreditCases } from "../../store/slices/creditCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import creditCaseApi from "../../store/api/creditCaseApi";
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
  FaPlus,
  FaEdit,
  FaTrash,
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

const CreditCollectionCalendar = () => {
  const dispatch = useDispatch();
  const { cases: creditCases, isLoading } = useSelector(
    (state) => state.creditCases
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
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newFollowUpData, setNewFollowUpData] = useState({
    date: new Date(),
    time: "09:00",
    title: "",
    description: "",
    caseId: "",
  });
  const [newPaymentData, setNewPaymentData] = useState({
    amount: "",
    currency: "KES",
    promisedDate: new Date(),
    notes: "",
    paymentMethod: "",
    caseId: "",
  });

  // Load cases
  useEffect(() => {
    if (user?.lawFirm?._id) {
      dispatch(getCreditCases({ lawFirm: user.lawFirm._id }));
      dispatch(getUsers({ lawFirm: user.lawFirm._id }));
    }
  }, [dispatch, user]);

  // Filter cases based on user role
  const filteredCases = React.useMemo(() => {
    if (!user || !creditCases) return [];

    if (user.role === "debt_collector") {
      return creditCases.filter(
        (c) => c.assignedTo === user._id || c.assignedTo?._id === user._id
      );
    }

    return creditCases;
  }, [creditCases, user]);

  // Get calendar events from credit cases
  const getCalendarEvents = () => {
    const events = [];

    if (filteredCases && Array.isArray(filteredCases)) {
      filteredCases.forEach((creditCase) => {
        // Assignment date events
        if (creditCase.assignedAt) {
          events.push({
            id: `${creditCase._id}-assigned`,
            title: `Assigned: ${creditCase.title || creditCase.caseNumber}`,
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
                title: `Follow-up: ${
                  creditCase.title || creditCase.caseNumber
                }`,
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

        // Promised payment dates
        if (
          creditCase.promisedPayments &&
          Array.isArray(creditCase.promisedPayments)
        ) {
          creditCase.promisedPayments.forEach((payment, paymentIndex) => {
            if (payment.promisedDate && payment.status !== "cancelled") {
              const statusColor =
                payment.status === "paid"
                  ? "bg-green-500"
                  : payment.status === "overdue"
                  ? "bg-red-600"
                  : "bg-purple-500";
              events.push({
                id: `${creditCase._id}-payment-${paymentIndex}`,
                title: `Payment: ${
                  creditCase.title || creditCase.caseNumber
                } - ${payment.currency} ${payment.amount.toLocaleString()}`,
                date: new Date(payment.promisedDate),
                type: "credit_payment",
                case: creditCase,
                caseType: "credit",
                payment: payment,
                color: statusColor,
                icon: FaMoneyBillWave,
              });
            }
          });
        }

        // Due dates
        if (creditCase.dueDate) {
          events.push({
            id: `${creditCase._id}-due`,
            title: `Due: ${creditCase.title || creditCase.caseNumber}`,
            date: new Date(creditCase.dueDate),
            type: "credit_due",
            case: creditCase,
            caseType: "credit",
            color: "bg-red-500",
            icon: FaExclamationTriangle,
          });
        }
      });
    }

    return events.sort((a, b) => a.date - b.date);
  };

  const events = getCalendarEvents();

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toDateString();
    return events.filter((event) => event.date.toDateString() === dateStr);
  };

  // Navigation functions
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

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDateObj = new Date(startDate);

    while (currentDateObj <= lastDay || days.length < 42) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  };

  // Handle event click
  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    setSelectedCase(event.case);
    setShowEventModal(true);
  };

  // Handle date click
  const handleDateClick = (date, events) => {
    setSelectedDateForEvents(date);
    setSelectedDateEvents(events);
    setShowDateEventsModal(true);
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get event type label
  const getEventTypeLabel = (type) => {
    switch (type) {
      case "credit_assigned":
        return "Case Assigned";
      case "credit_followup":
        return "Follow-up";
      case "credit_payment":
        return "Promised Payment";
      case "credit_due":
        return "Due Date";
      default:
        return "Event";
    }
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
      `credit-collection-calendar-${currentDate.getFullYear()}-${
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
      `credit-collection-calendar-${currentDate.getFullYear()}-${
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

  // Handle add follow-up
  const handleAddFollowUp = () => {
    setShowAddFollowUpModal(true);
  };

  // Handle add payment
  const handleAddPayment = () => {
    setShowAddPaymentModal(true);
  };

  // Handle save follow-up
  const handleSaveFollowUp = async () => {
    try {
      if (!newFollowUpData.caseId) {
        toast.error("Please select a case");
        return;
      }

      if (!newFollowUpData.title.trim()) {
        toast.error("Please enter a title for the follow-up");
        return;
      }

      // Combine date and time
      const followUpDateTime = new Date(newFollowUpData.date);
      const [hours, minutes] = newFollowUpData.time.split(":");
      followUpDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const followUpData = {
        followUpDate: followUpDateTime.toISOString(),
        title: newFollowUpData.title,
        description: newFollowUpData.description,
        time: newFollowUpData.time,
      };

      // Call the API to add the follow-up
      const response = await creditCaseApi.addFollowUp(
        newFollowUpData.caseId,
        followUpData
      );

      if (response.data.success) {
        toast.success("Follow-up added successfully");
        setShowAddFollowUpModal(false);
        setNewFollowUpData({
          date: new Date(),
          time: "09:00",
          title: "",
          description: "",
          caseId: "",
        });

        // Refresh the cases to show the new follow-up
        dispatch(getCreditCases({ lawFirm: user.lawFirm._id }));
      }
    } catch (error) {
      console.error("Error adding follow-up:", error);
      toast.error(error.response?.data?.message || "Failed to add follow-up");
    }
  };

  // Handle save payment
  const handleSavePayment = async () => {
    try {
      if (!newPaymentData.caseId) {
        toast.error("Please select a case");
        return;
      }

      if (!newPaymentData.amount || parseFloat(newPaymentData.amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const paymentData = {
        amount: parseFloat(newPaymentData.amount),
        currency: newPaymentData.currency,
        promisedDate: newPaymentData.promisedDate.toISOString(),
        notes: newPaymentData.notes,
        paymentMethod: newPaymentData.paymentMethod,
      };

      // Call the API to add the promised payment
      const response = await creditCaseApi.addPromisedPayment(
        newPaymentData.caseId,
        paymentData
      );

      if (response.data.success) {
        toast.success("Promised payment added successfully");
        setShowAddPaymentModal(false);
        setNewPaymentData({
          amount: "",
          currency: "KES",
          promisedDate: new Date(),
          notes: "",
          paymentMethod: "",
          caseId: "",
        });

        // Refresh the cases to show the new payment
        dispatch(getCreditCases({ lawFirm: user.lawFirm._id }));
      }
    } catch (error) {
      console.error("Error adding promised payment:", error);
      toast.error(
        error.response?.data?.message || "Failed to add promised payment"
      );
    }
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border-b border-slate-600/50 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
              <FaCalendar className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                📅 Credit Collection Calendar
              </h1>
              <p className="text-slate-300 text-lg">
                Manage your follow-ups, case schedules, and payment reminders
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <FaCalendar className="text-blue-400" />
                  {getCalendarEvents().length} Total Events
                </span>
                <span className="flex items-center gap-2">
                  <FaStickyNote className="text-orange-400" />
                  {getCalendarEvents().filter(e => e.type === 'credit_followup').length} Follow-ups
                </span>
                <span className="flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-400" />
                  {getCalendarEvents().filter(e => e.type === 'credit_due').length} Due Dates
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={goToToday} className="btn btn-outline border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white rounded-xl">
              <FaCalendar className="mr-2" /> Today
            </button>
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border-b border-slate-600/50 p-6 shadow-2xl">
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

      {/* Calendar Controls */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border-b border-slate-600/50 p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousMonth}
              className="btn btn-circle bg-slate-700/80 border-slate-600/50 text-slate-300 hover:bg-slate-600 hover:text-white hover:scale-110 transition-all duration-200 shadow-lg"
            >
              <FaArrowLeft />
            </button>
            <button
              onClick={goToToday}
              className="btn bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-xl shadow-lg px-6 py-2"
            >
              <FaCalendar className="mr-2" /> Today
            </button>
            <button
              onClick={goToNextMonth}
              className="btn btn-circle bg-slate-700/80 border-slate-600/50 text-slate-300 hover:bg-slate-600 hover:text-white hover:scale-110 transition-all duration-200 shadow-lg"
            >
              <FaArrowRight />
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
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="bg-slate-700/80 border border-slate-600/50 text-white rounded-xl px-4 py-2"
            >
              <option value="month">Month View</option>
              <option value="week">Week View</option>
              <option value="day">Day View</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 sm:p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-px mb-2 bg-slate-700/80 rounded-t-2xl overflow-hidden">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center py-4 text-sm font-bold text-white bg-slate-800/90 border-b border-slate-600/50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px bg-slate-700/80 rounded-b-2xl overflow-hidden">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === today.toDateString();
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <div
                key={index}
                className={`min-h-36 p-3 border border-slate-600/50 transition-all duration-200 ${
                  isCurrentMonth 
                    ? "bg-gradient-to-br from-slate-700/50 to-slate-600/50 hover:from-slate-600/50 hover:to-slate-500/50" 
                    : "bg-slate-800/30"
                } ${isToday ? "ring-2 ring-blue-500/50 shadow-blue-500/25" : ""}`}
                onClick={() => handleDateClick(day, dayEvents)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      isToday ? "text-blue-400 font-bold" : "text-white"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full border border-blue-400/50">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Events for this day */}
                <div className="space-y-2">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`${event.color} text-white text-xs p-2 rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-lg`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {React.createElement(event.icon, { className: "w-3 h-3 flex-shrink-0" })}
                        <span className="truncate font-medium">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-slate-400 text-center py-2 bg-slate-600/30 rounded-lg border border-slate-500/30">
                      +{dayEvents.length - 2} more events
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl max-w-md w-full mx-4 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
              <h3 className="text-xl font-bold text-white">Event Details</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="btn btn-circle bg-slate-700/80 border-slate-600/50 text-slate-300 hover:bg-slate-600 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Event Type</label>
                <p className="text-white font-medium">
                  {getEventTypeLabel(selectedEvent.type)}
                </p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Title</label>
                <p className="text-white">{selectedEvent.title}</p>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Date & Time</label>
                <p className="text-white">
                  {selectedEvent.date.toLocaleDateString()} at{" "}
                  {formatTime(selectedEvent.date)}
                </p>
              </div>

              {selectedEvent.note && (
                <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Note</label>
                  <p className="text-white">{selectedEvent.note.content}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    // Navigate to case details
                    window.location.href = `/credit-collection/cases/${selectedEvent.case._id}`;
                  }}
                  className="btn bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 rounded-xl shadow-lg flex-1"
                >
                  <FaEye className="mr-2" />
                  View Case
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="btn btn-outline border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Events Modal */}
      {showDateEventsModal && selectedDateForEvents && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl max-w-lg w-full mx-4 border border-slate-600/50 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-600/50 flex-shrink-0">
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

            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8">
                  <FaCalendar className="text-4xl text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-lg">
                    No events scheduled for this date
                  </p>
                </div>
              ) : (
                selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`${event.color} text-white p-4 rounded-xl border border-slate-600/50 cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-lg`}
                    onClick={() => {
                      setShowDateEventsModal(false);
                      handleEventClick(event);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                          {React.createElement(event.icon, { className: "text-lg" })}
                        </div>
                        <div>
                          <span className="font-medium text-lg block">{event.title}</span>
                          <span className="text-sm opacity-80">
                            {formatTime(event.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-slate-600/50 flex-shrink-0">
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

      {/* Add Follow-up Modal */}
      {showAddFollowUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Follow-up</h3>
              <button
                onClick={() => setShowAddFollowUpModal(false)}
                className="text-dark-300 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-300 mb-2">Case</label>
                <select
                  value={newFollowUpData.caseId}
                  onChange={(e) =>
                    setNewFollowUpData({
                      ...newFollowUpData,
                      caseId: e.target.value,
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select a case</option>
                  {filteredCases.map((case_) => (
                    <option key={case_._id} value={case_._id}>
                      {case_.title || case_.caseNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">Date</label>
                <input
                  type="date"
                  value={newFollowUpData.date.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setNewFollowUpData({
                      ...newFollowUpData,
                      date: new Date(e.target.value),
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">Time</label>
                <input
                  type="time"
                  value={newFollowUpData.time}
                  onChange={(e) =>
                    setNewFollowUpData({
                      ...newFollowUpData,
                      time: e.target.value,
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newFollowUpData.title}
                  onChange={(e) =>
                    setNewFollowUpData({
                      ...newFollowUpData,
                      title: e.target.value,
                    })
                  }
                  placeholder="Follow-up title"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newFollowUpData.description}
                  onChange={(e) =>
                    setNewFollowUpData({
                      ...newFollowUpData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Follow-up description"
                  rows={3}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={handleSaveFollowUp}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex-1"
                >
                  Save Follow-up
                </button>
                <button
                  onClick={() => setShowAddFollowUpModal(false)}
                  className="bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Promised Payment</h3>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="text-dark-300 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-300 mb-2">Case</label>
                <select
                  value={newPaymentData.caseId}
                  onChange={(e) =>
                    setNewPaymentData({
                      ...newPaymentData,
                      caseId: e.target.value,
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select a case</option>
                  {filteredCases.map((case_) => (
                    <option key={case_._id} value={case_._id}>
                      {case_.title || case_.caseNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={newPaymentData.amount}
                  onChange={(e) =>
                    setNewPaymentData({
                      ...newPaymentData,
                      amount: e.target.value,
                    })
                  }
                  placeholder="Enter amount"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Currency
                </label>
                <select
                  value={newPaymentData.currency}
                  onChange={(e) =>
                    setNewPaymentData({
                      ...newPaymentData,
                      currency: e.target.value,
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Promised Date
                </label>
                <input
                  type="date"
                  value={
                    newPaymentData.promisedDate.toISOString().split("T")[0]
                  }
                  onChange={(e) =>
                    setNewPaymentData({
                      ...newPaymentData,
                      promisedDate: new Date(e.target.value),
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Payment Method
                </label>
                <input
                  type="text"
                  value={newPaymentData.paymentMethod}
                  onChange={(e) =>
                    setNewPaymentData({
                      ...newPaymentData,
                      paymentMethod: e.target.value,
                    })
                  }
                  placeholder="e.g., Cash, Bank Transfer, M-Pesa"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={newPaymentData.notes}
                  onChange={(e) =>
                    setNewPaymentData({
                      ...newPaymentData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Additional notes about the payment"
                  rows={3}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={handleSavePayment}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex-1"
                >
                  Save Payment
                </button>
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCollectionCalendar;
