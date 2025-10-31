import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLegalCases } from "../../store/slices/legalCaseSlice";
import { getCreditCases } from "../../store/slices/creditCaseSlice";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaGavel,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const Calendar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cases: legalCases } = useSelector((state) => state.legalCases);
  const { cases: creditCases } = useSelector((state) => state.creditCases);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.lawFirm?._id) {
      setIsLoading(true);
      Promise.all([
        dispatch(getLegalCases({ lawFirm: user.lawFirm._id, limit: 100 })),
        dispatch(getCreditCases({ lawFirm: user.lawFirm._id, limit: 100 })),
      ]).finally(() => setIsLoading(false));
    }
  }, [dispatch, user?.lawFirm?._id]);

  // Get all appointments/court dates
  const appointments = [
    ...legalCases
      .filter((c) => c.courtDetails?.courtDate)
      .map((c) => ({
        id: c._id,
        title: c.title || c.caseNumber,
        date: new Date(c.courtDetails.courtDate),
        type: "legal",
        location: c.courtDetails.courtLocation,
        case: c,
      })),
  ].sort((a, b) => a.date - b.date);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getAppointmentsForDate = (day) => {
    if (!day) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Calendar & Appointments</h1>
        <p className="text-slate-400">View upcoming court dates and appointments</p>
      </div>

      {/* Calendar Controls */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-700/50 rounded-lg text-white transition-colors"
          >
            <FaChevronLeft />
          </button>
          <h2 className="text-xl font-bold text-white">{monthName}</h2>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-700/50 rounded-lg text-white transition-colors"
          >
            <FaChevronRight />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-slate-400 font-semibold py-2">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDate(day);
            const isToday =
              day &&
              new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString() ===
                new Date().toDateString();

            return (
              <div
                key={index}
                onClick={() => day && setSelectedDate(day)}
                className={`min-h-[80px] p-2 border border-slate-600/30 rounded-lg ${
                  day
                    ? "bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer"
                    : "bg-transparent"
                } ${isToday ? "ring-2 ring-pink-500" : ""}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-semibold mb-1 ${isToday ? "text-pink-400" : "text-white"}`}>
                      {day}
                    </div>
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="text-xs bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded mb-1 truncate"
                      >
                        {apt.title}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-slate-400">+{dayAppointments.length - 2} more</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Appointments */}
      {selectedDate && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Appointments for {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate).toLocaleDateString()}
          </h3>
          <div className="space-y-3">
            {getAppointmentsForDate(selectedDate).length > 0 ? (
              getAppointmentsForDate(selectedDate).map((apt) => (
                <div
                  key={apt.id}
                  className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50"
                >
                  <div className="flex items-start gap-3">
                    <FaGavel className="text-blue-400 w-5 h-5 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{apt.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                        <div className="flex items-center gap-1">
                          <FaClock className="w-4 h-4" />
                          {apt.date.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {apt.location && (
                          <div className="flex items-center gap-1">
                            <FaMapMarkerAlt className="w-4 h-4" />
                            {apt.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">No appointments scheduled</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;

