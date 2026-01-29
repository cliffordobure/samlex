/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getLegalCase } from "../../store/slices/legalCaseSlice";
import legalCaseApi from "../../store/api/legalCaseApi";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaSave,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaGavel,
  FaCalendar,
  FaMapMarkerAlt,
  FaFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaFolderOpen,
} from "react-icons/fa";

const CompleteCaseInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCase, isLoading, error } = useSelector(
    (state) => state.legalCases
  );
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch case details
  useEffect(() => {
    if (id) {
      console.log("Fetching case details for ID:", id);
      dispatch(getLegalCase(id));
    }
  }, [dispatch, id]);

  // Update form data when case is loaded
  useEffect(() => {
    if (currentCase) {
      console.log("=== FRONTEND DEBUG: Case loaded ===");
      console.log("Case loaded successfully:", currentCase.caseNumber);
      console.log("Full case data:", currentCase);
      console.log("Client data:", currentCase.client);
      console.log("Opposing party data:", currentCase.opposingParty);
      console.log("Filing fee data:", currentCase.filingFee);
      console.log("Documents:", currentCase.documents);
      console.log("Notes:", currentCase.notes);
      console.log("Escalated from:", currentCase.escalatedFrom);
      
      setFormData({
        client: {
          name:
            currentCase.client?.firstName && currentCase.client?.lastName
              ? `${currentCase.client.firstName} ${currentCase.client.lastName}`
              : "",
          email: currentCase.client?.email || "",
          phone: currentCase.client?.phoneNumber || "",
        },
        courtDetails: {
          courtName: currentCase.courtDetails?.courtName || "",
          courtLocation: currentCase.courtDetails?.courtLocation || "",
          judgeAssigned: currentCase.courtDetails?.judgeAssigned || "",
          courtDate: currentCase.courtDetails?.courtDate
            ? new Date(currentCase.courtDetails.courtDate)
                .toISOString()
                .split("T")[0]
            : "",
          courtRoom: currentCase.courtDetails?.courtRoom || "",
        },
        opposingParty: {
          name: currentCase.opposingParty?.name || "",
          lawyer: currentCase.opposingParty?.lawyer || "",
          contact: {
            email: currentCase.opposingParty?.contact?.email || "",
            phone: currentCase.opposingParty?.contact?.phone || "",
          },
        },
        filingFee: {
          amount: currentCase.filingFee?.amount || "",
          currency: currentCase.filingFee?.currency || "KES",
          paid: currentCase.filingFee?.paid || false,
        },
      });
    }
  }, [currentCase]);

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNestedInputChange = (section, field, subField, value) => {
    setFormData((prev) => ({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const submitData = {};

      // Only include client if name and phone are provided
      if (formData.client.name && formData.client.phone) {
        submitData.client = {
          name: formData.client.name,
          email: formData.client.email || null,
          phone: formData.client.phone,
        };
      }

      // Only include court details if at least one field is filled
      const hasCourtDetails = Object.values(formData.courtDetails).some(
        (value) => value
      );
      if (hasCourtDetails) {
        submitData.courtDetails = formData.courtDetails;
      }

      // Only include opposing party if name is provided
      if (formData.opposingParty.name) {
        submitData.opposingParty = formData.opposingParty;
      }

      // Only include filing fee if amount is provided
      if (formData.filingFee.amount) {
        submitData.filingFee = {
          ...formData.filingFee,
          amount: parseFloat(formData.filingFee.amount),
        };
      }

      console.log("Submitting case info for case ID:", id);
      console.log("Submit data:", submitData);
      
      await legalCaseApi.completeCaseInfo(id, submitData);
      toast.success("Case information completed successfully");
      
      // Navigate to case details page
      console.log("Navigating to case details:", `/legal/cases/${id}`);
      const isAdminContext = window.location.pathname.includes('/admin');
      const targetPath = isAdminContext 
        ? `/admin/legal-case/${id}` 
        : `/legal/cases/${id}`;
      console.log("Target path:", targetPath);
      navigate(targetPath);
    } catch (error) {
      console.error("Error completing case info:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to complete case information"
      );
      // Don't navigate away on error - stay on the form
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading case details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>Error: {error}</span>
        </div>
        <button
          onClick={() => navigate("/legal/cases")}
          className="btn btn-outline"
        >
          <FaArrowLeft />
          Back to Cases
        </button>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="space-y-6">
        <div className="alert alert-warning">
          <FaExclamationTriangle />
          <span>Case not found.</span>
        </div>
        <button
          onClick={() => navigate("/legal/cases")}
          className="btn btn-outline"
        >
          <FaArrowLeft />
          Back to Cases
        </button>
      </div>
    );
  }

  // Check if user has permission to update this case
  const canUpdateCase = 
    currentCase.assignedTo?._id === user._id || // Assigned advocate
    user.role === "legal_head" || // Legal head
    user.role === "law_firm_admin" || // Law firm admin
    user.role === "law_firm"; // Law firm (for admin context)

  console.log("Permission check:", {
    currentCase: currentCase?.caseNumber,
    assignedTo: currentCase?.assignedTo?._id,
    userId: user._id,
    userRole: user.role,
    canUpdateCase,
    isAdminContext: window.location.pathname.includes('/admin')
  });

  if (!canUpdateCase) {
    console.log("Permission denied - redirecting to cases list");
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-3 sm:p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30 shadow-lg mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaExclamationTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-red-300 font-semibold text-lg">Access Denied</h3>
                <p className="text-slate-300 mt-1">
                  You don't have permission to update this case information. Only the assigned advocate, legal head, or law firm admin can update case details.
                </p>
                <div className="mt-3 text-sm text-slate-400">
                  <p><strong>Your Role:</strong> {user.role}</p>
                  <p><strong>Case Assigned To:</strong> {currentCase.assignedTo?.firstName} {currentCase.assignedTo?.lastName}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                const isAdminContext = window.location.pathname.includes('/admin');
                const targetPath = isAdminContext 
                  ? `/admin/legal-case/${id}` 
                  : `/legal/cases/${id}`;
                navigate(targetPath);
              }}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 border border-slate-600/50 flex items-center justify-center gap-2"
            >
              <FaArrowLeft />
              Back to Case Details
            </button>
            <button
              onClick={() => {
                const isAdminContext = window.location.pathname.includes('/admin');
                const targetPath = isAdminContext ? '/admin/cases' : '/legal/cases';
                navigate(targetPath);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            >
              <FaFolderOpen />
              View All Cases
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-3 sm:p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const isAdminContext = window.location.pathname.includes('/admin');
                const targetPath = isAdminContext 
                  ? `/admin/legal-case/${id}` 
                  : `/legal/cases/${id}`;
                navigate(targetPath);
              }}
              className="p-2 sm:p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl sm:rounded-2xl border border-slate-600/50 transition-all duration-300 hover:scale-105 group"
            >
              <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Update Case Details
              </h1>
              <p className="text-slate-300 text-lg sm:text-xl mt-2">
                Case: {currentCase.caseNumber} - {currentCase.title}
              </p>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">
                Complete the missing information for this escalated case
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Escalation Info */}
      {currentCase.escalatedFrom && (
        <div className="mb-6 md:mb-8">
          <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-blue-500/30 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaCheckCircle className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-blue-300 font-semibold text-lg">Escalated Case - Data Transferred</h3>
                <p className="text-slate-300 mt-1">
                  This case was escalated from credit collection. All client, debtor, creditor, and document information has been automatically transferred. You only need to complete the court details and filing fee information below.
                </p>
                <div className="mt-3 text-sm text-slate-400 space-y-1">
                  <p>✅ Client information transferred</p>
                  <p>✅ Debtor/Creditor details transferred</p>
                  <p>✅ All documents transferred</p>
                  <p>✅ Payment history transferred</p>
                  <p>⏳ Court details needed</p>
                  <p>⏳ Filing fee confirmation needed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {/* Client Information */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
              <FaUser className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Client Information
              </h2>
              {currentCase.escalatedFrom && (
                <p className="text-green-400 text-sm mt-1">
                  ✅ Transferred from credit collection case
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-slate-300 font-medium text-sm mb-2">
                Client Name
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl text-white transition-all duration-200 ${
                  currentCase.escalatedFrom 
                    ? 'bg-green-900/20 border border-green-500/30 text-green-300' 
                    : 'bg-slate-700/50 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50'
                }`}
                placeholder="Enter client name"
                value={formData.client.name}
                onChange={(e) =>
                  handleInputChange("client", "name", e.target.value)
                }
                disabled={currentCase.escalatedFrom}
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium text-sm mb-2">
                Email
              </label>
              <input
                type="email"
                className={`w-full px-4 py-3 rounded-xl text-white transition-all duration-200 ${
                  currentCase.escalatedFrom 
                    ? 'bg-green-900/20 border border-green-500/30 text-green-300' 
                    : 'bg-slate-700/50 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50'
                }`}
                placeholder="Enter client email"
                value={formData.client.email}
                onChange={(e) =>
                  handleInputChange("client", "email", e.target.value)
                }
                disabled={currentCase.escalatedFrom}
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium text-sm mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                className={`w-full px-4 py-3 rounded-xl text-white transition-all duration-200 ${
                  currentCase.escalatedFrom 
                    ? 'bg-green-900/20 border border-green-500/30 text-green-300' 
                    : 'bg-slate-700/50 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50'
                }`}
                placeholder="Enter phone number"
                value={formData.client.phone}
                onChange={(e) =>
                  handleInputChange("client", "phone", e.target.value)
                }
                disabled={currentCase.escalatedFrom}
              />
            </div>
          </div>
        </div>

        {/* Court Details */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
              <FaGavel className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Court Details
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-slate-300 font-medium text-sm mb-2">
                Court Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                placeholder="Enter court name"
                value={formData.courtDetails.courtName}
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
              <label className="block text-slate-300 font-medium text-sm mb-2">
                Court Location
              </label>
              <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  placeholder="Enter court location"
                  value={formData.courtDetails.courtLocation}
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
              <label className="block text-slate-300 font-medium text-sm mb-2">
                  Judge Assigned
                </label>
              <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  placeholder="Enter judge name"
                  value={formData.courtDetails.judgeAssigned}
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
              <label className="block text-slate-300 font-medium text-sm mb-2">
                  Court Date
                </label>
              <input
                  type="date"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  value={formData.courtDetails.courtDate}
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
              <label className="block text-slate-300 font-medium text-sm mb-2">
                  Court Room
                </label>
              <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                  placeholder="Enter court room"
                  value={formData.courtDetails.courtRoom}
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

        {/* Opposing Party */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
              <FaUser className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Opposing Party (Creditor)
              </h2>
              {currentCase.escalatedFrom && (
                <p className="text-green-400 text-sm mt-1">
                  ✅ Transferred from credit collection case
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-slate-300 font-medium text-sm mb-2">
                  Opposing Party Name
                </label>
              <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl text-white transition-all duration-200 ${
                    currentCase.escalatedFrom 
                      ? 'bg-green-900/20 border border-green-500/30 text-green-300' 
                      : 'bg-slate-700/50 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50'
                  }`}
                  placeholder="Enter opposing party name"
                  value={formData.opposingParty.name}
                  onChange={(e) =>
                    handleInputChange("opposingParty", "name", e.target.value)
                  }
                  disabled={currentCase.escalatedFrom}
                />
            </div>
            <div>
              <label className="block text-slate-300 font-medium text-sm mb-2">
                  Opposing Lawyer
                </label>
              <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                  placeholder="Enter opposing lawyer name"
                  value={formData.opposingParty.lawyer}
                  onChange={(e) =>
                    handleInputChange("opposingParty", "lawyer", e.target.value)
                  }
                />
            </div>
            <div>
              <label className="block text-slate-300 font-medium text-sm mb-2">
                  Email
                </label>
              <input
                  type="email"
                  className={`w-full px-4 py-3 rounded-xl text-white transition-all duration-200 ${
                    currentCase.escalatedFrom 
                      ? 'bg-green-900/20 border border-green-500/30 text-green-300' 
                      : 'bg-slate-700/50 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50'
                  }`}
                  placeholder="Enter opposing party email"
                  value={formData.opposingParty.contact.email}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "opposingParty",
                      "contact",
                      "email",
                      e.target.value
                    )
                  }
                  disabled={currentCase.escalatedFrom}
                />
            </div>
            <div>
              <label className="block text-slate-300 font-medium text-sm mb-2">
                  Phone
                </label>
              <input
                  type="tel"
                  className={`w-full px-4 py-3 rounded-xl text-white transition-all duration-200 ${
                    currentCase.escalatedFrom 
                      ? 'bg-green-900/20 border border-green-500/30 text-green-300' 
                      : 'bg-slate-700/50 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50'
                  }`}
                  placeholder="Enter opposing party phone"
                  value={formData.opposingParty.contact.phone}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "opposingParty",
                      "contact",
                      "phone",
                      e.target.value
                    )
                  }
                  disabled={currentCase.escalatedFrom}
                />
            </div>
          </div>
        </div>

        {/* Filing Fee */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
              <FaFileAlt className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Filing Fee
              </h2>
              {currentCase.escalatedFrom && (
                <p className="text-green-400 text-sm mt-1">
                  ✅ Amount transferred from escalation payment
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-slate-300 font-medium text-sm mb-2">
                  Amount
                </label>
              <input
                  type="number"
                  className={`w-full px-4 py-3 rounded-xl text-white transition-all duration-200 ${
                    currentCase.escalatedFrom 
                      ? 'bg-green-900/20 border border-green-500/30 text-green-300' 
                      : 'bg-slate-700/50 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50'
                  }`}
                  placeholder="Enter amount"
                  value={formData.filingFee.amount}
                  onChange={(e) =>
                    handleInputChange("filingFee", "amount", e.target.value)
                  }
                  disabled={currentCase.escalatedFrom}
                />
            </div>
            <div>
              <label className="block text-slate-300 font-medium text-sm mb-2">
                  Currency
                </label>
              <select
                  className={`w-full px-4 py-3 rounded-xl text-white transition-all duration-200 ${
                    currentCase.escalatedFrom 
                      ? 'bg-green-900/20 border border-green-500/30 text-green-300' 
                      : 'bg-slate-700/50 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50'
                  }`}
                  value={formData.filingFee.currency}
                  onChange={(e) =>
                    handleInputChange("filingFee", "currency", e.target.value)
                  }
                  disabled={currentCase.escalatedFrom}
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className={`w-5 h-5 text-green-500 rounded focus:ring-green-500/50 focus:ring-2 ${
                    currentCase.escalatedFrom 
                      ? 'bg-green-900/20 border border-green-500/30' 
                      : 'bg-slate-700 border-slate-600'
                  }`}
                  checked={formData.filingFee.paid}
                  onChange={(e) =>
                    handleInputChange("filingFee", "paid", e.target.checked)
                  }
                  disabled={currentCase.escalatedFrom}
                />
                <span className="text-slate-300 font-medium">
                  {currentCase.escalatedFrom ? 'Payment Status' : 'Paid'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Transferred Information Summary */}
        {currentCase.escalatedFrom && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                <FaFileAlt className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Transferred Information
                </h2>
                <p className="text-slate-300 text-sm mt-1">
                  All information below was automatically transferred from the credit collection case
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FaFolderOpen className="w-4 h-4 text-blue-400" />
                  Documents ({currentCase.documents?.length || 0})
                </h3>
                {currentCase.documents && currentCase.documents.length > 0 ? (
                  <div className="space-y-2">
                    {currentCase.documents.slice(0, 3).map((doc, index) => (
                      <div key={index} className="text-sm text-slate-300 bg-slate-700/30 rounded-lg p-2">
                        📄 {doc.name || doc.originalName}
                      </div>
                    ))}
                    {currentCase.documents.length > 3 && (
                      <div className="text-sm text-slate-400">
                        ... and {currentCase.documents.length - 3} more documents
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No documents transferred</p>
                )}
              </div>
              
              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FaFileAlt className="w-4 h-4 text-blue-400" />
                  Notes & History ({currentCase.notes?.length || 0})
                </h3>
                {currentCase.notes && currentCase.notes.length > 0 ? (
                  <div className="space-y-2">
                    {currentCase.notes.slice(0, 3).map((note, index) => (
                      <div key={index} className="text-sm text-slate-300 bg-slate-700/30 rounded-lg p-2">
                        💬 {note.content.length > 50 ? `${note.content.substring(0, 50)}...` : note.content}
                      </div>
                    ))}
                    {currentCase.notes.length > 3 && (
                      <div className="text-sm text-slate-400">
                        ... and {currentCase.notes.length - 3} more notes
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No notes transferred</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => {
              const isAdminContext = window.location.pathname.includes('/admin');
              const targetPath = isAdminContext 
                ? `/admin/legal-case/${id}` 
                : `/legal/cases/${id}`;
              navigate(targetPath);
            }}
            className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 border border-slate-600/50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaSave className="w-4 h-4" />
            )}
{isSubmitting ? "Updating..." : (currentCase.escalatedFrom ? "Complete Court Details" : "Update Case Details")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteCaseInfo;
