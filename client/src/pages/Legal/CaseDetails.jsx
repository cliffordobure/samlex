/* eslint-disable no-unused-vars */
//just a comment here for redeployment
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getLegalCase, setCurrentCase } from "../../store/slices/legalCaseSlice";
import legalCaseApi from "../../store/api/legalCaseApi";
import socket from "../../utils/socket";
import toast from "react-hot-toast";
import { API_URL } from "../../config/api.js";
import {
  FaArrowLeft,
  FaEye,
  FaDownload,
  FaTimes,
  FaUserPlus,
  FaEdit,
  FaSave,
  FaTrash,
  FaFileAlt,
  FaGavel,
  FaBalanceScale,
  FaBuilding,
  FaHome,
  FaBriefcase,
  FaUsers,
  FaCalendar,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaUserTie,
  FaComments,
  FaStickyNote,
  FaUpload,
  FaInfoCircle,
  FaPaperPlane,
  FaUserCircle,
} from "react-icons/fa";

const API_BASE = API_URL;
const FILE_BASE = API_BASE.replace(/\/api$/, "");

const statusColors = {
  pending_assignment: "bg-yellow-500",
  filed: "bg-blue-500",
  assigned: "bg-purple-500",
  under_review: "bg-orange-500",
  court_proceedings: "bg-red-500",
  settlement: "bg-green-500",
  resolved: "bg-emerald-500",
  closed: "bg-gray-500",
};

