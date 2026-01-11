/* eslint-disable no-unused-vars */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import legalCaseApi from "../api/legalCaseApi";

export const getLegalCases = createAsyncThunk(
  "legalCases/getLegalCases",
  async (params, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.getLegalCases(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch legal cases"
      );
    }
  }
);

export const createLegalCase = createAsyncThunk(
  "legalCases/createLegalCase",
  async (caseData, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.createLegalCase(caseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create legal case"
      );
    }
  }
);

export const updateLegalCase = createAsyncThunk(
  "legalCases/updateLegalCase",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.updateLegalCase(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update legal case"
      );
    }
  }
);

export const assignLegalCase = createAsyncThunk(
  "legalCases/assignLegalCase",
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.assignCase(id, userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign legal case"
      );
    }
  }
);

export const createLegalCaseFromEscalated = createAsyncThunk(
  "legalCases/createLegalCaseFromEscalated",
  async ({ data, assignedTo, notes }, { rejectWithValue }) => {
    try {
      console.log("=== FRONTEND: Creating Legal Case ===");
      console.log("Data:", data);
      console.log("Assigned To:", assignedTo);
      console.log("Notes:", notes);

      // Create the legal case with assignment already included in the data
      const createResponse = await legalCaseApi.createLegalCase(data);
      const legalCase = createResponse.data;

      console.log("=== FRONTEND: Case Created ===");
      console.log("Legal Case ID:", legalCase._id);
      console.log("Legal Case:", legalCase);

      // If notes are provided, add them to the case
      if (notes && notes.trim()) {
        try {
          await legalCaseApi.addNote(legalCase._id, {
            content: notes,
            isInternal: true,
          });
          console.log("Notes added successfully");
        } catch (noteError) {
          console.warn("Failed to add assignment notes:", noteError);
        }
      }

      return legalCase;
    } catch (error) {
      console.error("=== FRONTEND: Error Creating Case ===");
      console.error("Error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create legal case from escalated"
      );
    }
  }
);

export const updateLegalCaseStatus = createAsyncThunk(
  "legalCases/updateLegalCaseStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.updateStatus(id, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update legal case status"
      );
    }
  }
);

export const addLegalCaseNote = createAsyncThunk(
  "legalCases/addLegalCaseNote",
  async ({ id, content, isInternal }, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.addNote(id, { content, isInternal });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add note"
      );
    }
  }
);

export const addLegalCaseComment = createAsyncThunk(
  "legalCases/addLegalCaseComment",
  async ({ id, comment }, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.addComment(id, { comment });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add comment"
      );
    }
  }
);

export const addLegalCaseDocument = createAsyncThunk(
  "legalCases/addLegalCaseDocument",
  async ({ id, documents }, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.addDocument(id, documents);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add document"
      );
    }
  }
);

export const getPendingAssignmentCases = createAsyncThunk(
  "legalCases/getPendingAssignmentCases",
  async (_, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.getPendingAssignmentCases();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch pending cases"
      );
    }
  }
);

export const getLegalCaseStatistics = createAsyncThunk(
  "legalCases/getLegalCaseStatistics",
  async (params, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.getStatistics(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch statistics"
      );
    }
  }
);

export const getLegalCase = createAsyncThunk(
  "legalCases/getLegalCase",
  async (id, { rejectWithValue }) => {
    try {
      const response = await legalCaseApi.getLegalCase(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch legal case"
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
};

const legalCaseSlice = createSlice({
  name: "legalCases",
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
      .addCase(getLegalCases.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getLegalCases.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log("📊 Legal Cases API Response:", action.payload);
        
        // Handle different response structures
        if (action.payload && action.payload.data) {
          if (Array.isArray(action.payload.data)) {
            state.cases = action.payload.data;
          } else if (Array.isArray(action.payload.data.cases)) {
            state.cases = action.payload.data.cases;
          } else {
            state.cases = [];
          }
          state.pagination = action.payload.pagination || action.payload.data.pagination || {};
        } else if (Array.isArray(action.payload)) {
          state.cases = action.payload;
          state.pagination = {};
        } else {
          state.cases = [];
          state.pagination = {};
        }
        
        console.log("📊 Processed Legal Cases:", state.cases.length);
      })
      .addCase(getLegalCases.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createLegalCase.fulfilled, (state, action) => {
        state.cases.unshift(action.payload);
      })
      .addCase(updateLegalCase.fulfilled, (state, action) => {
        const index = state.cases.findIndex(
          (case_) => case_._id === action.payload._id
        );
        if (index !== -1) {
          state.cases[index] = action.payload;
        }
      })
      .addCase(assignLegalCase.fulfilled, (state, action) => {
        const updatedCase = action.payload;
        // Update in cases array
        const index = state.cases.findIndex(
          (case_) => case_._id === updatedCase._id
        );
        if (index !== -1) {
          state.cases[index] = updatedCase;
        }
        // Update currentCase if it's the same case
        if (state.currentCase && state.currentCase._id === updatedCase._id) {
          state.currentCase = updatedCase;
        }
        // Also update if we have a caseDetails field (some components use this)
        if (state.caseDetails && state.caseDetails._id === updatedCase._id) {
          state.caseDetails = updatedCase;
        }
      })
      .addCase(updateLegalCaseStatus.fulfilled, (state, action) => {
        const index = state.cases.findIndex(
          (case_) => case_._id === action.payload._id
        );
        if (index !== -1) {
          state.cases[index] = action.payload;
        }
      })
      .addCase(addLegalCaseNote.fulfilled, (state, action) => {
        const index = state.cases.findIndex(
          (case_) => case_._id === action.payload._id
        );
        if (index !== -1) {
          state.cases[index] = action.payload;
        }
      })
      .addCase(addLegalCaseDocument.fulfilled, (state, action) => {
        // Handle response structure: { success: true, data: case, message: "..." }
        const updatedCase = action.payload.data || action.payload;
        const caseId = updatedCase._id || updatedCase.id;
        
        // Update in cases array
        const index = state.cases.findIndex(
          (case_) => case_._id === caseId
        );
        if (index !== -1) {
          state.cases[index] = updatedCase;
        }
        
        // Update currentCase if it's the same case being viewed
        if (state.currentCase && state.currentCase._id === caseId) {
          state.currentCase = updatedCase;
        }
      })
      .addCase(getLegalCase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getLegalCase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCase = action.payload.data;
      })
      .addCase(getLegalCase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getPendingAssignmentCases.fulfilled, () => {
        // Handle pending assignment cases if needed
      })
      .addCase(getLegalCaseStatistics.fulfilled, () => {
        // Handle statistics if needed
      });
  },
});

export const { clearError, setCurrentCase } = legalCaseSlice.actions;
export default legalCaseSlice.reducer;
