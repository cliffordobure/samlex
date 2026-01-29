import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { createLegalCase } from "../../store/slices/legalCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import { fetchActiveClients } from "../../store/slices/clientSlice";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api.js";

const API_BASE = API_URL;
import {
  FaSave,
  FaUpload,
  FaTimes,
  FaFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGavel,
  FaCalendar,
  FaMapMarkerAlt,
  FaBuilding,
  FaUserTie,
} from "react-icons/fa";

const CreateLegalCase = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const { activeClients } = useSelector((state) => state.clients);

  // Get escalated credit case from location state
  const escalatedCreditCase = location.state?.escalatedCreditCase;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    caseType: "",
    caseReference: "",
    assignedTo: "",
    client: {
      name: "",
      email: "",
      phone: "",
    },
    filingFee: {
      amount: "",
      currency: "KES",
      paid: false,
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
    priority: "medium",
    documents: [],
    requiredDocuments: [
      "demand_letter",
      "payment_proof",
      "debtor_response",
      "escalation_authorization",
    ],
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [clientSelectionMode, setClientSelectionMode] = useState("new"); // "existing" or "new"
  const [selectedClientId, setSelectedClientId] = useState("");

  // Load users for assignment
  useEffect(() => {
    if (user?.lawFirm?._id) {
      dispatch(getUsers({ lawFirm: user.lawFirm._id }));
    }
  }, [dispatch, user?.lawFirm?._id]);

  // Load active clients for selection
  useEffect(() => {
    if (user?.lawFirm?._id) {
      dispatch(fetchActiveClients({ lawFirm: user.lawFirm._id }));
    }
  }, [dispatch, user?.lawFirm?._id]);

  // Pre-fill form if escalated from credit case
  useEffect(() => {
    if (escalatedCreditCase) {
      // If escalated case has a client, try to find it in active clients
      if (escalatedCreditCase.client?._id) {
        const existingClient = activeClients.find(
          (c) => c._id === escalatedCreditCase.client._id
        );
        if (existingClient) {
          setClientSelectionMode("existing");
          setSelectedClientId(existingClient._id);
        } else {
          setFormData((prev) => ({
            ...prev,
            client: {
              name:
                escalatedCreditCase.client?.firstName +
                  " " +
                  escalatedCreditCase.client?.lastName || "",
              email: escalatedCreditCase.client?.email || "",
              phone: escalatedCreditCase.client?.phoneNumber || "",
            },
          }));
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          client: {
            name:
              escalatedCreditCase.client?.firstName +
                " " +
                escalatedCreditCase.client?.lastName || "",
            email: escalatedCreditCase.client?.email || "",
            phone: escalatedCreditCase.client?.phoneNumber || "",
          },
        }));
      }
      setFormData((prev) => ({
        ...prev,
        title: `Legal Case - ${escalatedCreditCase.title}`,
        description: `Escalated from credit collection case: ${escalatedCreditCase.caseNumber}`,
        caseType: "debt_collection",
        escalatedFromCreditCase: escalatedCreditCase._id,
      }));
    }
  }, [escalatedCreditCase, activeClients]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleNestedInputChange = (parent, child, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value,
      },
    }));
  };

  const handleClientInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      client: {
        ...prev.client,
        [field]: value,
      },
    }));
    // Clear error when user starts typing
    if (errors[`client${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors((prev) => ({
        ...prev,
        [`client${field.charAt(0).toUpperCase() + field.slice(1)}`]: "",
      }));
    }
  };

  const handleOpposingPartyContactChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      opposingParty: {
        ...prev.opposingParty,
        contact: {
          ...prev.opposingParty.contact,
          [field]: value,
        },
      },
    }));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Case title is required";
    }

    if (!formData.caseType) {
      newErrors.caseType = "Case type is required";
    }

    // Validate client based on selection mode
    if (clientSelectionMode === "existing") {
      if (!selectedClientId) {
        newErrors.selectedClient = "Please select a client";
      }
    } else {
      if (!formData.client.name.trim()) {
        newErrors.clientName = "Client name is required";
      }

      if (!formData.client.phone.trim()) {
        newErrors.clientPhone = "Client phone is required";
      }

      // Email is optional, but if provided, it must be valid
      if (formData.client.email.trim() && !/\S+@\S+\.\S+/.test(formData.client.email)) {
        newErrors.clientEmail = "Please enter a valid email address";
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = "Case description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Submitting legal case form...");

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);
    setUploadingFiles(true);

    try {
      // Upload files first (only if server is available)
      const uploadedDocuments = [];
      if (uploadedFiles.length > 0) {
        console.log("📁 Uploading", uploadedFiles.length, "files...");

        for (const file of uploadedFiles) {
          console.log("📤 Uploading file:", file.name, "Size:", file.size);

          try {
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch(`${API_BASE}/upload`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: formData,
            });

            console.log("📡 Upload response status:", uploadResponse.status);

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({}));
              console.error("❌ Upload failed:", errorData);
              // Continue without this file instead of failing completely
              console.log(
                "⚠️ Skipping file upload, continuing with case creation..."
              );
              continue;
            }

            const uploadResult = await uploadResponse.json();
            console.log("✅ File uploaded successfully:", uploadResult);
            uploadedDocuments.push(uploadResult.url);
          } catch (uploadError) {
            console.error("❌ File upload error:", uploadError);
            console.log(
              "⚠️ Skipping file upload, continuing with case creation..."
            );
            // Continue without this file
            continue;
          }
        }
        setUploadingFiles(false);
      }

      // Prepare client data based on selection mode
      let clientData;
      if (clientSelectionMode === "existing" && selectedClientId) {
        // Send client ID if existing client is selected
        clientData = selectedClientId;
      } else {
        // Send client object if creating new client
        clientData = formData.client;
      }

      // Create case with Cloudinary URLs (or empty array if upload failed)
      const caseData = {
        ...formData,
        client: clientData,
        filingFee: {
          ...formData.filingFee,
          amount: formData.filingFee.amount === "" ? 0 : parseFloat(formData.filingFee.amount) || 0,
        },
        documents: uploadedDocuments,
      };

      console.log("📋 Creating legal case with data:", caseData);
      const result = await dispatch(createLegalCase(caseData)).unwrap();
      console.log("✅ Legal case created successfully:", result);

      if (uploadedFiles.length > 0 && uploadedDocuments.length === 0) {
        toast.success(
          "Legal case created successfully (files could not be uploaded - server issue)"
        );
      } else {
        toast.success("Legal case created successfully");
      }

      // Navigate back to admin case management if coming from admin panel
      const isFromAdmin = window.location.pathname.includes("/admin");
      const targetPath = isFromAdmin ? "/admin/cases" : "/legal/cases";
      console.log("🧭 Navigating to:", targetPath);
      navigate(targetPath);
    } catch (error) {
      console.error("❌ Error in form submission:", error);
      toast.error(error.message || "Failed to create legal case");
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-dark-800 to-dark-700 border-b border-dark-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                const isFromAdmin = window.location.pathname.includes("/admin");
                navigate(isFromAdmin ? "/admin/cases" : "/legal/cases");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg border border-dark-600 hover:border-primary-400 transition-all duration-200 shadow-sm"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Cases</span>
            </button>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">
                Create Legal Case
              </h1>
              <p className="text-dark-300 text-lg">
                {escalatedCreditCase
                  ? "Create legal case from escalated credit collection case"
                  : "Create a new legal case with all required documents and information"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-dark-300 text-sm font-medium">
                Live Form
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Escalated Case Alert */}
      {escalatedCreditCase && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-600/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-300 mb-2">
                  Escalated from Credit Collection
                </h3>
                <div className="text-blue-200">
                  <p className="mb-1">
                    <span className="font-medium">Case Number:</span>{" "}
                    {escalatedCreditCase.caseNumber}
                  </p>
                  <p>
                    <span className="font-medium">Title:</span>{" "}
                    {escalatedCreditCase.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-8 py-6 border-b border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <FaFileAlt className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Basic Information
                  </h2>
                  <p className="text-dark-300">
                    Essential case details and client information
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Case Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Case Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 bg-dark-900/50 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 ${
                      errors.title
                        ? "border-red-500 focus:ring-red-500/50"
                        : "border-dark-600"
                    }`}
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter case title"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <FaExclamationTriangle className="w-3 h-3" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Case Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Case Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    className={`w-full px-4 py-3 bg-dark-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 ${
                      errors.caseType
                        ? "border-red-500 focus:ring-red-500/50"
                        : "border-dark-600"
                    }`}
                    value={formData.caseType}
                    onChange={(e) =>
                      handleInputChange("caseType", e.target.value)
                    }
                  >
                    <option value="">Select case type</option>
                    <option value="civil">Civil</option>
                    <option value="criminal">Criminal</option>
                    <option value="corporate">Corporate</option>
                    <option value="family">Family</option>
                    <option value="property">Property</option>
                    <option value="labor">Labor</option>
                    <option value="debt_collection">Debt Collection</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.caseType && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <FaExclamationTriangle className="w-3 h-3" />
                      {errors.caseType}
                    </p>
                  )}
                </div>

                {/* Case Reference */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Case Reference
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                    value={formData.caseReference}
                    onChange={(e) =>
                      handleInputChange("caseReference", e.target.value)
                    }
                    placeholder="Enter case reference number"
                  />
                </div>

                {/* Assign To */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Assign To
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                    value={formData.assignedTo}
                    onChange={(e) =>
                      handleInputChange("assignedTo", e.target.value)
                    }
                  >
                    <option value="">Leave unassigned</option>
                    {user?.role === "law_firm_admin" && (
                      <option value={user._id}>
                        {user.firstName} {user.lastName} (You - Admin)
                      </option>
                    )}
                    {users
                      ?.filter((u) => u.role === "advocate")
                      .map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} (Advocate)
                        </option>
                      ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Priority
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                    value={formData.priority}
                    onChange={(e) =>
                      handleInputChange("priority", e.target.value)
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Client Information Section */}
          <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-8 py-6 border-b border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FaUser className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Client Information
                  </h2>
                  <p className="text-dark-300">
                    Client details and contact information
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {/* Client Selection Mode Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-3">
                  Client Selection <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="clientMode"
                      value="existing"
                      checked={clientSelectionMode === "existing"}
                      onChange={(e) => {
                        setClientSelectionMode(e.target.value);
                        setSelectedClientId("");
                        setErrors((prev) => ({
                          ...prev,
                          selectedClient: "",
                          clientName: "",
                          clientEmail: "",
                          clientPhone: "",
                        }));
                      }}
                      className="w-4 h-4 text-primary-500 bg-dark-900 border-dark-600 focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-white">Select Existing Client</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="clientMode"
                      value="new"
                      checked={clientSelectionMode === "new"}
                      onChange={(e) => {
                        setClientSelectionMode(e.target.value);
                        setSelectedClientId("");
                        setErrors((prev) => ({
                          ...prev,
                          selectedClient: "",
                        }));
                      }}
                      className="w-4 h-4 text-primary-500 bg-dark-900 border-dark-600 focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-white">Create New Client</span>
                  </label>
                </div>
              </div>

              {/* Existing Client Selection */}
              {clientSelectionMode === "existing" && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-2">
                    Select Client <span className="text-red-400">*</span>
                  </label>
                  <select
                    className={`w-full px-4 py-3 bg-dark-900/50 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 ${
                      errors.selectedClient
                        ? "border-red-500 focus:ring-red-500/50"
                        : "border-dark-600"
                    }`}
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      if (errors.selectedClient) {
                        setErrors((prev) => ({
                          ...prev,
                          selectedClient: "",
                        }));
                      }
                    }}
                  >
                    <option value="">Choose a client...</option>
                    {activeClients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.firstName} {client.lastName}
                        {client.email ? ` - ${client.email}` : ""}
                        {client.clientType === "corporate" && client.companyName
                          ? ` (${client.companyName})`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {errors.selectedClient && (
                    <p className="text-sm text-red-400 flex items-center gap-1 mt-1">
                      <FaExclamationTriangle className="w-3 h-3" />
                      {errors.selectedClient}
                    </p>
                  )}
                  {selectedClientId && (
                    <div className="mt-3 p-3 bg-dark-900/30 border border-dark-600 rounded-lg">
                      {(() => {
                        const selectedClient = activeClients.find(
                          (c) => c._id === selectedClientId
                        );
                        return selectedClient ? (
                          <div className="text-sm text-dark-300">
                            <p className="text-white font-medium">
                              {selectedClient.firstName} {selectedClient.lastName}
                            </p>
                            {selectedClient.email && (
                              <p>Email: {selectedClient.email}</p>
                            )}
                            {selectedClient.phoneNumber && (
                              <p>Phone: {selectedClient.phoneNumber}</p>
                            )}
                            {selectedClient.clientType === "corporate" &&
                              selectedClient.companyName && (
                                <p>Company: {selectedClient.companyName}</p>
                              )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* New Client Form Fields */}
              {clientSelectionMode === "new" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Client Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                    <input
                      type="text"
                      className={`w-full pl-10 pr-4 py-3 bg-dark-900/50 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 ${
                        errors.clientName
                          ? "border-red-500 focus:ring-red-500/50"
                          : "border-dark-600"
                      }`}
                      value={formData.client.name}
                      onChange={(e) =>
                        handleClientInputChange("name", e.target.value)
                      }
                      placeholder="Enter client name"
                    />
                  </div>
                  {errors.clientName && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <FaExclamationTriangle className="w-3 h-3" />
                      {errors.clientName}
                    </p>
                  )}
                </div>

                {/* Client Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Client Email <span className="text-dark-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                    <input
                      type="email"
                      className={`w-full pl-10 pr-4 py-3 bg-dark-900/50 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 ${
                        errors.clientEmail
                          ? "border-red-500 focus:ring-red-500/50"
                          : "border-dark-600"
                      }`}
                      value={formData.client.email}
                      onChange={(e) =>
                        handleClientInputChange("email", e.target.value)
                      }
                      placeholder="Enter client email"
                    />
                  </div>
                  {errors.clientEmail && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <FaExclamationTriangle className="w-3 h-3" />
                      {errors.clientEmail}
                    </p>
                  )}
                </div>

                {/* Client Phone */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Client Phone <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                    <input
                      type="tel"
                      className={`w-full pl-10 pr-4 py-3 bg-dark-900/50 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 ${
                        errors.clientPhone
                          ? "border-red-500 focus:ring-red-500/50"
                          : "border-dark-600"
                      }`}
                      value={formData.client.phone}
                      onChange={(e) =>
                        handleClientInputChange("phone", e.target.value)
                      }
                      placeholder="Enter client phone"
                    />
                  </div>
                  {errors.clientPhone && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <FaExclamationTriangle className="w-3 h-3" />
                      {errors.clientPhone}
                    </p>
                  )}
                </div>
                </div>
              )}
            </div>
          </div>

          {/* Court Details Section */}
          <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-8 py-6 border-b border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FaGavel className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Court Details
                  </h2>
                  <p className="text-dark-300">
                    Court information and hearing details
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Court Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Court Name
                  </label>
                  <div className="relative">
                    <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                      value={formData.courtDetails.courtName}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "courtDetails",
                          "courtName",
                          e.target.value
                        )
                      }
                      placeholder="Enter court name"
                    />
                  </div>
                </div>

                {/* Court Location */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Court Location
                  </label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                      value={formData.courtDetails.courtLocation}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "courtDetails",
                          "courtLocation",
                          e.target.value
                        )
                      }
                      placeholder="Enter court location"
                    />
                  </div>
                </div>

                {/* Judge Assigned */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Judge Assigned
                  </label>
                  <div className="relative">
                    <FaUserTie className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                      value={formData.courtDetails.judgeAssigned}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "courtDetails",
                          "judgeAssigned",
                          e.target.value
                        )
                      }
                      placeholder="Enter judge name"
                    />
                  </div>
                </div>

                {/* Court Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Court Date
                  </label>
                  <div className="relative">
                    <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                    <input
                      type="datetime-local"
                      className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                      value={formData.courtDetails.courtDate}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "courtDetails",
                          "courtDate",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                {/* Court Room */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Court Room
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                    value={formData.courtDetails.courtRoom}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "courtDetails",
                        "courtRoom",
                        e.target.value
                      )
                    }
                    placeholder="Enter court room"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Opposing Party Section */}
          <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-8 py-6 border-b border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <FaUserTie className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Opposing Party
                  </h2>
                  <p className="text-dark-300">
                    Information about the opposing party and their lawyer
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Opposing Party Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Opposing Party Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                    value={formData.opposingParty.name}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "opposingParty",
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Enter opposing party name"
                  />
                </div>

                {/* Opposing Party Lawyer */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Opposing Party Lawyer
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                    value={formData.opposingParty.lawyer}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "opposingParty",
                        "lawyer",
                        e.target.value
                      )
                    }
                    placeholder="Enter lawyer name"
                  />
                </div>

                {/* Opposing Party Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Opposing Party Email
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                      value={formData.opposingParty.contact.email}
                      onChange={(e) =>
                        handleOpposingPartyContactChange(
                          "email",
                          e.target.value
                        )
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                {/* Opposing Party Phone */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Opposing Party Phone
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                      value={formData.opposingParty.contact.phone}
                      onChange={(e) =>
                        handleOpposingPartyContactChange(
                          "phone",
                          e.target.value
                        )
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filing Fee Section */}
          <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-8 py-6 border-b border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-400 font-bold text-lg">$</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Filing Fee</h2>
                  <p className="text-dark-300">Court filing fee information</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Filing Fee Amount */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Filing Fee Amount
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                    value={formData.filingFee.amount === "" ? "" : formData.filingFee.amount}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "filingFee",
                        "amount",
                        e.target.value === "" ? "" : parseFloat(e.target.value) || ""
                      )
                    }
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Filing Fee Currency */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Currency
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                    value={formData.filingFee.currency}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "filingFee",
                        "currency",
                        e.target.value
                      )
                    }
                  >
                    <option value="KES">KES (Kenyan Shilling)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>
              </div>
              
              {/* Payment Status */}
              <div className="mt-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="filingFeePaid"
                    className="w-5 h-5 text-primary-500 bg-dark-900 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                    checked={formData.filingFee.paid}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "filingFee",
                        "paid",
                        e.target.checked
                      )
                    }
                  />
                  <label htmlFor="filingFeePaid" className="text-sm font-semibold text-white">
                    Filing fee has been paid
                  </label>
                </div>
                <p className="text-dark-400 text-sm mt-2 ml-8">
                  Check this box if the client has already paid the filing fee
                </p>
              </div>
            </div>
          </div>

          {/* Case Description Section */}
          <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-8 py-6 border-b border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <FaFileAlt className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Case Description
                  </h2>
                  <p className="text-dark-300">
                    Detailed description of the case
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white">
                  Case Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  className={`w-full px-4 py-3 bg-dark-900/50 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 resize-none ${
                    errors.description
                      ? "border-red-500 focus:ring-red-500/50"
                      : "border-dark-600"
                  }`}
                  rows={6}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Provide detailed description of the case..."
                />
                {errors.description && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <FaExclamationTriangle className="w-3 h-3" />
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-8 py-6 border-b border-dark-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <FaUpload className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Documents</h2>
                  <p className="text-dark-300">
                    Upload relevant case documents
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {/* Required Documents */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-3">
                  Required Documents
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formData.requiredDocuments.map((doc) => {
                    const isUploaded = uploadedFiles.some((file) =>
                      file.name.toLowerCase().includes(doc.replace("_", ""))
                    );
                    return (
                      <div
                        key={doc}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                          isUploaded
                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                            : "bg-dark-900/30 border-dark-600 text-dark-300"
                        }`}
                      >
                        {isUploaded ? (
                          <FaCheckCircle className="w-4 h-4" />
                        ) : (
                          <FaFileAlt className="w-4 h-4" />
                        )}
                        <span className="text-sm capitalize">
                          {doc.replace("_", " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-dark-400 mt-2">
                  These are suggested documents. You can upload any relevant
                  files.
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white">
                  Upload Documents
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600 transition-all duration-200"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
                <p className="text-sm text-dark-400">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG
                </p>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Uploaded Files
                  </label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-dark-900/30 border border-dark-600 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FaFileAlt className="w-5 h-5 text-primary-400" />
                          <div>
                            <span className="text-white font-medium">
                              {file.name}
                            </span>
                            <p className="text-sm text-dark-400">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Section */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => {
                const isFromAdmin = window.location.pathname.includes("/admin");
                navigate(isFromAdmin ? "/admin/cases" : "/legal/cases");
              }}
              className="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg border border-dark-600 hover:border-primary-400 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || uploadingFiles}
            >
              {isSubmitting || uploadingFiles ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FaSave className="w-4 h-4" />
              )}
              {uploadingFiles
                ? "Uploading Files..."
                : isSubmitting
                ? "Creating Case..."
                : "Create Legal Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLegalCase;