const priorityColors = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const CaseDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { currentCase, isLoading, error, cases } = useSelector(
    (state) => state.legalCases
  );
  const { users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);

  // State for various features
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    assignedTo: "",
    notes: "",
  });

  // Handle opening assignment modal
  const handleOpenAssignmentModal = () => {
    if (currentCase.assignedTo) {
      setAssignmentData({
        assignedTo: currentCase.assignedTo._id,
        notes: "",
      });
    } else {
      setAssignmentData({
        assignedTo: "",
        notes: "",
      });
    }
    setShowAssignmentModal(true);
  };

  // Notes state
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Chat/Comments state
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const commentsEndRef = useRef(null);

  // Communications state
  const [communications, setCommunications] = useState([]);
  const [communicationContent, setCommunicationContent] = useState("");
  const [communicationLoading, setCommunicationLoading] = useState(false);

  // Document state
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  // Court dates state
  const [showCourtDatesModal, setShowCourtDatesModal] = useState(false);
  const [courtDatesData, setCourtDatesData] = useState({
    nextHearingDate: "",
    mentioningDate: "",
    hearingNotes: "",
    adjournmentReason: "",
    courtDate: "",
    courtRoom: "",
    judgeAssigned: "",
  });
  const [courtDatesLoading, setCourtDatesLoading] = useState(false);

  // Function to open court dates modal with existing data
  const handleOpenCourtDatesModal = async () => {
    console.log("=== DEBUG: handleOpenCourtDatesModal ===");
    console.log("Current case:", currentCase);
    console.log(
      "Current case keys:",
      currentCase ? Object.keys(currentCase) : "No case"
    );
    console.log("Current showCourtDatesModal state:", showCourtDatesModal);

    // If currentCase is empty, try to fetch it directly
    if (!currentCase || Object.keys(currentCase).length === 0) {
      console.log("Current case is empty, fetching directly...");
      try {
        const response = await legalCaseApi.getLegalCase(id);
        console.log("Direct API response:", response);
        const caseData = response.data;

        if (caseData && caseData.data) {
          // Use the fetched data to populate the modal
          const fetchedCase = caseData.data;
          console.log("Fetched case data:", fetchedCase);

          if (fetchedCase?.courtDetails) {
            const existingData = {
              nextHearingDate: fetchedCase.courtDetails.nextHearingDate
                ? new Date(fetchedCase.courtDetails.nextHearingDate)
                    .toISOString()
                    .slice(0, 16)
                : "",
              mentioningDate: fetchedCase.courtDetails.mentioningDate
                ? new Date(fetchedCase.courtDetails.mentioningDate)
                    .toISOString()
                    .slice(0, 16)
                : "",
              hearingNotes: fetchedCase.courtDetails.hearingNotes || "",
              adjournmentReason:
                fetchedCase.courtDetails.adjournmentReason || "",
              courtDate: fetchedCase.courtDetails.courtDate
                ? new Date(fetchedCase.courtDetails.courtDate)
                    .toISOString()
                    .slice(0, 16)
                : "",
              courtRoom: fetchedCase.courtDetails.courtRoom || "",
              judgeAssigned: fetchedCase.courtDetails.judgeAssigned || "",
            };
            setCourtDatesData(existingData);
            console.log(
              "Set court dates data from direct fetch:",
              existingData
            );
          } else {
            // Initialize with empty data if no court details exist
            setCourtDatesData({
              nextHearingDate: "",
              mentioningDate: "",
              hearingNotes: "",
              adjournmentReason: "",
              courtDate: "",
              courtRoom: "",
              judgeAssigned: "",
            });
            console.log("No existing court details, using empty data");
          }
          console.log(
            "About to set showCourtDatesModal to true (direct fetch)"
          );
          setShowCourtDatesModal(true);
          console.log("showCourtDatesModal set to true (direct fetch)");
        } else {
          toast.error("Failed to load case data. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching case directly:", error);
        toast.error(
          "Failed to load case data. Please refresh the page and try again."
        );
        return;
      }
    } else {
      // Use existing currentCase data
      if (currentCase?.courtDetails) {
        const existingData = {
          nextHearingDate: currentCase.courtDetails.nextHearingDate
            ? new Date(currentCase.courtDetails.nextHearingDate)
                .toISOString()
                .slice(0, 16)
            : "",
          mentioningDate: currentCase.courtDetails.mentioningDate
            ? new Date(currentCase.courtDetails.mentioningDate)
                .toISOString()
                .slice(0, 16)
            : "",
          hearingNotes: currentCase.courtDetails.hearingNotes || "",
          adjournmentReason: currentCase.courtDetails.adjournmentReason || "",
          courtDate: currentCase.courtDetails.courtDate
            ? new Date(currentCase.courtDetails.courtDate)
                .toISOString()
                .slice(0, 16)
            : "",
          courtRoom: currentCase.courtDetails.courtRoom || "",
          judgeAssigned: currentCase.courtDetails.judgeAssigned || "",
        };
        setCourtDatesData(existingData);
        console.log("Set court dates data:", existingData);
      } else {
        // Initialize with empty data if no court details exist
        setCourtDatesData({
          nextHearingDate: "",
          mentioningDate: "",
          hearingNotes: "",
          adjournmentReason: "",
          courtDate: "",
          courtRoom: "",
          judgeAssigned: "",
        });
        console.log("No existing court details, using empty data");
      }
      console.log("About to set showCourtDatesModal to true (existing data)");
      setShowCourtDatesModal(true);
      console.log("showCourtDatesModal set to true (existing data)");
    }
  };

  // Fetch case details and related data
  useEffect(() => {
    console.log("=== DEBUG: CaseDetails useEffect ===");
    console.log("ID from useParams:", id);
    console.log("ID type:", typeof id);
    console.log("Current cases in store:", cases?.length || 0);

    if (id && id !== "undefined") {
      console.log("Fetching case details for ID:", id);
      dispatch(getLegalCase(id))
        .then((result) => {
          console.log("=== DEBUG: getLegalCase result ===");
          console.log("Result:", result);
          if (result.error) {
            console.error("Error fetching case:", result.error);
          }
        })
        .catch((error) => {
          console.error("=== DEBUG: getLegalCase error ===");
          console.error("Error:", error);
        });
    } else {
      console.log("Invalid ID, not fetching case details");
    }
  }, [dispatch, id]);

  // Fallback: if currentCase is not loaded but we have cases, try to find it
  useEffect(() => {
    if (!currentCase && cases && cases.length > 0 && id) {
      const foundCase = cases.find((c) => c._id === id);
      if (foundCase) {
        console.log("Found case in cases list:", foundCase);
        // We could dispatch setCurrentCase here if needed
      }
    }
  }, [currentCase, cases, id]);

  // Fetch assignable users when cases are loaded
  useEffect(() => {
    if (users && users.length > 0) {
      fetchAssignableUsers();
    }
  }, [users]);

  // Fetch notes when current case is loaded
  useEffect(() => {
    if (currentCase) {
      fetchNotes();
      fetchCommunications();
      fetchComments();
    }
  }, [currentCase]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (currentCase && id) {
      // Join the case room for real-time updates
      socket.emit("join-case", id);
      
      // Listen for new comments
      socket.on("legalCaseCommented", handleNewComment);
      
      // Listen for case assignment updates
      const handleCaseAssigned = (updatedCase) => {
        if (updatedCase._id === id) {
          dispatch(getLegalCase(id)); // Refresh case details
        }
      };
      
      socket.on("legalCaseAssigned", handleCaseAssigned);
      
      return () => {
        socket.off("legalCaseCommented", handleNewComment);
        socket.off("legalCaseAssigned", handleCaseAssigned);
        socket.emit("leave-case", id);
      };
    }
  }, [currentCase, id, dispatch]);

  // Scroll to bottom when comments update
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  // Fetch assignable users (advocates)
  const fetchAssignableUsers = async () => {
    try {
      const advocates = users.filter((u) => u.role === "advocate");
      setAssignableUsers(advocates);
    } catch (error) {
      console.error("Error fetching assignable users:", error);
      setAssignableUsers([]);
    }
  };

  // Fetch notes
  const fetchNotes = async () => {
    try {
      if (currentCase?.notes) {
        setNotes(currentCase.notes);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const fetchCommunications = async () => {
    try {
      if (currentCase?.communications) {
        setCommunications(currentCase.communications);
      }
    } catch (error) {
      console.error("Error fetching communications:", error);
    }
  };

  // Handle assignment
  const handleAssignCase = async () => {
    if (!assignmentData.assignedTo) {
      toast.error("Please select an advocate");
      return;
    }

    if (!id) {
      toast.error("Case ID is missing");
      return;
    }

    console.log("=== DEBUG: CaseDetails handleAssignCase ===");
    console.log("Case ID:", id);
    console.log("Assigned To:", assignmentData.assignedTo);

    setAssignLoading(true);
    try {
      await legalCaseApi.assignCase(id, assignmentData.assignedTo);
      toast.success(
        currentCase.assignedTo
          ? "Case reassigned successfully"
          : "Case assigned successfully"
      );
      setShowAssignmentModal(false);
      setAssignmentData({ assignedTo: "", notes: "" });
      dispatch(getLegalCase(id)); // Refresh case details
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign case");
    } finally {
      setAssignLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      await legalCaseApi.updateStatus(id, newStatus);
      toast.success("Status updated successfully");
      dispatch(getLegalCase(id)); // Refresh case details
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Handle note submission
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      toast.error("Please enter note content");
      return;
    }

    setNoteLoading(true);
    try {
      await legalCaseApi.addNote(id, {
        content: noteContent,
        isInternal: false,
      });
      toast.success("Note added successfully");
      setNoteContent("");
      setShowNoteModal(false);
      dispatch(getLegalCase(id)); // Refresh case details
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add note");
    } finally {
      setNoteLoading(false);
    }
  };

  // Handle communication submission
  const handleAddCommunication = async (e) => {
    e.preventDefault();
    if (!communicationContent.trim()) {
      toast.error("Please enter communication content");
      return;
    }

    setCommunicationLoading(true);
    try {
      await legalCaseApi.addCommunication(id, {
        content: communicationContent,
        type: "communication",
      });
      toast.success("Communication added successfully");
      setCommunicationContent("");
      dispatch(getLegalCase(id)); // Refresh case details
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to add communication"
      );
    } finally {
      setCommunicationLoading(false);
    }
  };

  // Chat/Comments functions
  const fetchComments = async () => {
    try {
      // Get the case details which includes notes
      const response = await legalCaseApi.getLegalCase(id);
      if (response.data.success && response.data.data.notes) {
        // Convert notes to comments format for display
        const commentsFromNotes = response.data.data.notes.map(note => ({
          _id: note._id,
          content: note.content,
          author: note.createdBy,
          createdAt: note.createdAt,
          type: 'comment',
          isInternal: note.isInternal
        }));
        setComments(commentsFromNotes);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    }
  };

  const handleNewComment = (comment) => {
    setComments((prev) => {
      // Ensure prev is always an array
      const currentComments = Array.isArray(prev) ? prev : [];
      return [...currentComments, comment];
    });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    
    setCommentLoading(true);
    try {
      // Add comment using the notes endpoint
      const response = await legalCaseApi.addNote(id, {
        content: commentInput,
        isInternal: false,
      });
      
      if (response.data.success) {
        setCommentInput("");
        toast.success("Message sent successfully");
        
        // Emit socket event for real-time updates to other users
        socket.emit("legalCaseCommented", {
          caseId: id,
          comment: {
            _id: response.data.data.notes[response.data.data.notes.length - 1]._id,
            content: commentInput,
            author: user,
            createdAt: new Date().toISOString(),
            type: 'comment',
            isInternal: false
          }
        });
        
        // Refresh comments to show the new one
        await fetchComments();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setCommentLoading(false);
    }
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
      const response = await legalCaseApi.addDocument(id, { documents: uploadedUrls });
      
      if (response.data.success && response.data.data) {
        // Update currentCase immediately with the response
        dispatch(setCurrentCase(response.data.data));
      }
      
      toast.success("Documents uploaded successfully");
      // Refresh case details to get fully populated data
      dispatch(getLegalCase(id));
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

  // Handle court dates update
  const handleUpdateCourtDates = async (e) => {
    e.preventDefault();

    console.log("=== DEBUG: handleUpdateCourtDates ===");
    console.log("Case ID:", id);
    console.log("Court Dates Data:", courtDatesData);

    // Basic validation
    if (
      !courtDatesData.nextHearingDate &&
      !courtDatesData.mentioningDate &&
      !courtDatesData.courtDate
    ) {
      toast.error(
        "Please provide at least one date (Next Hearing, Mentioning, or Court Date)"
      );
      return;
    }

    setCourtDatesLoading(true);
    try {
      console.log("Sending API request to update court dates...");
      const result = await legalCaseApi.updateCourtDates(id, courtDatesData);
      console.log("API response:", result);

      toast.success("Court dates updated successfully");
      setShowCourtDatesModal(false);
      setCourtDatesData({
        nextHearingDate: "",
        mentioningDate: "",
        hearingNotes: "",
        adjournmentReason: "",
        courtDate: "",
        courtRoom: "",
        judgeAssigned: "",
      });
      dispatch(getLegalCase(id)); // Refresh case details
    } catch (error) {
      console.error("Error updating court dates:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to update court dates"
      );
    } finally {
      setCourtDatesLoading(false);
    }
  };

  // Document viewer functions
  const handleDocumentClick = (doc) => {
    let documentUrl = doc.path;
    // Handle Cloudinary URLs and other URL formats
    if (doc.path.startsWith("http")) {
      documentUrl = doc.path;
    } else if (doc.path.startsWith("/uploads/")) {
      documentUrl = `${FILE_BASE}${doc.path}`;
    } else if (doc.path.startsWith("uploads/")) {
      documentUrl = `${FILE_BASE}/${doc.path}`;
    } else {
      documentUrl = `${FILE_BASE}/uploads/general/${doc.path}`;
    }
    setSelectedDocument({ url: documentUrl, filename: doc.originalName });
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

  // Handle payment status update
  const handlePaymentStatusUpdate = async (paid) => {
    try {
      console.log("=== FRONTEND: Updating filing fee payment ===");
      console.log("Case ID:", id);
      console.log("Paid status:", paid);
      console.log("User:", user);
      console.log("Current case assigned to:", currentCase.assignedTo?._id);
      
      const response = await legalCaseApi.updateFilingFeePayment(id, {
        paid: paid,
        paymentId: paid ? `PAY-${Date.now()}` : null, // Generate a simple payment ID
      });

      console.log("API Response:", response);

      if (response.data.success) {
        // Update the current case state in Redux
        dispatch(setCurrentCase({
          ...currentCase,
          filingFee: {
            ...currentCase.filingFee,
            paid: paid,
            paidAt: paid ? new Date().toISOString() : null,
            paymentId: paid ? `PAY-${Date.now()}` : null,
          }
        }));

        toast.success(`Filing fee ${paid ? 'marked as paid' : 'marked as unpaid'} successfully`);
      } else {
        console.error("API returned error:", response.data);
        toast.error(response.data.message || "Failed to update payment status");
      }
    } catch (error) {
      console.error("=== FRONTEND: Error updating payment status ===");
      console.error("Error object:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to update payment status";
      toast.error(errorMessage);
    }
  };

  // Get case type icon
  const getCaseTypeIcon = (caseType) => {
    const icons = {
      civil: FaBalanceScale,
      criminal: FaGavel,
      corporate: FaBuilding,
      family: FaUsers,
      property: FaHome,
      labor: FaBriefcase,
      debt_collection: FaFileAlt,
      other: FaFileAlt,
    };
    return icons[caseType] || FaFileAlt;
  };

  // Debug logging
  console.log("CaseDetails render:", {
    isLoading,
    error,
    currentCase,
    id,
    showCourtDatesModal,
  });

  // Test modal visibility
  if (showCourtDatesModal) {
    console.log("=== MODAL SHOULD BE VISIBLE ===");
  } else {
    console.log("=== MODAL IS HIDDEN ===");
  }

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
        <Link to="/legal/cases" className="btn btn-outline">
          <FaArrowLeft />
          Back to Cases
        </Link>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="space-y-6">
        <div className="alert alert-warning">
          <FaExclamationTriangle />
          <span>Case not found or not loaded yet.</span>
        </div>
        <div className="flex gap-2">
          <Link to="/legal/cases" className="btn btn-outline">
            <FaArrowLeft />
            Back to Cases
          </Link>
          <button
            onClick={() => {
              console.log("Manually fetching case:", id);
              dispatch(getLegalCase(id));
            }}
            className="btn btn-primary"
          >
            Retry Load Case
          </button>
        </div>
        <div className="text-sm text-dark-400">
          <p>Case ID: {id}</p>
          <p>Cases loaded: {cases?.length || 0}</p>
          <p>Loading: {isLoading ? "Yes" : "No"}</p>
          <p>Error: {error || "None"}</p>
        </div>
      </div>
    );
  }

  const CaseTypeIcon = getCaseTypeIcon(currentCase.caseType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-dark-800 to-dark-700 border-b border-dark-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                to="/legal/cases"
                className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg border border-dark-600 hover:border-primary-400 transition-all duration-200 shadow-sm"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span className="font-medium">Back to Cases</span>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <CaseTypeIcon className="w-6 h-6 text-primary-400" />
                    <h1 className="text-3xl font-bold text-white">
                      {currentCase.caseNumber}
                    </h1>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      statusColors[currentCase.status] || "bg-gray-500"
                    } text-white shadow-sm`}
                  >
                    {currentCase.status?.replace("_", " ") || "Unknown"}
                  </span>
                </div>
                <p className="text-dark-300 text-lg font-medium">
                  {currentCase.title}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-dark-400">
                    Created:{" "}
                    {new Date(currentCase.createdAt).toLocaleDateString()}
                  </span>
                  {(!currentCase || Object.keys(currentCase).length === 0) && (
                    <button
                      onClick={() => {
                        console.log("Manual retry - fetching case:", id);
                        dispatch(getLegalCase(id));
                      }}
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm font-medium transition-all duration-200"
                    >
                      Retry Load
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(user.role === "legal_head" ||
                user.role === "law_firm_admin") && (
                <>
                  {!currentCase.assignedTo && (
                    <button
                      onClick={handleOpenAssignmentModal}
                      className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      <FaUserPlus className="w-4 h-4" />
                      Assign Case
                    </button>
                  )}
                  {currentCase.assignedTo && (
                    <button
                      onClick={handleOpenAssignmentModal}
                      className="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg border border-dark-600 hover:border-primary-400 transition-all duration-200 font-medium flex items-center gap-2"
                    >
                      <FaEdit className="w-4 h-4" />
                      Reassign
                    </button>
                  )}
                  
                  {/* Update Case Details Button for Legal Heads and Admins */}
                  <Link
                    to={window.location.pathname.includes('/admin') 
                      ? `/admin/legal-case/${currentCase._id}/complete`
                      : `/legal/cases/${currentCase._id}/complete`}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <FaEdit className="w-4 h-4" />
                    Update Case Details
                  </Link>
                </>
              )}
              {currentCase.assignedTo?._id === user._id && (
                <div className="flex items-center gap-2">
                  <select
                    className="px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                    value={currentCase.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                  >
                    <option value="assigned">Assigned</option>
                    <option value="under_review">Under Review</option>
                    <option value="court_proceedings">Court Proceedings</option>
                    <option value="settlement">Settlement</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  
                  {/* Update Case Details Button - Available for all assigned cases */}
                  <Link
                    to={window.location.pathname.includes('/admin') 
                      ? `/admin/legal-case/${currentCase._id}/complete`
                      : `/legal/cases/${currentCase._id}/complete`}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <FaEdit className="w-4 h-4" />
                    Update Case Details
                  </Link>
                  
                  {currentCase.escalatedFrom?.creditCaseId && (
                    <Link
                      to={`/legal/cases/${currentCase._id}/complete`}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      <FaEdit className="w-4 h-4" />
                      Complete Info
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Case Information Card */}
            <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-8 py-6 border-b border-dark-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <FaFileAlt className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Case Information
                    </h2>
                    <p className="text-dark-300">
                      Essential case details and metadata
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Case Number
                    </label>
                    <div className="font-mono text-lg bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white">
                      {currentCase.caseNumber}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Case Type
                    </label>
                    <div className="flex items-center gap-3 bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600">
                      <CaseTypeIcon className="w-5 h-5 text-primary-400" />
                      <span className="text-white capitalize">
                        {currentCase.caseType}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Priority
                    </label>
                    <span
                      className={`inline-block px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wide ${
                        priorityColors[currentCase.priority] || "bg-gray-500"
                      } text-white shadow-sm`}
                    >
                      {currentCase.priority}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Created Date
                    </label>
                    <div className="bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white">
                      {new Date(currentCase.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Description
                    </label>
                    <div className="bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white min-h-[80px]">
                      {currentCase.description || "No description provided"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information Card */}
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
                {currentCase.client ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white">
                        Name
                      </label>
                      <div className="bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white">
                        {currentCase.client.firstName}{" "}
                        {currentCase.client.lastName}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white">
                        Email
                      </label>
                      <div className="flex items-center gap-3 bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white">
                        <FaEnvelope className="w-4 h-4 text-dark-400" />
                        {currentCase.client.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white">
                        Phone
                      </label>
                      <div className="flex items-center gap-3 bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white">
                        <FaPhone className="w-4 h-4 text-dark-400" />
                        {currentCase.client.phoneNumber || "Not provided"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-dark-400">
                    <FaUser className="mx-auto text-4xl mb-4" />
                    <p>Client information not available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Court Details Card */}
            {currentCase.courtDetails && (
              <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-8 py-6 border-b border-dark-600">
                  <div className="flex items-center justify-between">
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
                    {/* Show Update Dates button for assigned users or admins */}
                    {(user.role === "law_firm_admin" ||
                      user.role === "legal_head" ||
                      currentCase?.assignedTo?._id === user._id) && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleOpenCourtDatesModal}
                          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                        >
                          <FaCalendar className="w-4 h-4" />
                          Update Dates
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentCase.courtDetails.courtName && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-white">
                          Court Name
                        </label>
                        <div className="bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white">
                          {currentCase.courtDetails.courtName}
                        </div>
                      </div>
                    )}
                    {currentCase.courtDetails.courtLocation && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-white">
                          Location
                        </label>
                        <div className="flex items-center gap-3 bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white">
                          <FaMapMarkerAlt className="w-4 h-4 text-dark-400" />
                          {currentCase.courtDetails.courtLocation}
                        </div>
                      </div>
                    )}
                    {currentCase.courtDetails.judgeAssigned && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-white">
                          Judge Assigned
                        </label>
                        <div className="bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white">
                          {currentCase.courtDetails.judgeAssigned}
                        </div>
                      </div>
                    )}
                    {currentCase.courtDetails.courtDate && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-white">
                          Court Date
                        </label>
                        <div className="flex items-center gap-3 bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white">
                          <FaCalendar className="w-4 h-4 text-dark-400" />
                          {new Date(
                            currentCase.courtDetails.courtDate
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {currentCase.courtDetails.courtRoom && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-white">
                          Court Room
                        </label>
                        <div className="bg-dark-900/50 px-4 py-3 rounded-lg border border-dark-600 text-white">
                          {currentCase.courtDetails.courtRoom}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Documents Card */}
            <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-8 py-6 border-b border-dark-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <FaFileAlt className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Documents
                      </h2>
                      <p className="text-dark-300">Case documents and files</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      multiple
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="document-upload"
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer"
                    >
                      <FaUpload className="w-4 h-4" />
                      Upload
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-8">
                {(() => {
                  // Handle different document formats and ensure we have valid documents
                  const documents = currentCase.documents || [];
                  const validDocuments = documents.filter(doc => {
                    // Document must be an object with at least a path or name
                    if (!doc || typeof doc !== 'object') return false;
                    return doc.path || doc.name || doc.originalName;
                  });
                  
                  return validDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {validDocuments.map((doc, index) => (
                        <div
                          key={doc._id || doc.path || index}
                          className="bg-dark-900/30 border border-dark-600 rounded-lg p-4 hover:bg-dark-900/50 transition-all duration-200 cursor-pointer"
                          onClick={() => handleDocumentClick(doc)}
                        >
                          <div className="flex items-center gap-3">
                            <FaFileAlt className="w-5 h-5 text-primary-400" />
                            <div className="flex-1">
                              <div className="font-medium text-white truncate">
                                {doc.originalName ||
                                  doc.name ||
                                  (doc.path ? doc.path.split("/").pop() : `Document ${index + 1}`)}
                              </div>
                              <div className="text-sm text-dark-400">
                                {doc.uploadedBy?.firstName || doc.uploadedBy ? `${doc.uploadedBy.firstName || ''} ${doc.uploadedBy.lastName || ''}`.trim() : 'Unknown'}
                              </div>
                            </div>
                            <FaEye className="w-4 h-4 text-dark-400 hover:text-primary-400 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-dark-400">
                      <FaFileAlt className="mx-auto text-4xl mb-4" />
                      <p>No documents uploaded yet</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Professional Chat Section */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-8 py-6 border-b border-slate-600/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FaComments className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Case Chat & Comments
                    </h2>
                    <p className="text-slate-300">
                      Real-time communication with team members and clients
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col h-96">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/30">
                  {(!comments || !Array.isArray(comments) || comments.length === 0) ? (
                    <div className="text-center py-12">
                      <FaComments className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">No messages yet</p>
                      <p className="text-slate-500 text-sm">Start the conversation below</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment._id}
                        className={`flex ${comment.author?._id === user?._id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          comment.author?._id === user?._id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-700/50 text-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <FaUserCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {comment.author?.firstName} {comment.author?.lastName}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              comment.author?._id === user?._id 
                                ? 'bg-blue-500/30 text-blue-200' 
                                : 'bg-slate-600/50 text-slate-300'
                            }`}>
                              {comment.author?.role?.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <p className={`text-xs mt-1 ${
                            comment.author?._id === user?._id 
                              ? 'text-blue-200' 
                              : 'text-slate-400'
                          }`}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={commentsEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-6 border-t border-slate-600/50 bg-slate-800/50">
                  <form onSubmit={handleCommentSubmit} className="flex gap-3">
                    <div className="flex-1">
                      <textarea
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 resize-none"
                        rows={2}
                        disabled={commentLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={commentLoading || !commentInput.trim()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      {commentLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FaPaperPlane className="w-4 h-4" />
                      )}
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Case Status Card */}
            <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-6 py-4 border-b border-dark-600">
                <h3 className="text-lg font-bold text-white">Case Status</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Status
                  </label>
                  <span
                    className={`inline-block px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wide ${
                      statusColors[currentCase.status] || "bg-gray-500"
                    } text-white shadow-sm`}
                  >
                    {currentCase.status?.replace("_", " ") || "Unknown"}
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Priority
                  </label>
                  <span
                    className={`inline-block px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wide ${
                      priorityColors[currentCase.priority] || "bg-gray-500"
                    } text-white shadow-sm`}
                  >
                    {currentCase.priority}
                  </span>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Created
                  </label>
                  <div className="bg-dark-900/50 px-3 py-2 rounded-lg border border-dark-600 text-white text-sm">
                    {new Date(currentCase.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {currentCase.dueDate && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Due Date
                    </label>
                    <div className="bg-dark-900/50 px-3 py-2 rounded-lg border border-dark-600 text-white text-sm">
                      {new Date(currentCase.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Card */}
            <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-6 py-4 border-b border-dark-600">
                <h3 className="text-lg font-bold text-white">Assignment</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white">
                    Assigned To
                  </label>
                  <div className="bg-dark-900/50 px-3 py-2 rounded-lg border border-dark-600 text-white">
                    {currentCase.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <FaUser className="w-4 h-4 text-dark-400" />
                        <span>
                          {currentCase.assignedTo.firstName}{" "}
                          {currentCase.assignedTo.lastName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-dark-400">Unassigned</span>
                    )}
                  </div>
                </div>
                {currentCase.assignedBy && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Assigned By
                    </label>
                    <div className="bg-dark-900/50 px-3 py-2 rounded-lg border border-dark-600 text-white">
                      {currentCase.assignedBy.firstName}{" "}
                      {currentCase.assignedBy.lastName}
                    </div>
                  </div>
                )}
                {currentCase.assignedAt && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Assigned Date
                    </label>
                    <div className="bg-dark-900/50 px-3 py-2 rounded-lg border border-dark-600 text-white text-sm">
                      {new Date(currentCase.assignedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filing Fee Card */}
            {currentCase.filingFee && (
              <div className="bg-gradient-to-br from-dark-800/50 to-dark-700/50 border border-dark-600 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-dark-700 to-dark-600 px-6 py-4 border-b border-dark-600">
                  <h3 className="text-lg font-bold text-white">Filing Fee</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Amount
                    </label>
                    <div className="bg-dark-900/50 px-3 py-2 rounded-lg border border-dark-600 text-white">
                      {currentCase.filingFee.currency}{" "}
                      {currentCase.filingFee.amount}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-white">
                      Status
                    </label>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block px-3 py-2 rounded-lg text-sm font-bold ${
                          currentCase.filingFee.paid
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        } text-white shadow-sm`}
                      >
                        {currentCase.filingFee.paid ? "Paid" : "Pending"}
                      </span>
                      
                      {/* Payment Status Update Button for Advocates */}
                      {user?.role === "advocate" && currentCase.assignedTo?._id === user._id && (
                        <button
                          onClick={() => handlePaymentStatusUpdate(!currentCase.filingFee.paid)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            currentCase.filingFee.paid
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                        >
                          {currentCase.filingFee.paid ? "Mark as Unpaid" : "Mark as Paid"}
                        </button>
                      )}
                    </div>
                    
                    {/* Payment Date */}
                    {currentCase.filingFee.paid && currentCase.filingFee.paidAt && (
                      <p className="text-dark-400 text-sm">
                        Paid on: {new Date(currentCase.filingFee.paidAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-700/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-600/50 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                    <FaUserPlus className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      {currentCase.assignedTo ? "Reassign Case" : "Assign Case"} to Advocate
                    </h3>
                    <p className="text-slate-300 text-lg mt-1">
                      {currentCase.assignedTo ? "Transfer case to a different advocate" : "Assign this case to an available advocate"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <FaTimes className="w-5 h-5 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Current Assignment Info */}
              {currentCase.assignedTo && (
                <div className="mb-8">
                  <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaUser className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-blue-300 font-semibold text-lg mb-2">Current Assignment</h4>
                        <p className="text-slate-300">
                          <span className="font-medium">Currently assigned to:</span> {currentCase.assignedTo.firstName} {currentCase.assignedTo.lastName}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                          This will be reassigned to the selected advocate
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Advocate Selection */}
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                      <FaUserTie className="w-4 h-4 text-green-400" />
                    </div>
                    <h4 className="text-white font-semibold text-lg">Select Advocate</h4>
                  </div>
                  <select
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                    value={assignmentData.assignedTo}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        assignedTo: e.target.value,
                      })
                    }
                  >
                    <option value="">Choose an advocate</option>
                    {assignableUsers.map((advocate) => (
                      <option key={advocate._id} value={advocate._id}>
                        {advocate.firstName} {advocate.lastName}
                        {advocate.email && ` (${advocate.email})`}
                      </option>
                    ))}
                  </select>
                  <p className="text-slate-400 text-sm mt-2">
                    Select the advocate who will handle this case
                  </p>
                </div>

                {/* Assignment Notes */}
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center">
                      <FaFileAlt className="w-4 h-4 text-purple-400" />
                    </div>
                    <h4 className="text-white font-semibold text-lg">Assignment Notes</h4>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 resize-none"
                    rows={4}
                    placeholder="Add any notes about this assignment..."
                    value={assignmentData.notes}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        notes: e.target.value,
                      })
                    }
                  />
                  <p className="text-slate-400 text-sm mt-2">
                    Optional notes about the case assignment
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-6 border-t border-slate-600/50">
                <button
                  type="button"
                  className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 border border-slate-600/50"
                  onClick={() => setShowAssignmentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  onClick={handleAssignCase}
                  disabled={!assignmentData.assignedTo || assignLoading}
                >
                  {assignLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaUserPlus className="w-4 h-4" />
                  )}
                  {assignLoading ? "Assigning..." : currentCase.assignedTo ? "Reassign Case" : "Assign Case"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add Note</h3>
            <form onSubmit={handleAddNote}>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Note Content</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-32"
                    placeholder="Enter your note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowNoteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={noteLoading}
                >
                  {noteLoading ? (
                    <div className="loading loading-spinner loading-sm"></div>
                  ) : (
                    "Add Note"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{selectedDocument.filename}</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadDocument}
                  className="btn btn-sm btn-outline"
                >
                  <FaDownload />
                  Download
                </button>
                <button
                  onClick={closeDocumentModal}
                  className="btn btn-sm btn-outline"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className="h-96">
              <iframe
                src={selectedDocument.url}
                className="w-full h-full border rounded"
                title={selectedDocument.filename}
              />
            </div>
          </div>
        </div>
      )}

      {/* Court Dates Modal */}
      {showCourtDatesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-700/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-600/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                    <FaCalendar className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      Update Court Dates
                    </h3>
                    <p className="text-slate-300 text-lg mt-1">
                      Manage hearing dates, mentioning dates, and court information
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      Case: {currentCase?.caseNumber}
                    </p>
                    {currentCase?.status && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Status: {currentCase.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowCourtDatesModal(false)}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <FaTimes className="w-5 h-5 text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <form onSubmit={handleUpdateCourtDates}>
                {/* Current Court Details Summary */}
                {currentCase?.courtDetails && (
                  <div className="mb-8">
                    <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaInfoCircle className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-blue-300 font-semibold text-lg mb-4">Current Court Information</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {currentCase.courtDetails.courtName && (
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <div>
                                  <span className="text-slate-400 text-sm">Court:</span>
                                  <span className="text-white font-medium ml-2">
                                    {currentCase.courtDetails.courtName}
                                  </span>
                                </div>
                              </div>
                            )}
                            {currentCase.courtDetails.courtLocation && (
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <div>
                                  <span className="text-slate-400 text-sm">Location:</span>
                                  <span className="text-white font-medium ml-2">
                                    {currentCase.courtDetails.courtLocation}
                                  </span>
                                </div>
                              </div>
                            )}
                            {currentCase.courtDetails.judgeAssigned && (
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <div>
                                  <span className="text-slate-400 text-sm">Judge:</span>
                                  <span className="text-white font-medium ml-2">
                                    {currentCase.courtDetails.judgeAssigned}
                                  </span>
                                </div>
                              </div>
                            )}
                            {currentCase.courtDetails.courtRoom && (
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <div>
                                  <span className="text-slate-400 text-sm">Room:</span>
                                  <span className="text-white font-medium ml-2">
                                    {currentCase.courtDetails.courtRoom}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Next Hearing Date */}
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                        <FaCalendar className="w-4 h-4 text-green-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg">Next Hearing Date</h4>
                    </div>
                    <div className="relative">
                      <FaCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="datetime-local"
                        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                        value={courtDatesData.nextHearingDate}
                        onChange={(e) =>
                          setCourtDatesData({
                            ...courtDatesData,
                            nextHearingDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <p className="text-slate-400 text-sm mt-2">
                      Set the next scheduled court hearing date and time
                    </p>
                  </div>

                  {/* Mentioning Date */}
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center">
                        <FaCalendar className="w-4 h-4 text-purple-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg">Mentioning Date</h4>
                    </div>
                    <div className="relative">
                      <FaCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="datetime-local"
                        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                        value={courtDatesData.mentioningDate}
                        onChange={(e) =>
                          setCourtDatesData({
                            ...courtDatesData,
                            mentioningDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <p className="text-slate-400 text-sm mt-2">
                      Set the mentioning date for case updates and status checks
                    </p>
                  </div>

                  {/* Court Date */}
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center">
                        <FaCalendar className="w-4 h-4 text-blue-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg">Main Court Date</h4>
                    </div>
                    <div className="relative">
                      <FaCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="datetime-local"
                        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                        value={courtDatesData.courtDate}
                        onChange={(e) =>
                          setCourtDatesData({
                            ...courtDatesData,
                            courtDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <p className="text-slate-400 text-sm mt-2">
                      Set the main court date for proceedings and hearings
                    </p>
                  </div>

                  {/* Court Room */}
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center">
                        <FaBuilding className="w-4 h-4 text-orange-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg">Court Room</h4>
                    </div>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                      placeholder="Enter court room number"
                      value={courtDatesData.courtRoom}
                      onChange={(e) =>
                        setCourtDatesData({
                          ...courtDatesData,
                          courtRoom: e.target.value,
                        })
                      }
                    />
                    <p className="text-slate-400 text-sm mt-2">
                      Specify the court room for hearings
                    </p>
                  </div>

                  {/* Judge Assigned */}
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                        <FaUserTie className="w-4 h-4 text-red-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg">Judge Assigned</h4>
                    </div>
                    <div className="relative">
                      <FaUserTie className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                        placeholder="Enter judge name"
                        value={courtDatesData.judgeAssigned}
                        onChange={(e) =>
                          setCourtDatesData({
                            ...courtDatesData,
                            judgeAssigned: e.target.value,
                          })
                        }
                      />
                    </div>
                    <p className="text-slate-400 text-sm mt-2">
                      Assign or update the presiding judge
                    </p>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mt-8 space-y-6">
                  {/* Hearing Notes */}
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                        <FaFileAlt className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg">Hearing Notes</h4>
                    </div>
                    <textarea
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 resize-none"
                      rows={4}
                      placeholder="Enter detailed hearing notes, proceedings, and outcomes..."
                      value={courtDatesData.hearingNotes}
                      onChange={(e) =>
                        setCourtDatesData({
                          ...courtDatesData,
                          hearingNotes: e.target.value,
                        })
                      }
                    />
                    <p className="text-slate-400 text-sm mt-2">
                      Document important details from the hearing
                    </p>
                  </div>

                  {/* Adjournment Reason */}
                  <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                        <FaExclamationTriangle className="w-4 h-4 text-yellow-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg">Adjournment Reason</h4>
                    </div>
                    <textarea
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-200 resize-none"
                      rows={3}
                      placeholder="Enter adjournment reason if the case was adjourned..."
                      value={courtDatesData.adjournmentReason}
                      onChange={(e) =>
                        setCourtDatesData({
                          ...courtDatesData,
                          adjournmentReason: e.target.value,
                        })
                      }
                    />
                    <p className="text-slate-400 text-sm mt-2">
                      Specify reason if case was adjourned
                    </p>
                  </div>
                </div>

                {/* Helpful Note */}
                <div className="mt-8">
                  <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaInfoCircle className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-blue-300 font-semibold text-lg mb-3">
                          What happens when you update court dates?
                        </h4>
                        <ul className="text-slate-300 space-y-2">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Notifications will be sent for upcoming hearings (7 days in advance)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>Case status may be automatically updated based on dates</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>All changes are logged and tracked for audit purposes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span>You can update dates multiple times as court schedules change</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-6 border-t border-slate-600/50">
                  <button
                    type="button"
                    className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 border border-slate-600/50"
                    onClick={() => setShowCourtDatesModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    disabled={courtDatesLoading}
                  >
                    {courtDatesLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FaCalendar className="w-4 h-4" />
                    )}
                    {courtDatesLoading ? "Updating..." : "Update Court Dates"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetails;
