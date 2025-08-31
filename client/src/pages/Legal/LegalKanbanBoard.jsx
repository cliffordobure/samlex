import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import socket from "../../utils/socket";
import { useSelector, useDispatch } from "react-redux";
import {
  getLegalCases,
  updateLegalCaseStatus,
  assignLegalCase,
  addLegalCaseComment,
} from "../../store/slices/legalCaseSlice";
import { getUsers } from "../../store/slices/userSlice";
import { Link, useNavigate } from "react-router-dom";

const STATUS_COLUMNS = [
  { key: "pending_assignment", label: "Pending Assignment" },
  { key: "filed", label: "Filed" },
  { key: "assigned", label: "Assigned" },
  { key: "under_review", label: "Under Review" },
  { key: "court_proceedings", label: "Court Proceedings" },
  { key: "settlement", label: "Settlement" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

const LegalKanbanBoard = ({
  cases: propCases,
  isLoading: propIsLoading,
  isAdminView = false,
  onAssignCase,
  onAddComment,
  availableUsers = [],
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reduxCases = useSelector((state) => state.legalCases.cases);
  const reduxIsLoading = useSelector((state) => state.legalCases.isLoading);
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
  const [modalError, setModalError] = useState("");

  // Check if user is admin
  const isAdmin = user?.role === "admin" || user?.role === "law_firm_admin";
  const isAdvocate = user?.role === "advocate";

  // Allow admins to change status in both normal and admin view
  const canChangeStatus = isAdmin;
  const canAssignCases = isAdmin || isAdminView;

  // Load users for assignment dropdown
  useEffect(() => {
    if (isAdmin && !isAdminView) {
      // Load all users that can be assigned legal cases: advocates, legal heads, and admins
      dispatch(getUsers()); // Load all users, we'll filter them in the dropdown
    }
  }, [dispatch, isAdmin, isAdminView]);

  // Filter cases based on user role
  const filteredCases = React.useMemo(() => {
    if (!user) return localCases;
    if (isAdvocate) {
      return localCases.filter(
        (c) => c.assignedTo === user._id || c.assignedTo?._id === user._id
      );
    }
    return localCases;
  }, [localCases, user, isAdvocate]);

  // Socket.IO listeners
  useEffect(() => {
    const refetch = () => dispatch(getLegalCases());
    socket.on("legalCaseStatusUpdated", refetch);
    socket.on("legalCaseCreated", refetch);
    socket.on("legalCaseAssigned", refetch);
    socket.on("legalCaseCommented", refetch);
    return () => {
      socket.off("legalCaseStatusUpdated", refetch);
      socket.off("legalCaseCreated", refetch);
      socket.off("legalCaseAssigned", refetch);
      socket.off("legalCaseCommented", refetch);
    };
  }, [dispatch]);

  // Handle drag end - allow admins to change status in both normal and admin view
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    // Only allow admins to change status
    if (!canChangeStatus) {
      return;
    }

    // Optimistically update localCases
    setLocalCases((prev) =>
      prev.map((c) =>
        c._id === draggableId ? { ...c, status: destination.droppableId } : c
      )
    );
    // Dispatch Redux update for status only
    dispatch(
      updateLegalCaseStatus({
        id: draggableId,
        status: destination.droppableId,
      })
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
    const inProgress = casesByStatus.under_review?.length || 0;
    const assigned = casesByStatus.assigned?.length || 0;
    const courtProceedings = casesByStatus.court_proceedings?.length || 0;

    return {
      total,
      resolved: resolved + closed,
      inProgress: inProgress + assigned + courtProceedings,
      courtProceedings,
      completionRate:
        total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0,
      progressRate:
        total > 0
          ? Math.round(
              ((inProgress + assigned + courtProceedings) / total) * 100
            )
          : 0,
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
        case_.status === "under_review" ||
        case_.status === "assigned" ||
        case_.status === "court_proceedings"
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
  const openModal = (legalCase) => {
    setSelectedCase(legalCase);
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
        await onAssignCase(selectedCase._id, assignUserId, "legal");
      } else {
        // Use default Redux action
        await dispatch(
          assignLegalCase({ id: selectedCase._id, userId: assignUserId })
        ).unwrap();
      }
      closeModal();
      dispatch(getLegalCases()); // Refetch to update the board
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
        await onAddComment(selectedCase._id, comment, "legal");
      } else {
        // Use default Redux action
        await dispatch(
          addLegalCaseComment({ id: selectedCase._id, comment })
        ).unwrap();
      }
      closeModal();
      dispatch(getLegalCases()); // Refetch to update the board
    } catch (err) {
      setModalError(err || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  // Helper to determine if a case can be dragged (based on status)
  const canChangeStatusForCase = (case_) => {
    return canChangeStatus;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 to-dark-800">
      {/* Header with user info and permissions */}
      <div className="bg-white/5 border-b border-dark-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Legal Case Management Board
            </h1>
            <div className="flex items-center space-x-4 text-sm text-dark-300">
              <span>
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <span className="px-2 py-1 rounded bg-primary-500/20 text-primary-300">
                {user?.role?.replace("_", " ").toUpperCase()}
              </span>
              {isAdmin && (
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">
                  ADMIN PRIVILEGES
                </span>
              )}
            </div>
            {isAdmin && (
              <div className="mt-2 text-xs text-dark-400">
                💡 Admin Features:{" "}
                {isAdminView
                  ? "Drag cards to change status • Assign cases to advocates • Monitor progress"
                  : "Drag cards to change status • Assign cases to advocates • Monitor progress"}
              </div>
            )}
          </div>
          <div className="text-right text-sm text-dark-300">
            <div>Total Cases: {filteredCases.length}</div>
            <div>
              Your Cases: {isAdvocate ? filteredCases.length : "All visible"}
            </div>
            {isAdmin && progressMetrics && (
              <div className="mt-2 pt-2 border-t border-dark-600">
                <div className="text-xs text-dark-400 mb-1">
                  Progress Overview:
                </div>
                <div className="flex space-x-3 text-xs">
                  <div>
                    <div className="text-green-400">
                      {progressMetrics.completionRate}% Complete
                    </div>
                    <div className="text-dark-400">
                      ({progressMetrics.resolved} cases)
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-400">
                      {progressMetrics.progressRate}% In Progress
                    </div>
                    <div className="text-dark-400">
                      ({progressMetrics.inProgress} cases)
                    </div>
                  </div>
                  <div>
                    <div className="text-orange-400">
                      {progressMetrics.courtProceedings} In Court
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex space-x-6 overflow-x-auto p-6 min-h-[70vh]">
        <DragDropContext onDragEnd={onDragEnd}>
          {STATUS_COLUMNS.map((col) => (
            <Droppable droppableId={col.key} key={col.key}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-white/5 rounded-2xl shadow-lg w-80 min-h-[60vh] flex flex-col border border-dark-700 transition-all duration-200 ${
                    snapshot.isDraggingOver
                      ? "ring-2 ring-primary-400 scale-105"
                      : ""
                  }`}
                >
                  <div className="px-5 pt-5 pb-3 border-b border-dark-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white tracking-wide">
                      {col.label}
                    </h2>
                    <span className="text-xs text-dark-400 font-semibold">
                      {casesByStatus[col.key]?.length || 0}
                    </span>
                  </div>
                  <div className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar max-h-[60vh]">
                    {isLoading ? (
                      <div className="text-dark-400 text-center py-8">
                        Loading...
                      </div>
                    ) : (
                      <>
                        {/* Show first 3 cases */}
                        {casesByStatus[col.key]
                          ?.slice(0, 3)
                          .map((legalCase, idx) => (
                            <Draggable
                              draggableId={legalCase._id}
                              index={idx}
                              key={legalCase._id}
                              isDragDisabled={
                                !canChangeStatusForCase(legalCase)
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
                                    !canChangeStatusForCase(legalCase)
                                      ? "cursor-default"
                                      : ""
                                  }`}
                                  onClick={() => openModal(legalCase)}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-bold text-dark-900 truncate max-w-[160px] text-base">
                                      {legalCase.title || legalCase._id}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {canChangeStatusForCase(legalCase) && (
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
                                      {legalCase.assignedTo?.firstName
                                        ? legalCase.assignedTo.firstName[0]
                                        : "?"}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-xs text-dark-500">
                                        Assigned to
                                      </div>
                                      <div className="font-medium text-dark-700 text-sm">
                                        {legalCase.assignedTo?.firstName &&
                                        legalCase.assignedTo?.lastName
                                          ? `${legalCase.assignedTo.firstName} ${legalCase.assignedTo.lastName}`
                                          : "Unassigned"}
                                      </div>
                                    </div>
                                  </div>
                                  <Link
                                    to={
                                      isAdminView
                                        ? `/admin/legal-case/${legalCase._id}`
                                        : `/legal/cases/${legalCase._id}`
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
                                        legalCase.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {!canChangeStatusForCase(legalCase) && (
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
                          .map((legalCase, idx) => (
                            <Draggable
                              draggableId={legalCase._id}
                              index={idx + 3}
                              key={legalCase._id}
                              isDragDisabled={
                                !canChangeStatusForCase(legalCase)
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
                                    !canChangeStatusForCase(legalCase)
                                      ? "cursor-default"
                                      : ""
                                  }`}
                                  onClick={() => openModal(legalCase)}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-bold text-dark-900 truncate max-w-[160px] text-base">
                                      {legalCase.title || legalCase._id}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {canChangeStatusForCase(legalCase) && (
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
                                      {legalCase.assignedTo?.firstName
                                        ? legalCase.assignedTo.firstName[0]
                                        : "?"}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-xs text-dark-500">
                                        Assigned to
                                      </div>
                                      <div className="font-medium text-dark-700 text-sm">
                                        {legalCase.assignedTo?.firstName &&
                                        legalCase.assignedTo?.lastName
                                          ? `${legalCase.assignedTo.firstName} ${legalCase.assignedTo.lastName}`
                                          : "Unassigned"}
                                      </div>
                                    </div>
                                  </div>
                                  <Link
                                    to={
                                      isAdminView
                                        ? `/admin/legal-case/${legalCase._id}`
                                        : `/legal/cases/${legalCase._id}`
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
                                        legalCase.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {!canChangeStatusForCase(legalCase) && (
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
      </div>

      {/* Case Details Modal */}
      {showModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Case Details</h3>
              <button
                onClick={closeModal}
                className="text-dark-400 hover:text-white text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-white mb-2">
                  {selectedCase.title}
                </h4>
                <p className="text-dark-300 text-sm mb-2">
                  {selectedCase.description}
                </p>
                <div className="text-xs text-dark-400">
                  Case Number: {selectedCase.caseNumber}
                </div>
                <div className="text-xs text-dark-400">
                  Status: {selectedCase.status.replace("_", " ").toUpperCase()}
                </div>
                <div className="text-xs text-dark-400">
                  Assigned to:{" "}
                  {selectedCase.assignedTo?.firstName &&
                  selectedCase.assignedTo?.lastName
                    ? `${selectedCase.assignedTo.firstName} ${selectedCase.assignedTo.lastName}`
                    : "Unassigned"}
                </div>
              </div>

              {canAssignCases && (
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Assign to Advocate, Legal Head, or Admin
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                  >
                    <option value="">
                      Select advocate, legal head, or admin...
                    </option>
                    {users
                      .filter((u) =>
                        [
                          "advocate",
                          "legal_head",
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
                  <button
                    onClick={handleAssign}
                    disabled={assignLoading || !assignUserId}
                    className="btn btn-primary btn-sm mt-2 w-full"
                  >
                    {assignLoading ? "Assigning..." : "Assign Case"}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Add Comment
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <button
                  onClick={handleComment}
                  disabled={commentLoading || !comment.trim()}
                  className="btn btn-secondary btn-sm mt-2 w-full"
                >
                  {commentLoading ? "Adding..." : "Add Comment"}
                </button>
              </div>

              {modalError && (
                <div className="alert alert-error text-sm">
                  <span>{modalError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalKanbanBoard;
