import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import NotificationBell from "../common/NotificationBell";
import {
  FaHome,
  FaFolderOpen,
  FaCalendarAlt,
  FaFileAlt,
  FaChartBar,
  FaBars,
  FaTimes,
  FaSearch,
  FaUserCircle,
  FaSignOutAlt,
  FaShieldAlt,
  FaGavel,
  FaBalanceScale,
  FaUsers,
  FaCog,
  FaBullseye,
} from "react-icons/fa";

const LegalLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const navigation = [
    {
      name: "Overview",
      href: "/legal",
      icon: <FaHome className="w-5 h-5" />,
      description: "Dashboard overview and statistics"
    },
    {
      name: "Cases",
      href: "/legal/cases",
      icon: <FaFolderOpen className="w-5 h-5" />,
      description: "Manage legal cases and proceedings"
    },
    // Only show Escalated Cases for legal heads and admins
    ...(user?.role === "legal_head" || user?.role === "law_firm_admin"
      ? [
          {
            name: "Escalated Cases",
            href: "/legal/escalated",
            icon: <FaBalanceScale className="w-5 h-5" />,
            description: "Cases escalated from credit collection"
          },
        ]
      : []),
    {
      name: "Court Calendar",
      href: "/legal/calendar",
      icon: <FaCalendarAlt className="w-5 h-5" />,
      description: "Court dates and hearings schedule"
    },
    {
      name: "Documents",
      href: "/legal/documents",
      icon: <FaFileAlt className="w-5 h-5" />,
      description: "Legal documents and filings"
    },
    {
      name: "Reports",
      href: "/legal/reports",
      icon: <FaChartBar className="w-5 h-5" />,
      description: "Performance analytics and reports"
    },
    ...(user?.role === "legal_head"
      ? [
          {
            name: "Revenue Targets",
            href: "/legal/revenue-targets",
            icon: <FaBullseye className="w-5 h-5" />,
            description: "Set and track revenue goals"
          },
        ]
      : []),
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 mt-4 text-lg">Loading legal layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent
          navigation={navigation}
          currentPath={location.pathname}
          lawFirm={user?.lawFirm}
          onNavClick={handleNavClick}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 flex z-50 md:hidden ${
          sidebarOpen ? "" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-br from-slate-800 to-slate-700">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes className="h-5 w-5 text-white" />
            </button>
          </div>
          <SidebarContent
            navigation={navigation}
            currentPath={location.pathname}
            lawFirm={user?.lawFirm}
            onNavClick={handleNavClick}
            user={user}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden md:ml-72">
        {/* Top Navigation Bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-xl border-b border-slate-600/50 shadow-lg">
          <button
            className="px-4 border-r border-slate-600/50 text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex lg:ml-0">
                <div className="relative w-full max-w-lg text-slate-400 focus-within:text-slate-200">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-5 w-5 top-1/2 transform -translate-y-1/2" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-2xl leading-5 bg-slate-700/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-slate-700 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all duration-300"
                    placeholder="Search cases, documents, clients..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center lg:ml-6 space-x-4">
              {/* Notification Bell */}
              <div className="relative">
                <NotificationBell />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <FaUserCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {user?.role?.replace("_", " ").toUpperCase()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    title="Sign out"
                  >
                    <FaSignOutAlt className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, currentPath, lawFirm, onNavClick, user, onLogout }) => (
  <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-slate-800 to-slate-700 border-r border-slate-600/50">
    {/* Logo and Firm Name */}
    <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-slate-600/50">
      <div className="flex items-center space-x-4">
        {lawFirm?.logo ? (
          <img
            src={lawFirm.logo}
            alt={`${lawFirm.firmName} Logo`}
            className="w-12 h-12 object-contain rounded-2xl shadow-lg"
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaGavel className="w-6 h-6 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">
            {lawFirm?.firmName || "Law Firm"}
          </h1>
          <p className="text-sm text-slate-400">Legal Department</p>
        </div>
      </div>
    </div>

    {/* Navigation Menu */}
    <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== "/legal" && currentPath.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavClick}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 hover:scale-105 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <span className={`mr-3 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`}>
                {item.icon}
              </span>
              <div className="flex-1">
                <span className="font-medium">{item.name}</span>
                <p className={`text-xs mt-1 ${
                  isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-slate-300 transition-colors'
                }`}>
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info Section */}
      <div className="px-4 pt-6 border-t border-slate-600/50">
        <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-2xl border border-slate-600/30">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <div className="flex items-center mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                <FaShieldAlt className="w-3 h-3 mr-1" />
                {user?.role?.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LegalLayout;
