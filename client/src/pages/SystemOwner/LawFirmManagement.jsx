import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getLawFirms,
  createLawFirm,
  updateLawFirm,
  deleteLawFirm,
  clearError,
} from "../../store/slices/lawFirmSlice";
import lawFirmApi from "../../store/api/lawFirmApi";
import { toast } from "react-hot-toast";
import { createLawFirmAdmin } from "../../store/slices/userSlice";

const LawFirmManagement = () => {
  const dispatch = useDispatch();
  const { lawFirms, isLoading, error, pagination } = useSelector(
    (state) => state.lawFirms
  );

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLawFirm, setSelectedLawFirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [lawFirmStats, setLawFirmStats] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [adminLawFirmId, setAdminLawFirmId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firmName: "",
    firmEmail: "",
    firmPhone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Kenya",
    },
    subscription: {
      plan: "basic",
      status: "trial",
    },
    settings: {
      allowedDepartments: ["credit_collection", "legal"],
      paymentMethods: ["stripe", "bank_transfer"],
      emailNotifications: true,
      timezone: "Africa/Nairobi",
    },
  });

  useEffect(() => {
    loadLawFirms();
  }, [currentPage, searchTerm, filterStatus, filterPlan]);

  const loadLawFirms = () => {
    const params = {
      page: currentPage,
      limit: 10,
      search: searchTerm,
      subscriptionStatus: filterStatus,
      subscriptionPlan: filterPlan,
    };
    dispatch(getLawFirms(params));
  };

  const handleCreateLawFirm = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(createLawFirm(formData)).unwrap();
      setShowCreateModal(false);
      resetForm();
      loadLawFirms();

      // Show login credentials if available
      if (result.data?.loginCredentials) {
        const { email, loginEmail, password } = result.data.loginCredentials;
        toast.success(
          `Law firm created successfully! Login credentials sent to ${email}`,
          {
            duration: 8000,
            style: {
              background: "#10b981",
              color: "white",
            },
          }
        );

        // Show credentials in console for development
        console.log("Law Firm Login Credentials:", {
          "Primary Email": email,
          "Login Email (254 prefix)": loginEmail,
          Password: password,
        });
      } else {
        toast.success("Law firm created successfully!");
      }
    } catch (error) {
      console.error("Failed to create law firm:", error);
      toast.error(error.message || "Failed to create law firm");
    }
  };

  const handleUpdateLawFirm = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        updateLawFirm({ id: selectedLawFirm._id, data: formData })
      ).unwrap();
      setShowEditModal(false);
      resetForm();
      loadLawFirms();
    } catch (error) {
      console.error("Failed to update law firm:", error);
    }
  };

  const handleDeleteLawFirm = async () => {
    try {
      await dispatch(deleteLawFirm(selectedLawFirm._id)).unwrap();
      setShowDeleteModal(false);
      setSelectedLawFirm(null);
      loadLawFirms();
    } catch (error) {
      console.error("Failed to delete law firm:", error);
    }
  };

  const handleEdit = (lawFirm) => {
    setSelectedLawFirm(lawFirm);
    setFormData({
      firmName: lawFirm.firmName,
      firmEmail: lawFirm.firmEmail,
      firmPhone: lawFirm.firmPhone || "",
      address: lawFirm.address,
      subscription: lawFirm.subscription,
      settings: lawFirm.settings,
    });
    setShowEditModal(true);
  };

  const handleDelete = (lawFirm) => {
    setSelectedLawFirm(lawFirm);
    setShowDeleteModal(true);
  };

  const handleViewStats = async (lawFirm) => {
    try {
      const response = await lawFirmApi.getLawFirmStats(lawFirm._id);
      setLawFirmStats(response.data.data);
      setShowStatsModal(true);
    } catch (error) {
      console.error("Failed to fetch law firm stats:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      firmName: "",
      firmEmail: "",
      firmPhone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Kenya",
      },
      subscription: {
        plan: "basic",
        status: "trial",
      },
      settings: {
        allowedDepartments: ["credit_collection", "legal"],
        paymentMethods: ["stripe", "bank_transfer"],
        emailNotifications: true,
        timezone: "Africa/Nairobi",
      },
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "badge-success",
      trial: "badge-warning",
      suspended: "badge-danger",
      cancelled: "badge-secondary",
    };
    return `badge ${statusConfig[status] || "badge-secondary"}`;
  };

  const getPlanBadge = (plan) => {
    const planConfig = {
      basic: "badge-info",
      premium: "badge-warning",
      enterprise: "badge-success",
    };
    return `badge ${planConfig[plan] || "badge-secondary"}`;
  };

  const handleOpenAdminModal = (lawFirmId) => {
    setAdminLawFirmId(lawFirmId);
    setShowAdminModal(true);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        createLawFirmAdmin({
          ...adminForm,
          lawFirm: adminLawFirmId,
        })
      ).unwrap();
      setShowAdminModal(false);
      setAdminForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
      setAdminLawFirmId(null);
      toast.success("Admin user created successfully!");
    } catch (error) {
      console.error("Failed to create admin:", error);
      toast.error(error.message || "Failed to create admin user");
    }
  };

  const handleToggleActive = async (firm) => {
    try {
      const newStatus = !firm.isActive;
      await dispatch(
        updateLawFirm({
          id: firm._id,
          data: { isActive: newStatus },
        })
      ).unwrap();
      loadLawFirms();
      toast.success(
        `Law firm ${newStatus ? "activated" : "deactivated"} successfully!`
      );
    } catch (error) {
      console.error("Failed to toggle law firm status:", error);
      toast.error(error.message || "Failed to update law firm status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Law Firm Management</h1>
          <p className="text-dark-400 mt-2">
            Manage all law firms in the system
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          Add New Law Firm
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">
                <span className="label-text text-white">Search</span>
              </label>
              <input
                type="text"
                placeholder="Search firms..."
                className="input input-bordered w-full bg-dark-700 border-dark-600 text-white placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text text-white">Status</span>
              </label>
              <select
                className="select select-bordered w-full bg-dark-700 border-dark-600 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">
                <span className="label-text text-white">Plan</span>
              </label>
              <select
                className="select select-bordered w-full bg-dark-700 border-dark-600 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
              >
                <option value="">All Plans</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("");
                  setFilterPlan("");
                }}
                className="btn btn-outline w-full border-dark-600 text-white hover:bg-primary-600 hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button
            onClick={() => dispatch(clearError())}
            className="btn btn-sm btn-ghost"
          >
            ×
          </button>
        </div>
      )}

      {/* Law Firms Table */}
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Firm Name</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Active</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lawFirms.map((firm) => (
                    <tr key={firm._id}>
                      <td>
                        <div>
                          <div className="font-medium text-white">
                            {firm.firmName}
                          </div>
                          <div className="text-sm text-dark-300">
                            {firm.firmCode}
                          </div>
                        </div>
                      </td>
                      <td className="text-dark-300">{firm.firmEmail}</td>
                      <td>
                        <span className={getPlanBadge(firm.subscription?.plan)}>
                          {firm.subscription?.plan}
                        </span>
                      </td>
                      <td>
                        <span
                          className={getStatusBadge(firm.subscription?.status)}
                        >
                          {firm.subscription?.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            firm.isActive
                              ? "badge badge-success"
                              : "badge badge-error"
                          }
                        >
                          {firm.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-dark-300">
                        {new Date(firm.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleActive(firm)}
                            className={`btn btn-sm ${
                              firm.isActive ? "btn-error" : "btn-success"
                            }`}
                            title={firm.isActive ? "Deactivate" : "Activate"}
                          >
                            {firm.isActive ? "🚫" : "✅"}
                          </button>
                          <button
                            onClick={() => handleViewStats(firm)}
                            className="btn btn-sm btn-info"
                            title="View Stats"
                          >
                            📊
                          </button>
                          <button
                            onClick={() => handleEdit(firm)}
                            className="btn btn-sm btn-warning"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(firm)}
                            className="btn btn-sm btn-error"
                            title="Delete"
                          >
                            🗑️
                          </button>
                          <button
                            onClick={() => handleOpenAdminModal(firm._id)}
                            className="btn btn-sm btn-success"
                            title="Add Admin"
                          >
                            👤
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="join">
                <button
                  className="join-item btn"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  «
                </button>
                <button className="join-item btn">
                  Page {pagination.page} of {pagination.pages}
                </button>
                <button
                  className="join-item btn"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Law Firm Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-6">
              Create New Law Firm
            </h3>
            <form onSubmit={handleCreateLawFirm}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Firm Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Enter firm name"
                    value={formData.firmName}
                    onChange={(e) =>
                      setFormData({ ...formData, firmName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Enter firm email"
                    value={formData.firmEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, firmEmail: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Enter phone number"
                    value={formData.firmPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, firmPhone: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Enter city"
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            city: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Enter state"
                      value={formData.address.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            state: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Plan
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      value={formData.subscription.plan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subscription: {
                            ...formData.subscription,
                            plan: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      value={formData.subscription.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subscription: {
                            ...formData.subscription,
                            status: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Create Law Firm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Law Firm Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-6">Edit Law Firm</h3>
            <form onSubmit={handleUpdateLawFirm}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Firm Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Enter firm name"
                    value={formData.firmName}
                    onChange={(e) =>
                      setFormData({ ...formData, firmName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Enter firm email"
                    value={formData.firmEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, firmEmail: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Enter phone number"
                    value={formData.firmPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, firmPhone: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Enter city"
                      value={formData.address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            city: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="Enter state"
                      value={formData.address.state}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            state: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Plan
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      value={formData.subscription.plan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subscription: {
                            ...formData.subscription,
                            plan: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      value={formData.subscription.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subscription: {
                            ...formData.subscription,
                            status: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="trial">Trial</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Update Law Firm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Delete Law Firm
            </h3>
            <p className="text-dark-300 mb-6">
              Are you sure you want to delete{" "}
              <strong className="text-white">
                {selectedLawFirm?.firmName}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLawFirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && lawFirmStats && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Law Firm Statistics</h3>
            <div className="space-y-6">
              {/* Firm Info */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">Firm Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Firm Name</p>
                      <p className="font-medium">
                        {lawFirmStats.firmInfo.firmName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Firm Code</p>
                      <p className="font-medium">
                        {lawFirmStats.firmInfo.firmCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Plan</p>
                      <span
                        className={getPlanBadge(
                          lawFirmStats.firmInfo.subscriptionPlan
                        )}
                      >
                        {lawFirmStats.firmInfo.subscriptionPlan}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span
                        className={getStatusBadge(
                          lawFirmStats.firmInfo.subscriptionStatus
                        )}
                      >
                        {lawFirmStats.firmInfo.subscriptionStatus}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Trial Days Remaining
                      </p>
                      <p className="font-medium">
                        {lawFirmStats.firmInfo.trialDaysRemaining}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Statistics */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">User Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {lawFirmStats.users.total}
                      </p>
                      <p className="text-sm text-gray-500">Total Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-500">
                        {lawFirmStats.users.active}
                      </p>
                      <p className="text-sm text-gray-500">Active Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-500">
                        {lawFirmStats.users.inactive}
                      </p>
                      <p className="text-sm text-gray-500">Inactive Users</p>
                    </div>
                  </div>
                  {lawFirmStats.users.byRole.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Users by Role</h5>
                      <div className="space-y-2">
                        {lawFirmStats.users.byRole.map((role) => (
                          <div key={role._id} className="flex justify-between">
                            <span className="capitalize">
                              {role._id.replace("_", " ")}
                            </span>
                            <span className="font-medium">{role.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Department Statistics */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h4 className="card-title">Department Statistics</h4>
                  <div className="text-center mb-4">
                    <p className="text-2xl font-bold">
                      {lawFirmStats.departments.total}
                    </p>
                    <p className="text-sm text-gray-500">Total Departments</p>
                  </div>
                  {lawFirmStats.departments.byType.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Departments by Type</h5>
                      <div className="space-y-2">
                        {lawFirmStats.departments.byType.map((dept) => (
                          <div key={dept._id} className="flex justify-between">
                            <span className="capitalize">
                              {dept._id.replace("_", " ")}
                            </span>
                            <span className="font-medium">{dept.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button onClick={() => setShowStatsModal(false)} className="btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-6">
              Create Law Firm Admin
            </h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Enter first name"
                  value={adminForm.firstName}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Enter last name"
                  value={adminForm.lastName}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, lastName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Enter email"
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Enter password"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
                  onClick={() => setShowAdminModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawFirmManagement;
