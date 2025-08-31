/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword,
} from "../../store/slices/userSlice";
import { getDepartments } from "../../store/slices/departmentSlice";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaFilter,
  FaEdit,
  FaTrash,
  FaKey,
  FaEye,
  FaUserTie,
  FaUserShield,
  FaUserCheck,
  FaUserTimes,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft,
  FaCog,
  FaChartBar,
  FaGavel,
  FaMapMarkerAlt,
  FaUser,
} from "react-icons/fa";

const UserManagement = () => {
  return (
    <Routes>
      <Route path="/" element={<UserList />} />
      <Route path="/create" element={<CreateUser />} />
      <Route path="/:id/edit" element={<EditUser />} />
    </Routes>
  );
};

const UserList = () => {
  const dispatch = useDispatch();
  const { users, isLoading } = useSelector((state) => state.users);
  const { departments } = useSelector((state) => state.departments);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filters, setFilters] = useState({
    role: "",
    department: "",
    status: "",
    search: "",
  });
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  useEffect(() => {
    dispatch(getUsers());
    dispatch(getDepartments());
  }, [dispatch]);

  useEffect(() => {
    // Check if users exists and is an array before filtering
    if (!users || !Array.isArray(users)) {
      console.log("Users is not an array:", users);
      setFilteredUsers([]);
      return;
    }

    console.log("Filtering users:", users.length);

    let filtered = users.filter((user) => user.role !== "law_firm_admin");

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm) ||
          user.phoneNumber?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.role) {
      filtered = filtered.filter((user) => user.role === filters.role);
    }

    if (filters.department) {
      filtered = filtered.filter(
        (user) => user.department?._id === filters.department
      );
    }

    if (filters.status) {
      const isActive = filters.status === "active";
      filtered = filtered.filter((user) => user.isActive === isActive);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "name") {
        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, filters, sortConfig]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="w-3 h-3 text-slate-400" />;
    return sortConfig.direction === "asc" ? (
      <FaSortUp className="w-3 h-3 text-blue-400" />
    ) : (
      <FaSortDown className="w-3 h-3 text-blue-400" />
    );
  };

  const handleDeactivate = (user) => {
    setUserToDeactivate(user);
    setShowDeactivateModal(true);
  };

  const confirmDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await dispatch(deactivateUser(userToDeactivate._id)).unwrap();
      toast.success("User deactivated successfully");
      setShowDeactivateModal(false);
    } catch (err) {
      toast.error(err || "Failed to deactivate user");
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleResetPassword = async (user) => {
    setIsResetting(true);
    try {
      await dispatch(resetUserPassword(user._id)).unwrap();
      toast.success("Password reset and emailed to user");
    } catch (err) {
      toast.error(err || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      credit_head: <FaUserTie className="w-4 h-4" />,
      debt_collector: <FaUserCheck className="w-4 h-4" />,
      legal_head: <FaUserShield className="w-4 h-4" />,
      advocate: <FaGavel className="w-4 h-4" />,
      client: <FaUser className="w-4 h-4" />,
    };
    return roleIcons[role] || <FaUser className="w-4 h-4" />;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      credit_head: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      debt_collector: "bg-green-500/20 text-green-400 border-green-500/30",
      legal_head: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      advocate: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      client: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return roleColors[role] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getStatusIcon = (isActive) => {
    return isActive ? (
      <FaUserCheck className="w-3 h-3" />
    ) : (
      <FaUserTimes className="w-3 h-3" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                <FaUsers className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                  👥 User Management
                </h1>
                <p className="text-slate-300 text-lg">
                  Manage users, roles, and permissions within your law firm
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <FaUsers className="text-blue-400" />
                {filteredUsers.length} Total Users
              </span>
              <span className="flex items-center gap-2">
                <FaUserCheck className="text-green-400" />
                {filteredUsers.filter(u => u.isActive).length} Active Users
              </span>
              <span className="flex items-center gap-2">
                <FaBuilding className="text-orange-400" />
                {departments?.length || 0} Departments
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/admin/users/create"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center"
            >
              <FaUserPlus className="w-5 h-5" />
              Create User
            </Link>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-6 border-b border-slate-600/50">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <FaFilter className="text-blue-400" />
            Filters & Search
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-slate-300 mb-2">
                Search Users
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  id="search"
                  name="search"
                  placeholder="Search by name, email, or phone..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>
              <select
                id="role-filter"
                name="role"
                className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                value={filters.role}
                onChange={handleFilterChange}
              >
                <option value="">All Roles</option>
                <option value="credit_head">Credit Head</option>
                <option value="debt_collector">Debt Collector</option>
                <option value="legal_head">Legal Head</option>
                <option value="advocate">Advocate</option>
                <option value="client">Client</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                id="status-filter"
                name="status"
                className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ role: "", department: "", status: "", search: "" })}
                className="w-full px-4 py-2 bg-slate-600/80 hover:bg-slate-600 text-white rounded-xl transition-all duration-200 border border-slate-500/50 hover:border-slate-400/50 flex items-center justify-center gap-2"
              >
                <FaTimes className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users List Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <FaUsers className="text-blue-400" />
            User List
          </h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-400 mt-2">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/80 border-b border-slate-600/50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                      >
                        <FaUser className="w-4 h-4" />
                        Name {getSortIcon("name")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      <button
                        onClick={() => handleSort("email")}
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                      >
                        <FaEnvelope className="w-4 h-4" />
                        Email {getSortIcon("email")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      <button
                        onClick={() => handleSort("role")}
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                      >
                        <FaUserTie className="w-4 h-4" />
                        Role {getSortIcon("role")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      <button
                        onClick={() => handleSort("department")}
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                      >
                        <FaBuilding className="w-4 h-4" />
                        Department {getSortIcon("department")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      <button
                        onClick={() => handleSort("isActive")}
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                      >
                        <FaUserCheck className="w-4 h-4" />
                        Status {getSortIcon("isActive")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      <button
                        onClick={() => handleSort("lastLogin")}
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                      >
                        <FaCalendar className="w-4 h-4" />
                        Last Login {getSortIcon("lastLogin")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-white">
                      <FaCog className="w-4 h-4 inline mr-2" />
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user._id} 
                      className={`border-b border-slate-600/50 ${
                        index % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-800/30'
                      } hover:bg-slate-700/50 transition-all duration-200`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                            <span className="text-white font-semibold text-sm">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.phoneNumber && (
                              <div className="text-xs text-slate-400 flex items-center gap-1">
                                <FaPhone className="w-3 h-3" />
                                {user.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role?.replace("_", " ").toUpperCase() || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-300">
                          {user.department?.name || "No Department"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.isActive)}`}>
                          {getStatusIcon(user.isActive)}
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-300">
                          <FaCalendar className="w-4 h-4" />
                          <span>
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : "Never"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/users/${user._id}/edit`}
                            className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg transition-all duration-200"
                            title="Edit User"
                          >
                            <FaEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                            title="Reset Password"
                            disabled={isResetting}
                          >
                            <FaKey className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(user)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                            title="Deactivate User"
                            disabled={isDeactivating}
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600/50">
                <FaUsers className="text-slate-400 text-2xl" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-slate-300">
                No users found
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Get started by creating your first user.
              </p>
              <div className="mt-6">
                <Link 
                  to="/admin/users/create" 
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
                >
                  <FaUserPlus className="w-5 h-5" />
                  Create User
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deactivate User Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl w-full max-w-md mx-4 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0">
                <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30">
                  <FaExclamationTriangle className="h-6 w-6 text-red-400" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-white">
                  Deactivate User
                </h3>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 mb-4">
                <p className="text-slate-300 mb-3">
                  Are you sure you want to deactivate{" "}
                  <span className="font-semibold text-white">
                    {userToDeactivate?.firstName} {userToDeactivate?.lastName}
                  </span>?
                </p>
                <p className="text-slate-300">
                  This will prevent them from logging in but preserve their data.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-6 py-2 bg-slate-600/80 hover:bg-slate-600 text-white rounded-xl border border-slate-500/50 hover:border-slate-400/50 transition-all duration-200"
                disabled={isDeactivating}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivate}
                disabled={isDeactivating}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-800 disabled:to-red-900 disabled:cursor-not-allowed text-white border-0 rounded-xl font-medium transition-all duration-200 shadow-lg"
              >
                {isDeactivating ? "Deactivating..." : "Deactivate User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { departments } = useSelector((state) => state.departments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "",
    department: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Kenya",
    },
  });

  useEffect(() => {
    dispatch(getDepartments());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Remove empty department if client role
      const userData = { ...formData };
      if (userData.role === "client") {
        userData.department = null;
      }

      await dispatch(createUser(userData)).unwrap();
      toast.success(
        "User created successfully! Login credentials have been sent via email."
      );
      navigate("/admin/users");
    } catch (error) {
      toast.error(error?.message || String(error) || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const roleRequiresDepartment = [
    "credit_head",
    "debt_collector",
    "legal_head",
    "advocate",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            to="/admin/users" 
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-600/50 rounded-lg"
          >
            <FaArrowLeft className="w-5 h-5" />
          </Link>
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-xl">
            <FaUserPlus className="text-2xl text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New User</h1>
            <p className="text-slate-300 mt-2">
              Add a new user to your law firm with appropriate role and permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
          <div className="p-6 border-b border-slate-600/50">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaUserPlus className="text-green-400" />
              User Information
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter phone number"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Role and Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                    Role *
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="">Select a role</option>
                    <option value="credit_head">Credit Head</option>
                    <option value="debt_collector">Debt Collector</option>
                    <option value="legal_head">Legal Head</option>
                    <option value="advocate">Advocate</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-slate-300 mb-2">
                    Department {roleRequiresDepartment.includes(formData.role) && <span className="text-red-400">*</span>}
                  </label>
                  <select
                    id="department"
                    name="department"
                    required={roleRequiresDepartment.includes(formData.role)}
                    disabled={!roleRequiresDepartment.includes(formData.role)}
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">Select a department</option>
                    {departments?.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.departmentType.replace("_", " ")})
                      </option>
                    ))}
                  </select>
                  {!roleRequiresDepartment.includes(formData.role) && (
                    <p className="text-xs text-slate-400 mt-1">
                      Department not required for this role
                    </p>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-slate-700/30 p-6 rounded-xl border border-slate-600/50">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-blue-400" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="address.street" className="block text-sm font-medium text-slate-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="address.street"
                      name="address.street"
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter street address"
                      value={formData.address.street}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="address.city" className="block text-sm font-medium text-slate-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="address.city"
                      name="address.city"
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter city"
                      value={formData.address.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="address.state" className="block text-sm font-medium text-slate-300 mb-2">
                      State/County
                    </label>
                    <input
                      type="text"
                      id="address.state"
                      name="address.state"
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter state or county"
                      value={formData.address.state}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="address.zipCode" className="block text-sm font-medium text-slate-300 mb-2">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      id="address.zipCode"
                      name="address.zipCode"
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter ZIP code"
                      value={formData.address.zipCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-600/50">
                <Link
                  to="/admin/users"
                  className="px-6 py-3 bg-slate-600/80 hover:bg-slate-600 text-white rounded-xl border border-slate-500/50 hover:border-slate-400/50 transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-800 disabled:to-green-900 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaUserPlus className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Creating User..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { users } = useSelector((state) => state.users);
  const { departments } = useSelector((state) => state.departments);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "",
    department: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Kenya",
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await dispatch(getUser(id)).unwrap();
        setCurrentUser(result.data);
        setFormData({
          firstName: result.data.firstName || "",
          lastName: result.data.lastName || "",
          email: result.data.email || "",
          phoneNumber: result.data.phoneNumber || "",
          role: result.data.role || "",
          department: result.data.department?._id || "",
          address: {
            street: result.data.address?.street || "",
            city: result.data.address?.city || "",
            state: result.data.address?.state || "",
            zipCode: result.data.address?.zipCode || "",
            country: result.data.address?.country || "Kenya",
          },
        });
      } catch (error) {
        toast.error("Failed to fetch user details");
        navigate("/admin/users");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
    dispatch(getDepartments());
  }, [dispatch, id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userData = { ...formData };
      if (userData.role === "client") {
        userData.department = null;
      }

      await dispatch(updateUser({ id, data: userData })).unwrap();
      toast.success("User updated successfully!");
      navigate("/admin/users");
    } catch (error) {
      toast.error(error?.message || String(error) || "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const roleRequiresDepartment = [
    "credit_head",
    "debt_collector",
    "legal_head",
    "advocate",
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/admin/users" className="text-slate-400 hover:text-white">
            <FaArrowLeft className="w-4 h-4" /> Back to Users
          </Link>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-2">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/admin/users" className="text-slate-400 hover:text-white">
            <FaArrowLeft className="w-4 h-4" /> Back to Users
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="text-slate-400">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            to="/admin/users" 
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-600/50 rounded-lg"
          >
            <FaArrowLeft className="w-5 h-5" />
          </Link>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl">
            <FaEdit className="text-2xl text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit User</h1>
            <p className="text-slate-300 mt-2">
              Update user information and permissions for {currentUser.firstName} {currentUser.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
          <div className="p-6 border-b border-slate-600/50">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaEdit className="text-indigo-400" />
              User Information
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter phone number"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Role and Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                    Role *
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="">Select a role</option>
                    <option value="credit_head">Credit Head</option>
                    <option value="debt_collector">Debt Collector</option>
                    <option value="legal_head">Legal Head</option>
                    <option value="advocate">Advocate</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-slate-300 mb-2">
                    Department {roleRequiresDepartment.includes(formData.role) && <span className="text-red-400">*</span>}
                  </label>
                  <select
                    id="department"
                    name="department"
                    required={roleRequiresDepartment.includes(formData.role)}
                    disabled={!roleRequiresDepartment.includes(formData.role)}
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">Select a department</option>
                    {departments?.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.departmentType.replace("_", " ")})
                      </option>
                    ))}
                  </select>
                  {!roleRequiresDepartment.includes(formData.role) && (
                    <p className="text-xs text-slate-400 mt-1">
                      Department not required for this role
                    </p>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-slate-700/30 p-6 rounded-xl border border-slate-600/50">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-blue-400" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="address.street" className="block text-sm font-medium text-slate-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="address.street"
                      name="address.street"
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter street address"
                      value={formData.address.street}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="address.city" className="block text-sm font-medium text-slate-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="address.city"
                      name="address.city"
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter city"
                      value={formData.address.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="address.state" className="block text-sm font-medium text-slate-300 mb-2">
                      State/County
                    </label>
                    <input
                      type="text"
                      id="address.state"
                      name="address.state"
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter state or county"
                      value={formData.address.state}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="address.zipCode" className="block text-sm font-medium text-slate-300 mb-2">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      id="address.zipCode"
                      name="address.zipCode"
                      className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600/50 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      placeholder="Enter ZIP code"
                      value={formData.address.zipCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-600/50">
                <Link
                  to="/admin/users"
                  className="px-6 py-3 bg-slate-600/80 hover:bg-slate-600 text-white rounded-xl border border-slate-500/50 hover:border-slate-400/50 transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-indigo-800 disabled:to-indigo-900 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaEdit className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Updating User..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
