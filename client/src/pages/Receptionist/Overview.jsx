import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getCreditCases } from "../../store/slices/creditCaseSlice";
import { getLegalCases } from "../../store/slices/legalCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import {
  FaFolderOpen,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaCalendarAlt,
  FaFileAlt,
  FaArrowRight,
  FaChartBar,
  FaBuilding,
} from "react-icons/fa";

const ReceptionistOverview = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cases: creditCases } = useSelector((state) => state.creditCases);
  const { cases: legalCases } = useSelector((state) => state.legalCases);
  const { users } = useSelector((state) => state.users);

  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    resolvedCases: 0,
    totalClients: 0,
    todayAppointments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.lawFirm?._id) {
      setIsLoading(true);
      Promise.all([
        dispatch(getCreditCases({ lawFirm: user.lawFirm._id, limit: 100 })),
        dispatch(getLegalCases({ lawFirm: user.lawFirm._id, limit: 100 })),
        dispatch(getUsers({ lawFirm: user.lawFirm._id, limit: 50 })),
      ]).finally(() => setIsLoading(false));
    }
  }, [dispatch, user?.lawFirm?._id]);

  useEffect(() => {
    const allCases = [...creditCases, ...legalCases];
    const activeCases = allCases.filter((c) =>
      ["assigned", "in_progress", "under_review", "court_proceedings"].includes(c.status)
    );
    const resolvedCases = allCases.filter((c) =>
      ["resolved", "closed"].includes(c.status)
    );
    
    const clients = users.filter(u => u.role === "client");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAppointments = allCases.filter((c) => {
      if (c.courtDetails?.courtDate) {
        const courtDate = new Date(c.courtDetails.courtDate);
        courtDate.setHours(0, 0, 0, 0);
        return courtDate.getTime() === today.getTime();
      }
      return false;
    });

    setStats({
      totalCases: allCases.length,
      activeCases: activeCases.length,
      resolvedCases: resolvedCases.length,
      totalClients: clients.length,
      todayAppointments: todayAppointments.length,
    });
  }, [creditCases, legalCases, users]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-6 border border-pink-500/30">
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome, {user?.firstName} {user?.lastName}!
        </h1>
        <p className="text-slate-300">Receptionist Dashboard - Overview and Quick Actions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<FaFolderOpen className="w-6 h-6" />}
          title="Total Cases"
          value={stats.totalCases}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={<FaClock className="w-6 h-6" />}
          title="Active Cases"
          value={stats.activeCases}
          color="from-orange-500 to-orange-600"
        />
        <StatCard
          icon={<FaCheckCircle className="w-6 h-6" />}
          title="Resolved"
          value={stats.resolvedCases}
          color="from-green-500 to-green-600"
        />
        <StatCard
          icon={<FaUsers className="w-6 h-6" />}
          title="Total Clients"
          value={stats.totalClients}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          icon={<FaCalendarAlt className="w-6 h-6" />}
          title="Today's Appointments"
          value={stats.todayAppointments}
          color="from-pink-500 to-pink-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickActionCard
          title="View All Cases"
          description="Browse and search through all cases"
          icon={<FaFolderOpen className="w-8 h-8" />}
          link="/receptionist/cases"
          color="from-blue-500 to-blue-600"
        />
        <QuickActionCard
          title="Manage Clients"
          description="View and update client information"
          icon={<FaUsers className="w-8 h-8" />}
          link="/receptionist/clients"
          color="from-purple-500 to-purple-600"
        />
        <QuickActionCard
          title="View Calendar"
          description="Check appointments and schedules"
          icon={<FaCalendarAlt className="w-8 h-8" />}
          link="/receptionist/calendar"
          color="from-pink-500 to-pink-600"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaChartBar className="text-pink-400" />
          Recent Activity
        </h2>
        <div className="space-y-3">
          {[...creditCases, ...legalCases].slice(0, 5).map((caseItem) => (
            <div
              key={caseItem._id}
              className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <FaFileAlt className="text-blue-400 w-5 h-5" />
              <div className="flex-1">
                <div className="text-white font-medium">{caseItem.title || caseItem.caseNumber}</div>
                <div className="text-sm text-slate-400">
                  {caseItem.status?.replace("_", " ").toUpperCase()} • {new Date(caseItem.updatedAt || caseItem.createdAt).toLocaleDateString()}
                </div>
              </div>
              <Link
                to={`/receptionist/cases/${caseItem._id}`}
                className="text-pink-400 hover:text-pink-300"
              >
                <FaArrowRight />
              </Link>
            </div>
          ))}
          {stats.totalCases === 0 && (
            <div className="text-center py-8 text-slate-400">
              No recent activity to display
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-lg`}>
    <div className="flex items-center justify-between mb-4">
      <div className="text-white/80">{icon}</div>
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-white/80 text-sm">{title}</div>
  </div>
);

const QuickActionCard = ({ title, description, icon, link, color }) => (
  <Link
    to={link}
    className={`bg-gradient-to-br ${color} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
  >
    <div className="text-white mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-white/80 text-sm">{description}</p>
  </Link>
);

export default ReceptionistOverview;

