import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import notificationApi from "../api/notificationApi.js";
import toast from "react-hot-toast";

// Async thunks
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getNotifications(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch notifications"
      );
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getUnreadCount();
      return response.data.count;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch unread count"
      );
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAsRead(notificationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark notification as read"
      );
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAllAsRead();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to mark all notifications as read"
      );
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await notificationApi.deleteNotification(notificationId);
      return { notificationId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete notification"
      );
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
  },
  isLoading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 20,
      };
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.pagination = action.payload.pagination;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        console.error("Failed to fetch unread count:", action.payload);
      })
      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = action.payload;
        const index = state.notifications.findIndex(
          (n) => n._id === notification._id
        );
        if (index !== -1) {
          state.notifications[index] = notification;
          if (!notification.isRead && state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        toast.error(action.payload);
      })
      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        }));
        state.unreadCount = 0;
        toast.success("All notifications marked as read");
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        toast.error(action.payload);
      })
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const { notificationId } = action.payload;
        const notification = state.notifications.find(
          (n) => n._id === notificationId
        );
        if (notification && !notification.isRead && state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
        state.notifications = state.notifications.filter(
          (n) => n._id !== notificationId
        );
        toast.success("Notification deleted");
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        toast.error(action.payload);
      });
  },
});

export const { clearNotifications, addNotification, updateUnreadCount } =
  notificationSlice.actions;

export default notificationSlice.reducer;
