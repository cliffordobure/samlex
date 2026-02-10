import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import creditCaseApi from "../../store/api/creditCaseApi";
import { getUsers } from "../../store/slices/userSlice";
import { fetchActiveClients } from "../../store/slices/clientSlice";
import { validateFile } from "../../utils/cloudinary";
import { API_URL } from "../../config/api.js";

const API_BASE = API_URL;

const CreateCase = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const { activeClients } = useSelector((state) => state.clients);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    debtorName: "",
    debtorEmail: "",
    debtorContact: "",
    creditorName: "",
    creditorEmail: "",
    creditorContact: "",
    debtAmount: "",
    caseReference: "",
    description: "",
    assignedTo: "", // Add assignment field
    documents: [],
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState("");
  const [debtorSelectionMode, setDebtorSelectionMode] = useState("new"); // "existing" or "new"
  const [selectedDebtorId, setSelectedDebtorId] = useState("");
  // Per-case SMS preferences (admin can configure who gets SMS on creation)
  const [smsPreferences, setSmsPreferences] = useState({
    sendSmsToAssigned: true,
    // By default, don't send SMS to external parties when creating a case
    sendSmsToDebtor: false,
    sendSmsToCreditor: false,
  });

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate each file
    const validFiles = [];
    const errors = [];
    
    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    setFiles(validFiles);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    let documentUrls = [];
    
    try {
      // 1. Upload files through backend endpoint if present
      if (files.length > 0) {
        console.log("📁 Uploading", files.length, "files through backend...");
        setUploadingFiles(true);
        setUploadProgress({});

        try {
          const uploadedUrls = [];

          // Upload each file through backend endpoint (same as Add Document button)
          for (const file of files) {
            console.log("Uploading file:", file.name, "Size:", file.size);

            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch(`${API_BASE}/upload`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: formData,
            });

            console.log("Upload response status:", uploadResponse.status);

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({}));
              console.error("Upload failed:", errorData);
              throw new Error(
                `Failed to upload file: ${
                  errorData.message || uploadResponse.statusText
                }`
              );
            }

            const uploadResult = await uploadResponse.json();
            console.log("Upload result:", uploadResult);
            uploadedUrls.push(uploadResult.url);
          }

          documentUrls = uploadedUrls;
          console.log("✅ All files uploaded successfully through backend:", documentUrls);
        } catch (uploadError) {
          console.error("❌ Backend upload error:", uploadError);
          setError("Failed to upload files. Please try again.");
          setUploadingFiles(false);
          setLoading(false);
          return;
        } finally {
          setUploadingFiles(false);
          setUploadProgress({});
        }
      }

      // 2. Prepare debtor data based on selection mode
      let debtorData = {};
      if (debtorSelectionMode === "existing" && selectedDebtorId) {
        // If existing client is selected, we'll send the client ID
        // The backend will handle mapping it to debtor fields
        const selectedClient = activeClients.find(
          (c) => c._id === selectedDebtorId
        );
        if (selectedClient) {
          debtorData = {
            debtorName: `${selectedClient.firstName} ${selectedClient.lastName}`,
            debtorEmail: selectedClient.email || "",
            debtorContact: selectedClient.phoneNumber || "",
          };
        }
      } else {
        // Use form data for new debtor
        debtorData = {
          debtorName: form.debtorName,
          debtorEmail: form.debtorEmail,
          debtorContact: form.debtorContact,
        };
      }

      // 3. Create the case with Cloudinary URLs
      console.log("📋 Creating case with document URLs:", documentUrls);
      await creditCaseApi.createCreditCase({
        ...form,
        ...debtorData,
        debtAmount: Number(form.debtAmount),
        assignedTo: form.assignedTo || undefined,
        documents: documentUrls, // Send Cloudinary URLs instead of files
        // Pass SMS preferences to backend so it can decide who to notify
        ...smsPreferences,
      });

      // Show success message
      if (files.length > 0) {
        alert(`Case created successfully with ${documentUrls.length} files uploaded!`);
      } else {
        alert("Case created successfully!");
      }

      // Navigate back to admin case management if coming from admin panel
      const isFromAdmin = window.location.pathname.includes("/admin");
      navigate(isFromAdmin ? "/admin/cases" : "/credit-collection/cases");
      
    } catch (err) {
      console.error("❌ Case creation error:", err);
      setError(err.response?.data?.message || "Failed to create case");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            Create Credit Collection Case
          </h1>
          <p className="text-slate-400">Fill in the details below to create a new credit collection case</p>
        </div>

        {/* Form Container */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Information Section */}
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter case title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Case Reference No
                    </label>
                    <input
                      name="caseReference"
                      value={form.caseReference}
                      onChange={handleChange}
                      placeholder="kwc/cv/087/2025"
                      required
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* SMS Notification Settings */}
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h6m-6 4h4M5 5a2 2 0 012-2h10a2 2 0 012 2v9.586a1 1 0 01-.293.707l-3.414 3.414A1 1 0 0114.586 19H7a2 2 0 01-2-2V5z"
                    />
                  </svg>
                  SMS Notifications on Case Creation
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                  Choose who should receive SMS notifications immediately after this
                  case is created. You can always send additional SMS later from the
                  SMS tools.
                </p>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-emerald-500 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
                      checked={smsPreferences.sendSmsToAssigned}
                      onChange={(e) =>
                        setSmsPreferences((prev) => ({
                          ...prev,
                          sendSmsToAssigned: e.target.checked,
                        }))
                      }
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-200">
                        Notify assigned debt collector
                      </span>
                      <p className="text-xs text-slate-400">
                        Sends an SMS to the staff member the case is assigned to (recommended).
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-emerald-500 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
                      checked={smsPreferences.sendSmsToDebtor}
                      onChange={(e) =>
                        setSmsPreferences((prev) => ({
                          ...prev,
                          sendSmsToDebtor: e.target.checked,
                        }))
                      }
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-200">
                        Notify debtor (client) on creation
                      </span>
                      <p className="text-xs text-slate-400">
                        When enabled, the debtor receives an SMS as soon as the case is
                        created and assigned. Leave this off if you want to contact
                        them later manually.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-emerald-500 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
                      checked={smsPreferences.sendSmsToCreditor}
                      onChange={(e) =>
                        setSmsPreferences((prev) => ({
                          ...prev,
                          sendSmsToCreditor: e.target.checked,
                        }))
                      }
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-200">
                        Notify creditor on creation
                      </span>
                      <p className="text-xs text-slate-400">
                        When enabled, the creditor receives an SMS confirmation that the
                        case has been created and assigned.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Debtor Information Section */}
              <div className="bg-gradient-to-br from-red-700/20 to-red-600/20 rounded-xl p-6 border border-red-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Debtor Information
                </h3>
                
                {/* Debtor Selection Mode Toggle */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Debtor Selection <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="debtorMode"
                        value="existing"
                        checked={debtorSelectionMode === "existing"}
                        onChange={(e) => {
                          setDebtorSelectionMode(e.target.value);
                          setSelectedDebtorId("");
                          setForm((prev) => ({
                            ...prev,
                            debtorName: "",
                            debtorEmail: "",
                            debtorContact: "",
                          }));
                        }}
                        className="w-4 h-4 text-red-500 bg-slate-700 border-slate-600 focus:ring-red-500 focus:ring-2"
                      />
                      <span className="text-slate-300">Select Existing Client</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="debtorMode"
                        value="new"
                        checked={debtorSelectionMode === "new"}
                        onChange={(e) => {
                          setDebtorSelectionMode(e.target.value);
                          setSelectedDebtorId("");
                        }}
                        className="w-4 h-4 text-red-500 bg-slate-700 border-slate-600 focus:ring-red-500 focus:ring-2"
                      />
                      <span className="text-slate-300">Create New Debtor</span>
                    </label>
                  </div>
                </div>

                {/* Existing Client Selection */}
                {debtorSelectionMode === "existing" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Select Client <span className="text-red-400">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      value={selectedDebtorId}
                      onChange={(e) => {
                        setSelectedDebtorId(e.target.value);
                        const selectedClient = activeClients.find(
                          (c) => c._id === e.target.value
                        );
                        if (selectedClient) {
                          setForm((prev) => ({
                            ...prev,
                            debtorName: `${selectedClient.firstName} ${selectedClient.lastName}`,
                            debtorEmail: selectedClient.email || "",
                            debtorContact: selectedClient.phoneNumber || "",
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
                    {selectedDebtorId && (
                      <div className="mt-3 p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                        {(() => {
                          const selectedClient = activeClients.find(
                            (c) => c._id === selectedDebtorId
                          );
                          return selectedClient ? (
                            <div className="text-sm text-slate-300">
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

                {/* New Debtor Form Fields */}
                {debtorSelectionMode === "new" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Debtor Name
                    </label>
                    <input
                      name="debtorName"
                      value={form.debtorName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter debtor name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Debtor Email
                    </label>
                    <input
                      name="debtorEmail"
                      type="email"
                      value={form.debtorEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="debtor@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Debtor Contact
                    </label>
                    <input
                      name="debtorContact"
                      value={form.debtorContact}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>
                )}
              </div>

              {/* Creditor Information Section */}
              <div className="bg-gradient-to-br from-green-700/20 to-green-600/20 rounded-xl p-6 border border-green-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Creditor Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Creditor Name
                    </label>
                    <input
                      name="creditorName"
                      value={form.creditorName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter creditor name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Creditor Email
                    </label>
                    <input
                      name="creditorEmail"
                      type="email"
                      value={form.creditorEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="creditor@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Creditor Contact
                    </label>
                    <input
                      name="creditorContact"
                      value={form.creditorContact}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>
              </div>

              {/* Case Details Section */}
              <div className="bg-gradient-to-br from-purple-700/20 to-purple-600/20 rounded-xl p-6 border border-purple-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Case Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Debt Amount (KSH) <span className="text-slate-500 text-xs">(Optional)</span>
                    </label>
                    <input
                      name="debtAmount"
                      type="number"
                      value={form.debtAmount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter debt amount (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Assign To</label>
                    <select
                      name="assignedTo"
                      value={form.assignedTo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Leave unassigned</option>
                      {user?.role === "law_firm_admin" && (
                        <option value={user._id}>
                          {user.firstName} {user.lastName} (You - Admin)
                        </option>
                      )}
                      {users
                        ?.filter((u) =>
                          [
                            "debt_collector",
                            "credit_head",
                            "law_firm_admin",
                            "admin",
                          ].includes(u.role)
                        )
                        .map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.firstName} {user.lastName} (
                            {user.role.replace("_", " ")})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Enter case description (optional)..."
                  />
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-gradient-to-br from-yellow-700/20 to-yellow-600/20 rounded-xl p-6 border border-yellow-600/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Documents (Optional)
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Upload Documents
                  </label>
                  <input
                    type="file"
                    accept="application/pdf,image/*,.doc,.docx"
                    multiple
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-white hover:file:bg-yellow-600"
                  />
                  {files.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                      <p className="text-sm font-medium text-slate-300 mb-2">Selected Files:</p>
                      <div className="space-y-2">
                        {files.map((f, index) => (
                          <div key={index} className="text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                              {uploadingFiles && uploadProgress[f.name] !== undefined && (
                                <span className="text-yellow-400">
                                  {Math.round(uploadProgress[f.name])}%
                                </span>
                              )}
                            </div>
                            {uploadingFiles && uploadProgress[f.name] !== undefined && (
                              <div className="mt-1 w-full bg-slate-600 rounded-full h-1.5">
                                <div 
                                  className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress[f.name]}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {uploadingFiles && (
                        <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Uploading files to Cloudinary...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-400 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-600/50">
                <button
                  type="button"
                  onClick={() => navigate("/credit-collection/cases")}
                  className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border border-slate-600/50 hover:border-slate-500/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {uploadingFiles ? 'Uploading...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Case
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCase;
