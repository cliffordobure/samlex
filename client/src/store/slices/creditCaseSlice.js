import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import creditCaseApi from "../api/creditCaseApi";

export const getCreditCases = createAsyncThunk(
  "creditCases/getCreditCases",
  async (params, { rejectWithValue }) => {
    try {
      const response = await creditCaseApi.getCreditCases(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch credit cases"
      );
    }
  }
);

export const createCreditCase = createAsyncThunk(
  "creditCases/createCreditCase",
  async (caseData, { rejectWithValue }) => {
    try {
      const response = await creditCaseApi.createCreditCase(caseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create credit case"
      );
    }
  }
);

export const updateCreditCase = createAsyncThunk(
  "creditCases/updateCreditCase",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await creditCaseApi.updateCreditCase(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update credit case"
      );
    }
  }
);

export const updateCaseStatus = createAsyncThunk(
  "creditCases/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await creditCaseApi.updateStatus(id, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update case status"
      );
    }
  }
);

export const assignCase = createAsyncThunk(
  "creditCases/assignCase",
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      const response = await creditCaseApi.assignCase(id, userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign case"
      );
    }
  }
);

export const addCaseComment = createAsyncThunk(
  "creditCases/addComment",
  async ({ id, comment }, { rejectWithValue }) => {
    try {
      const response = await creditCaseApi.addCaseComment(id, { comment });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add comment"
      );
    }
  }
);

export const escalateCase = createAsyncThunk(
  "creditCases/escalateCase",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await creditCaseApi.escalateToLegal(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to escalate case"
      );
    }
  }
);

export const getCreditCaseById = createAsyncThunk(
  "creditCases/getById",
  async (id, { rejectWithValue }) => {
    try {
      console.log("[getCreditCaseById thunk] Called with id:", id);
      const response = await creditCaseApi.getCreditCase(id);
      console.log("[getCreditCaseById thunk] Response:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("[getCreditCaseById thunk] Error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch credit case"
      );
    }
  }
);

const initialState = {
  cases: [],
  currentCase: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  },
  caseDetails: null,
  caseDetailsLoading: false,
  caseDetailsError: null,
};

const creditCaseSlice = createSlice({
  name: "creditCases",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCase: (state, action) => {
      state.currentCase = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCreditCases.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCreditCases.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cases = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getCreditCases.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createCreditCase.fulfilled, (state, action) => {
        state.cases.unshift(action.payload);
      })
      .addCase(updateCreditCase.fulfilled, (state, action) => {
        const index = state.cases.findIndex(
          (case_) => case_._id === action.payload._id
        );
        if (index !== -1) {
          state.cases[index] = action.payload;
        }
      })
      .addCase(getCreditCaseById.pending, (state) => {
        state.caseDetailsLoading = true;
        state.caseDetailsError = null;
      })
      .addCase(getCreditCaseById.fulfilled, (state, action) => {
        state.caseDetailsLoading = false;
        state.caseDetails = action.payload;
      })
      .addCase(getCreditCaseById.rejected, (state, action) => {
        state.caseDetailsLoading = false;
        state.caseDetailsError = action.error.message;
      })
      .addCase(assignCase.fulfilled, (state, action) => {
        const index = state.cases.findIndex(
          (case_) => case_._id === action.payload._id
        );
        if (index !== -1) {
          state.cases[index] = action.payload;
        }
      })
      .addCase(addCaseComment.fulfilled, (state, action) => {
        const index = state.cases.findIndex(
          (case_) => case_._id === action.payload._id
        );
        if (index !== -1) {
          state.cases[index] = action.payload;
        }
      })
      .addCase(escalateCase.fulfilled, (state, action) => {
        const index = state.cases.findIndex(
          (case_) => case_._id === action.payload._id
        );
        if (index !== -1) {
          state.cases[index] = action.payload;
        }
      })
      .addCase(updateCaseStatus.fulfilled, (state, action) => {
        const index = state.cases.findIndex(
          (case_) => case_._id === action.payload._id
        );
        if (index !== -1) {
          state.cases[index] = action.payload;
        }
      })
      .addCase(updateCaseStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentCase } = creditCaseSlice.actions;
export default creditCaseSlice.reducer;
