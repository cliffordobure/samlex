/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCreditCaseById } from "../../store/slices/creditCaseSlice";
import socket from "../../utils/socket";
import creditCaseApi from "../../store/api/creditCaseApi";
import userApi from "../../store/api/userApi";
import toast from "react-hot-toast";
import { getAccessibleDocumentUrl } from "../../utils/documentUrl.js";
import { API_URL } from "../../config/api.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PromisedPaymentsList from "../../components/credit-collection/PromisedPaymentsList";
import { 
  FaArrowLeft, 
  FaFileAlt, 
  FaUser, 
  FaUsers, 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaClock, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaSpinner, 
  FaPlus, 
  FaDownload, 
  FaTimes, 
  FaPaperPlane, 
  FaStickyNote, 
  FaPhone, 
  FaEnvelope, 
  FaBuilding,
  FaGavel,
  FaChartLine
} from "react-icons/fa";

const API_BASE = API_URL;
const FILE_BASE = API_BASE.replace(/\/api$/, ""); // Remove /api if present

const statusColors = {
  Open: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "In Progress": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Closed: "bg-green-500/20 text-green-400 border border-green-500/30",
  Resolved: "bg-green-500/20 text-green-400 border border-green-500/30",
  Pending: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  Escalated: "bg-red-500/20 text-red-400 border border-red-500/30",
  assigned: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  follow_up_required: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  escalated_to_legal: "bg-red-500/20 text-red-400 border border-red-500/30",
  resolved: "bg-green-500/20 text-green-400 border border-green-500/30",
  closed: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  // Add more statuses as needed
};

const CaseDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { caseDetails, caseDetailsLoading, caseDetailsError } = useSelector(
    (state) => state.creditCases
  );
  const { user } = useSelector((state) => state.auth);
  console.log("Redux user object:", user);
  const getUser = (user) => user?.data || user || {};
  const currentUser = getUser(user);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const commentsEndRef = useRef(null);

  // Assignment state
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Escalation state
  const [escalationFee, setEscalationFee] = useState(0);
  const [escalationLoading, setEscalationLoading] = useState(false);
  const [escalationError, setEscalationError] = useState("");
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState("");
  const [noteDate, setNoteDate] = useState(new Date());
  const [followUpDate, setFollowUpDate] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);

  // Document viewer state
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Document upload state
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  // Promised payments state
  const [showPromisedPaymentsModal, setShowPromisedPaymentsModal] =
    useState(false);

  // Fetch case details, comments, assignable users
  useEffect(() => {
    dispatch(getCreditCaseById(id));
    fetchComments();
    fetchAssignableUsers();
    fetchEscalationFee();
    // Join socket room for this case
    socket.emit("join-case", id);
    // Listen for new comments and assignment updates
    socket.on("newComment", handleNewComment);
    socket.on("caseAssigned", handleCaseAssigned);
    socket.on("caseEscalated", handleCaseEscalated);
    return () => {
      socket.off("newComment", handleNewComment);
      socket.off("caseAssigned", handleCaseAssigned);
      socket.off("caseEscalated", handleCaseEscalated);
    };
    // eslint-disable-next-line
  }, [dispatch, id]);

  // Scroll to bottom when comments update
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  // Fetch comments from backend
  async function fetchComments() {
    try {
      const res = await creditCaseApi.getCaseComments(id);
      if (res.data.success) setComments(res.data.data);
    } catch (err) {
      // handle error
    }
  }

  // Fetch assignable users (debt collectors, credit heads, and admins)
  async function fetchAssignableUsers() {
    try {
      // Get all users and filter for assignable roles
      const res = await userApi.getUsers();
      console.log("All users API response:", res.data);
      if (res.data.success && Array.isArray(res.data.data.users)) {
        // Filter users to include debt collectors, credit heads, and admins
        const assignableUsers = res.data.data.users.filter((user) =>
          ["debt_collector", "credit_head", "law_firm_admin", "admin"].includes(
            user.role
          )
        );
        setAssignableUsers(assignableUsers);
      } else {
        setAssignableUsers([]);
      }
    } catch (err) {
      setAssignableUsers([]);
    }
  }

  // Handle new comment from socket
  function handleNewComment(comment) {
    setComments((prev) => [...prev, comment]);
  }

  // Handle assignment update from socket
  function handleCaseAssigned({ caseId, assignedTo }) {
    if (caseId === id) {
      dispatch(getCreditCaseById(id)); // Refresh case details
    }
  }

  // Handle case escalation from socket
  function handleCaseEscalated({ caseId }) {
    if (caseId === id) {
      dispatch(getCreditCaseById(id)); // Refresh case details
    }
  }

  // Document viewer functions
  const handleDocumentClick = async (doc, filename) => {
    let documentUrl = doc;
    if (doc.startsWith("http")) {
      documentUrl = doc;
    } else if (doc.startsWith("/uploads/")) {
      documentUrl = `${FILE_BASE}${doc}`;
    } else if (doc.startsWith("uploads/")) {
      documentUrl = `${FILE_BASE}/${doc}`;
    } else {
      documentUrl = `${FILE_BASE}/uploads/general/${doc}`;
    }
    
    // For S3 URLs, get signed URL
    if (documentUrl.includes('.s3.') || documentUrl.includes('s3.amazonaws.com')) {
      try {
        documentUrl = await getAccessibleDocumentUrl(documentUrl);
      } catch (error) {
        console.error("Error getting signed URL:", error);
        toast.error("Failed to load document");
        return;
      }
    }
    
    setSelectedDocument({ url: documentUrl, filename });
    setShowDocumentModal(true);
  };

  const handleDownloadDocument = () => {
    if (selectedDocument) {
      const link = document.createElement("a");
      link.href = selectedDocument.url;
      link.download = selectedDocument.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
  };

  // Handle document upload with Cloudinary
  const handleDocumentUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    console.log("=== DEBUG: handleDocumentUpload ===");
    console.log("Files to upload:", files);

    setUploadingDocuments(true);
    try {
      const uploadedUrls = [];

      // Upload each file to Cloudinary
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

      console.log("All uploaded URLs:", uploadedUrls);

      if (uploadedUrls.length === 0) {
        throw new Error("No files were successfully uploaded");
      }

      // Add documents to case
      console.log("Sending to API:", { documents: uploadedUrls });
      await creditCaseApi.addDocument(id, { documents: uploadedUrls });
      toast.success("Documents uploaded successfully");
      dispatch(getCreditCaseById(id)); // Refresh case details
    } catch (error) {
      console.error("Document upload error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload documents"
      );
    } finally {
      setUploadingDocuments(false);
    }
  };

  // Fetch escalation fee
  async function fetchEscalationFee() {
    try {
      const res = await creditCaseApi.getEscalationFee(id);
      if (res.data.success) {
        setEscalationFee(res.data.data.escalationFee);
      }
    } catch (err) {
      console.error("Error fetching escalation fee:", err);
    }
  }

  // Initiate escalation
  async function handleInitiateEscalation() {
    setEscalationLoading(true);
    setEscalationError("");
    try {
      const res = await creditCaseApi.initiateEscalation(id);
      if (res.data.success) {
        setPaymentDetails(res.data.data.payment);
        setShowEscalationModal(true);
      } else {
        setEscalationError(res.data.message || "Failed to initiate escalation");
      }
    } catch (err) {
      setEscalationError(
        err.response?.data?.message || "Failed to initiate escalation"
      );
    } finally {
      setEscalationLoading(false);
    }
  }

  // Confirm escalation payment
  async function handleConfirmEscalation() {
    if (!paymentDetails) return;

    setEscalationLoading(true);
    setEscalationError("");
    try {
      const res = await creditCaseApi.confirmEscalationPayment(
        id,
        paymentDetails._id
      );
      if (res.data.success) {
        setShowEscalationModal(false);
        setPaymentDetails(null);
        toast.success("Case escalated to legal successfully!");
        dispatch(getCreditCaseById(id)); // Refresh case details
      } else {
        setEscalationError(res.data.message || "Failed to confirm escalation");
      }
    } catch (err) {
      setEscalationError(
        err.response?.data?.message || "Failed to confirm escalation"
      );
    } finally {
      setEscalationLoading(false);
    }
  }

  // Handle comment submit
  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setCommentLoading(true);
    try {
      const res = await creditCaseApi.addCaseComment(id, {
        content: commentInput,
      });
      if (res.data.success) {
        setCommentInput("");
        // Comment will be added via socket event
      }
    } finally {
      setCommentLoading(false);
    }
  }

  // Handle assignment change
  async function handleAssignChange(e) {
    const userId = e.target.value;
    setAssignLoading(true);
    setAssignError("");
    try {
      const res = await creditCaseApi.assignCase(id, userId);
      if (res.data.success) {
        toast.success("Case assigned successfully!");
        // Immediately refresh case details
        dispatch(getCreditCaseById(id));
        // Assignment will also be updated via socket event
      } else {
        setAssignError(res.data.message || "Failed to assign case");
      }
    } catch (err) {
      setAssignError("Failed to assign case");
      toast.error("Failed to assign case");
    } finally {
      setAssignLoading(false);
    }
  }

  // Fetch notes for this case
  useEffect(() => {
    fetchNotes();
  }, [id]);

  async function fetchNotes() {
    try {
      const res = await creditCaseApi.getCreditCase(id); // Assuming notes are in the case details
      if (res.data.success && res.data.data.notes) {
        setNotes(res.data.data.notes);
      } else {
        setNotes([]);
      }
    } catch (err) {
      setNotes([]);
    }
  }

  // Handle add note
  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setNoteLoading(true);
    try {
      const note = {
        content: noteContent,
        date: noteDate ? noteDate.toISOString() : new Date().toISOString(),
        followUpDate: followUpDate ? followUpDate.toISOString() : undefined,
      };
      const res = await creditCaseApi.addNote(id, note);
      if (res.data.success) {
        setNoteContent("");
        setNoteDate(new Date());
        setFollowUpDate(null);
        fetchNotes();
        toast.success("Note added!");
      }
    } finally {
      setNoteLoading(false);
    }
  }

  // Handle promised payments modal
  const handlePromisedPaymentsUpdate = () => {
    dispatch(getCreditCaseById(id)); // Refresh case details
  };

  // Helper to extract filename from URL or path
  const getDocumentFilename = (doc, idx) => {
    if (doc.startsWith("http")) {
      // Cloudinary or remote URL
      return doc.split("/").pop().split("?")[0] || `Document ${idx + 1}`;
    }
    return doc.split("/").pop() || `Document ${idx + 1}`;
  };

  if (caseDetailsLoading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xl font-semibold text-white">Loading Case Details...</p>
          <p className="text-slate-400 mt-2">Please wait while we fetch the case information</p>
        </div>
      </div>
    );
  if (caseDetailsError)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full mb-4">
            <FaExclamationTriangle className="w-8 h-8 text-white" />
          </div>
          <p className="text-xl font-semibold text-white">Error Loading Case</p>
          <p className="text-slate-400 mt-2">{caseDetailsError}</p>
        </div>
      </div>
    );
  if (!caseDetails)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full mb-4">
            <FaFileAlt className="w-8 h-8 text-white" />
          </div>
          <p className="text-xl font-semibold text-white">Case Not Found</p>
          <p className="text-slate-400 mt-2">The requested case could not be located</p>
        </div>
      </div>
    );

  const {
    caseNumber,
    title,
    description,
    debtorName,
    debtorEmail,
    debtorContact,
    creditorName,
    creditorEmail,
    creditorContact,
    debtAmount,
    currency,
    status,
    priority,
    assignedTo,
    documents,
    createdAt,
    updatedAt,
  } = caseDetails;

  // Status badge color
  const statusColor = statusColors[status] || "bg-gray-600";

  console.log("📄 Case Details - Documents:", {
    documents,
    caseNumber,
    title,
  });

  console.log("Current user:", currentUser);

  const isHeadOfCredit = currentUser.role === "credit_head";
  const isAdmin =
    currentUser.role === "admin" || currentUser.role === "law_firm_admin";
  const canAssignCases = isHeadOfCredit || isAdmin;

  console.log("assignedTo", assignedTo, "currentUser._id", currentUser._id);

  // --- Notes Section ---
  const renderNotesSection = () => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 shadow-xl mb-6 sm:mb-8" data-notes-section>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-white">
          Case Notes & Follow-ups
        </h3>
      </div>

      <form
        onSubmit={handleAddNote}
        className="bg-dark-800/50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-dark-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-2 font-medium">
              Date of Interaction
            </label>
            <DatePicker
              selected={noteDate}
              onChange={setNoteDate}
              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              dateFormat="yyyy-MM-dd"
              maxDate={new Date()}
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-gray-400 mb-2 font-medium">
              Next Follow-up (optional)
            </label>
            <DatePicker
              selected={followUpDate}
              onChange={setFollowUpDate}
              className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              dateFormat="yyyy-MM-dd"
              minDate={new Date()}
              isClearable
              placeholderText="Select date"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors disabled:opacity-60 text-sm sm:text-base"
              disabled={noteLoading}
            >
              {noteLoading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Note
                </>
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs sm:text-sm text-gray-400 mb-2 font-medium">
            Note / Response
          </label>
          <textarea
            className="w-full bg-dark-700/50 border border-dark-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[80px] text-sm"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="E.g. Called debtor, agreed to pay next week..."
            required
          />
        </div>
      </form>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-400">No notes added yet.</p>
          </div>
        ) : (
          notes
            .slice()
            .reverse()
            .map((note, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400">
                        {new Date(note.date).toLocaleDateString()}
                      </span>
                      {note.followUpDate && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                          Follow-up:{" "}
                          {new Date(note.followUpDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-200 text-sm leading-relaxed">
                      {note.content}
                    </div>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 relative">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-4 sm:space-y-6 pb-20 sm:pb-8">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                to="/credit-collection/cases"
                className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-400 rounded-xl transition-all duration-200 border border-blue-500/30 hover:border-blue-500/50 text-sm sm:text-base"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span className="font-medium">Back to Cases</span>
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <span className="text-xs sm:text-sm text-slate-400 font-mono bg-slate-700/50 px-2 sm:px-3 py-1 rounded-lg border border-slate-600/50 text-center">
                  #{caseNumber}
                </span>
                <span
                  className={`inline-flex items-center justify-center px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${statusColors[status] || statusColors["Pending"]} shadow-lg`}
                >
                  {status?.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-6">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 leading-tight break-words">
              {title}
            </h1>
            <p className="text-slate-300 text-sm sm:text-lg leading-relaxed max-w-4xl break-words">
              {description?.substring(0, 120)}...
            </p>
          </div>
        </div>
        {/* Case Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Case Details Card */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl">
                <FaFileAlt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Case Details</h3>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                <span className="text-slate-400 text-xs sm:text-sm">Priority</span>
                <span className="px-2 sm:px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs sm:text-sm font-medium border border-yellow-500/30 text-center">
                  {priority}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                <span className="text-slate-400 text-xs sm:text-sm">Created</span>
                <span className="text-white text-xs sm:text-sm flex items-center space-x-2">
                  <FaCalendarAlt className="w-3 h-3 text-slate-400" />
                  <span>{new Date(createdAt).toLocaleDateString()}</span>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                <span className="text-slate-400 text-xs sm:text-sm">Updated</span>
                <span className="text-white text-xs sm:text-sm flex items-center space-x-2">
                  <FaClock className="w-3 h-3 text-slate-400" />
                  <span>{new Date(updatedAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Assignment Card */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl">
                <FaUser className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Assignment</h3>
            </div>
            <div className="space-y-3">
              {canAssignCases ? (
                <>
                  <select
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-700/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 text-sm sm:text-base"
                    value={assignedTo?._id || ""}
                    onChange={handleAssignChange}
                    disabled={assignLoading}
                  >
                    <option value="">Select Assignee</option>
                    {Array.isArray(assignableUsers) &&
                      assignableUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.firstName} {u.lastName} ({u.role.replace("_", " ")})
                        </option>
                      ))}
                  </select>
                  {assignLoading && (
                    <div className="flex items-center space-x-2 text-blue-400 text-xs sm:text-sm">
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Assigning...</span>
                    </div>
                  )}
                  {assignError && (
                    <div className="text-red-400 text-xs sm:text-sm bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                      {assignError}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <FaUser className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  </div>
                  <span className="text-white text-sm sm:text-base break-words">
                    {assignedTo
                      ? assignedTo.name || assignedTo.email
                      : "Unassigned"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl">
                <FaMoneyBillWave className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Financial</h3>
            </div>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {debtAmount.toLocaleString()}
                </div>
                <div className="text-slate-400 text-xs sm:text-sm font-medium">{currency}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Parties Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Debtor Card */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl">
                <FaUser className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Debtor</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs sm:text-sm text-slate-400 mb-1">Name</div>
                <div className="text-white font-medium text-sm sm:text-base break-words">{debtorName}</div>
              </div>
              {debtorEmail && (
                <div>
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Email</div>
                  <a
                    href={`mailto:${debtorEmail}`}
                    className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors text-sm sm:text-base break-all"
                  >
                    <FaEnvelope className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">{debtorEmail}</span>
                  </a>
                </div>
              )}
              {debtorContact && (
                <div>
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Phone</div>
                  <a
                    href={`tel:${debtorContact}`}
                    className="inline-flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors text-sm sm:text-base break-all"
                  >
                    <FaPhone className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">{debtorContact}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Creditor Card */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl">
                <FaUsers className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Creditor</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs sm:text-sm text-slate-400 mb-1">Name</div>
                <div className="text-white font-medium text-sm sm:text-base break-words">{creditorName}</div>
              </div>
              {creditorEmail && (
                <div>
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Email</div>
                  <a
                    href={`mailto:${creditorEmail}`}
                    className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors text-sm sm:text-base break-all"
                  >
                    <FaEnvelope className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">{creditorEmail}</span>
                  </a>
                </div>
              )}
              {creditorContact && (
                <div>
                  <div className="text-xs sm:text-sm text-slate-400 mb-1">Phone</div>
                  <a
                    href={`tel:${creditorContact}`}
                    className="inline-flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors text-sm sm:text-base break-all"
                  >
                    <FaPhone className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">{creditorContact}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
              <FaStickyNote className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Case Description
            </h3>
          </div>
          <div className="text-slate-200 leading-relaxed text-sm sm:text-base break-words">{description}</div>
        </div>
        
        {/* Documents */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl">
                <FaFileAlt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Documents</h3>
            </div>
            {/* Add Document Button */}
            <div className="flex items-center space-x-2">
              <input
                type="file"
                multiple
                accept="application/pdf,image/*,.doc,.docx,.txt"
                onChange={handleDocumentUpload}
                className="hidden"
                id="document-upload"
                disabled={uploadingDocuments}
              />
              <label
                htmlFor="document-upload"
                className={`inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer text-sm sm:text-base ${
                  uploadingDocuments
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {uploadingDocuments ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" />
                    <span>Add Document</span>
                  </>
                )}
              </label>
            </div>
          </div>
          {Array.isArray(documents) &&
          documents.filter((doc) => typeof doc === "string" && doc).length >
            0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {documents
                .filter((doc) => typeof doc === "string" && doc)
                .map((doc, idx) => {
                  let documentUrl = doc;
                  if (doc.startsWith("http")) {
                    documentUrl = doc;
                  } else if (doc.startsWith("/uploads/")) {
                    documentUrl = `${FILE_BASE}${doc}`;
                  } else if (doc.startsWith("uploads/")) {
                    documentUrl = `${FILE_BASE}/${doc}`;
                  } else {
                    documentUrl = `${FILE_BASE}/uploads/general/${doc}`;
                  }
                  const filename = getDocumentFilename(doc, idx);
                  return (
                    <div
                      key={idx}
                      className="bg-slate-700/50 rounded-xl p-3 sm:p-4 hover:bg-slate-600/50 transition-all duration-200 cursor-pointer border border-slate-600/50 hover:border-slate-500/50 hover:shadow-lg"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaFileAlt className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                        </div>
                        <button
                          onClick={() => handleDocumentClick(doc, filename)}
                          className="text-blue-400 hover:text-blue-300 transition-colors text-left flex-1 text-xs sm:text-sm font-medium break-words"
                        >
                          {filename}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFileAlt className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">
                No documents attached to this case.
              </p>
            </div>
          )}
        </div>



        {/* Escalation Section - Debt Collector View */}
        {currentUser?.role === "debt_collector" &&
          (assignedTo?._id || assignedTo)?.toString() ===
            currentUser._id?.toString() &&
          status !== "escalated_to_legal" && (
            <div className="mb-6">
              <div className="font-semibold mb-3 text-primary-400">
                Case Escalation
              </div>
              <div className="bg-dark-800 rounded-lg p-4">
                <div className="mb-4">
                  <p className="text-gray-300 mb-2">
                    If this case requires legal intervention, you can escalate
                    it to the legal department.
                  </p>
                  <p className="text-yellow-400 text-sm">
                    Escalation Fee: {escalationFee.toLocaleString()} KES
                  </p>
                </div>

                {escalationError && (
                  <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200">
                    {escalationError}
                  </div>
                )}

                <button
                  onClick={handleInitiateEscalation}
                  disabled={escalationLoading}
                  className="btn btn-primary px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  {escalationLoading ? "Processing..." : "Initiate Escalation"}
                </button>
              </div>
            </div>
          )}

        {/* Escalation Status - Show for escalated cases */}
        {status === "escalated_to_legal" && (
          <div className="mb-6">
            <div className="font-semibold mb-3 text-primary-400">
              Escalation Status
            </div>
            <div className="bg-green-900 border border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-green-400 font-semibold">
                  Case Escalated to Legal Department
                </span>
              </div>
              <p className="text-green-200 text-sm">
                This case has been successfully escalated to the legal
                department for further action.
              </p>
            </div>
          </div>
        )}
        {/* Professional Comments Section */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl">
              <FaPaperPlane className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Case Communications
            </h3>
          </div>

          {/* Comments Display */}
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6 max-h-96 overflow-y-auto border border-slate-600/50">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-600/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPaperPlane className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">
                  No communications yet. Start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="bg-slate-600/30 rounded-xl p-4 border border-slate-500/30 hover:bg-slate-600/50 transition-all duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <FaUser className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-white text-sm">
                            {comment.author?.firstName}{" "}
                            {comment.author?.lastName}
                          </span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                            {comment.role}
                          </span>
                          <span className="text-xs text-slate-400 ml-auto">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-slate-200 text-sm leading-relaxed">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>

          {/* Professional Comment Input */}
          <form
            onSubmit={handleCommentSubmit}
            className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FaUser className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full px-4 py-3 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none min-h-[80px]"
                  placeholder="Add a professional comment or update about this case..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  disabled={commentLoading}
                  required
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-slate-400">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                    disabled={commentLoading || !commentInput.trim()}
                  >
                    {commentLoading ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="w-4 h-4" />
                        <span>Send Comment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        {renderNotesSection()}

        {/* Promised Payments Section */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl">
                <FaChartLine className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Promised Payments
              </h3>
            </div>
            <button
              onClick={() => setShowPromisedPaymentsModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaPlus className="w-4 h-4" />
              <span>Add Promised Payment</span>
            </button>
          </div>

          {/* Promised Payments List */}
          <PromisedPaymentsList
            case_={caseDetails}
            onUpdate={handlePromisedPaymentsUpdate}
          />
        </div>

        {/* Escalation Confirmation Modal */}
        {showEscalationModal && paymentDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4 relative shadow-2xl border border-primary-700">
              {/* Close button */}
              <button
                onClick={() => {
                  setShowEscalationModal(false);
                  setPaymentDetails(null);
                  setEscalationError("");
                }}
                className="absolute top-3 right-3 text-dark-400 hover:text-white text-xl font-bold focus:outline-none"
                aria-label="Close"
              >
                &times;
              </button>
              <div className="mb-4 flex flex-col items-center">
                {/* Success/Info Icon */}
                <svg
                  className="w-12 h-12 text-primary-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
                <h3 className="text-2xl font-bold text-white mb-1 text-center">
                  Confirm Escalation Payment
                </h3>
                <p className="text-gray-300 text-sm text-center mb-2">
                  Please confirm that the escalation fee has been paid before
                  proceeding. This action will escalate the case to the legal
                  department.
                </p>
              </div>
              {/* Case summary */}
              <div className="bg-dark-700 rounded p-3 mb-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Case Number:</span>
                  <span className="text-white font-mono">{caseNumber}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Title:</span>
                  <span className="text-white">{title}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Debtor:</span>
                  <span className="text-white">{debtorName}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Creditor:</span>
                  <span className="text-white">{creditorName}</span>
                </div>
              </div>
              {/* Payment details */}
              <div className="bg-dark-700 rounded p-3 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Payment ID:</span>
                  <span className="text-white font-mono text-sm">
                    {paymentDetails.paymentId}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">
                    {paymentDetails.amount.toLocaleString()} KES
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-yellow-400 capitalize">
                    {paymentDetails.status}
                  </span>
                </div>
              </div>
              {/* Info/Warning */}
              <div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 rounded text-yellow-200 text-sm flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
                Make sure the payment has been received before confirming. This
                action cannot be undone.
              </div>
              {escalationError && (
                <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
                  {escalationError}
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    setShowEscalationModal(false);
                    setPaymentDetails(null);
                    setEscalationError("");
                  }}
                  className="flex-1 px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEscalation}
                  disabled={escalationLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-60 transition-colors font-bold text-lg flex items-center justify-center"
                >
                  {escalationLoading && (
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {escalationLoading
                    ? "Confirming..."
                    : "Confirm Payment & Escalate"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {showDocumentModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg w-full max-w-6xl h-full max-h-[90vh] mx-4 relative shadow-2xl border border-primary-700 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-dark-600">
                <h3 className="text-xl font-bold text-white">
                  {selectedDocument.filename}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadDocument}
                    className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-500 transition-colors text-sm"
                  >
                    Download
                  </button>
                  <button
                    onClick={closeDocumentModal}
                    className="text-dark-400 hover:text-white text-2xl font-bold focus:outline-none"
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Document Viewer */}
              <div className="flex-1 p-4 overflow-hidden">
                <iframe
                  src={selectedDocument.url}
                  className="w-full h-full border-0 rounded"
                  title={selectedDocument.filename}
                />
              </div>
            </div>
          </div>
        )}

        {/* Promised Payments Modal */}
        {showPromisedPaymentsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg w-full max-w-4xl h-full max-h-[90vh] mx-4 relative shadow-2xl border border-primary-700 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-dark-600">
                <h3 className="text-xl font-bold text-white">
                  Manage Promised Payments - {caseDetails?.caseNumber}
                </h3>
                <button
                  onClick={() => setShowPromisedPaymentsModal(false)}
                  className="text-dark-400 hover:text-white text-2xl font-bold focus:outline-none"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {/* Promised Payments Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <PromisedPaymentsList
                  case_={caseDetails}
                  onUpdate={handlePromisedPaymentsUpdate}
                />
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button for Mobile */}
        <div className="fixed bottom-4 right-4 sm:hidden z-40">
          <button
            onClick={() => {
              // Scroll to the notes section
              const notesSection = document.querySelector('[data-notes-section]');
              if (notesSection) {
                notesSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
            title="Add Note"
          >
            <FaPlus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
