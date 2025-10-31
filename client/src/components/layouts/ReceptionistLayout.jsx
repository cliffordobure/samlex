import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import NotificationBell from "../common/NotificationBell";
import {
  FaHome,
  FaFolderOpen,
  FaCalendarAlt,
  FaUsers,
  FaBars,
  FaTimes,
  FaSearch,
  FaUserCircle,
  FaSignOutAlt,
  FaBuilding,
} from "react-icons/fa";

const ReceptionistLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const navigation = [
    {
      name: "Overview",
      href: "/receptionist",
      icon: <FaHome className="w-5 h-5" />,
      description: "Dashboard overview and statistics"
    },
    {
      name: "Cases",
      href: "/receptionist/cases",
      icon: <FaFolderOpen className="w-5 h-5" />,
      description: "View and manage cases"
    },
    {
      name: "Clients",
      href: "/receptionist/clients",
      icon: <FaUsers className="w-5 h-5" />,
      description: "Manage client information"
    },
    {
      name: "Calendar",
      href: "/receptionist/calendar",
      icon: <FaCalendarAlt className="w-5 h-5" />,
      description: "View appointments and schedules"
    },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-pink-900/20 to-purple-900/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 mt-4 text-lg">Loading receptionist dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-900 via-pink-900/20 to-purple-900/20">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent
          navigation={navigation}
          user={user}
          handleLogout={handleLogout}
          location={location}
          handleNavClick={handleNavClick}
        />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 shadow-xl">
            <SidebarContent
              navigation={navigation}
              user={user}
              handleLogout={handleLogout}
              location={location}
              handleNavClick={handleNavClick}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-72 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-gradient-to-r from-slate-800/95 to-slate-700/95 backdrop-blur-sm border-b border-slate-600/50 shadow-lg">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  {sidebarOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
                </button>
                <div className="relative flex-1 max-w-md">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search cases, clients, documents..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-white font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-slate-400">Receptionist</div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-pink-500/30">
                    <FaUserCircle className="w-6 h-6 text-pink-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, user, handleLogout, location, handleNavClick }) => {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
            <FaBuilding className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg">
              {user?.lawFirm?.firmName || user?.lawFirm?.name || "Law Firm"}
            </div>
            <div className="text-slate-400 text-xs">Receptionist Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              {item.icon}
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-slate-400">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
        >
          <FaSignOutAlt className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ReceptionistLayout;

