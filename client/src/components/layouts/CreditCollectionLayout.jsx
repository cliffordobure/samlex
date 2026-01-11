import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import NotificationBell from "../common/NotificationBell";
import { 
  FaHome, 
  FaFolderOpen, 
  FaCalendarAlt, 
  FaChartBar, 
  FaBars, 
  FaTimes, 
  FaSearch, 
  FaUserCircle, 
  FaSignOutAlt,
  FaBuilding,
  FaGavel,
  FaFileExcel,
  FaSms,
  FaPaperPlane,
  FaBullseye
} from "react-icons/fa";

const CreditCollectionLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const navigation = [
    {
      name: "Overview",
      href: "/credit-collection",
      icon: <FaHome className="w-5 h-5" />,
      description: "Dashboard overview and statistics"
    },
    {
      name: "Cases",
      href: "/credit-collection/cases",
      icon: <FaFolderOpen className="w-5 h-5" />,
      description: "Manage credit collection cases"
    },
    {
      name: "Bulk Import",
      href: "/credit-collection/bulk-import",
      icon: <FaFileExcel className="w-5 h-5" />,
      description: "Import cases from Excel"
    },
    {
      name: "Bulk SMS",
      href: "/credit-collection/bulk-sms",
      icon: <FaSms className="w-5 h-5" />,
      description: "Send SMS to multiple debtors"
    },
    {
      name: "Single SMS",
      href: "/credit-collection/send-sms",
      icon: <FaPaperPlane className="w-5 h-5" />,
      description: "Send SMS to any phone number"
    },
    {
      name: "Send SMS",
      href: "/credit-collection/send-sms",
      icon: <FaSms className="w-5 h-5" />,
      description: "Send single SMS to any number"
    },
    {
      name: "Calendar",
      href: "/credit-collection/calendar",
      icon: <FaCalendarAlt className="w-5 h-5" />,
      description: "Schedule and view appointments"
    },
    {
      name: "Reports",
      href: "/credit-collection/reports",
      icon: <FaChartBar className="w-5 h-5" />,
      description: "Analytics and performance reports"
    },
    ...(user?.role === "credit_head"
      ? [
          {
            name: "Revenue Targets",
            href: "/credit-collection/revenue-targets",
            icon: <FaBullseye className="w-5 h-5" />,
            description: "Set and track revenue goals"
          },
        ]
      : []),
  ];

  const navigate = useNavigate();
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden ${
          sidebarOpen ? "" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-br from-slate-800 to-slate-700 border-r border-slate-600/50">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-slate-700/80 hover:bg-slate-600/80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          <SidebarContent
            navigation={navigation}
            currentPath={location.pathname}
            user={user}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <SidebarContent
            navigation={navigation}
            currentPath={location.pathname}
            user={user}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top nav */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-xl border-b border-slate-600/50 shadow-2xl">
          <button
            className="px-4 border-r border-slate-600/50 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 md:hidden transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-slate-400 focus-within:text-slate-200">
                  {/* Search can go here */}
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <NotificationBell />
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <FaUserCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm font-medium text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {user?.lawFirm?.firmName}
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30">
                      {(user?.role || "").replace("_", " ").toUpperCase()}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                      title="Sign out"
                    >
                      <FaSignOutAlt className="h-5 w-5" />
                    </button>
                  </div>
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

const SidebarContent = ({ navigation, currentPath, user }) => (
  <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-slate-800/95 to-slate-700/95 backdrop-blur-xl border-r border-slate-600/50">
    <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
      {/* Logo and Firm Name */}
      <div className="flex items-center flex-shrink-0 px-6 mb-8">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl mr-4">
          <FaGavel className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Credit Collection</h1>
          <p className="text-sm text-slate-300">{user?.lawFirm?.firmName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive =
            currentPath === item.href ||
            (item.href !== "/credit-collection" &&
              currentPath.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md"
              }`}
              title={item.description}
            >
              <span className={`mr-3 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info Section */}
      <div className="px-4 mt-8">
        <div className="p-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl border border-slate-600/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <FaUserCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-600/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Role</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30">
                {(user?.role || "").replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default CreditCollectionLayout;
