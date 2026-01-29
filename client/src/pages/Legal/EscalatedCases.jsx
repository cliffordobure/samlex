import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getUsers } from "../../store/slices/userSlice";
import { createLegalCaseFromEscalated } from "../../store/slices/legalCaseSlice";
import creditCaseApi from "../../store/api/creditCaseApi";
import toast from "react-hot-toast";
import socket from "../../utils/socket";
import {
  FaArrowLeft,
  FaUserPlus,
  FaGavel,
  FaBalanceScale,
  FaBuilding,
  FaHome,
  FaUsers,
  FaBriefcase,
  FaFileAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
  FaCalendar,
  FaMoneyBillWave,
  FaUser,
  FaTimes,
  FaPlus,
  FaFileContract,
} from "react-icons/fa";

const EscalatedCases = () => {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);

  // State for escalated credit cases
  const [escalatedCases, setEscalatedCases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  // State for assignment modal
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    assignedTo: "",
    notes: "",
    addInfoBeforeAssign: false, // New option
  });
  const [assignLoading, setAssignLoading] = useState(false);

  // State for pre-assignment information modal
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [caseInfo, setCaseInfo] = useState({
    client: {
      name: "",
      email: "",
      phone: "",
    },
    courtDetails: {
      courtName: "",
      courtLocation: "",
      judgeAssigned: "",
      courtDate: "",
      courtRoom: "",
    },
    opposingParty: {
      name: "",
      lawyer: "",
      contact: {
        email: "",
        phone: "",
      },
    },
    filingFee: {
      amount: "",
      currency: "KES",
      paid: false,
    },
  });
  const [infoLoading, setInfoLoading] = useState(false);

  // Get assignable advocates
  const assignableAdvocates = users?.filter((u) => u.role === "advocate") || [];

  useEffect(() => {
    if (user?.lawFirm?._id) {
      fetchEscalatedCases();
      dispatch(getUsers({ lawFirm: user.lawFirm._id }));
    }
  }, [dispatch, user]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!user?.lawFirm?._id) return;

    // Listen for case escalated events
    const handleCaseEscalated = (data) => {
      console.log("🔄 Case escalated event received:", data);
      toast.success(`Case ${data.caseNumber} has been escalated to legal department`);
      fetchEscalatedCases(); // Refresh the escalated cases list
    };

    // Listen for credit case updates that might affect escalated cases
    const handleCreditCaseUpdated = (data) => {
      console.log("🔄 Credit case updated event received:", data);
      if (data.escalatedToLegal) {
        fetchEscalatedCases(); // Refresh the escalated cases list
      }
    };

    // Join the law firm room for real-time updates
    socket.emit("join-law-firm", user.lawFirm._id);

    // Add event listeners
    socket.on("caseEscalated", handleCaseEscalated);
    socket.on("creditCaseUpdated", handleCreditCaseUpdated);

    // Cleanup function
    return () => {
      socket.off("caseEscalated", handleCaseEscalated);
      socket.off("creditCaseUpdated", handleCreditCaseUpdated);
      socket.emit("leave-law-firm", user.lawFirm._id);
    };
  }, [user?.lawFirm?._id]);

  const fetchEscalatedCases = async () => {
    setIsLoading(true);
    try {
      console.log("=== FRONTEND: Fetching escalated cases ===");
      const response = await creditCaseApi.getEscalatedCases({
        page: pagination.currentPage,
        limit: 10,
      });
      console.log("API Response:", response.data);
      console.log("Escalated cases count:", response.data.data?.length || 0);
      setEscalatedCases(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching escalated cases:", error);
      toast.error("Failed to fetch escalated cases");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignCase = async () => {
    if (!assignmentData.assignedTo) {
      toast.error("Please select an advocate");
      return;
    }

    // If user wants to add info before assigning, show info modal
    if (assignmentData.addInfoBeforeAssign) {
      setShowAssignmentModal(false);
      setShowInfoModal(true);
      return;
    }

    // Otherwise, proceed with immediate assignment
    await createAndAssignCase();
  };

  const createAndAssignCase = async (additionalInfo = {}) => {
    setAssignLoading(true);
    try {
      console.log("=== Creating Legal Case ===");
      console.log("Selected Case:", selectedCase);
      console.log("Assignment Data:", assignmentData);
      console.log("Additional Info:", additionalInfo);

      // Prepare comprehensive legal case data with all escalated case information
      const legalCaseData = {
        title: `Legal Case - ${selectedCase.title || selectedCase.caseNumber}`,
        caseType: "debt_collection",
        description: `Escalated from credit collection case ${selectedCase.caseNumber}: ${selectedCase.description || 'Payment default requiring legal action'}`,
        priority: selectedCase.priority || "medium",
        status: "assigned",
        lawFirm: user.lawFirm._id,
        client: selectedCase.client?._id || null,
        caseReference: selectedCase.caseNumber,
        filingFee: {
          amount: selectedCase.escalationPayment?.amount || selectedCase.debtAmount || 5000,
          currency: selectedCase.currency || "KES",
          paid: selectedCase.escalationPayment?.status === "confirmed" || false,
          paidAt: selectedCase.escalationPayment?.confirmedAt || null,
        },
        // Note: Client will be handled by backend if not provided
        // Transfer creditor information as opposing party
        opposingParty: {
          name: selectedCase.creditorName || '',
          contact: {
            email: selectedCase.creditorEmail || '',
            phone: selectedCase.creditorContact || '',
          },
        },
        escalatedFrom: {
          creditCaseId: selectedCase._id,
          escalationDate: selectedCase.escalationDate,
          escalationFee: selectedCase.escalationPayment?.amount,
          escalationReason: "Payment default - requires legal action",
        },
        assignedTo: assignmentData.assignedTo,
        assignedBy: user._id,
        assignedAt: new Date(),
        createdBy: user._id,
        // Transfer all documents from credit case
        documents: selectedCase.documents || [],
        // Add any additional information provided
        ...additionalInfo,
      };

      console.log("=== FRONTEND DEBUG: Legal Case Data ===");
      console.log("Selected Case:", selectedCase);
      console.log("Legal Case Data:", legalCaseData);
      console.log("Client:", legalCaseData.client);
      console.log("Opposing Party:", legalCaseData.opposingParty);
      console.log("Filing Fee:", legalCaseData.filingFee);
      console.log("Documents:", legalCaseData.documents);

      // Create the legal case and assign it
      const result = await dispatch(
        createLegalCaseFromEscalated({
          data: legalCaseData,
          assignedTo: assignmentData.assignedTo,
          notes: assignmentData.notes,
        })
      ).unwrap();

      console.log("=== FRONTEND: Dispatch Result ===");
      console.log("Result:", result);

      toast.success("Case assigned successfully");
      setShowAssignmentModal(false);
      setShowInfoModal(false);
      setAssignmentData({
        assignedTo: "",
        notes: "",
        addInfoBeforeAssign: false,
      });
      setSelectedCase(null);

      // Refresh escalated cases
      fetchEscalatedCases();
    } catch (error) {
      toast.error(error || "Failed to assign case");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoLoading(true);

    try {
      // Prepare additional info data
      const additionalInfo = {};

      // Only include client if name and phone are provided
      if (caseInfo.client.name && caseInfo.client.phone) {
        additionalInfo.client = {
          name: caseInfo.client.name,
          email: caseInfo.client.email || null,
          phone: caseInfo.client.phone,
        };
      }

      // Only include court details if at least one field is filled
      const hasCourtDetails = Object.values(caseInfo.courtDetails).some(
        (value) => value
      );
      if (hasCourtDetails) {
        additionalInfo.courtDetails = caseInfo.courtDetails;
      }

      // Only include opposing party if name is provided
      if (caseInfo.opposingParty.name) {
        additionalInfo.opposingParty = caseInfo.opposingParty;
      }

      // Only include filing fee if amount is provided
      if (caseInfo.filingFee.amount) {
        additionalInfo.filingFee = {
          ...caseInfo.filingFee,
          amount: parseFloat(caseInfo.filingFee.amount),
        };
      }

      // Create and assign case with additional info
      await createAndAssignCase(additionalInfo);
    } catch {
      toast.error("Failed to add case information");
    } finally {
      setInfoLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setCaseInfo((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNestedInputChange = (section, field, subField, value) => {
    setCaseInfo((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          [subField]: value,
        },
      },
    }));
  };

  const openAssignmentModal = (creditCase) => {
    setSelectedCase(creditCase);
    setAssignmentData({ assignedTo: "", notes: "" });
    setShowAssignmentModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-500",
      assigned: "bg-purple-500",
      in_progress: "bg-orange-500",
      follow_up_required: "bg-yellow-500",
      escalated_to_legal: "bg-red-500",
      resolved: "bg-green-500",
      closed: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  const formatCurrency = (amount, currency = "KES") => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading escalated cases...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/legal" className="btn btn-outline btn-sm">
            <FaArrowLeft />
            Back to Overview
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Escalated Cases</h1>
            <p className="text-dark-400 mt-2">
              Credit collection cases escalated to legal department
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchEscalatedCases}
            className="btn btn-outline btn-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading loading-spinner loading-sm"></div>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="card-body text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{escalatedCases.length}</h3>
                <p className="text-orange-100">Escalated Cases</p>
              </div>
              <FaExclamationTriangle className="text-3xl opacity-80" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="card-body text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {assignableAdvocates.length}
                </h3>
                <p className="text-blue-100">Available Advocates</p>
              </div>
              <FaUser className="text-3xl opacity-80" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-green-500 to-green-600">
          <div className="card-body text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {escalatedCases.filter((c) => c.legalCaseId).length}
                </h3>
                <p className="text-green-100">Legal Cases Created</p>
              </div>
              <FaFileContract className="text-3xl opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-6">
            Escalated Credit Cases ({escalatedCases.length})
          </h2>

          {escalatedCases.length === 0 ? (
            <div className="text-center py-12">
              <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Escalated Cases
              </h3>
              <p className="text-dark-400">
                No credit collection cases have been escalated to legal
                department.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {escalatedCases.map((creditCase) => (
                <div
                  key={creditCase._id}
                  className={`border border-base-300 rounded-lg p-4 ${
                    creditCase.legalCaseId
                      ? "bg-green-50 border-green-300"
                      : "bg-yellow-50 border-yellow-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0">
                        <FaFileAlt className="text-2xl text-primary" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {creditCase.title}
                          </h3>
                          <span className="badge badge-primary">
                            {creditCase.caseNumber}
                          </span>
                          <span
                            className={`badge ${getStatusColor(
                              creditCase.status
                            )}`}
                          >
                            {creditCase.status?.replace("_", " ")}
                          </span>
                          <span
                            className={`badge ${getPriorityColor(
                              creditCase.priority
                            )}`}
                          >
                            {creditCase.priority}
                          </span>
                          {creditCase.legalCaseId ? (
                            <span className="badge badge-success">
                              Legal Case Created
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              Pending Legal Case
                            </span>
                          )}
                        </div>

                        <p className="text-dark-400 mb-3">
                          {creditCase.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          {creditCase.client && (
                            <div className="flex items-center gap-2">
                              <FaUser className="text-dark-400" />
                              <span>
                                {creditCase.client.firstName}{" "}
                                {creditCase.client.lastName}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <FaMoneyBillWave className="text-dark-400" />
                            <span>
                              Debt:{" "}
                              {formatCurrency(
                                creditCase.debtAmount,
                                creditCase.currency
                              )}
                            </span>
                          </div>

                          {creditCase.escalationPayment?.amount && (
                            <div className="flex items-center gap-2">
                              <FaMoneyBillWave className="text-dark-400" />
                              <span>
                                Fee:{" "}
                                {formatCurrency(
                                  creditCase.escalationPayment.amount
                                )}
                              </span>
                            </div>
                          )}

                          {creditCase.escalationDate && (
                            <div className="flex items-center gap-2">
                              <FaCalendar className="text-dark-400" />
                              <span>
                                Escalated:{" "}
                                {new Date(
                                  creditCase.escalationDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link
                        to={`/credit-collection/cases/${creditCase._id}`}
                        className="btn btn-outline btn-sm"
                      >
                        <FaEye />
                        View Credit Case
                      </Link>
                      {creditCase.legalCaseId ? (
                        <Link
                          to={`/legal/cases/${creditCase.legalCaseId._id}`}
                          className="btn btn-success btn-sm"
                        >
                          <FaFileContract />
                          View Legal Case
                        </Link>
                      ) : (
                        <button
                          onClick={() => openAssignmentModal(creditCase)}
                          className="btn btn-primary btn-sm"
                        >
                          <FaUserPlus />
                          Create Legal Case
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedCase && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Create Legal Case: {selectedCase.caseNumber}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Select Advocate</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={assignmentData.assignedTo}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      assignedTo: e.target.value,
                    })
                  }
                >
                  <option value="">Choose an advocate</option>
                  {assignableAdvocates.map((advocate) => (
                    <option key={advocate._id} value={advocate._id}>
                      {advocate.firstName} {advocate.lastName}
                      {advocate.email && ` (${advocate.email})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">
                    Assignment Notes (Optional)
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Add any notes about this assignment..."
                  value={assignmentData.notes}
                  onChange={(e) =>
                    setAssignmentData({
                      ...assignmentData,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary mr-2"
                    checked={assignmentData.addInfoBeforeAssign}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        addInfoBeforeAssign: e.target.checked,
                      })
                    }
                  />
                  <span className="label-text">
                    Add case information before assigning
                  </span>
                </label>
                <p className="text-sm text-dark-400 mt-1">
                  Check this if you want to add client, court, and other details
                  before assigning. Otherwise, the advocate can add this
                  information later.
                </p>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setShowAssignmentModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssignCase}
                disabled={!assignmentData.assignedTo || assignLoading}
              >
                {assignLoading ? (
                  <div className="loading loading-spinner loading-sm"></div>
                ) : assignmentData.addInfoBeforeAssign ? (
                  "Next: Add Information"
                ) : (
                  "Create & Assign"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Information Modal */}
      {showInfoModal && selectedCase && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              Add Case Information: {selectedCase.caseNumber}
            </h3>

            <form onSubmit={handleInfoSubmit} className="space-y-6">
              {/* Client Information */}
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">
                    <FaUser />
                    Client Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Client Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Enter client name"
                        value={caseInfo.client.name}
                        onChange={(e) =>
                          handleInputChange("client", "name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Email</span>
                      </label>
                      <input
                        type="email"
                        className="input input-bordered w-full"
                        placeholder="Enter client email"
                        value={caseInfo.client.email}
                        onChange={(e) =>
                          handleInputChange("client", "email", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Phone Number</span>
                      </label>
                      <input
                        type="tel"
                        className="input input-bordered w-full"
                        placeholder="Enter phone number"
                        value={caseInfo.client.phone}
                        onChange={(e) =>
                          handleInputChange("client", "phone", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Court Details */}
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">
                    <FaGavel />
                    Court Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Court Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Enter court name"
                        value={caseInfo.courtDetails.courtName}
                        onChange={(e) =>
                          handleInputChange(
                            "courtDetails",
                            "courtName",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Court Location</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Enter court location"
                        value={caseInfo.courtDetails.courtLocation}
                        onChange={(e) =>
                          handleInputChange(
                            "courtDetails",
                            "courtLocation",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Judge Assigned</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Enter judge name"
                        value={caseInfo.courtDetails.judgeAssigned}
                        onChange={(e) =>
                          handleInputChange(
                            "courtDetails",
                            "judgeAssigned",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Court Date</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered w-full"
                        value={caseInfo.courtDetails.courtDate}
                        onChange={(e) =>
                          handleInputChange(
                            "courtDetails",
                            "courtDate",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Court Room</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Enter court room"
                        value={caseInfo.courtDetails.courtRoom}
                        onChange={(e) =>
                          handleInputChange(
                            "courtDetails",
                            "courtRoom",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Opposing Party */}
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">
                    <FaUser />
                    Opposing Party
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Opposing Party Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Enter opposing party name"
                        value={caseInfo.opposingParty.name}
                        onChange={(e) =>
                          handleInputChange(
                            "opposingParty",
                            "name",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Opposing Lawyer</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Enter opposing lawyer name"
                        value={caseInfo.opposingParty.lawyer}
                        onChange={(e) =>
                          handleInputChange(
                            "opposingParty",
                            "lawyer",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Email</span>
                      </label>
                      <input
                        type="email"
                        className="input input-bordered w-full"
                        placeholder="Enter opposing party email"
                        value={caseInfo.opposingParty.contact.email}
                        onChange={(e) =>
                          handleNestedInputChange(
                            "opposingParty",
                            "contact",
                            "email",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Phone</span>
                      </label>
                      <input
                        type="tel"
                        className="input input-bordered w-full"
                        placeholder="Enter opposing party phone"
                        value={caseInfo.opposingParty.contact.phone}
                        onChange={(e) =>
                          handleNestedInputChange(
                            "opposingParty",
                            "contact",
                            "phone",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filing Fee */}
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">
                    <FaFileAlt />
                    Filing Fee
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">
                        <span className="label-text">Amount</span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered w-full"
                        placeholder="Enter amount"
                        value={caseInfo.filingFee.amount}
                        onChange={(e) =>
                          handleInputChange(
                            "filingFee",
                            "amount",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        <span className="label-text">Currency</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={caseInfo.filingFee.currency}
                        onChange={(e) =>
                          handleInputChange(
                            "filingFee",
                            "currency",
                            e.target.value
                          )
                        }
                      >
                        <option value="KES">KES</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="label cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary mr-2"
                          checked={caseInfo.filingFee.paid}
                          onChange={(e) =>
                            handleInputChange(
                              "filingFee",
                              "paid",
                              e.target.checked
                            )
                          }
                        />
                        <span className="label-text">Paid</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowInfoModal(false);
                    setShowAssignmentModal(true);
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={infoLoading}
                >
                  {infoLoading ? (
                    <div className="loading loading-spinner loading-sm"></div>
                  ) : (
                    "Create & Assign with Information"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalatedCases;
