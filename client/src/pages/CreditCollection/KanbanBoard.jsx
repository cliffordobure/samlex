import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import socket from "../../utils/socket";
import { useSelector, useDispatch } from "react-redux";
import {
  getCreditCases,
  updateCaseStatus,
  assignCase,
  addCaseComment,
  escalateCase,
} from "../../store/slices/creditCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import { Link } from "react-router-dom";
import creditCaseApi from "../../store/api/creditCaseApi";

const STATUS_COLUMNS = [
  { key: "new", label: "New" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "follow_up_required", label: "Follow Up Required" },
  { key: "escalated_to_legal", label: "Escalated to Legal" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

const KanbanBoard = ({
  cases: propCases,
  isLoading: propIsLoading,
  isAdminView = false,
  onAssignCase,
  onAddComment,
  onEscalateCase,
  availableUsers = [],
}) => {
  const dispatch = useDispatch();
  const reduxCases = useSelector((state) => state.creditCases.cases);
  const reduxIsLoading = useSelector((state) => state.creditCases.isLoading);
  const user = useSelector((state) => state.auth.user);
  const reduxUsers = useSelector((state) => state.users.users);
  const usersLoading = useSelector((state) => state.users.isLoading);

  // Use availableUsers if provided (for admin view), otherwise use Redux users
  const users = availableUsers.length > 0 ? availableUsers : reduxUsers;

  const cases = propCases ?? reduxCases;
  // Optimistic UI: local state for cases
  const [localCases, setLocalCases] = useState(cases);
  // Sync localCases with prop/Redux changes
  useEffect(() => {
    setLocalCases(cases);
  }, [cases]);
  const isLoading = propIsLoading ?? reduxIsLoading;
  const [selectedCase, setSelectedCase] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [escalateLoading, setEscalateLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [escalationFee, setEscalationFee] = useState(5000);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Check if user is admin
  const isAdmin = user?.role === "admin" || user?.role === "law_firm_admin";
  const isDebtCollector = user?.role === "debt_collector";
  const isCreditHead = user?.role === "credit_head";

  // Check if user can escalate cases
  const canEscalateCases = isAdmin || isCreditHead;

  // In admin view, we can assign cases and change status for cases assigned to admin
  const canAssignCases = isAdmin || isAdminView;

  // Helper function to get column descriptions
  const getColumnDescription = (status) => {
    const descriptions = {
      'new': 'Cases awaiting initial review',
      'assigned': 'Cases assigned to collectors',
      'in_progress': 'Cases currently being processed',
      'follow_up_required': 'Cases needing follow-up action',
      'escalated_to_legal': 'Cases escalated to legal department',
      'resolved': 'Successfully resolved cases',
      'closed': 'Completed and closed cases'
    };
    return descriptions[status] || 'Case management column';
  };

  // Allow admin and credit head to change status of all cases, debt collectors can change their assigned cases
  const canChangeStatusForCase = (case_ = null) => {
    if (isAdmin || isCreditHead) return true; // Admins and credit heads can change status of all cases

    // Debt collectors can only change status of cases assigned to them
    if (isDebtCollector && case_) {
      return (
        case_.assignedTo === user._id || case_.assignedTo?._id === user._id
      );
    }

    return false;
  };

  // Load users for assignment dropdown
  useEffect(() => {
    if (isAdmin && !isAdminView) {
      // Load all users that can be assigned credit cases: debt collectors, credit heads, and admins
      dispatch(getUsers()); // Load all users, we'll filter them in the dropdown
    }
  }, [dispatch, isAdmin, isAdminView]);

  // Filter cases based on user role
  const filteredCases = React.useMemo(() => {
    if (!user) return localCases;
    if (isDebtCollector) {
      return localCases.filter(
        (c) => c.assignedTo === user._id || c.assignedTo?._id === user._id
      );
    }
    return localCases;
  }, [localCases, user, isDebtCollector]);

  // Socket.IO listeners
  useEffect(() => {
    // You may want to refetch or update Redux state on socket events
    // For now, just refetch all cases on any event
    const refetch = () => dispatch(getCreditCases());
    socket.on("caseMoved", refetch);
    socket.on("caseCreated", refetch);
    socket.on("caseAssigned", refetch);
    socket.on("caseEscalated", refetch);
    socket.on("caseCommented", refetch);
    // Listen for caseMoved specifically for real-time status updates
    // (already included above, but this highlights its importance)
    // socket.on("caseMoved", refetch);
    return () => {
      socket.off("caseMoved", refetch);
      socket.off("caseCreated", refetch);
      socket.off("caseAssigned", refetch);
      socket.off("caseEscalated", refetch);
      socket.off("caseCommented", refetch);
    };
  }, [dispatch]);

  // Handle drag end - only allow admins to change status (but not in admin view)
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    // Find the case being dragged
    const draggedCase = localCases.find((c) => c._id === draggableId);
    if (!draggedCase) return;

    // Check if user can change status for this specific case
    if (!canChangeStatusForCase(draggedCase)) {
      return;
    }

    // Special handling for escalation to legal
    if (destination.droppableId === "escalated_to_legal") {
      // Check if user can escalate cases
      if (!canEscalateCases) {
        alert(
          "Only admins and credit heads can escalate cases to legal department."
        );
        return;
      }

      // Check if case is already escalated
      if (draggedCase.escalatedToLegal) {
        alert("This case is already escalated to legal department.");
        return;
      }

      // Show payment modal for escalation
      setSelectedCase(draggedCase);
      setShowPaymentModal(true);
      return;
    }

    // For other status changes, proceed normally
    // Optimistically update localCases
    setLocalCases((prev) =>
      prev.map((c) =>
        c._id === draggableId ? { ...c, status: destination.droppableId } : c
      )
    );
    // Dispatch Redux update for status only
    dispatch(
      updateCaseStatus({ id: draggableId, status: destination.droppableId })
    );
  };

  // Group cases by status
  const casesByStatus = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.key] = filteredCases.filter((c) => c.status === col.key);
    return acc;
  }, {});

  // Calculate progress metrics for admins
  const progressMetrics = React.useMemo(() => {
    if (!isAdmin) return null;

    const total = filteredCases.length;
    const resolved = casesByStatus.resolved?.length || 0;
    const closed = casesByStatus.closed?.length || 0;
    const inProgress = casesByStatus.in_progress?.length || 0;
    const assigned = casesByStatus.assigned?.length || 0;
    const escalated = casesByStatus.escalated_to_legal?.length || 0;

    return {
      total,
      resolved: resolved + closed,
      inProgress: inProgress + assigned,
      escalated,
      completionRate:
        total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0,
      progressRate:
        total > 0 ? Math.round(((inProgress + assigned) / total) * 100) : 0,
    };
  }, [filteredCases, casesByStatus, isAdmin]);

  // Calculate assignment statistics for admins
  const assignmentStats = React.useMemo(() => {
    if (!isAdmin) return null;

    const stats = {};
    filteredCases.forEach((case_) => {
      const assignedTo =
        case_.assignedTo?.firstName + " " + case_.assignedTo?.lastName ||
        "Unassigned";
      if (!stats[assignedTo]) {
        stats[assignedTo] = { total: 0, inProgress: 0, completed: 0 };
      }
      stats[assignedTo].total++;

      if (case_.status === "resolved" || case_.status === "closed") {
        stats[assignedTo].completed++;
      } else if (
        case_.status === "in_progress" ||
        case_.status === "assigned"
      ) {
        stats[assignedTo].inProgress++;
      }
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      ...data,
      completionRate:
        data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));
  }, [filteredCases, isAdmin]);

  // Modal open/close handlers
  const openModal = (creditCase) => {
    setSelectedCase(creditCase);
    setShowModal(true);
    setAssignUserId("");
    setComment("");
    setModalError("");
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedCase(null);
    setAssignUserId("");
    setComment("");
    setModalError("");
  };

  // Assign action - only for admins or admin view
  const handleAssign = async () => {
    if (!canAssignCases) {
      setModalError("Only admins can assign cases.");
      return;
    }

    if (!assignUserId) {
      setModalError("Please select a user to assign.");
      return;
    }
    setAssignLoading(true);
    setModalError("");
    try {
      if (onAssignCase) {
        // Use custom assign function if provided (for admin view)
        await onAssignCase(selectedCase._id, assignUserId, "credit");
      } else {
        // Use default Redux action
        await dispatch(
          assignCase({ id: selectedCase._id, userId: assignUserId })
        ).unwrap();
      }
      closeModal();
      dispatch(getCreditCases()); // Refetch to update the board
    } catch (err) {
      setModalError(err || "Failed to assign case");
    } finally {
      setAssignLoading(false);
    }
  };

  // Comment action - available for all users
  const handleComment = async () => {
    if (!comment.trim()) {
      setModalError("Please enter a comment.");
      return;
    }
    setCommentLoading(true);
    setModalError("");
    try {
      if (onAddComment) {
        // Use custom comment function if provided (for admin view)
        await onAddComment(selectedCase._id, comment, "credit");
      } else {
        // Use default Redux action
        await dispatch(
          addCaseComment({ id: selectedCase._id, comment })
        ).unwrap();
      }
      closeModal();
      dispatch(getCreditCases()); // Refetch to update the board
    } catch (err) {
      setModalError(err || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  // Escalate action - only for admins and credit heads
  const handleEscalate = async () => {
    if (!canEscalateCases) {
      setModalError("Only admins and credit heads can escalate cases.");
      return;
    }

    // Show payment modal instead of escalating directly
    setShowPaymentModal(true);
    closeModal(); // Close the case details modal
  };

  // Handle escalation with payment
  const handleEscalationWithPayment = async () => {
    setPaymentLoading(true);
    setPaymentError("");

    try {
      const response = await creditCaseApi.escalateCase(selectedCase._id, {
        escalationFee: escalationFee,
      });

      if (response.data.success) {
        setShowPaymentModal(false);
        dispatch(getCreditCases()); // Refetch to update the board
        // Show success message
        alert("Case escalated successfully! Payment is pending confirmation.");
      }
    } catch (error) {
      console.error("Escalation error:", error);
      setPaymentError(
        error.response?.data?.message || "Failed to escalate case"
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentError("");
    setSelectedCase(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 to-dark-800">
      {/* Header with user info and permissions */}
      <div className="bg-white/5 border-b border-dark-700 p-6 rounded-b-3xl shadow-xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow-lg">
              Case Management Board
            </h1>
            <div className="flex items-center space-x-4 text-base text-dark-300 font-medium">
              <span>
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 font-bold text-xs">
                {user?.role?.replace("_", " ").toUpperCase()}
              </span>
              {isAdmin && (
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 font-bold text-xs">
                  ADMIN PRIVILEGES
                </span>
              )}
            </div>
            {isAdmin && (
              <div className="mt-2 text-sm text-dark-400">
                💡 Admin Features:{" "}
                {isAdminView
                  ? "Drag cards to change status • Assign cases to collectors • Monitor progress • Escalate cases"
                  : "Drag cards to change status • Assign cases to collectors • Monitor progress • Escalate cases"}
              </div>
            )}
          </div>
          <div className="text-right text-base text-dark-300">
            <div>
              Total Cases:{" "}
              <span className="font-bold text-white">
                {filteredCases.length}
              </span>
            </div>
            <div>
              Your Cases:{" "}
              <span className="font-bold text-white">
                {isDebtCollector ? filteredCases.length : "All visible"}
              </span>
            </div>
            {isAdmin && progressMetrics && (
              <div className="mt-2 pt-2 border-t border-dark-600">
                <div className="text-xs text-dark-400 mb-1">
                  Progress Overview:
                </div>
                <div className="flex space-x-6 text-xs">
                  <div>
                    <div className="text-green-400 font-bold">
                      {progressMetrics.completionRate}% Complete
                    </div>
                    <div className="text-dark-400">
                      ({progressMetrics.resolved} cases)
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-400 font-bold">
                      {progressMetrics.progressRate}% In Progress
                    </div>
                    <div className="text-dark-400">
                      ({progressMetrics.inProgress} cases)
                    </div>
                  </div>
                  <div>
                    <div className="text-orange-400 font-bold">
                      {progressMetrics.escalated} Escalated
                    </div>
                  </div>
                </div>
                {assignmentStats && assignmentStats.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dark-600">
                    <div className="text-xs text-dark-400 mb-1">
                      Assignment Overview:
                    </div>
                    <div className="space-y-1">
                      {assignmentStats.slice(0, 3).map((stat, index) => (
                        <div
                          key={index}
                          className="text-xs flex justify-between"
                        >
                          <span className="text-dark-300">{stat.name}</span>
                          <span className="text-blue-400">
                            {stat.total} cases ({stat.completionRate}% done)
                          </span>
                        </div>
                      ))}
                      {assignmentStats.length > 3 && (
                        <div className="text-xs text-dark-400 italic">
                          +{assignmentStats.length - 3} more collectors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex space-x-4 sm:space-x-6 overflow-x-auto p-4 md:p-6 min-h-[70vh] pb-8">
        <DragDropContext onDragEnd={onDragEnd}>
          {STATUS_COLUMNS.map((col) => (
            <Droppable droppableId={col.key} key={col.key}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl w-72 sm:w-80 min-h-[60vh] flex flex-col border border-slate-600/50 transition-all duration-300 ${
                    snapshot.isDraggingOver
                      ? "ring-2 ring-blue-500/50 scale-105 shadow-blue-500/25"
                      : "hover:shadow-slate-500/25"
                  }`}
                >
                  {/* Column Header */}
                  <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-slate-600/50 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-t-2xl sm:rounded-t-3xl">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                        {col.label}
                      </h2>
                      <span className="px-2 py-1 bg-slate-600/50 text-white text-xs font-bold rounded-full border border-slate-500/50">
                        {casesByStatus[col.key]?.length || 0}
                      </span>
                    </div>
                    {/* Column Description */}
                    <p className="text-xs text-slate-400">
                      {getColumnDescription(col.key)}
                    </p>
                  </div>
                  
                  {/* Column Content */}
                  <div className="flex-1 px-3 sm:px-4 py-4 overflow-y-auto custom-scrollbar max-h-[60vh]">
                    {isLoading ? (
                      <div className="text-dark-400 text-center py-8">
                        Loading...
                      </div>
                    ) : (
                      <>
                        {/* Show first 3 cases */}
                        {casesByStatus[col.key]
                          ?.slice(0, 3)
                          .map((creditCase, idx) => (
                            <Draggable
                              draggableId={creditCase._id}
                              index={idx}
                              key={creditCase._id}
                              isDragDisabled={
                                !canChangeStatusForCase(creditCase)
                              }
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white/90 bg-opacity-80 rounded-2xl shadow-lg mb-5 p-5 cursor-pointer border-l-4 border-primary-400 hover:shadow-2xl transition-all duration-200 ${
                                    snapshot.isDragging
                                      ? "scale-105 ring-2 ring-primary-400"
                                      : ""
                                  } ${
                                    !canChangeStatusForCase(creditCase)
                                      ? "cursor-default"
                                      : ""
                                  }`}
                                  onClick={() => openModal(creditCase)}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-bold text-dark-900 truncate max-w-[160px] text-base">
                                      {creditCase.title || creditCase._id}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {canChangeStatusForCase(creditCase) && (
                                        <span className="text-xs text-dark-500">
                                          ⋮⋮
                                        </span>
                                      )}
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-bold uppercase tracking-wide shadow">
                                        {col.label}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center mb-2">
                                    <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold text-lg mr-2 shadow">
                                      {creditCase.assignedTo?.firstName
                                        ? creditCase.assignedTo.firstName[0]
                                        : "?"}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-xs text-dark-500">
                                        Assigned to
                                      </div>
                                      <div className="font-medium text-dark-700 text-sm">
                                        {creditCase.assignedTo?.firstName &&
                                        creditCase.assignedTo?.lastName
                                          ? `${creditCase.assignedTo.firstName} ${creditCase.assignedTo.lastName}`
                                          : "Unassigned"}
                                      </div>
                                    </div>
                                  </div>
                                  <Link
                                    to={
                                      isAdminView
                                        ? `/admin/case/${creditCase._id}`
                                        : `/credit-collection/cases/${creditCase._id}`
                                    }
                                    className="text-primary-500 hover:text-primary-700 text-xs block mb-2 underline font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View Details
                                  </Link>
                                  <div className="flex items-center text-xs text-dark-400 mb-1">
                                    <span className="mr-2">Created:</span>
                                    <span>
                                      {new Date(
                                        creditCase.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {!canChangeStatusForCase(creditCase) && (
                                    <div className="mt-2 text-xs text-dark-500 italic">
                                      (View only - contact case handler for
                                      status changes)
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}

                        {/* Show remaining cases if more than 3 */}
                        {casesByStatus[col.key]?.length > 3 && (
                          <div className="text-center py-4">
                            <div className="text-xs text-dark-400 mb-2">
                              +{casesByStatus[col.key].length - 3} more cases
                            </div>
                            <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent rounded-full opacity-50"></div>
                          </div>
                        )}

                        {/* Show all remaining cases in scrollable area */}
                        {casesByStatus[col.key]
                          ?.slice(3)
                          .map((creditCase, idx) => (
                            <Draggable
                              draggableId={creditCase._id}
                              index={idx + 3}
                              key={creditCase._id}
                              isDragDisabled={
                                !canChangeStatusForCase(creditCase)
                              }
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white/90 bg-opacity-80 rounded-2xl shadow-lg mb-5 p-5 cursor-pointer border-l-4 border-primary-400 hover:shadow-2xl transition-all duration-200 ${
                                    snapshot.isDragging
                                      ? "scale-105 ring-2 ring-primary-400"
                                      : ""
                                  } ${
                                    !canChangeStatusForCase(creditCase)
                                      ? "cursor-default"
                                      : ""
                                  }`}
                                  onClick={() => openModal(creditCase)}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-bold text-dark-900 truncate max-w-[160px] text-base">
                                      {creditCase.title || creditCase._id}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {canChangeStatusForCase(creditCase) && (
                                        <span className="text-xs text-dark-500">
                                          ⋮⋮
                                        </span>
                                      )}
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-bold uppercase tracking-wide shadow">
                                        {col.label}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center mb-2">
                                    <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold text-lg mr-2 shadow">
                                      {creditCase.assignedTo?.firstName
                                        ? creditCase.assignedTo.firstName[0]
                                        : "?"}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-xs text-dark-500">
                                        Assigned to
                                      </div>
                                      <div className="font-medium text-dark-700 text-sm">
                                        {creditCase.assignedTo?.firstName &&
                                        creditCase.assignedTo?.lastName
                                          ? `${creditCase.assignedTo.firstName} ${creditCase.assignedTo.lastName}`
                                          : "Unassigned"}
                                      </div>
                                    </div>
                                  </div>
                                  <Link
                                    to={
                                      isAdminView
                                        ? `/admin/case/${creditCase._id}`
                                        : `/credit-collection/cases/${creditCase._id}`
                                    }
                                    className="text-primary-500 hover:text-primary-700 text-xs block mb-2 underline font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View Details
                                  </Link>
                                  <div className="flex items-center text-xs text-dark-400 mb-1">
                                    <span className="mr-2">Created:</span>
                                    <span>
                                      {new Date(
                                        creditCase.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {!canChangeStatusForCase(creditCase) && (
                                    <div className="mt-2 text-xs text-dark-500 italic">
                                      (View only - contact case handler for
                                      status changes)
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                      </>
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
        {/* Case Details Modal */}
        {showModal && selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-dark-900 rounded-3xl p-10 w-full max-w-lg mx-4 relative shadow-2xl border border-primary-400">
              <button
                className="absolute top-3 right-3 text-dark-400 hover:text-white text-2xl"
                onClick={closeModal}
              >
                &times;
              </button>
              <h2 className="text-2xl font-extrabold text-white mb-4 drop-shadow">
                {selectedCase.title}
              </h2>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold text-xl mr-3 shadow">
                  {selectedCase.assignedTo?.firstName
                    ? selectedCase.assignedTo.firstName[0]
                    : "?"}
                </div>
                <div>
                  <div className="text-xs text-dark-500">Assigned to</div>
                  <div className="font-medium text-dark-200 text-base">
                    {selectedCase.assignedTo?.firstName &&
                    selectedCase.assignedTo?.lastName
                      ? `${selectedCase.assignedTo.firstName} ${selectedCase.assignedTo.lastName}`
                      : "Unassigned"}
                  </div>
                </div>
              </div>
              <div className="text-dark-300 mb-2">
                Debtor: {selectedCase.debtorName}
              </div>
              <div className="text-dark-300 mb-2">
                Amount:{" "}
                <span className="font-bold text-white">
                  KES {selectedCase.debtAmount?.toLocaleString()}
                </span>
              </div>
              <div className="text-dark-300 mb-2">
                Case Reference: {selectedCase.caseReference || "N/A"}
              </div>
              <div className="text-dark-300 mb-2">
                Status:{" "}
                <span className="badge badge-lg badge-info font-bold text-white ml-2">
                  {selectedCase.status?.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className="text-dark-300 mb-2">
                Description: {selectedCase.description}
              </div>
              {selectedCase.document && (
                <div className="mt-4">
                  <a
                    href={selectedCase.document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    View/Download Document
                  </a>
                </div>
              )}
              {/* Actions: Assign, Comment, Escalate */}
              <div className="mt-8 flex flex-col space-y-3">
                {/* Assign action - only for admins */}
                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    <select
                      className="input input-bordered input-lg rounded-full bg-dark-900/80 text-white border-none focus:ring-2 focus:ring-primary-400"
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      disabled={assignLoading || usersLoading}
                    >
                      <option value="">
                        Assign to debt collector, credit head, or admin...
                      </option>
                      {users
                        .filter((u) =>
                          [
                            "debt_collector",
                            "credit_head",
                            "law_firm_admin",
                            "admin",
                          ].includes(u.role)
                        )
                        .map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.firstName} {u.lastName} (
                            {u.role.replace("_", " ")})
                          </option>
                        ))}
                    </select>
                    <button
                      className="btn btn-primary btn-lg rounded-full shadow"
                      onClick={handleAssign}
                      disabled={assignLoading}
                    >
                      {assignLoading ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                )}

                {/* Comment action - available for all users */}
                <div className="flex items-center space-x-2">
                  <input
                    className="input input-bordered input-lg rounded-full bg-dark-900/80 text-white border-none focus:ring-2 focus:ring-primary-400 flex-1"
                    placeholder="Add comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={commentLoading}
                  />
                  <button
                    className="btn btn-secondary btn-lg rounded-full shadow"
                    onClick={handleComment}
                    disabled={commentLoading}
                  >
                    {commentLoading ? "Commenting..." : "Comment"}
                  </button>
                </div>

                {/* Escalate action - only for admins and credit heads */}
                {canEscalateCases && (
                  <button
                    className="btn btn-error btn-lg rounded-full shadow"
                    onClick={handleEscalate}
                    disabled={escalateLoading}
                  >
                    {escalateLoading ? "Escalating..." : "Escalate"}
                  </button>
                )}

                {modalError && (
                  <div className="text-red-400 text-sm mt-2">{modalError}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal for Escalation */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Escalate Case to Legal Department
            </h3>

            <div className="mb-4">
              <p className="text-dark-300 mb-4">
                This action will escalate the case to the legal department. An
                escalation fee of KES {escalationFee} will be charged.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Escalation Fee (KES)
                </label>
                <input
                  type="number"
                  value={escalationFee}
                  onChange={(e) => setEscalationFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {paymentError && (
              <div className="text-red-400 text-sm mb-4">{paymentError}</div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={closePaymentModal}
                className="flex-1 px-4 py-2 bg-dark-600 text-white rounded-lg hover:bg-dark-500 transition-colors"
                disabled={paymentLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEscalationWithPayment}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={paymentLoading}
              >
                {paymentLoading ? "Processing..." : "Confirm Escalation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
