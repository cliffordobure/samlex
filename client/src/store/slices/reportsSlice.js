import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import reportsApi from "../api/reportsApi.js";
import { toast } from "react-hot-toast";

// Async thunks
export const fetchCaseStatistics = createAsyncThunk(
  "reports/fetchCaseStatistics",
  async ({ lawFirmId, params }, { rejectWithValue }) => {
    try {
      const response = await reportsApi.getCaseStatistics(lawFirmId, params);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch case statistics";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchUserActivity = createAsyncThunk(
  "reports/fetchUserActivity",
  async ({ lawFirmId, params }, { rejectWithValue }) => {
    try {
      const response = await reportsApi.getUserActivity(lawFirmId, params);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch user activity";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchDepartmentPerformance = createAsyncThunk(
  "reports/fetchDepartmentPerformance",
  async ({ lawFirmId, params }, { rejectWithValue }) => {
    try {
      const response = await reportsApi.getDepartmentPerformance(
        lawFirmId,
        params
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to fetch department performance";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchRevenueAnalytics = createAsyncThunk(
  "reports/fetchRevenueAnalytics",
  async ({ lawFirmId, params }, { rejectWithValue }) => {
    try {
      const response = await reportsApi.getRevenueAnalytics(lawFirmId, params);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch revenue analytics";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchDashboardAnalytics = createAsyncThunk(
  "reports/fetchDashboardAnalytics",
  async (lawFirmId, { rejectWithValue }) => {
    try {
      const response = await reportsApi.getDashboardAnalytics(lawFirmId);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch dashboard analytics";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  caseStatistics: null,
  userActivity: null,
  departmentPerformance: null,
  revenueAnalytics: null,
  dashboardAnalytics: null,
  isLoading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearReports: (state) => {
      state.caseStatistics = null;
      state.userActivity = null;
      state.departmentPerformance = null;
      state.revenueAnalytics = null;
      state.dashboardAnalytics = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Case Statistics
      .addCase(fetchCaseStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCaseStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.caseStatistics = action.payload;
      })
      .addCase(fetchCaseStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // User Activity
      .addCase(fetchUserActivity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userActivity = action.payload;
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Department Performance
      .addCase(fetchDepartmentPerformance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentPerformance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.departmentPerformance = action.payload;
      })
      .addCase(fetchDepartmentPerformance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Revenue Analytics
      .addCase(fetchRevenueAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.revenueAnalytics = action.payload;
      })
      .addCase(fetchRevenueAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Dashboard Analytics
      .addCase(fetchDashboardAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardAnalytics = action.payload;
      })
      .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearReports } = reportsSlice.actions;
export default reportsSlice.reducer;
