/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../store/slices/notificationSlice";
import {
  FaBell,
  FaTimes,
  FaCheck,
  FaTrash,
  FaCalendar,
  FaGavel,
  FaFileAlt,
  FaUser,
  FaClock,
  FaFilter,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import toast from "react-hot-toast";

const Notifications = () => {
  const dispatch = useDispatch();
  const { notifications, pagination, isLoading } = useSelector(
    (state) => state.notifications
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    loadNotifications();
  }, [currentPage, filter, typeFilter]);

  const loadNotifications = () => {
    const params = {
      page: currentPage,
      limit: 20,
    };

    if (filter === "unread") {
      params.unreadOnly = true;
    }

    dispatch(fetchNotifications(params));
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
      loadNotifications(); // Reload to update the list
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
      loadNotifications(); // Reload to update the list
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
      loadNotifications(); // Reload to update the list
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "court_date":
      case "hearing_date":
      case "mentioning_date":
        return <FaCalendar className="text-blue-500" />;
      case "case_assigned":
      case "case_reassigned":
        return <FaUser className="text-green-500" />;
      case "task_reminder":
        return <FaClock className="text-orange-500" />;
      case "daily_summary":
        return <FaFileAlt className="text-purple-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case "court_date":
        return "Court Date";
      case "hearing_date":
        return "Hearing Date";
      case "mentioning_date":
        return "Mentioning Date";
      case "case_assigned":
        return "Case Assigned";
      case "case_reassigned":
        return "Case Reassigned";
      case "task_reminder":
        return "Task Reminder";
      case "daily_summary":
        return "Daily Summary";
      default:
        return "System";
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      urgent: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-blue-100 text-blue-800",
      low: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          colors[priority] || colors.medium
        }`}
      >
        {priority}
      </span>
    );
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (typeFilter !== "all" && notification.type !== typeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Notifications
            </h1>
            <p className="text-dark-400">
              Stay updated with your case activities and important reminders
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleMarkAllAsRead}
              className="btn btn-outline btn-sm"
            >
              <FaCheck />
              Mark All Read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaFilter className="text-dark-400" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="all">All Types</option>
                <option value="court_date">Court Dates</option>
                <option value="hearing_date">Hearing Dates</option>
                <option value="mentioning_date">Mentioning Dates</option>
                <option value="case_assigned">Case Assignments</option>
                <option value="task_reminder">Task Reminders</option>
                <option value="daily_summary">Daily Summaries</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="card">
              <div className="card-body text-center">
                <div className="loading loading-spinner loading-lg"></div>
                <p className="mt-4 text-dark-400">Loading notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No notifications found
                </h3>
                <p className="text-gray-500">
                  {filter === "all"
                    ? "You're all caught up! No notifications to show."
                    : `No ${filter} notifications found.`}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`card ${
                  !notification.isRead ? "border-l-4 border-l-blue-500" : ""
                }`}
              >
                <div className="card-body">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3
                              className={`text-lg font-semibold ${
                                !notification.isRead
                                  ? "text-white"
                                  : "text-gray-600"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-gray-300 mb-3">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-dark-400">
                            <span className="flex items-center gap-1">
                              <FaClock />
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaFileAlt />
                              {getNotificationTypeLabel(notification.type)}
                            </span>
                            {notification.eventDate && (
                              <span className="flex items-center gap-1">
                                <FaCalendar />
                                {new Date(
                                  notification.eventDate
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {!notification.isRead ? (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="btn btn-sm btn-outline"
                              title="Mark as read"
                            >
                              <FaEye />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="btn btn-sm btn-outline"
                              title="Mark as unread"
                            >
                              <FaEyeSlash />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteNotification(notification._id)
                            }
                            className="btn btn-sm btn-outline btn-error"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      {notification.actionUrl && (
                        <div className="mt-3">
                          <Link
                            to={notification.actionUrl}
                            className="btn btn-sm btn-primary"
                          >
                            View Details
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="join">
              <button
                className="join-item btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                «
              </button>
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1
              ).map((page) => (
                <button
                  key={page}
                  className={`join-item btn ${
                    page === currentPage ? "btn-active" : ""
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="join-item btn"
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
