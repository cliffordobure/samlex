import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import NotificationBell from "../common/NotificationBell";
import {
  FaHome,
  FaChartLine,
  FaBuilding,
  FaBullseye,
  FaBars,
  FaTimes,
  FaSearch,
  FaUserCircle,
  FaSignOutAlt,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaChartBar,
} from "react-icons/fa";

const AccountantLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const navigation = [
    {
      name: "Overview",
      href: "/accountant",
      icon: <FaHome className="w-5 h-5" />,
      description: "Financial dashboard and overview",
    },
    {
      name: "Financial Tracking",
      href: "/accountant/financial-tracking",
      icon: <FaMoneyBillWave className="w-5 h-5" />,
      description: "Track money coming into the company",
    },
    {
      name: "Department Reviews",
      href: "/accountant/departments",
      icon: <FaBuilding className="w-5 h-5" />,
      description: "Review department performance",
    },
    {
      name: "Revenue Targets",
      href: "/accountant/targets",
      icon: <FaBullseye className="w-5 h-5" />,
      description: "Monitor department targets",
    },
    {
      name: "Reports",
      href: "/accountant/reports",
      icon: <FaChartBar className="w-5 h-5" />,
      description: "Financial reports and analytics",
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 mt-4 text-lg">Loading accountant layout...</p>
        </div>
      </div>
    );
  }

  const SidebarContent = ({ navigation, currentPath, user }) => (
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
            <FaFileInvoiceDollar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Accountant</h1>
            <p className="text-xs text-slate-400">Financial Management</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-green-600/90 to-emerald-600/90 text-white shadow-lg shadow-green-500/20"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
              title={item.description}
            >
              <span className={`mr-3 ${isActive ? "text-white" : "text-slate-400 group-hover:text-green-400"}`}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-900 via-green-900/20 to-emerald-900/20">
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
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-slate-700/80 hover:bg-slate-600/80 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-200"
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
          <div className="flex flex-col flex-grow bg-gradient-to-br from-slate-800 to-slate-700 border-r border-slate-600/50 shadow-2xl">
            <SidebarContent
              navigation={navigation}
              currentPath={location.pathname}
              user={user}
            />
            <div className="flex-shrink-0 flex border-t border-slate-600/50 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaUserCircle className="h-10 w-10 text-slate-400" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-2 flex-shrink-0 p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                    title="Logout"
                  >
                    <FaSignOutAlt className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top nav */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-xl border-b border-slate-600/50 shadow-2xl">
          <button
            className="px-4 border-r border-slate-600/50 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 md:hidden transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <FaBars className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-slate-400 focus-within:text-slate-200">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <FaSearch className="h-5 w-5 ml-3" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-600/50 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                    placeholder="Search..."
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <NotificationBell />
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-400">Accountant</p>
                </div>
                <FaUserCircle className="h-8 w-8 text-slate-400" />
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

export default AccountantLayout;
